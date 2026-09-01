import { useState } from 'react';
import { Alert } from 'react-native';

export function useAudioRecorder(onRecordingComplete: (base64AudioUrl: string) => Promise<void>) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const startRecording = async () => {
    Alert.alert('Voice Notes', 'Voice notes are coming in the next update. Type messages, send stickers, and share images!');
  };

  const stopRecording = async () => {
    setIsRecording(false);
  };

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
  };
}
