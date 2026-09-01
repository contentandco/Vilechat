import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { MessageItem, ActiveRoomDetail } from '../../types';
import { fetchRoomMessages, sendEncryptedMessage, generateClientUUID, SendMessageParams } from '../../api/messages';
import { saveLocalRoomMessages, getLocalRoomMessages } from '../../services/storage';

export const messageKeys = {
  all: ['messages'] as const,
  room: (roomId: string) => ['messages', roomId] as const,
};

/**
 * Injects a live incoming message directly into TanStack Query cache,
 * moves the room to the top of the inbox, and persists to local storage.
 */
export function injectIncomingMessageIntoCache(
  queryClient: QueryClient,
  roomId: string,
  roomCode: string,
  msg: MessageItem
) {
  const resolvedKey = roomId || roomCode;
  if (!resolvedKey) return;

  // 1. Update room messages cache with deduplication & sorting
  queryClient.setQueryData<MessageItem[]>(
    messageKeys.room(resolvedKey),
    (old = []) => {
      if (old.some((m) => m.id === msg.id)) {
        return old;
      }
      const updated = [...old, msg].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      // Persist updated list to local storage
      if (roomCode) {
        saveLocalRoomMessages(roomCode, updated).catch(() => {});
      }
      return updated;
    }
  );

  // 2. Move room to the top of the inbox and mark unread
  if (roomCode) {
    queryClient.setQueriesData<ActiveRoomDetail[]>({ queryKey: ['inbox-rooms'] }, (old = []) => {
      const cleanCode = roomCode.trim().toLowerCase();
      const target = old.find((r) => r.code.trim().toLowerCase() === cleanCode);
      const rest = old.filter((r) => r.code.trim().toLowerCase() !== cleanCode);
      if (target) {
        return [{ ...target, hasUnread: true }, ...rest];
      }
      return old;
    });
  }
}

/**
 * Hook to query messages for a room with TanStack Query and local persistence.
 */
export function useRoomMessages(roomId: string, roomCode: string) {
  const resolvedKey = roomId || roomCode;
  const queryClient = useQueryClient();

  return useQuery<MessageItem[]>({
    queryKey: messageKeys.room(resolvedKey),
    queryFn: async () => {
      const msgs = await fetchRoomMessages(roomId, roomCode, 50);
      if (roomCode && msgs.length > 0) {
        saveLocalRoomMessages(roomCode, msgs).catch(() => {});
      }
      // Reconcile and sort
      return msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    },
    enabled: Boolean(roomId || roomCode),
    staleTime: 1000 * 60 * 5, // 5 minutes fresh time for 0ms instant display
    gcTime: 1000 * 60 * 60 * 24, // 24 hours in memory
  });
}

/**
 * Hook to send messages with optimistic cache insertion and rollback.
 */
export function useSendMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SendMessageParams) => {
      const msgId = params.id || generateClientUUID();
      await sendEncryptedMessage({
        ...params,
        id: msgId,
      });
      return { id: msgId, ...params };
    },
    onMutate: async (params) => {
      const roomId = params.roomId || params.roomCode;
      const msgId = params.id || generateClientUUID();
      params.id = msgId;

      await queryClient.cancelQueries({ queryKey: messageKeys.room(roomId) });
      const previousMessages = queryClient.getQueryData<MessageItem[]>(messageKeys.room(roomId)) || [];

      const optimisticMsg: MessageItem = {
        id: msgId,
        sender_id: params.senderId,
        sender_name: params.senderName,
        content: params.rawContent,
        is_image: Boolean(params.isImage),
        is_voice: Boolean(params.isVoice),
        is_sticker: Boolean(params.isSticker),
        is_system: Boolean(params.isSystem),
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<MessageItem[]>(
        messageKeys.room(roomId),
        (old = []) => {
          if (old.some((m) => m.id === msgId)) return old;
          const updated = [...old, optimisticMsg];
          if (params.roomCode) {
            saveLocalRoomMessages(params.roomCode, updated).catch(() => {});
          }
          return updated;
        }
      );

      // When a message is chatted/sent in a room, move that room to the top of the inbox list
      if (params.roomCode) {
        queryClient.setQueriesData<ActiveRoomDetail[]>({ queryKey: ['inbox-rooms'] }, (old = []) => {
          const cleanCode = params.roomCode.trim().toLowerCase();
          const target = old.find((r) => r.code.trim().toLowerCase() === cleanCode);
          const rest = old.filter((r) => r.code.trim().toLowerCase() !== cleanCode);
          if (target) {
            return [target, ...rest];
          }
          return old;
        });
      }

      return { previousMessages, msgId, roomId };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(messageKeys.room(context.roomId), context.previousMessages);
      }
    },
  });
}

/**
 * Hook to load earlier messages and prepend them to the cache.
 */
export function useLoadEarlierMessagesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      roomCode,
      beforeCreatedAt,
    }: {
      roomId: string;
      roomCode: string;
      beforeCreatedAt: string;
    }) => {
      const earlier = await fetchRoomMessages(roomId, roomCode, 50, beforeCreatedAt);
      return { roomId, roomCode, earlier };
    },
    onSuccess: ({ roomId, roomCode, earlier }) => {
      if (earlier.length === 0) return;
      const resolvedKey = roomId || roomCode;
      queryClient.setQueryData<MessageItem[]>(
        messageKeys.room(resolvedKey),
        (old = []) => {
          const existingIds = new Set(old.map((m) => m.id));
          const uniqueEarlier = earlier.filter((m) => !existingIds.has(m.id));
          const updated = [...uniqueEarlier, ...old].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          if (roomCode) {
            saveLocalRoomMessages(roomCode, updated).catch(() => {});
          }
          return updated;
        }
      );
    },
  });
}
