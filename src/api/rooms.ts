import { supabase } from '../lib/supabase';
import { encryptMessage, decryptMessage } from '../lib/encryption';
import { RecentRoom, ActiveRoomDetail } from '../types';
import { getRoomLastRead } from '../services/storage';

/**
 * Checks if Supabase client is properly configured.
 */
export function checkSupabaseConfig(): void {
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('your-project-id')) {
    throw new Error('Supabase URL is not configured.');
  }
}

/**
 * Creates a new room in the Supabase database (24 hour expiration) with fallback support.
 */
export async function createRoomInDB(
  code: string, 
  name?: string, 
  creatorDeviceId?: string, 
  creatorId?: string
) {
  checkSupabaseConfig();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  const payload: any = {
    code,
    expires_at: expiresAt,
    is_paused: false,
  };

  if (creatorDeviceId) payload.creator_device_id = creatorDeviceId;
  if (creatorId) payload.creator_id = creatorId;

  if (name) {
    payload.name = name;
    payload.name_encrypted = encryptMessage(name, code);
  }

  try {
    const { data, error } = await supabase
      .from('rooms')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      return data;
    }

    // If duplicate code, fetch existing
    if (error && (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique'))) {
      const existing = await supabase.from('rooms').select().eq('code', code).single();
      if (existing.data) return existing.data;
    }

    if (error) throw error;
  } catch (err: any) {
    console.warn('Initial room insert failed, attempting fallback with base schema:', err?.message || err);

    const basePayload: any = {
      code,
      expires_at: expiresAt,
    };
    if (name) {
      basePayload.name = name;
      basePayload.name_encrypted = encryptMessage(name, code);
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert([basePayload])
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        const existing = await supabase.from('rooms').select().eq('code', code).single();
        if (existing.data) return existing.data;
      }
      console.error('Fatal createRoomInDB error:', error);
      throw error;
    }

    return data;
  }
}

/**
 * Fetches and validates a room by its code.
 */
export async function fetchRoomByCode(code: string) {
  checkSupabaseConfig();
  const cleanCode = code.trim().toLowerCase();

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .ilike('code', cleanCode)
    .single();

  if (error || !data) {
    console.error('Fetch room error for code:', cleanCode, error);
    throw new Error('Room not found or has expired. Make sure the code is exact.');
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    throw new Error('This room has expired.');
  }

  if (data.is_paused === true) {
    throw new Error('This room link is currently paused by the creator. Please check back later!');
  }

  let roomName = data.name || data.code;
  if ((!roomName || roomName === data.code) && data.name_encrypted) {
    try {
      const dec = decryptMessage(data.name_encrypted, cleanCode);
      if (dec && dec.trim()) {
        roomName = dec.trim();
      }
    } catch (e) {}
  }

  return {
    ...data,
    resolvedName: roomName,
    creator_id: data.creator_id || null,
    creator_device_id: data.creator_device_id || null,
    is_paused: Boolean(data.is_paused),
  };
}

/**
 * Updates the paused status of a room in the Supabase database.
 */
export async function setRoomPausedInDB(roomCode: string, isPaused: boolean) {
  try {
    await supabase
      .from('rooms')
      .update({ is_paused: isPaused })
      .ilike('code', roomCode);
  } catch (e) {
    console.warn('Failed to update is_paused in DB (column may not exist yet):', e);
  }
}

/**
 * Deletes a room completely from the Supabase database.
 */
export async function deleteRoomPermanently(roomId: string, roomCode: string) {
  try {
    const channel = supabase.channel(`room_actions_${roomId}`);
    await channel.send({
      type: 'broadcast',
      event: 'room_deleted',
      payload: { roomCode },
    });
  } catch (e) {}

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId);

  if (error) throw error;
}

/**
 * Broadcasts a kick event to remove a specific user from the room.
 */
export async function broadcastKickUser(roomId: string, targetUserId: string) {
  const channel = supabase.channel(`room_actions_${roomId}`);
  await channel.send({
    type: 'broadcast',
    event: 'user_kicked',
    payload: { targetUserId },
  });
}

/**
 * Subscribes to real-time room administrative actions (kick, delete).
 */
