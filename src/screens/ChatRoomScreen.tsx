import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MessageItem, ActiveRoomDetail } from '../types';
import { Colors } from '../constants/theme';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageList } from '../components/chat/MessageList';
import { ChatInputBar } from '../components/chat/ChatInputBar';
import { StickersPanel } from '../components/chat/StickersPanel';
import { RoomInfoModal } from '../components/common/RoomInfoModal';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useImagePicker } from '../hooks/useImagePicker';
import {
  useRoomMessages,
  useSendMessageMutation,
  useLoadEarlierMessagesMutation,
  messageKeys,
} from '../hooks/queries/useMessagesQuery';
import { useRenameRoomMutation } from '../hooks/queries/useRoomQuery';
import { inboxKeys } from '../hooks/queries/useInboxQuery';
import { setRoomLastRead } from '../services/storage';
import {
  subscribeToRoomMessages,
  generateClientUUID,
  sendSystemJoinMessage,
} from '../api/messages';
import {
  subscribeToRoomMeta,
  broadcastKickUser,
  subscribeToRoomActions,
  deleteRoomPermanently,
} from '../api/rooms';

interface ChatRoomScreenProps {
  roomId: string;
  roomCode: string;
  roomName: string;
  setRoomName: (name: string) => void;
  userId: string;
  deviceId: string;
  userNickname: string;
  timeRemaining: string;
  isCreator: boolean;
  onBack: () => void;
  onLeaveRoom: () => void;
  onDestroyRoom?: () => void;
  showRoomInfo: boolean;
  setShowRoomInfo: (show: boolean) => void;
}

