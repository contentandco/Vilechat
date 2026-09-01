import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Camera01Icon,
  Mic01Icon,
  Image01Icon,
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
  loading,
}) => {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);
  const hasText = inputText.trim().length > 0;

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

  const bottomPadding = isKeyboardOpen
    ? 8
    : Math.max(insets.bottom + 6, Platform.OS === 'android' ? 22 : 12);

  return (
    <View style={[styles.instagramInputBar, { paddingBottom: bottomPadding }]}>
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
                style={styles.innerIconBtn} 
                onPressIn={onStartRecording}
                onPressOut={onStopRecording}
                activeOpacity={0.7}
              >
                <HugeiconsIcon 
                  icon={Mic01Icon} 
                  size={20} 
                  color={isRecording ? Colors.primary : Colors.textPrimary} 
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
  instagramSendTextBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  instagramSendText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 15,
  },
});
