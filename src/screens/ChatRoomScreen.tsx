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
import { useAppStore } from '../store/useAppStore';
import { useRoomActions } from '../hooks/useRoomActions';
import { useRoomTimer } from '../hooks/useRoomTimer';

export const ChatRoomScreen: React.FC = () => {
  const queryClient = useQueryClient();

  // Zustand Store
  const roomId = useAppStore((s) => s.activeRoomId);
  const roomCode = useAppStore((s) => s.activeRoomCode);
  const roomName = useAppStore((s) => s.activeRoomName);
  const setRoomName = useAppStore((s) => s.setActiveRoomName);
  const userId = useAppStore((s) => s.userId);
  const deviceId = useAppStore((s) => s.deviceId);
  const userNickname = useAppStore((s) => s.userNickname);
  const roomExpiresAt = useAppStore((s) => s.roomExpiresAt);
  const roomCreatorDeviceId = useAppStore((s) => s.roomCreatorDeviceId);
  const roomCreatorId = useAppStore((s) => s.roomCreatorId);
  const whisperRoomCode = useAppStore((s) => s.whisperRoomCode);
  const showRoomInfo = useAppStore((s) => s.showRoomInfo);
  const setShowRoomInfo = useAppStore((s) => s.setShowRoomInfo);

  const {
    handleLeaveRoom,
    handleLeaveAndRemoveRoom,
    handleDestroyAndRemoveRoom,
  } = useRoomActions();

  const timeRemaining = useRoomTimer(roomExpiresAt, handleLeaveRoom);

  const isCreator = Boolean(
    (roomCreatorDeviceId && roomCreatorDeviceId === deviceId) ||
    (roomCreatorId && roomCreatorId === userId) ||
    roomCode === whisperRoomCode
  );

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

  const [onlineUsers, setOnlineUsers] = useState<RoomPresenceUser[]>([]);
  const participantsCount = Math.max(1, onlineUsers.length);

  // Scroll to bottom helper
  const scrollToBottom = (delay: number = 50) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, delay);
  };

  // Helper to mark current room as read
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

  useEffect(() => {
    markActiveRoomRead();
    setHasEarlierMessages(messages.length >= 50);
  }, [roomId, messages.length]);

  // System Join Announcement & Real-Time subscriptions
  useEffect(() => {
    if (!roomId) return;
    markActiveRoomRead();

    const checkAnnouncement = async () => {
      const announceKey = `vailchat_announcement_sent_${roomId}_${userId}`;
      const alreadyAnnounced = await AsyncStorage.getItem(announceKey);
      if (!alreadyAnnounced) {
        await AsyncStorage.setItem(announceKey, 'true');
        await sendSystemJoinMessage(roomId, roomCode, userNickname, isCreator);
      }
    };
    checkAnnouncement();

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refetchMessages();
        markActiveRoomRead();
      }
    });

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

    const unsubscribeMeta = subscribeToRoomMeta(roomId, roomCode, (newName) => {
      setRoomName(newName);
    });

    const unsubscribeActions = subscribeToRoomActions(
      roomId,
      (kickedUserId) => {
        if (kickedUserId === userId) {
          Alert.alert(
            'Removed',
            'You were removed from this room by the creator.',
            [{ text: 'OK', onPress: handleLeaveAndRemoveRoom }]
          );
        }
      },
      () => {
        if (!isCreator) {
          Alert.alert(
            'Room Closed',
            'This room was closed and deleted by the creator.',
            [{ text: 'OK', onPress: handleLeaveAndRemoveRoom }]
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

  const handleLoadEarlier = async () => {
    if (loadingEarlier || messages.length === 0) return;
    try {
      const earliestMessage = messages[0];
      const result = await loadEarlierMutation({
        roomId,
        roomCode,
        beforeCreatedAt: earliestMessage.created_at,
      });
      if (result.earlier.length < 50) {
        setHasEarlierMessages(false);
      }
    } catch (err) {
      console.warn('Failed to load earlier messages:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawContent = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!rawContent || !roomId) return;

    setInputText('');
    const clientMsgId = generateClientUUID();

    try {
      await sendMessageMutation({
        id: clientMsgId,
        roomId,
        roomCode,
        senderId: userId,
        senderName: userNickname || 'Anonymous',
        rawContent,
      });
      scrollToBottom(50);
    } catch (err: any) {
      Alert.alert('Send Error', err.message || 'Failed to send encrypted message.');
    }
  };

  const handleSendVoiceMessage = async (base64AudioUrl: string) => {
    if (!roomId || !base64AudioUrl) return;
    const clientMsgId = generateClientUUID();

    try {
      await sendMessageMutation({
        id: clientMsgId,
        roomId,
        roomCode,
        senderId: userId,
        senderName: userNickname || 'Anonymous',
        rawContent: base64AudioUrl,
        isVoice: true,
      });
      scrollToBottom(50);
    } catch (err: any) {
      Alert.alert('Voice Note Error', err.message || 'Failed to send voice note.');
    }
  };

  const handleSendImageMessage = async (base64Image: string) => {
    if (!roomId || !base64Image) return;
    const clientMsgId = generateClientUUID();

    try {
      await sendMessageMutation({
        id: clientMsgId,
        roomId,
        roomCode,
        senderId: userId,
        senderName: userNickname || 'Anonymous',
        rawContent: base64Image,
        isImage: true,
      });
      scrollToBottom(50);
    } catch (err: any) {
      Alert.alert('Photo Error', err.message || 'Failed to send photo.');
    }
  };

  const {
    isRecording,
    startRecording,
    stopRecording,
    cancelRecording,
    isProcessing: recordingProcessing,
  } = useAudioRecorder(handleSendVoiceMessage);

  const { selectImage, pickingImage } = useImagePicker(handleSendImageMessage);

  const handleRenameRoom = async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === roomName) return;

    try {
      setLoading(true);
      await renameRoomMutation({ roomCode, newName: trimmed });
      setRoomName(trimmed);
      Alert.alert('Success', 'Room name updated!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to rename room.');
    } finally {
      setLoading(false);
    }
  };

  const handleDestroyRoom = () => {
    Alert.alert(
      'Destroy Room?',
      'Are you sure you want to permanently delete this room and purge all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Destroy',
          style: 'destructive',
          onPress: async () => {
            setShowRoomInfo(false);
            await handleDestroyAndRemoveRoom();
          },
        },
      ]
    );
  };

  const handleKickParticipant = async (targetUserId: string) => {
    try {
      await broadcastKickUser(roomId, targetUserId);
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== targetUserId));
    } catch (err) {
      console.warn('Kick error:', err);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.chatWrapper}
    >
      <ChatHeader
        roomName={roomName}
        timeRemaining={timeRemaining}
        participantsCount={participantsCount}
        onBack={handleLeaveRoom}
        onOpenRoomInfo={() => {
          setRoomNameInputText(roomName);
          setShowRoomInfo(true);
        }}
      />

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
        onLeaveRoom={handleLeaveAndRemoveRoom}
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
