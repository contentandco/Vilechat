import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MessageItem, ActiveRoomDetail } from '../types';
import { Colors } from '../constants/theme';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageList } from '../components/chat/MessageList';
import { ChatInputBar } from '../components/chat/ChatInputBar';
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
import { setRoomLastRead, saveLocalRoomMessages } from '../services/storage';
import {
  sendEncryptedMessage,
  sendSystemJoinMessage,
  subscribeToRoomMessages,
  generateClientUUID,
  RoomPresenceUser,
} from '../api/messages';
import {
  subscribeToRoomMeta,
  subscribeToRoomActions,
  broadcastKickUser,
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
  const [loading, setLoading] = useState<boolean>(false);
  const [hasEarlierMessages, setHasEarlierMessages] = useState<boolean>(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const { playingAudioId, playAudio, stopAudio } = useAudioPlayer();

  // TanStack Query hooks for messages and mutations
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useRoomMessages(roomId, roomCode);
  const { mutateAsync: sendMessageMutation } = useSendMessageMutation();
  const { mutateAsync: loadEarlierMutation, isPending: loadingEarlier } = useLoadEarlierMessagesMutation();
  const { mutateAsync: renameRoomMutation } = useRenameRoomMutation(deviceId);

  const [isPullRefreshing, setIsPullRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    try {
      setIsPullRefreshing(true);
      await refetchMessages();
    } finally {
      setIsPullRefreshing(false);
    }
  };

  const [onlineUsers, setOnlineUsers] = useState<RoomPresenceUser[]>([]);
  const participantsCount = Math.max(1, onlineUsers.length);

  // Scroll to bottom (latest message) helper
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

  // Update hasEarlierMessages dynamically
  useEffect(() => {
    markActiveRoomRead();
    setHasEarlierMessages(messages.length >= 50);
  }, [roomId, messages.length]);

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

    // AppState Foreground Reconnect: Catch up on any delta messages missed while offline/backgrounded
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refetchMessages();
        markActiveRoomRead();
      }
    });

    // Subscribe to incoming messages and live Presence
    const unsubscribeMessages = subscribeToRoomMessages(
      roomId,
      roomCode,
      (newMsg) => {
        markActiveRoomRead();
        queryClient.setQueryData<MessageItem[]>(messageKeys.room(roomId), (old = []) => {
          if (old.some((m) => m.id === newMsg.id)) {
            return old;
          }
          const updated = [...old, newMsg].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          if (roomCode) {
            saveLocalRoomMessages(roomCode, updated).catch(() => {});
          }
          return updated;
        });
        scrollToBottom(100);
      },
      userId,
      userNickname,
      (presenceUsers) => {
        setOnlineUsers(presenceUsers);
      }
    );

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
      appStateSub.remove();
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
      if (res.earlier.length < 50) {
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

  // Record and send voice note
  const { isRecording, isProcessing: recordingProcessing, startRecording, stopRecording, cancelRecording } = useAudioRecorder(
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
    } catch (e) {
      console.warn('Failed to update room name:', e);
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
    if (onDestroyRoom) {
      onDestroyRoom();
      return;
    }
    try {
      setLoading(true);
      await deleteRoomPermanently(roomId, roomCode);
      onLeaveRoom();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.chatWrapper}
    >
      {/* Top Header */}
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

      {/* Messages Scroll Area */}
      <MessageList
        scrollViewRef={scrollViewRef}
        messages={messages}
        userId={userId}
        userNickname={userNickname}
        roomName={roomName}
        playingAudioId={playingAudioId}
        onPlayAudio={playAudio}
        hasEarlierMessages={hasEarlierMessages}
        loadingEarlier={loadingEarlier}
        onLoadEarlier={handleLoadEarlier}
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
        onCancelRecording={cancelRecording}
        loading={loading || pickingImage || recordingProcessing}
      />

      {/* Room Details Modal */}
      <RoomInfoModal
        visible={showRoomInfo}
        onClose={() => setShowRoomInfo(false)}
        activeRoomName={roomName}
        activeRoomCode={roomCode}
        timeRemaining={timeRemaining}
        participantsCount={participantsCount}
        onlineUsers={onlineUsers}
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
