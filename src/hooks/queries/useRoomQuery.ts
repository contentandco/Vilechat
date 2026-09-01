import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRoomByCode,
  createRoomInDB,
  renameRoomInDB,
  renameRoomByCodeInDB,
  syncDeviceSession,
} from '../../api/rooms';
import { inboxKeys } from './useInboxQuery';
import { ActiveRoomDetail } from '../../types';
import { getLocalRecentRooms, saveLocalRecentRooms } from '../../services/storage';

export const roomKeys = {
  all: ['rooms'] as const,
  detail: (code: string) => ['room-detail', code.trim().toLowerCase()] as const,
};

/**
 * Cached lookup for room details by room code.
 */
export function useRoomDetails(roomCode: string) {
  const cleanCode = (roomCode || '').trim().toLowerCase();

  return useQuery({
    queryKey: roomKeys.detail(cleanCode),
    queryFn: () => fetchRoomByCode(cleanCode),
    enabled: Boolean(cleanCode),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * Mutation to create a room and update cache.
 */
export function useCreateRoomMutation(deviceId: string, userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, name }: { code: string; name?: string }) => {
      const room = await createRoomInDB(code, name, deviceId, userId);
      return { ...room, code, name };
    },
    onSuccess: (data) => {
      // Seed detail cache
      queryClient.setQueryData(roomKeys.detail(data.code), data);

      // Persist to local storage immediately so it stays on inbox reload
      getLocalRecentRooms().then((localRooms) => {
        const cleanCode = data.code.trim().toLowerCase();
        const remaining = localRooms.filter((r) => r.code.trim().toLowerCase() !== cleanCode);
        saveLocalRecentRooms([{ code: data.code, name: data.name || data.code, timestamp: Date.now() }, ...remaining]);
      });

      // Persist to device sessions in DB
      if (deviceId) {
        syncDeviceSession(deviceId, data.code, data.name).catch(() => {});
      }

      // Optimistically add to inbox cache with strict case-insensitive deduplication
      queryClient.setQueryData<ActiveRoomDetail[]>(
        inboxKeys.byDevice(deviceId),
        (old = []) => {
          const cleanCode = data.code.trim().toLowerCase();
          const exists = old.find((r) => r.code.trim().toLowerCase() === cleanCode);
          const remaining = old.filter((r) => r.code.trim().toLowerCase() !== cleanCode);
          const updated: ActiveRoomDetail = exists
            ? { ...exists, id: data.id || exists.id, name: data.name || exists.name }
            : {
                id: data.id,
                code: data.code,
                name: data.name || data.code,
                expires_at: data.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                hasUnread: false,
              };
          return [updated, ...remaining];
        }
      );
    },
  });
}

/**
 * Mutation to rename a room with optimistic updates.
 */
export function useRenameRoomMutation(deviceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      roomCode,
      newName,
    }: {
      roomId?: string;
      roomCode: string;
      newName: string;
    }) => {
      if (roomId) {
        await renameRoomInDB(roomId, roomCode, newName);
      } else {
        await renameRoomByCodeInDB(roomCode, newName);
      }
      return { roomId, roomCode, newName };
    },
    onMutate: async ({ roomCode, newName }) => {
      const cleanCode = roomCode.trim().toLowerCase();
      // Optimistically update room detail cache
      queryClient.setQueryData(roomKeys.detail(cleanCode), (old: any) =>
        old ? { ...old, name: newName, resolvedName: newName } : old
      );

      // Optimistically update inbox list cache
      queryClient.setQueryData<ActiveRoomDetail[]>(
        inboxKeys.byDevice(deviceId),
        (old = []) =>
          old.map((r) => (r.code.toLowerCase() === cleanCode ? { ...r, name: newName } : r))
      );
    },
  });
}
