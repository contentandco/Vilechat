import React from 'react';
import { StyleSheet, View, Text, Image, Platform } from 'react-native';
import { MessageItem } from '../../types';
import { Colors } from '../../constants/theme';
import { VoiceWaveform } from './VoiceWaveform';

interface MessageBubbleProps {
  item: MessageItem;
  isMe: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  isPlayingAudio: boolean;
  onPlayAudio: (id: string, content: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  item,
  isMe,
  isFirstInGroup,
  isLastInGroup,
  isPlayingAudio,
  onPlayAudio,
}) => {
  const formatMsgTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  };

  const bubbleStyle = isMe 
    ? {
        borderTopLeftRadius: 18,
        borderBottomLeftRadius: 18,
        borderTopRightRadius: isFirstInGroup ? 18 : 4,
        borderBottomRightRadius: isLastInGroup ? 4 : 4,
      }
    : {
        borderTopRightRadius: 18,
        borderBottomRightRadius: 18,
        borderTopLeftRadius: isFirstInGroup ? 18 : 4,
        borderBottomLeftRadius: isLastInGroup ? 4 : 4,
      };

  return (
    <View 
      style={[
        styles.messageRow, 
        isMe ? styles.messageRowRight : styles.messageRowLeft,
        { marginBottom: isLastInGroup ? 12 : 2 }
      ]}
    >
      {!isMe && isFirstInGroup && (
        <Text style={styles.senderName}>{item.sender_name}</Text>
      )}

      <View style={[
        styles.msgBubble, 
        isMe ? styles.msgBubbleRight : styles.msgBubbleLeft,
        bubbleStyle,
        (item.is_image || item.is_sticker) && styles.msgBubbleImage,
        item.is_voice && styles.msgBubbleVoice,
      ]}>
        {item.is_image ? (
          <Image 
            source={{ uri: item.content }} 
            style={styles.sentImage} 
            resizeMode="cover"
          />
        ) : item.is_sticker ? (
          <Image 
            source={{ uri: item.content }} 
            style={styles.sentSticker} 
            resizeMode="contain"
          />
        ) : item.is_voice ? (
          <VoiceWaveform 
            isPlaying={isPlayingAudio}
            isMe={isMe}
            onTogglePlay={() => onPlayAudio(item.id, item.content)}
          />
        ) : (
          <Text style={[styles.msgText, isMe ? styles.msgTextRight : styles.msgTextLeft]}>
            {item.content}
          </Text>
        )}
      </View>

      {isLastInGroup && (
        <Text style={[styles.msgTime, isMe ? styles.msgTimeRight : styles.msgTimeLeft]}>
          {formatMsgTime(item.created_at)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageRow: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  messageRowLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageRowRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  senderName: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 8,
  },
  msgBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  msgBubbleLeft: {
    backgroundColor: Colors.cardBackground,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  msgBubbleRight: {
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: 4,
  },
  msgBubbleImage: {
    padding: 4,
    borderRadius: 14,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  msgBubbleVoice: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    minWidth: 180,
  },
  msgText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 15,
    lineHeight: 20,
  },
  msgTextLeft: {
    color: Colors.textPrimary,
  },
  msgTextRight: {
    color: Colors.textWhite,
    fontWeight: '500',
  },
  sentImage: {
    width: 220,
    height: 180,
    borderRadius: 12,
  },
  sentSticker: {
    width: 120,
    height: 120,
  },
  msgTime: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  msgTimeLeft: {
    alignSelf: 'flex-start',
    marginLeft: 12,
  },
  msgTimeRight: {
    alignSelf: 'flex-end',
    marginRight: 12,
  },
});
