import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { BubbleChatSpark01Icon } from '@hugeicons/core-free-icons';
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
          <HugeiconsIcon 
            icon={BubbleChatSpark01Icon} 
            size={48} 
            color="#4E5766" 
            style={{ marginBottom: 12 }} 
          />
          <Text style={styles.emptyTitle}>Secure Workspace Initiated</Text>
          <Text style={styles.emptyDesc}>
            Your messages are encrypted end-to-end. Eavesdroppers (and even this database server) see nothing but random letters.
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
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
