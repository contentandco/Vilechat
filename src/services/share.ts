import { Share, Clipboard, Platform, ToastAndroid, Alert } from 'react-native';

export function getShareUrl(roomCode: string): string {
  return `https://vailchat.com/join?code=${roomCode}`;
}

/**
 * Universal Multi-Platform Sharing (Instagram Story, WhatsApp, iMessage, Telegram, Snapchat, etc.)
 */
export async function shareRoomLink(roomCode: string): Promise<void> {
  try {
    const shareUrl = getShareUrl(roomCode);
    const shareText = `Send me anonymous messages on Vailchat! 🤫💬\n\nLink: ${shareUrl}\nSecret Room Code: ${roomCode}`;

    await Share.share({
      message: shareText,
      url: shareUrl,
      title: 'Send me anonymous messages on Vailchat!',
    });
  } catch (err) {
    console.log('Share error:', err);
  }
}

/**
 * Copies the clickable web link to clipboard with native toast/alert feedback.
 */
export function copyRoomLinkToClipboard(roomCode: string): void {
  const shareUrl = getShareUrl(roomCode);
  Clipboard.setString(shareUrl);
  if (Platform.OS === 'android') {
    ToastAndroid.show('Room Link copied to clipboard! 📋', ToastAndroid.SHORT);
  } else {
    Alert.alert('Link Copied! 🔗', `Share this link with your friends to receive anonymous messages.\n\nCode: ${roomCode}`);
  }
}

/**
 * Copies the raw room code to clipboard.
 */
export function copyRoomCodeToClipboard(roomCode: string): void {
  Clipboard.setString(roomCode);
  if (Platform.OS === 'android') {
    ToastAndroid.show(`Room code ${roomCode} copied! 📋`, ToastAndroid.SHORT);
  } else {
    Alert.alert('Copied! 📋', `Room code copied to clipboard: ${roomCode}`);
  }
}
