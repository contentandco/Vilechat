import { supabase } from '../lib/supabase';
import { encryptMessage, decryptMessage } from '../lib/encryption';
import { RecentRoom, ActiveRoomDetail } from '../types';

/**
 * Checks if Supabase client is properly configured.
 */
export function checkSupabaseConfig(): void {
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('your-project-id')) {
    throw new Error('Supabase URL is not configured.');
  }
}

/**
 * Creates a new room in the Supabase database (24 hour expiration).
 */
export async function createRoomInDB(code: string, name?: string) {
  checkSupabaseConfig();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  const payload: any = {
    code,
    expires_at: expiresAt,
    is_paused: false,
  };

  if (name) {
    payload.name = name;
    payload.name_encrypted = encryptMessage(name, code);
  }

  const { data, error } = await supabase
    .from('rooms')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetches and validates a room by its code.
 */
export async function fetchRoomByCode(code: string) {
  checkSupabaseConfig();
  const { data, error } = await supabase
    .from('rooms')
    .select()
    .eq('code', code)
    .single();

  if (error || !data) {
    throw new Error('Room not found or has expired.');
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    throw new Error('This room has expired.');
  }

  if (data.is_paused) {
    throw new Error('This room link is currently paused by the creator. Please check back later!');
  }

  let roomName = data.name || data.code;
  if ((!roomName || roomName === data.code) && data.name_encrypted) {
    try {
      const dec = decryptMessage(data.name_encrypted, code);
      if (dec && dec.trim()) {
        roomName = dec.trim();
      }
    } catch (e) {}
  }

  return {
    ...data,
    resolvedName: roomName,
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
      .eq('code', roomCode);
  } catch (e) {}
}

/**
 * Queries Supabase to filter out expired or deleted rooms and decodes room names.
 */
export async function verifyActiveRoomsFromDB(roomsList: RecentRoom[]): Promise<ActiveRoomDetail[]> {
  if (roomsList.length === 0) {
    return [];
  }

  try {
    const codes = roomsList.map((r) => r.code);
    const { data, error } = await supabase
      .from('rooms')
      .select('code, expires_at, name, name_encrypted, is_paused')
      .in('code', codes)
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    return (data || []).map((r: any) => {
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
      return {
        code: r.code,
        expires_at: r.expires_at,
        name: roomName || r.code,
        hasUnread: false,
      };
    });
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