export function subscribeToRoomActions(
  roomId: string,
  onKicked: (targetUserId: string) => void,
  onDeleted: () => void
) {
  const channel = supabase
    .channel(`room_actions_${roomId}`)
    .on('broadcast', { event: 'user_kicked' }, (event) => {
      if (event.payload?.targetUserId) {
        onKicked(event.payload.targetUserId);
      }
    })
    .on('broadcast', { event: 'room_deleted' }, () => {
      onDeleted();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Queries Supabase to filter out expired or deleted rooms, decodes room names, and calculates unread status.
 */
export async function verifyActiveRoomsFromDB(roomsList: RecentRoom[]): Promise<ActiveRoomDetail[]> {
  if (roomsList.length === 0) {
    return [];
  }

  try {
    const codes = roomsList.map((r) => r.code);
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .in('code', codes)
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    const roomIds = (data || []).map((r: any) => r.id);
    const latestMsgMap = new Map<string, number>();

    if (roomIds.length > 0) {
      try {
        const { data: msgs } = await supabase
          .from('messages')
          .select('room_id, created_at')
          .in('room_id', roomIds)
          .order('created_at', { ascending: false });

        if (msgs) {
          for (const m of msgs) {
            const time = new Date(m.created_at).getTime();
            if (!latestMsgMap.has(m.room_id) || time > (latestMsgMap.get(m.room_id) || 0)) {
              latestMsgMap.set(m.room_id, time);
            }
          }
        }
      } catch (e) {}
    }

    const verified: ActiveRoomDetail[] = [];
    for (const r of (data || [])) {
      let roomName = r.name || r.code;
      if ((!roomName || roomName === r.code) && r.name_encrypted) {
        try {
          const dec = decryptMessage(r.name_encrypted, r.code);
          if (dec && dec.trim()) {
            roomName = dec.trim();
          }
        } catch (e) {}
      }
      if (!roomName || roomName === r.code) {
        const localMatch = roomsList.find((rm) => rm.code === r.code);
        if (localMatch?.name) {
          roomName = localMatch.name;
        }
      }

      const lastRead = await getRoomLastRead(r.code);
      const latestMsgTime = latestMsgMap.get(r.id) || 0;
      const hasUnread = latestMsgTime > 0 && latestMsgTime > lastRead;

      verified.push({
        code: r.code,
        expires_at: r.expires_at,
        name: roomName || r.code,
        hasUnread,
      });
    }

    return verified;
  } catch (err) {
    console.error('Failed to verify active rooms from Supabase:', err);
    return roomsList.map((r) => ({
      code: r.code,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      name: r.name || r.code,
      hasUnread: false,
    }));
  }
}

/**
 * Renames a room by updating its plain and encrypted name columns.
 */
export async function renameRoomInDB(roomId: string, roomCode: string, newName: string) {
  const encryptedName = encryptMessage(newName, roomCode);
  const { error } = await supabase
    .from('rooms')
    .update({ 
      name: newName,
      name_encrypted: encryptedName 
    })
    .eq('id', roomId);

  if (error) throw error;
}

/**
 * Renames a room by room code.
 */
export async function renameRoomByCodeInDB(roomCode: string, newName: string) {
  const encryptedName = encryptMessage(newName, roomCode);
  const { error } = await supabase
    .from('rooms')
    .update({ 
      name: newName,
      name_encrypted: encryptedName 
    })
    .eq('code', roomCode);

  if (error) throw error;
}

/**
 * Persists/upserts a room session to Supabase device_sessions table.
 */
export async function syncDeviceSession(deviceId: string, roomCode: string, roomName?: string) {
  if (!deviceId) return;
  try {
    await supabase
      .from('device_sessions')
      .upsert({
        device_id: deviceId,
        room_code: roomCode,
        room_name: roomName || null,
        last_active_at: new Date().toISOString(),
      }, { onConflict: 'device_id,room_code' });
  } catch (e) {}
}

/**
 * Fetches sessions associated with this device.
 */
export async function fetchDeviceSessions(deviceId: string): Promise<RecentRoom[]> {
  if (!deviceId) return [];
  try {
    const { data: dbSessions, error } = await supabase
      .from('device_sessions')
      .select('room_code, room_name, created_at, last_active_at')
      .eq('device_id', deviceId)
      .order('last_active_at', { ascending: false });

    if (!error && dbSessions && dbSessions.length > 0) {
      return dbSessions.map((s: any) => ({
        code: s.room_code,
        name: s.room_name || undefined,
        timestamp: new Date(s.last_active_at || s.created_at).getTime(),
      }));
    }
  } catch (err) {}
  return [];
}

/**
 * Deletes sessions for specified rooms from the device_sessions table.
 */
export async function deleteDeviceSessions(deviceId: string, roomCodes: string[]) {
  if (!deviceId || roomCodes.length === 0) return;
  try {
    await supabase
      .from('device_sessions')
      .delete()
      .eq('device_id', deviceId)
      .in('room_code', roomCodes);
  } catch (e) {}
}

/**
 * Subscribes to live room metadata updates (e.g. live renaming).
 */
export function subscribeToRoomMeta(
  roomId: string, 
  roomCode: string, 
  onNameUpdate: (newName: string) => void
) {
  const channel = supabase
    .channel(`room_meta_${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        const updatedRoom = payload.new;
        if (updatedRoom.name) {
          onNameUpdate(updatedRoom.name);
        } else if (updatedRoom.name_encrypted) {
          try {
            const decrypted = decryptMessage(updatedRoom.name_encrypted, roomCode);
            if (decrypted) onNameUpdate(decrypted);
          } catch (e) {
            console.log('Failed to decrypt updated room name');
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
