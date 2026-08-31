import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { MessageItem } from '../types';
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
  fetchRoomMessages,
  sendEncryptedMessage,
  subscribeToRoomMessages,
  generateClientUUID,
} from '../api/messages';
import { subscribeToRoomMeta, renameRoomInDB } from '../api/rooms';
import { copyRoomLinkToClipboard } from '../services/share';

interface ChatRoomScreenProps {
  roomId: string;
  roomCode: string;
  roomName: string;
  setRoomName: (name: string) => void;
  userId: string;
  userNickname: string;
  timeRemaining: string;
  onLeaveRoom: () => void;
  showRoomInfo: boolean;
  setShowRoomInfo: (show: boolean) => void;
}

export const ChatRoomScreen: React.FC<ChatRoomScreenProps> = ({
  roomId,
  roomCode,
  roomName,
  setRoomName,
  userId,
  userNickname,
  timeRemaining,
  onLeaveRoom,
  showRoomInfo,
  setShowRoomInfo,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [roomNameInputText, setRoomNameInputText] = useState<string>('');
  const [participantsCount, setParticipantsCount] = useState<number>(1);
  const [showStickers, setShowStickers] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const { playingAudioId, playAudio, stopAudio } = useAudioPlayer();

  // Scroll to bottom helper
  const scrollToBottom = (delay: number = 50) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, delay);
  };

  // Load initial messages and subscribe to real-time events
  useEffect(() => {
    if (!roomId) return;

    fetchRoomMessages(roomId, roomCode)
      .then((loadedMessages) => {
        setMessages(loadedMessages);
        const participants = new Set(loadedMessages.map((m) => m.sender_id));
        participants.add(userId);
        setParticipantsCount(participants.size);
        scrollToBottom(100);
      })
      .catch((err) => console.error('Failed to load messages:', err));

    const unsubscribeMessages = subscribeToRoomMessages(roomId, roomCode, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev;
        }
        scrollToBottom(100);
        return [...prev, newMsg];
      });
    });

    const unsubscribeMeta = subscribeToRoomMeta(roomId, roomCode, (newName) => {
      setRoomName(newName);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeMeta();
      stopAudio();
    };
  }, [roomId, roomCode]);

  // Send text message
  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    const msgId = generateClientUUID();

    // Optimistic update
    const optimisticMsg: MessageItem = {
      id: msgId,
      sender_id: userId,
      sender_name: userNickname,
      content: text,
      is_image: false,
      is_voice: false,
      is_sticker: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      await sendEncryptedMessage({
        id: msgId,
        roomId,
        roomCode,
        senderId: userId,
        senderName: userNickname,
        rawContent: text,
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  // Send photo
  const { selectImage, pickingImage } = useImagePicker(async (base64Image) => {
    const msgId = generateClientUUID();
    const optimisticMsg: MessageItem = {
      id: msgId,
      sender_id: userId,
      sender_name: userNickname,
      content: base64Image,
      is_image: true,
      is_voice: false,
      is_sticker: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      await sendEncryptedMessage({
        id: msgId,
        roomId,
        roomCode,
        senderId: userId,
        senderName: userNickname,
        rawContent: base64Image,
        isImage: true,
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      Alert.alert('Error', 'Failed to send image.');
    }
  });

  // Send sticker
  const handleSendSticker = async (stickerUrl: string) => {
    setShowStickers(false);
    const msgId = generateClientUUID();

    const optimisticMsg: MessageItem = {
      id: msgId,
      sender_id: userId,
      sender_name: userNickname,
      content: stickerUrl,
      is_image: false,
      is_voice: false,
      is_sticker: true,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      await sendEncryptedMessage({
        id: msgId,
        roomId,
        roomCode,
        senderId: userId,
        senderName: userNickname,
        rawContent: stickerUrl,
        isSticker: true,
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      Alert.alert('Error', 'Failed to send sticker.');
    }
  };

  // Record and send voice note
  const { isRecording, isProcessing: recordingProcessing, startRecording, stopRecording } = useAudioRecorder(
    async (base64AudioData) => {
      const msgId = generateClientUUID();
      const optimisticMsg: MessageItem = {
        id: msgId,
        sender_id: userId,
        sender_name: userNickname,
        content: base64AudioData,
        is_image: false,
        is_voice: true,
        is_sticker: false,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      scrollToBottom();

      try {
        await sendEncryptedMessage({
          id: msgId,
          roomId,
          roomCode,
          senderId: userId,
          senderName: userNickname,
          rawContent: base64AudioData,
          isVoice: true,
        });
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
        Alert.alert('Error', 'Failed to send voice note.');
      }
    }
  );

  // Rename room
  const handleRenameRoom = async (newName: string) => {
    try {
      setLoading(true);
      await renameRoomInDB(roomId, roomCode, newName);
      setRoomName(newName);
      Alert.alert('Success', 'Room renamed successfully!');
    } catch (e) {
      Alert.alert('Error', 'Failed to update room name.');
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
      {/* Instagram-Inspired Header */}
      <ChatHeader
        roomName={roomName}
        timeRemaining={timeRemaining}
        participantsCount={participantsCount}
        onBack={onLeaveRoom}
        onOpenRoomInfo={() => {
          setRoomNameInputText(roomName);
          setShowRoomInfo(true);
        }}
      />

      {/* Messages Stream */}
      <MessageList
        scrollViewRef={scrollViewRef}
        messages={messages}
        userId={userId}
        playingAudioId={playingAudioId}
        onPlayAudio={playAudio}
        onScrollBeginDrag={() => setShowStickers(false)}
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
        loading={loading || pickingImage || recordingProcessing}
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
        roomNameInputText={roomNameInputText}
        setRoomNameInputText={setRoomNameInputText}
        onRenameRoom={handleRenameRoom}
        onCopyInviteLink={() => copyRoomLinkToClipboard(roomCode)}
        onLeaveRoom={onLeaveRoom}
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
