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

  return (data || []).map((msg: any) => {
    const isSystem = msg.sender_id === '__system__' || msg.sender_name === 'System';
    return {
      id: msg.id,
      sender_id: msg.sender_id,
      sender_name: msg.sender_name,
      content: decryptMessage(msg.content_encrypted, roomCode),
      is_image: Boolean(msg.is_image),
      is_voice: Boolean(msg.is_voice),
      is_sticker: Boolean(msg.is_sticker),
      is_system: isSystem,
      created_at: msg.created_at,
    };
  });
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
  isSystem?: boolean;
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
  isSystem = false,
}: SendMessageParams) {
  const encryptedContent = encryptMessage(rawContent, roomCode);

  const { error } = await supabase
    .from('messages')
    .insert([
      {
        id,
        room_id: roomId,
        sender_id: isSystem ? '__system__' : senderId,
        sender_name: isSystem ? 'System' : senderName,
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
 * Sends an encrypted system announcement when a room is created ("New room") or someone joins ("@user joined the room").
 */
export async function sendSystemJoinMessage(
  roomId: string, 
  roomCode: string, 
  userNickname: string,
  isCreator: boolean = false
) {
  try {
    const cleanName = (userNickname || 'Anonymous').replace(/^@+/, '');
    const announcement = isCreator 
      ? `New room` 
      : `@${cleanName} joined the room`;

    await sendEncryptedMessage({
      roomId,
      roomCode,
      senderId: '__system__',
      senderName: 'System',
      rawContent: announcement,
      isSystem: true,
    });
  } catch (e) {
    console.warn('Failed to broadcast system announcement:', e);
  }
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
        const isSystem = newMsg.sender_id === '__system__' || newMsg.sender_name === 'System';
        
        const formattedMsg: MessageItem = {
          id: newMsg.id,
          sender_id: newMsg.sender_id,
          sender_name: newMsg.sender_name,
          content: decryptedContent,
          is_image: Boolean(newMsg.is_image),
          is_voice: Boolean(newMsg.is_voice),
          is_sticker: Boolean(newMsg.is_sticker),
          is_system: isSystem,
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
