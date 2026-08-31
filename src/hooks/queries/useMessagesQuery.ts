import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageItem } from '../../types';
import {
  fetchRoomMessages,
  sendEncryptedMessage,
  generateClientUUID,
  SendMessageParams,
} from '../../api/messages';

export const messageKeys = {
  all: ['messages'] as const,
  room: (roomId: string) => ['messages', roomId] as const,
};

/**
 * Hook to query messages for a room with TanStack Query.
 */
export function useRoomMessages(roomId: string, roomCode: string) {
  return useQuery<MessageItem[]>({
    queryKey: messageKeys.room(roomId),
    queryFn: () => fetchRoomMessages(roomId, roomCode, 20),
    enabled: Boolean(roomId),
    staleTime: 1000 * 5, // 5 seconds fresh time
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
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
      const roomId = params.roomId;
      const msgId = params.id || generateClientUUID();
      // Ensure params has the assigned id so mutationFn uses the exact same UUID
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
          return [...old, optimisticMsg];
        }
      );

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
      const earlier = await fetchRoomMessages(roomId, roomCode, 20, beforeCreatedAt);
      return { roomId, earlier };
    },
    onSuccess: ({ roomId, earlier }) => {
      if (earlier.length === 0) return;
      queryClient.setQueryData<MessageItem[]>(
        messageKeys.room(roomId),
        (old = []) => {
          const existingIds = new Set(old.map((m) => m.id));
          const uniqueEarlier = earlier.filter((m) => !existingIds.has(m.id));
          return [...uniqueEarlier, ...old];
        }
      );
    },
  });
}
