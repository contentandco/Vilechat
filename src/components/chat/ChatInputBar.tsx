import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Camera01Icon,
  Mic01Icon,
  Image01Icon,
  SmileIcon,
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
  showStickers: boolean;
  setShowStickers: (show: boolean) => void;
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
  showStickers,
  setShowStickers,
  loading,
}) => {
  const hasText = inputText.trim().length > 0;

  return (
    <View style={styles.instagramInputBar}>
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
        <TextInput
          style={styles.instagramTextInput}
          placeholder="Message..."
          placeholderTextColor={Colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          onFocus={() => setShowStickers(false)}
        />

        {/* Media Controls when no text is typed */}
        {!hasText && (
          <View style={styles.instagramRightIconsRow}>
            {/* Microphone Icon for Voice Notes */}
            <TouchableOpacity 
              style={styles.innerIconBtn} 
              onPressIn={onStartRecording}
              onPressOut={onStopRecording}
            >
              <HugeiconsIcon 
                icon={Mic01Icon} 
                size={20} 
                color={isRecording ? Colors.danger : Colors.textPrimary} 
              />
            </TouchableOpacity>

            {/* Photo/Gallery Icon */}
            <TouchableOpacity 
              style={styles.innerIconBtn} 
              onPress={() => onSendImage(false)}
              disabled={loading}
            >
              <HugeiconsIcon icon={Image01Icon} size={20} color={Colors.textPrimary} />
            </TouchableOpacity>

            {/* Sticker/Smile Icon */}
            <TouchableOpacity 
              style={styles.innerIconBtn} 
              onPress={() => setShowStickers(!showStickers)}
            >
              <HugeiconsIcon 
                icon={SmileIcon} 
                size={20} 
                color={showStickers ? Colors.secondary : Colors.textPrimary} 
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Send Button when text is present */}
        {hasText && (
          <TouchableOpacity 
            style={styles.instagramSendTextBtn} 
            onPress={onSendMessage}
            disabled={loading}
          >
            <Text style={styles.instagramSendText}>Send</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  instagramInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  instagramCamBtn: {
    backgroundColor: Colors.cardBackground,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instagramTextInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    paddingTop: 8,
    paddingBottom: 8,
    maxHeight: 100,
  },
  instagramRightIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  innerIconBtn: {
    padding: 4,
  },
  instagramSendTextBtn: {
    paddingHorizontal: 8,
  },
  instagramSendText: {
    color: Colors.secondary,
    fontWeight: '700',
    fontSize: 15,
  },
});
