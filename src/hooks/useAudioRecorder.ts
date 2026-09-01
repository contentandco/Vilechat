import { useState } from 'react';
import { Alert } from 'react-native';

let Audio: any = null;
let FileSystem: any = null;

try {
  Audio = require('expo-av').Audio;
} catch (e) {
  console.log('Audio (expo-av) module is not available in this Expo Go environment.');
}

try {
  FileSystem = require('expo-file-system');
  if (!FileSystem.readAsStringAsync && FileSystem.legacy) {
    FileSystem = FileSystem.legacy;
  }
} catch (e) {
  try {
    FileSystem = require('expo-file-system/legacy');
  } catch (err) {}
}

export function useAudioRecorder(onRecordingComplete: (base64AudioUrl: string) => Promise<void>) {
  const [recording, setRecording] = useState<any>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const startRecording = async () => {
    try {
      if (!Audio) {
        Alert.alert('Voice Note Support', 'Voice notes are not supported on your phone\'s current Expo Go version. Tap or paste links to chat!');
        return;
      }

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Denied', 'We need microphone access to record voice notes.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.LOW_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording audio.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    const recInstance = recording;
    setRecording(null);

    try {
      await recInstance.stopAndUnloadAsync();
      const uri = recInstance.getURI();
      if (!uri) return;

      if (!FileSystem) {
        Alert.alert('Error', 'FileSystem is not available to save audio.');
        return;
      }

      setIsProcessing(true);
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const audioData = `data:audio/aac;base64,${base64Audio}`;
      await onRecordingComplete(audioData);
    } catch (err) {
      console.error('Recording stop/save failed:', err);
      Alert.alert('Error', 'Failed to save voice note.');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
  };
}
