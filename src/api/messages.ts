import { supabase } from '../lib/supabase';
import { encryptMessage, decryptMessage } from '../lib/encryption';
import { MessageItem } from '../types';

/**
 * Generates a valid client-side UUID for optimistic updates.
 */
export function generateClientUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Fetches all messages for a room and decrypts them.
 */
export async function fetchRoomMessages(roomId: string, roomCode: string): Promise<MessageItem[]> {
  const { data, error } = await supabase
    .from('messages')
    .select()
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map((msg: any) => ({
    id: msg.id,
    sender_id: msg.sender_id,
    sender_name: msg.sender_name,
    content: decryptMessage(msg.content_encrypted, roomCode),
    is_image: msg.is_image,
    is_voice: msg.is_voice,
    is_sticker: msg.is_sticker,
    created_at: msg.created_at,
  }));
}

export interface SendMessageParams {
  id?: string;
  roomId: string;
  roomCode: string;
  senderId: string;
  senderName: string;
  rawContent: string;
  isImage?: boolean;
  isVoice?: boolean;
  isSticker?: boolean;
}

/**
 * Encrypts and posts a message to Supabase.
 */
export async function sendEncryptedMessage({
  id = generateClientUUID(),
  roomId,
  roomCode,
  senderId,
  senderName,
  rawContent,
  isImage = false,
  isVoice = false,
  isSticker = false,
}: SendMessageParams) {
  const encryptedContent = encryptMessage(rawContent, roomCode);

  const { error } = await supabase
    .from('messages')
    .insert([
      {
        id,
        room_id: roomId,
        sender_id: senderId,
        sender_name: senderName,
        content_encrypted: encryptedContent,
        is_image: isImage,
        is_voice: isVoice,
        is_sticker: isSticker,
      },
    ]);

  if (error) throw error;
  return id;
}

/**
 * Subscribes to real-time incoming messages for an active room.
 */
export function subscribeToRoomMessages(
  roomId: string,
  roomCode: string,
  onNewMessage: (msg: MessageItem) => void
) {
  const channel = supabase
    .channel(`room_${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        const newMsg = payload.new;
        const decryptedContent = decryptMessage(newMsg.content_encrypted, roomCode);
        
        const formattedMsg: MessageItem = {
          id: newMsg.id,
          sender_id: newMsg.sender_id,
          sender_name: newMsg.sender_name,
          content: decryptedContent,
          is_image: newMsg.is_image,
          is_voice: newMsg.is_voice,
          is_sticker: newMsg.is_sticker,
          created_at: newMsg.created_at,
        };

        onNewMessage(formattedMsg);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
