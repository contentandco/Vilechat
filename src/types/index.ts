export type Screen = 'welcome' | 'landing' | 'room-setup' | 'room-dashboard' | 'chat-room';

export type HomeTab = 'whisper' | 'inbox';

export interface RecentRoom {
  code: string;
  timestamp: number;
  name?: string;
}

export interface ActiveRoomDetail {
  code: string;
  expires_at: string;
  name?: string;
  hasUnread?: boolean;
}

export interface MessageItem {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  is_image: boolean;
  is_voice: boolean;
  is_sticker: boolean;
  created_at: string;
}

export interface CardTheme {
  id: string;
  bg: string;
  cardBorder: string;
  accent: string;
}

export interface StickerItem {
  id: string;
  url: string;
  label: string;
}
