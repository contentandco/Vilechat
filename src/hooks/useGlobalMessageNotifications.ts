import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { decryptMessage } from '../lib/encryption';
import { triggerLocalMessageNotification, requestNotificationPermission } from '../services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NOTIF_STORAGE_KEYS } from '../components/common/SettingsModal';
import { getLocalRecentRooms } from '../services/storage';

/**
 * Listens for global messages via Supabase realtime and triggers
 * system notifications when the user receives a message in an active member room,
 * while skipping notifications if the user is actively viewing that chat room or has left it.
 */
export function useGlobalMessageNotifications() {
  const deviceId = useAppStore((s) => s.deviceId);
  const activeRoomCode = useAppStore((s) => s.activeRoomCode);
  const currentScreen = useAppStore((s) => s.currentScreen);

  useEffect(() => {
    // Request notification permissions on app startup
    requestNotificationPermission();

    // Subscribe to global message broadcast
    const channel = supabase
      .channel('global_notification_listener')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        try {
          const newMsg = payload.new as any;
          if (!newMsg || !newMsg.content_encrypted) return;

          // 1. Don't notify for own messages or system announcements
          if (newMsg.sender_id === deviceId || newMsg.sender_id === '__system__') {
            return;
          }

          // 2. Check if notification setting is enabled by user
          const setting = await AsyncStorage.getItem(NOTIF_STORAGE_KEYS.NEW_MESSAGES);
          if (setting === 'false') return;

          // 3. Lookup room code from rooms table
          const { data: roomData } = await supabase
            .from('rooms')
            .select('code, name')
            .eq('id', newMsg.room_id)
            .single();

          const roomCode = (roomData?.code || '').trim().toLowerCase();
          if (!roomCode) return;
          const roomName = roomData?.name || `Room ${roomCode}`;

          // 4. Don't notify if the user has left the room, cleared the room, or deleted account
          const localRooms = await getLocalRecentRooms();
          const isMyRoom = localRooms.some((r) => r.code.trim().toLowerCase() === roomCode);
          if (!isMyRoom) {
            return;
          }

          // 5. Don't notify if the user is actively looking at this specific chat room
          const currentActive = useAppStore.getState().activeRoomCode.trim().toLowerCase();
          const activeScreen = useAppStore.getState().currentScreen;
          if (activeScreen === 'chat-room' && currentActive === roomCode) {
            return;
          }

          // 6. Decrypt message preview
          let decrypted = '';
          try {
            decrypted = decryptMessage(newMsg.content_encrypted, roomCode);
          } catch (e) {
            decrypted = 'New message received';
          }

          let preview = decrypted;
          if (newMsg.is_image) preview = '📷 Sent a photo';
          else if (newMsg.is_voice) preview = '🎤 Sent a voice note';
          else if (newMsg.is_sticker) preview = '✨ Sent a sticker';

          const sender = newMsg.sender_name || 'Someone';

          // 7. Trigger system notification banner
          await triggerLocalMessageNotification(
            roomName,
            `${sender}: ${preview}`,
            { roomCode, roomId: newMsg.room_id }
          );
        } catch (err) {
          console.warn('Global notification trigger error:', err);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, activeRoomCode, currentScreen]);
}
