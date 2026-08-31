import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { LockKeyIcon } from '@hugeicons/core-free-icons';
import { MessageItem } from '../../types';
import { Colors } from '../../constants/theme';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  scrollViewRef: React.RefObject<ScrollView | null>;
  messages: MessageItem[];
  userId: string;
  playingAudioId: string | null;
  onPlayAudio: (id: string, content: string) => void;
  onScrollBeginDrag?: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  scrollViewRef,
  messages,
  userId,
  playingAudioId,
  onPlayAudio,
  onScrollBeginDrag,
}) => {
  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.messagesList}
      contentContainerStyle={styles.messagesListContent}
      onScrollBeginDrag={onScrollBeginDrag}
      keyboardShouldPersistTaps="handled"
    >
      {messages.length === 0 ? (
        <View style={styles.emptyChatPlaceholder}>
          <View style={styles.emptyIconCircle}>
            <HugeiconsIcon 
              icon={LockKeyIcon} 
              size={32} 
              color={Colors.primary} 
            />
          </View>
          <Text style={styles.emptyTitle}>Encrypted Chat Initiated</Text>
          <Text style={styles.emptyDesc}>
            All messages, photos, and voice notes are end-to-end encrypted. Eavesdroppers and database servers only see random ciphertext.
          </Text>
        </View>
      ) : (
        messages.map((item, index) => {
          const isMe = item.sender_id === userId;
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

          const isFirstInGroup = !prevMsg || prevMsg.sender_id !== item.sender_id;
          const isLastInGroup = !nextMsg || nextMsg.sender_id !== item.sender_id;

          return (
            <MessageBubble
              key={item.id}
              item={item}
              isMe={isMe}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroup}
              isPlayingAudio={playingAudioId === item.id}
              onPlayAudio={onPlayAudio}
            />
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  messagesList: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesListContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyChatPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
