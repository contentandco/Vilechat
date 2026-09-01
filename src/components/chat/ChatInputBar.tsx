import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Keyboard,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Camera01Icon,
  Mic01Icon,
  Image01Icon,
  Delete02Icon,
  SentIcon,
} from '@hugeicons/core-free-icons';
import { Colors } from '../../constants/theme';

interface ChatInputBarProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: () => void;
  onSendImage: (useCamera: boolean) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  loading: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  inputText,
  setInputText,
  onSendMessage,
  onSendImage,
  isRecording,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  loading,
}) => {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const hasText = inputText.trim().length > 0;

  // Animations
  const dotAnim = useRef(new Animated.Value(1)).current;
  const barAnim1 = useRef(new Animated.Value(8)).current;
  const barAnim2 = useRef(new Animated.Value(16)).current;
  const barAnim3 = useRef(new Animated.Value(22)).current;
  const barAnim4 = useRef(new Animated.Value(12)).current;
  const barAnim5 = useRef(new Animated.Value(18)).current;

  // Keyboard listeners
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardOpen(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardOpen(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Recording timer and animations
  useEffect(() => {
    let timer: any = null;
    let dotLoop: any = null;

    if (isRecording) {
      setRecordingSeconds(0);
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Blinking white dot
      dotLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim, {
            toValue: 0.25,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      dotLoop.start();

      // Waveform dancing animation
      const animateBars = () => {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(barAnim1, { toValue: 20, duration: 250, useNativeDriver: false }),
            Animated.timing(barAnim1, { toValue: 6, duration: 250, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(barAnim2, { toValue: 8, duration: 250, useNativeDriver: false }),
            Animated.timing(barAnim2, { toValue: 24, duration: 250, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(barAnim3, { toValue: 26, duration: 250, useNativeDriver: false }),
            Animated.timing(barAnim3, { toValue: 10, duration: 250, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(barAnim4, { toValue: 10, duration: 250, useNativeDriver: false }),
            Animated.timing(barAnim4, { toValue: 22, duration: 250, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(barAnim5, { toValue: 24, duration: 250, useNativeDriver: false }),
            Animated.timing(barAnim5, { toValue: 8, duration: 250, useNativeDriver: false }),
          ]),
        ]).start(() => {
          if (isRecording) animateBars();
        });
      };
      animateBars();
    } else {
      dotAnim.setValue(1);
      setRecordingSeconds(0);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (dotLoop) dotLoop.stop();
    };
  }, [isRecording]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  const bottomPadding = isKeyboardOpen
    ? 8
    : Math.max(insets.bottom + 6, Platform.OS === 'android' ? 22 : 12);

  return (
    <View style={[styles.instagramInputBar, { paddingBottom: bottomPadding }]}>
      {isRecording ? (
        /* Active Recording Clean White HUD */
        <View style={styles.recordingContainer}>
          {/* Delete / Cancel Button */}
          <TouchableOpacity
            style={styles.recordingDeleteBtn}
            onPress={onCancelRecording}
            activeOpacity={0.7}
          >
            <HugeiconsIcon icon={Delete02Icon} size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Pulsing White Dot & Live Timer */}
          <View style={styles.recordingCenterRow}>
            <Animated.View style={[styles.recordingWhiteDot, { opacity: dotAnim }]} />
            <Text style={styles.recordingTimerText}>{formatTimer(recordingSeconds)}</Text>

            {/* Dancing Clean White Waveforms */}
            <View style={styles.recordingWaveform}>
              <Animated.View style={[styles.recWaveBar, { height: barAnim1 }]} />
              <Animated.View style={[styles.recWaveBar, { height: barAnim2 }]} />
              <Animated.View style={[styles.recWaveBar, { height: barAnim3 }]} />
              <Animated.View style={[styles.recWaveBar, { height: barAnim4 }]} />
              <Animated.View style={[styles.recWaveBar, { height: barAnim5 }]} />
              <Animated.View style={[styles.recWaveBar, { height: barAnim2 }]} />
              <Animated.View style={[styles.recWaveBar, { height: barAnim4 }]} />
            </View>
          </View>

          {/* Stop / Send Button */}
          <TouchableOpacity
            style={styles.recordingSendBtn}
            onPress={onStopRecording}
            activeOpacity={0.85}
          >
            <HugeiconsIcon icon={SentIcon} size={18} color="#000000" />
          </TouchableOpacity>
        </View>
      ) : (
        /* Normal Chat Input Bar */
        <>
          {/* Camera Button */}
          <TouchableOpacity
            style={styles.instagramCamBtn}
            onPress={() => onSendImage(true)}
            disabled={loading}
            activeOpacity={0.75}
          >
            <HugeiconsIcon icon={Camera01Icon} size={20} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Message Input Box */}
          <View style={styles.instagramInputBox}>
            {/* Text Input */}
            <TextInput
              ref={inputRef}
              style={styles.instagramTextInput}
              placeholder="Message..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              selectionColor="#FFFFFF"
              cursorColor="#FFFFFF"
              multiline
              maxLength={1000}
            />

            {/* Right side controls */}
            <View style={styles.instagramRightIconsRow}>
              {!hasText ? (
                <>
                  {/* Photo/Gallery Icon */}
                  <TouchableOpacity
                    style={styles.innerIconBtn}
                    onPress={() => onSendImage(false)}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <HugeiconsIcon icon={Image01Icon} size={20} color={Colors.textPrimary} />
                  </TouchableOpacity>

                  {/* Microphone Icon for Voice Notes */}
                  <TouchableOpacity
                    style={[styles.innerIconBtn, styles.micButton]}
                    onPress={onStartRecording}
                    activeOpacity={0.7}
                  >
                    <HugeiconsIcon
                      icon={Mic01Icon}
                      size={20}
                      color={Colors.textPrimary}
                    />
                  </TouchableOpacity>
                </>
              ) : (
                /* Send Button */
                <TouchableOpacity
                  style={styles.instagramSendTextBtn}
                  onPress={onSendMessage}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.instagramSendText}>Send</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  instagramInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  instagramCamBtn: {
    backgroundColor: Colors.cardBackground,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  instagramTextInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 6,
    maxHeight: 100,
  },
  instagramRightIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  innerIconBtn: {
    padding: 4,
  },
  micButton: {
    padding: 6,
  },
  instagramSendTextBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  instagramSendText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 15,
  },
  // Clean White Recording HUD
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E2738',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    height: 48,
  },
  recordingDeleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2A374D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordingWhiteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  recordingTimerText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  recordingWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    marginLeft: 6,
  },
  recWaveBar: {
    width: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  recordingSendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
