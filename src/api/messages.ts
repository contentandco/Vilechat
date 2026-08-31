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
 * Fetches the most recent messages for a room with pagination support (default 20 most recent).
 */
export async function fetchRoomMessages(
  roomId: string, 
  roomCode: string, 
  limit: number = 20, 
  beforeCreatedAt?: string
): Promise<MessageItem[]> {
  let query = supabase
    .from('messages')
    .select('id, sender_id, sender_name, content_encrypted, is_image, is_voice, is_sticker, created_at')
    .eq('room_id', roomId);

  if (beforeCreatedAt) {
    query = query.lt('created_at', beforeCreatedAt);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const decrypted = (data || []).map((msg: any) => {
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

  // Reverse to render chronologically
  return decrypted.reverse();
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
 * Encrypts and posts a message to Supabase, broadcasting live across WebSocket channels.
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
  const createdAt = new Date().toISOString();

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

  // 1. Broadcast immediate global notification for inbox badges
  try {
    const globalChannel = supabase.channel('global_inbox_messages');
    globalChannel.send({
      type: 'broadcast',
      event: 'new_message',
      payload: { roomId, roomCode },
    });
  } catch (e) {}

  // 2. Broadcast immediate room event for open chat screens
  try {
    const roomChannel = supabase.channel(`room_${roomId}`);
    roomChannel.send({
      type: 'broadcast',
      event: 'room_new_message',
      payload: {
        id,
        room_id: roomId,
        sender_id: isSystem ? '__system__' : senderId,
        sender_name: isSystem ? 'System' : senderName,
        content_encrypted: encryptedContent,
        is_image: isImage,
        is_voice: isVoice,
        is_sticker: isSticker,
        created_at: createdAt,
      },
    });
  } catch (e) {}

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
 * Subscribes to real-time incoming messages for an active room with dual-channel (postgres_changes + broadcast) listeners.
 */
export function subscribeToRoomMessages(
  roomId: string,
  roomCode: string,
  onNewMessage: (msg: MessageItem) => void
) {
  const handleIncomingPayload = (newMsg: any) => {
    if (!newMsg || !newMsg.content_encrypted) return;
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
      created_at: newMsg.created_at || new Date().toISOString(),
    };

    onNewMessage(formattedMsg);
  };

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
        handleIncomingPayload(payload.new);
      }
    )
    .on(
      'broadcast',
      { event: 'room_new_message' },
      (event) => {
        handleIncomingPayload(event.payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
