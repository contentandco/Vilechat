import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import { AudioModule, RecordingPresets } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

export function useAudioRecorder(onRecordingComplete: (base64AudioUrl: string) => Promise<void>) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const recorderRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone Permission', 'Microphone access is needed to record voice messages.');
        return;
      }

      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      const recorder = new AudioModule.AudioRecorder(RecordingPresets.LOW_QUALITY);
      await recorder.prepareToRecordAsync();
      recorder.record();

      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err: any) {
      console.warn('Failed to start recording:', err);
      Alert.alert('Recording Error', 'Could not access microphone.');
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) {
      setIsRecording(false);
      return;
    }

    setIsRecording(false);
    const recorder = recorderRef.current;
    recorderRef.current = null;

    try {
      setIsProcessing(true);
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return;

      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const audioData = `data:audio/m4a;base64,${base64Audio}`;
      await onRecordingComplete(audioData);
    } catch (err) {
      console.warn('Failed to save audio recording:', err);
      Alert.alert('Recording Error', 'Failed to save voice note.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelRecording = async () => {
    if (!recorderRef.current) {
      setIsRecording(false);
      return;
    }

    setIsRecording(false);
    const recorder = recorderRef.current;
    recorderRef.current = null;

    try {
      await recorder.stop();
    } catch (err) {
      console.warn('Failed to cancel audio recording:', err);
    }
  };

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
