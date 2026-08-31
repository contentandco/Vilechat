import { useState, useEffect } from 'react';
import { Alert } from 'react-native';

let Audio: any = null;
let FileSystem: any = null;

try {
  Audio = require('expo-av').Audio;
} catch (e) {
  console.log('Audio (expo-av) module is not available in this Expo Go environment.');
}

try {
  FileSystem = require('expo-file-system/legacy');
} catch (e) {
  console.log('FileSystem module is not available in this Expo Go environment.');
}

export function useAudioPlayer() {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [soundInstance, setSoundInstance] = useState<any>(null);

  // Setup audio permissions / modes
  useEffect(() => {
    if (Audio) {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      }).catch((err: any) => console.log('Audio init failed:', err));
    }

    return () => {
      if (soundInstance) {
        soundInstance.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const stopAudio = async () => {
    if (soundInstance) {
      try {
        await soundInstance.stopAsync();
        await soundInstance.unloadAsync();
      } catch (e) {}
      setSoundInstance(null);
      setPlayingAudioId(null);
    }
  };

  const playAudio = async (messageId: string, base64Audio: string) => {
    try {
      if (!Audio || !FileSystem) {
        Alert.alert('Playback Error', 'Voice playback is not supported on this version of Expo Go. Please update Expo Go.');
        return;
      }

      // If tapping currently playing audio, stop it
      if (playingAudioId === messageId && soundInstance) {
        await stopAudio();
        return;
      }

      // Stop any other sound playing first
      if (soundInstance) {
        await stopAudio();
      }

      const tempFileUri = `${FileSystem.cacheDirectory}temp_voice_${messageId}.aac`;
      const rawBase64 = base64Audio.replace(/^data:audio\/[a-z0-9]+;base64,/, '');

      await FileSystem.writeAsStringAsync(tempFileUri, rawBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: tempFileUri },
        { shouldPlay: true }
      );

      setSoundInstance(sound);
      setPlayingAudioId(messageId);

      sound.setOnPlaybackStatusUpdate(async (status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
          setSoundInstance(null);
          setPlayingAudioId(null);
        }
      });
    } catch (err) {
      console.error('Failed to play sound', err);
      Alert.alert('Playback Error', 'Could not play voice note.');
    }
  };

  return {
    playingAudioId,
    playAudio,
    stopAudio,
  };
}
