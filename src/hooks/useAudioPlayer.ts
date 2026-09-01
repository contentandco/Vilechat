import { useState, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { createAudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

export function useAudioPlayer() {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const checkIntervalRef = useRef<any>(null);

  const stopAudio = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.release?.();
      } catch (e) {}
      playerRef.current = null;
    }
    setPlayingAudioId(null);
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const playAudio = async (messageId: string, base64Audio: string) => {
    try {
      // If tapping currently playing audio, stop it
      if (playingAudioId === messageId && playerRef.current) {
        stopAudio();
        return;
      }

      stopAudio();

      const tempFileUri = `${FileSystem.cacheDirectory}voice_${messageId}.m4a`;
      const rawBase64 = base64Audio.replace(/^data:audio\/[a-z0-9]+;base64,/, '');

      await FileSystem.writeAsStringAsync(tempFileUri, rawBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const player = createAudioPlayer(tempFileUri);
      playerRef.current = player;
      setPlayingAudioId(messageId);
      player.play();

      // Poll playback completion
      checkIntervalRef.current = setInterval(() => {
        if (!player || !player.playing && player.currentTime > 0 && player.currentTime >= player.duration - 0.2) {
          stopAudio();
        }
      }, 300);
    } catch (err) {
      console.warn('Playback error:', err);
      Alert.alert('Playback Error', 'Could not play voice note.');
      stopAudio();
    }
  };

  return {
    playingAudioId,
    playAudio,
    stopAudio,
  };
}
