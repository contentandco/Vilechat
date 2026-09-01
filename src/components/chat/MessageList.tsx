import React, { useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { MessageItem } from '../../types';
import { Colors } from '../../constants/theme';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  scrollViewRef?: React.RefObject<ScrollView | null>;
  messages: MessageItem[];
  userId: string;
  userNickname?: string;
  roomName?: string;
  playingAudioId: string | null;
  onPlayAudio: (id: string, content: string) => void;
  onScrollBeginDrag?: () => void;
  hasEarlierMessages?: boolean;
  loadingEarlier?: boolean;
  onLoadEarlier?: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  scrollViewRef,
  messages,
  userId,
  userNickname,
  playingAudioId,
  onPlayAudio,
  onScrollBeginDrag,
  hasEarlierMessages = false,
  loadingEarlier = false,
  onLoadEarlier,
}) => {
  const isInitialMount = useRef(true);
  const prevLatestId = useRef<string | null>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = event.nativeEvent;
    // Prefetch earlier messages ahead of time when scrolling within 300px of top
    if (contentOffset.y <= 300 && hasEarlierMessages && !loadingEarlier && onLoadEarlier) {
      onLoadEarlier();
    }
  };

  const handleContentSizeChange = () => {
    const latestMsg = messages[messages.length - 1];
    const latestId = latestMsg?.id || null;

    if (isInitialMount.current && messages.length > 0) {
      // 0ms Instant positioning at the bottom on initial load
      scrollViewRef?.current?.scrollToEnd({ animated: false });
      isInitialMount.current = false;
      prevLatestId.current = latestId;
      return;
    }

    // ONLY scroll down if a NEW message was appended at the BOTTOM (latest message ID changed)
    if (latestId && prevLatestId.current && latestId !== prevLatestId.current) {
      scrollViewRef?.current?.scrollToEnd({ animated: true });
    }

    prevLatestId.current = latestId;
  };

  return (
    <ScrollView
      ref={scrollViewRef as any}
      style={styles.messagesList}
      contentContainerStyle={styles.messagesListContent}
      onScroll={handleScroll}
      scrollEventThrottle={32}
      onContentSizeChange={handleContentSizeChange}
      onScrollBeginDrag={onScrollBeginDrag}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Subtle indicator when fetching earlier messages */}
      {hasEarlierMessages && loadingEarlier && (
        <View style={styles.paginationContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}

      {/* Top Encryption & Ephemeral Text (Naturally placed at top) */}
      {!hasEarlierMessages && (
        <View style={styles.topNoticeWrapper}>
          <Text style={styles.topEncryptionText}>
            Messages and media are end-to-end encrypted. No one outside this chat can read them. They disappear after 24 hours.
          </Text>
        </View>
      )}

      {/* Message Stream */}
      {messages.map((item, index) => {
        const isMe = item.sender_id === userId;
        const prevMsg = index > 0 ? messages[index - 1] : null;
        const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

        const currentMsgTime = new Date(item.created_at).getTime();
        const prevMsgTime = prevMsg ? new Date(prevMsg.created_at).getTime() : 0;
        const nextMsgTime = nextMsg ? new Date(nextMsg.created_at).getTime() : 0;

        const FIVE_MINUTES_MS = 5 * 60 * 1000;

        // Is first in group if: different sender OR >5 minutes since previous message
        const isFirstInGroup =
          !prevMsg ||
          prevMsg.sender_id !== item.sender_id ||
          currentMsgTime - prevMsgTime >= FIVE_MINUTES_MS;

        // Is last in group (shows timestamp) if: no next message OR different sender OR next message is >=5 minutes later
        const isLastInGroup =
          !nextMsg ||
          nextMsg.sender_id !== item.sender_id ||
          nextMsgTime - currentMsgTime >= FIVE_MINUTES_MS;

        return (
          <MessageBubble
            key={item.id}
            item={item}
            isMe={isMe}
            userNickname={userNickname}
            isFirstInGroup={isFirstInGroup}
            isLastInGroup={isLastInGroup}
            isPlayingAudio={playingAudioId === item.id}
            onPlayAudio={onPlayAudio}
          />
        );
      })}
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  paginationContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 10,
  },
  topNoticeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginBottom: 12,
  },
  topEncryptionText: {
    color: '#D4A017',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
});
