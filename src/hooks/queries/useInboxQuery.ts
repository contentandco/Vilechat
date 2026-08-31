import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ActiveRoomDetail, RecentRoom } from '../../types';
import {
  getLocalRecentRooms,
  saveLocalRecentRooms,
  setRoomLastRead,
} from '../../services/storage';
import {
  fetchDeviceSessions,
  verifyActiveRoomsFromDB,
  syncDeviceSession,
  deleteDeviceSessions,
} from '../../api/rooms';

export const inboxKeys = {
  all: ['inbox-rooms'] as const,
  byDevice: (deviceId: string) => ['inbox-rooms', deviceId] as const,
};

/**
 * Fetches and verifies active rooms for the given device ID with smart caching.
 */
export function useInboxRooms(deviceId: string) {
  return useQuery<ActiveRoomDetail[]>({
    queryKey: inboxKeys.byDevice(deviceId),
    queryFn: async () => {
      const localRooms = await getLocalRecentRooms();

      let combined: RecentRoom[] = [...localRooms];

      if (deviceId) {
        try {
          const dbSessions = await fetchDeviceSessions(deviceId);
          if (dbSessions.length > 0) {
            combined = [
              ...dbSessions,
              ...localRooms.filter((lr) => !dbSessions.some((m) => m.code === lr.code)),
            ].slice(0, 25);
            // Save combined back to local storage
            saveLocalRecentRooms(combined);
          }
        } catch (e) {
          // If network error, continue with localRooms
        }
      }

      if (combined.length === 0) {
        return [];
      }

      return verifyActiveRoomsFromDB(combined);
    },
    enabled: Boolean(deviceId),
    staleTime: 1000 * 30, // 30 seconds fresh
    gcTime: 1000 * 60 * 15, // 15 minutes garbage collection
  });
}

/**
 * Hook to save a room to recent inbox with optimistic cache updates.
 */
export function useSaveRecentRoomMutation(deviceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, name }: { code: string; name?: string }) => {
      const localRooms = await getLocalRecentRooms();
      const existing = localRooms.find((r) => r.code === code);
      const resolvedName = name || existing?.name;

      const updated = [
        { code, timestamp: Date.now(), name: resolvedName },
        ...localRooms.filter((r) => r.code !== code),
      ].slice(0, 25);

      await saveLocalRecentRooms(updated);
      if (deviceId) {
        await syncDeviceSession(deviceId, code, resolvedName);
      }
      return { code, name: resolvedName, updatedRooms: updated };
    },
    onSuccess: (data) => {
      // Optimistically update query cache
      queryClient.setQueryData<ActiveRoomDetail[]>(
        inboxKeys.byDevice(deviceId),
        (old = []) => {
          const exists = old.find((r) => r.code === data.code);
          if (exists) {
            return old.map((r) =>
              r.code === data.code ? { ...r, name: data.name || r.name } : r
            );
          }
          const newRoom: ActiveRoomDetail = {
            code: data.code,
            name: data.name || data.code,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            hasUnread: false,
          };
          return [newRoom, ...old];
        }
      );
    },
  });
}

/**
 * Hook to delete rooms from inbox with optimistic cache updates.
 */
export function useDeleteRoomsMutation(deviceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (codesToDelete: string[]) => {
      if (codesToDelete.length === 0) return codesToDelete;
      const localRooms = await getLocalRecentRooms();
      const updated = localRooms.filter((r) => !codesToDelete.includes(r.code));
      await saveLocalRecentRooms(updated);

      if (deviceId) {
        await deleteDeviceSessions(deviceId, codesToDelete);
      }
      return codesToDelete;
    },
    onMutate: async (codesToDelete) => {
      await queryClient.cancelQueries({ queryKey: inboxKeys.byDevice(deviceId) });
      const previousRooms = queryClient.getQueryData<ActiveRoomDetail[]>(inboxKeys.byDevice(deviceId));

      queryClient.setQueryData<ActiveRoomDetail[]>(
        inboxKeys.byDevice(deviceId),
        (old = []) => old.filter((r) => !codesToDelete.includes(r.code))
      );

      return { previousRooms };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousRooms) {
        queryClient.setQueryData(inboxKeys.byDevice(deviceId), context.previousRooms);
      }
    },
  });
}

/**
 * Hook to mark a room as read with optimistic cache update.
 */
export function useMarkRoomReadMutation(deviceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomCode: string) => {
      await setRoomLastRead(roomCode, Date.now());
      return roomCode;
    },
    onMutate: async (roomCode) => {
      queryClient.setQueryData<ActiveRoomDetail[]>(
        inboxKeys.byDevice(deviceId),
        (old = []) =>
          old.map((r) => (r.code.toLowerCase() === roomCode.toLowerCase() ? { ...r, hasUnread: false } : r))
      );
    },
  });
}
