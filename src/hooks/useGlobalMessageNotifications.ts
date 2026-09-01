import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { decryptMessage } from '../lib/encryption';
import { triggerLocalMessageNotification, requestNotificationPermission } from '../services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NOTIF_STORAGE_KEYS } from '../components/common/SettingsModal';

/**
 * Listens for global messages via Supabase realtime and triggers
 * system notifications when the user receives a message in an inactive room.
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

          // Don't notify for own messages or system messages
          if (newMsg.sender_id === deviceId || newMsg.sender_id === '__system__') {
            return;
          }

          // Check if notification setting is enabled
          const setting = await AsyncStorage.getItem(NOTIF_STORAGE_KEYS.NEW_MESSAGES);
          if (setting === 'false') return;

          // Lookup room code from rooms table if needed
          const { data: roomData } = await supabase
            .from('rooms')
            .select('code, name')
            .eq('id', newMsg.room_id)
            .single();

          const roomCode = roomData?.code || '';
          const roomName = roomData?.name || `Room ${roomCode}`;

          // Don't notify if the user is actively inside this chat room
          if (currentScreen === 'chat-room' && activeRoomCode.toLowerCase() === roomCode.toLowerCase()) {
            return;
          }

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
