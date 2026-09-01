import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
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

const FIVE_MINUTES_MS = 5 * 60 * 1000;

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
  const flashListRef = React.useRef<FlashListRef<MessageItem>>(null);

  // Expose scrollToEnd on the scrollViewRef so ChatRoomScreen can still call it
  React.useImperativeHandle(scrollViewRef as any, () => ({
    scrollToEnd: ({ animated }: { animated?: boolean } = {}) => {
      if (messages.length > 0) {
        flashListRef.current?.scrollToEnd({ animated: animated ?? true });
      }
    },
  }));

  const renderItem = useCallback(({ item, index }: { item: MessageItem; index: number }) => {
    const isMe = item.sender_id === userId;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

    const currentMsgTime = new Date(item.created_at).getTime();
    const prevMsgTime = prevMsg ? new Date(prevMsg.created_at).getTime() : 0;
    const nextMsgTime = nextMsg ? new Date(nextMsg.created_at).getTime() : 0;

    const isFirstInGroup =
      !prevMsg ||
      prevMsg.sender_id !== item.sender_id ||
      currentMsgTime - prevMsgTime >= FIVE_MINUTES_MS;

    const isLastInGroup =
      !nextMsg ||
      nextMsg.sender_id !== item.sender_id ||
      nextMsgTime - currentMsgTime >= FIVE_MINUTES_MS;

    return (
      <MessageBubble
        item={item}
        isMe={isMe}
        userNickname={userNickname}
        isFirstInGroup={isFirstInGroup}
        isLastInGroup={isLastInGroup}
        isPlayingAudio={playingAudioId === item.id}
        onPlayAudio={onPlayAudio}
      />
    );
  }, [userId, userNickname, messages, playingAudioId, onPlayAudio]);

  const keyExtractor = useCallback((item: MessageItem) => item.id, []);

  const ListHeaderComponent = useCallback(() => (
    <>
      {hasEarlierMessages && loadingEarlier && (
        <View style={styles.paginationContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
      {!hasEarlierMessages && (
        <View style={styles.topNoticeWrapper}>
          <Text style={styles.topEncryptionText}>
            Messages and media are end-to-end encrypted. No one outside this chat can read them. They disappear after 24 hours.
          </Text>
        </View>
      )}
    </>
  ), [hasEarlierMessages, loadingEarlier]);

  const handleScroll = useCallback((e: any) => {
    const offsetY = e.nativeEvent?.contentOffset?.y ?? 0;
    if (offsetY <= 300 && hasEarlierMessages && !loadingEarlier && onLoadEarlier) {
      onLoadEarlier();
    }
    onScrollBeginDrag?.();
  }, [hasEarlierMessages, loadingEarlier, onLoadEarlier, onScrollBeginDrag]);

  return (
    <FlashList
      ref={flashListRef}
      data={messages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.messagesListContent}
      ListHeaderComponent={ListHeaderComponent}
      onScroll={handleScroll}
      scrollEventThrottle={32}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      onLoad={() => {
        if (messages.length > 0) {
          flashListRef.current?.scrollToEnd({ animated: false });
        }
      }}
      maintainVisibleContentPosition={{
        autoscrollToTopThreshold: 80,
      }}
    />
  );
};

const styles = StyleSheet.create({
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
