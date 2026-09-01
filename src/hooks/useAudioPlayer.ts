import { useState } from 'react';
import { Alert } from 'react-native';

export function useAudioPlayer() {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const stopAudio = async () => {
    setPlayingAudioId(null);
  };

  const playAudio = async (messageId: string, base64Audio: string) => {
    Alert.alert('Voice Note Playback', 'Voice playback is coming in the next update.');
  };

  return {
    playingAudioId,
    playAudio,
    stopAudio,
  };
}
