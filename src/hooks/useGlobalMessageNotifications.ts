import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { decryptMessage } from '../lib/encryption';
import { triggerLocalMessageNotification, requestNotificationPermission } from '../services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NOTIF_STORAGE_KEYS } from '../components/common/SettingsModal';
import { getLocalRecentRooms } from '../services/storage';
import { injectIncomingMessageIntoCache } from './queries/useMessagesQuery';
import { MessageItem } from '../types';

/**
 * WhatsApp/Instagram-grade Real-Time Message Dispatcher:
 * 1. Background pre-caches incoming messages directly into memory & local storage in 0ms.
 * 2. Delivers rich system notification banners when user is outside that active chat.
 * 3. Suppresses notifications when the user is actively viewing that chat room.
 */
export function useGlobalMessageNotifications() {
  const queryClient = useQueryClient();
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

          // 1. Don't process or notify own messages
          if (newMsg.sender_id === deviceId) {
            return;
          }

          // 2. Lookup room code from rooms table
          const { data: roomData } = await supabase
            .from('rooms')
            .select('code, name')
            .eq('id', newMsg.room_id)
            .single();

          const roomCode = (roomData?.code || '').trim().toLowerCase();
          if (!roomCode) return;
          const roomName = roomData?.name || `Room ${roomCode}`;

          // 3. Check if user is a member of this room (not deleted, left, or cleared)
          const localRooms = await getLocalRecentRooms();
          const isMyRoom = localRooms.some((r) => r.code.trim().toLowerCase() === roomCode);
          if (!isMyRoom) {
            return;
          }

          // 4. Decrypt message content
          let decrypted = '';
          try {
            decrypted = decryptMessage(newMsg.content_encrypted, roomCode);
          } catch (e) {
            decrypted = 'New message received';
          }

          const isSystem = newMsg.sender_id === '__system__' || newMsg.sender_name === 'System';

          const formattedMsg: MessageItem = {
            id: newMsg.id,
            sender_id: newMsg.sender_id,
            sender_name: newMsg.sender_name,
            content: decrypted,
            is_image: Boolean(newMsg.is_image),
            is_voice: Boolean(newMsg.is_voice),
            is_sticker: Boolean(newMsg.is_sticker),
            is_system: isSystem,
            created_at: newMsg.created_at || new Date().toISOString(),
          };

          // 5. PRE-CACHE INSTANTLY into TanStack Query & persistent local storage (0ms)
          injectIncomingMessageIntoCache(queryClient, newMsg.room_id, roomCode, formattedMsg);

          // 6. Check if user is actively looking at this specific chat room
          const currentActive = useAppStore.getState().activeRoomCode.trim().toLowerCase();
          const activeScreen = useAppStore.getState().currentScreen;
          if (activeScreen === 'chat-room' && currentActive === roomCode) {
            return; // Suppress notification banner since user is actively in this chat
          }

          // 7. Check if notification setting is enabled
          const setting = await AsyncStorage.getItem(NOTIF_STORAGE_KEYS.NEW_MESSAGES);
          if (setting === 'false') return;

          let preview = decrypted;
          if (newMsg.is_image) preview = '📷 Sent a photo';
          else if (newMsg.is_voice) preview = '🎤 Sent a voice note';
          else if (newMsg.is_sticker) preview = '✨ Sent a sticker';

          const sender = newMsg.sender_name || 'Someone';

          // 8. Deliver high-priority system notification banner
          await triggerLocalMessageNotification(
            roomName,
            `${sender}: ${preview}`,
            { roomCode, roomId: newMsg.room_id }
          );
        } catch (err) {
          console.warn('Global notification dispatcher error:', err);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, deviceId, activeRoomCode, currentScreen]);
}