export const ChatRoomScreen: React.FC<ChatRoomScreenProps> = ({
  roomId,
  roomCode,
  roomName,
  setRoomName,
  userId,
  deviceId,
  userNickname,
  timeRemaining,
  isCreator,
  onBack,
  onLeaveRoom,
  onDestroyRoom,
  showRoomInfo,
  setShowRoomInfo,
}) => {
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState<string>('');
  const [roomNameInputText, setRoomNameInputText] = useState<string>('');
  const [showStickers, setShowStickers] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasEarlierMessages, setHasEarlierMessages] = useState<boolean>(true);

  const scrollViewRef = useRef<ScrollView>(null);
  const { playingAudioId, playAudio, stopAudio } = useAudioPlayer();

  // TanStack Query hooks for messages and mutations
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    isRefetching,
    refetch: refetchMessages,
  } = useRoomMessages(roomId, roomCode);
  const { mutateAsync: sendMessageMutation } = useSendMessageMutation();
  const { mutateAsync: loadEarlierMutation, isPending: loadingEarlier } = useLoadEarlierMessagesMutation();
  const { mutateAsync: renameRoomMutation } = useRenameRoomMutation(deviceId);

  const handleRefresh = async () => {
    await refetchMessages();
  };

  // Compute unique human participants
  const myCleanName = (userNickname || '').replace(/^@+/, '').trim().toLowerCase();
  const uniqueParticipants = new Set<string>();
  for (const m of messages) {
    if (!m.is_system && m.sender_id !== '__system__' && m.sender_name !== 'System') {
      const cleanSender = (m.sender_name || m.sender_id).replace(/^@+/, '').trim().toLowerCase();
      if (cleanSender && cleanSender !== myCleanName && m.sender_id !== userId) {
        uniqueParticipants.add(cleanSender);
      }
    }
  }
  const participantsCount = uniqueParticipants.size + 1;

  // Scroll to bottom helper
  const scrollToBottom = (delay: number = 50) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, delay);
  };

  // Helper to mark current room as read both locally and in query cache
  const markActiveRoomRead = () => {
    if (roomCode) {
      setRoomLastRead(roomCode, Date.now());
      if (deviceId) {
        queryClient.setQueryData<ActiveRoomDetail[]>(
          inboxKeys.byDevice(deviceId),
          (old = []) =>
            old.map((r) =>
              r.code.toLowerCase() === roomCode.toLowerCase()
                ? { ...r, hasUnread: false }
                : r
            )
        );
      }
    }
  };

  // Scroll to bottom and mark room read on initial message load
  useEffect(() => {
    if (messages.length > 0) {
      markActiveRoomRead();
      scrollToBottom(100);
      if (messages.length < 20) {
        setHasEarlierMessages(false);
      }
    }
  }, [roomId, messages.length === 0]);

  // System Join Announcement & Real-Time subscriptions
  useEffect(() => {
    if (!roomId) return;
    markActiveRoomRead();

    // Send system announcement once per room session
    const checkAnnouncement = async () => {
      const announceKey = `vailchat_announcement_sent_${roomId}_${userId}`;
      const alreadyAnnounced = await AsyncStorage.getItem(announceKey);
      if (!alreadyAnnounced) {
        await AsyncStorage.setItem(announceKey, 'true');
        await sendSystemJoinMessage(roomId, roomCode, userNickname, isCreator);
      }
    };
    checkAnnouncement();

    // Subscribe to incoming messages and directly update TanStack Query cache (Zero duplicate DB queries)
    const unsubscribeMessages = subscribeToRoomMessages(roomId, roomCode, (newMsg) => {
      markActiveRoomRead();
      queryClient.setQueryData<MessageItem[]>(messageKeys.room(roomId), (old = []) => {
        if (old.some((m) => m.id === newMsg.id)) {
          return old;
        }
        return [...old, newMsg];
      });
      scrollToBottom(100);
    });

    // Subscribe to room meta updates
    const unsubscribeMeta = subscribeToRoomMeta(roomId, roomCode, (newName) => {
      setRoomName(newName);
    });

    // Subscribe to room actions (kick, delete)
    const unsubscribeActions = subscribeToRoomActions(
      roomId,
      (kickedUserId) => {
        if (kickedUserId === userId) {
          Alert.alert(
            'Removed',
            'You were removed from this room by the creator.',
            [{ text: 'OK', onPress: onLeaveRoom }]
          );
        }
      },
      () => {
        if (!isCreator) {
          Alert.alert(
            'Room Closed',
            'This room was closed and deleted by the creator.',
            [{ text: 'OK', onPress: onLeaveRoom }]
          );
        }
      }
    );

    return () => {
      markActiveRoomRead();
      unsubscribeMessages();
      unsubscribeMeta();
      unsubscribeActions();
      stopAudio();
    };
  }, [roomId, roomCode]);

  // Load earlier messages with TanStack Query mutation
  const handleLoadEarlier = async () => {
    if (loadingEarlier || messages.length === 0) return;
    try {
      const oldestCreatedAt = messages[0].created_at;
      const res = await loadEarlierMutation({
        roomId,
        roomCode,
        beforeCreatedAt: oldestCreatedAt,
      });
      if (res.earlier.length < 20) {
        setHasEarlierMessages(false);
      }
    } catch (e) {
      console.warn('Failed to load earlier messages:', e);
    }
  };

  // Send text message with optimistic update
  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    const msgId = generateClientUUID();
    setInputText('');
    scrollToBottom();

    try {
      await sendMessageMutation({
        id: msgId,
        roomId,
        roomCode,
        senderId: userId,
        senderName: userNickname,
        rawContent: text,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  // Send photo
  const { selectImage, pickingImage } = useImagePicker(async (base64Image) => {
    const msgId = generateClientUUID();
    scrollToBottom();
    try {
      await sendMessageMutation({
        id: msgId,
        roomId,
        roomCode,
        senderId: userId,
        senderName: userNickname,
        rawContent: base64Image,
        isImage: true,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to send image.');
    }
  });

  // Send sticker
  const handleSendSticker = async (stickerUrl: string) => {
    setShowStickers(false);
    const msgId = generateClientUUID();
    scrollToBottom();
    try {
      await sendMessageMutation({
        id: msgId,
        roomId,
        roomCode,
        senderId: userId,
        senderName: userNickname,
        rawContent: stickerUrl,
        isSticker: true,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to send sticker.');
    }
  };

  // Record and send voice note
  const { isRecording, isProcessing: recordingProcessing, startRecording, stopRecording } = useAudioRecorder(
    async (base64AudioData) => {
      const msgId = generateClientUUID();
      scrollToBottom();
      try {
        await sendMessageMutation({
          id: msgId,
          roomId,
          roomCode,
          senderId: userId,
          senderName: userNickname,
          rawContent: base64AudioData,
          isVoice: true,
        });
      } catch (err) {
        Alert.alert('Error', 'Failed to send voice note.');
      }
    }
  );

  // Rename room (Creator only)
  const handleRenameRoom = async (newName: string) => {
    if (!isCreator) return;
    try {
      setLoading(true);
      await renameRoomMutation({ roomId, roomCode, newName });
      setRoomName(newName);
      Alert.alert('Success', 'Room renamed successfully!');
    } catch (e) {
      Alert.alert('Error', 'Failed to update room name.');
    } finally {
      setLoading(false);
    }
  };

  // Kick participant (Creator only)
  const handleKickParticipant = async (participantId: string, participantName: string) => {
    if (!isCreator) return;
    try {
      await broadcastKickUser(roomId, participantId);
      // Remove locally from messages query cache
      queryClient.setQueryData<MessageItem[]>(messageKeys.room(roomId), (old = []) =>
        old.filter((m) => m.sender_id !== participantId)
      );
      Alert.alert('User Kicked', `${participantName} was removed from the room.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to kick user.');
    }
  };

  // Destroy room (Creator only)
  const handleDestroyRoom = async () => {
    if (!isCreator) return;
    try {
      setLoading(true);
      await deleteRoomPermanently(roomId, roomCode);
      if (onDestroyRoom) {
        onDestroyRoom();
      } else {
        onLeaveRoom();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to delete room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
      style={styles.chatWrapper}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <ChatHeader
        roomName={roomName}
        timeRemaining={timeRemaining}
        participantsCount={participantsCount}
        onBack={onBack}
        onOpenRoomInfo={() => {
          setRoomNameInputText(roomName);
          setShowRoomInfo(true);
        }}
      />

      {/* Messages Stream with 20-Message Pagination & Pull to Refresh */}
      <MessageList
        scrollViewRef={scrollViewRef}
        messages={messages}
        userId={userId}
        playingAudioId={playingAudioId}
        onPlayAudio={playAudio}
        onScrollBeginDrag={() => setShowStickers(false)}
        hasEarlierMessages={hasEarlierMessages}
        loadingEarlier={loadingEarlier}
        onLoadEarlier={handleLoadEarlier}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
      />

      {/* Input Bar */}
      <ChatInputBar
        inputText={inputText}
        setInputText={setInputText}
        onSendMessage={handleSendMessage}
        onSendImage={selectImage}
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        showStickers={showStickers}
        setShowStickers={setShowStickers}
        loading={loading || pickingImage || recordingProcessing || isLoadingMessages}
      />

      {/* Stickers Panel */}
      {showStickers && (
        <StickersPanel onSelectSticker={handleSendSticker} />
      )}

      {/* Room Details Modal */}
      <RoomInfoModal
        visible={showRoomInfo}
        onClose={() => setShowRoomInfo(false)}
        activeRoomName={roomName}
        activeRoomCode={roomCode}
        timeRemaining={timeRemaining}
        participantsCount={participantsCount}
        userNickname={userNickname}
        userId={userId}
        messages={messages}
        isCreator={isCreator}
        roomNameInputText={roomNameInputText}
        setRoomNameInputText={setRoomNameInputText}
        onRenameRoom={handleRenameRoom}
        onLeaveRoom={onLeaveRoom}
        onDestroyRoom={handleDestroyRoom}
        onKickParticipant={handleKickParticipant}
        loading={loading}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  chatWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
