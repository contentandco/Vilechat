import { useState } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../store/useAppStore';
import { useCreateRoomMutation, useRenameRoomMutation } from './queries/useRoomQuery';
import {
  useSaveRecentRoomMutation,
  useDeleteRoomsMutation,
  useMarkRoomReadMutation,
  useInboxRooms,
} from './queries/useInboxQuery';
import { fetchRoomByCode, deleteRoomPermanently } from '../api/rooms';
import { shareRoomLink } from '../services/share';
import { getPausedRoomCodes, clearAllUserData } from '../services/storage';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Encapsulated hook providing all Room & Whisper actions directly to any screen/component.
 * Uses Zustand and React Query internally — zero prop drilling needed.
 */
export function useRoomActions() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [nameSavedFeedback, setNameSavedFeedback] = useState(false);

  // Zustand State
  const deviceId = useAppStore((s) => s.deviceId);
  const userId = useAppStore((s) => s.userId);
  const activeRoomCode = useAppStore((s) => s.activeRoomCode);
  const activeRoomId = useAppStore((s) => s.activeRoomId);
  const whisperRoomCode = useAppStore((s) => s.whisperRoomCode);
  const customRoomNameInput = useAppStore((s) => s.customRoomNameInput);
  const roomCodeInput = useAppStore((s) => s.roomCodeInput);
  const selectedRoomCodes = useAppStore((s) => s.selectedRoomCodes);

  // Zustand Actions
  const enterRoom = useAppStore((s) => s.enterRoom);
  const leaveRoom = useAppStore((s) => s.leaveRoom);
  const setActiveRoomName = useAppStore((s) => s.setActiveRoomName);
  const setShowJoinCodeModal = useAppStore((s) => s.setShowJoinCodeModal);
  const setShowCreatedModal = useAppStore((s) => s.setShowCreatedModal);
  const setShowSettingsModal = useAppStore((s) => s.setShowSettingsModal);
  const generateNewWhisperCode = useAppStore((s) => s.generateNewWhisperCode);
  const setUserAvatar = useAppStore((s) => s.setUserAvatar);
  const setSelectedRoomCodes = useAppStore((s) => s.setSelectedRoomCodes);
  const setIsInboxEditMode = useAppStore((s) => s.setIsInboxEditMode);
  const resetAllState = useAppStore((s) => s.resetAllState);
  const setCurrentScreen = useAppStore((s) => s.setCurrentScreen);

  // React Query Mutations & Queries
  const { data: verifiedActiveRooms = [] } = useInboxRooms(deviceId);
  const { mutateAsync: saveRecentRoomMutation } = useSaveRecentRoomMutation(deviceId);
  const { mutateAsync: deleteRoomsMutation } = useDeleteRoomsMutation(deviceId);
  const { mutateAsync: markRoomReadMutation } = useMarkRoomReadMutation(deviceId);
  const { mutateAsync: createRoomMutation } = useCreateRoomMutation(deviceId, userId);
  const { mutateAsync: renameRoomMutation } = useRenameRoomMutation(deviceId);

  /**
   * Joins an existing room or creates/joins a whisper room.
   */
  const handleJoinRoom = async (code: string = roomCodeInput) => {
    let cleanCode = code.trim().toLowerCase();
    if (cleanCode.includes('code=')) {
      cleanCode = cleanCode.split('code=')[1].split('&')[0].trim();
    } else if (cleanCode.includes('/join/')) {
      cleanCode = cleanCode.split('/join/')[1].split('?')[0].trim();
    }

    if (!cleanCode) {
      Alert.alert('Error', 'Please enter a valid room code or link.');
      return;
    }

    // 1. Instant 0ms transition if room is already cached in inbox
    const existingRoom = verifiedActiveRooms.find((r) => r.code.toLowerCase() === cleanCode);
    if (existingRoom) {
      enterRoom({
        id: existingRoom.id || '',
        code: existingRoom.code,
        name: existingRoom.name || existingRoom.code,
        expires_at: existingRoom.expires_at,
        creator_device_id: '',
        creator_id: '',
      });
      markRoomReadMutation(cleanCode);
      setShowJoinCodeModal(false);

      // Enrich details in background
      fetchRoomByCode(cleanCode)
        .then((room) => {
          useAppStore.setState({
            activeRoomId: room.id,
            activeRoomName: room.resolvedName,
            roomExpiresAt: room.expires_at,
            roomCreatorDeviceId: room.creator_device_id || '',
            roomCreatorId: room.creator_id || '',
          });
        })
        .catch(() => {});
      return;
    }

    if (cleanCode === whisperRoomCode.toLowerCase()) {
      createRoomMutation({ code: whisperRoomCode }).catch(() => {});
    }

    const paused = await getPausedRoomCodes();
    if (paused.includes(cleanCode)) {
      Alert.alert(
        'Link Paused ⏸️',
        'The creator of this room has temporarily paused new messages. Please check back later!'
      );
      return;
    }

    // 2. Joining a new room from link or modal
    setLoading(true);
    try {
      const room = await fetchRoomByCode(cleanCode);
      enterRoom({
        id: room.id,
        code: room.code,
        name: room.resolvedName,
        expires_at: room.expires_at,
        creator_device_id: room.creator_device_id || '',
        creator_id: room.creator_id || '',
      });
      saveRecentRoomMutation({ code: room.code, name: room.resolvedName });
      markRoomReadMutation(cleanCode);
    } catch (err: any) {
      Alert.alert('Unable to Join', err.message || 'Could not find that room. Make sure the code is exact.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generates a new whisper code, copies link to clipboard, and saves to inbox.
   */
  const handleCreateNewWhisperRoom = async () => {
    const newCode = generateNewWhisperCode();
    const shareUrl = `https://vilechat.app/join?code=${newCode}`;

    Clipboard.setStringAsync(shareUrl);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Room link copied to clipboard! 📋', ToastAndroid.SHORT);
    }

    setShowCreatedModal(true);
    saveRecentRoomMutation({ code: newCode, name: newCode });

    try {
      await createRoomMutation({ code: newCode });
    } catch (e) {
      console.warn('createRoomInDB warning on new whisper room:', e);
    }
  };

  /**
   * Opens native share sheet instantly in 0ms and ensures DB existence asynchronously.
   */
  const handleUniversalShare = () => {
    const targetCode = activeRoomCode || whisperRoomCode;
    shareRoomLink(targetCode);
    createRoomMutation({ code: targetCode }).catch(() => {});
  };

  /**
   * Saves custom room name to DB and updates local state.
   */
  const handleSaveCustomRoomName = async (nameOverride?: string) => {
    const targetCode = activeRoomCode || whisperRoomCode;
    const nameToSave = (nameOverride !== undefined ? nameOverride : customRoomNameInput).trim();
    if (!nameToSave || !targetCode) return;

    setActiveRoomName(nameToSave);
    setNameSavedFeedback(true);
    setTimeout(() => setNameSavedFeedback(false), 2500);

    try {
      await renameRoomMutation({ roomCode: targetCode, newName: nameToSave });
      saveRecentRoomMutation({ code: targetCode, name: nameToSave });
    } catch (e) {}
  };

  /**
   * Handles user photo picker and avatar state updates.
   */
  const handleChangeAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0].base64) {
        const base64Data = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await setUserAvatar(base64Data);
      }
    } catch (e) {
      console.warn('Failed to update avatar:', e);
    }
  };

  /**
   * Leaves active room and marks it as read.
   */
  const handleLeaveRoom = async () => {
    const code = activeRoomCode;
    if (code) {
      markRoomReadMutation(code);
    }
    leaveRoom();
  };

  /**
   * Leaves and deletes active room from inbox.
   */
  const handleLeaveAndRemoveRoom = async () => {
    const codeToRemove = activeRoomCode;
    handleLeaveRoom();
    if (codeToRemove) {
      await deleteRoomsMutation([codeToRemove]);
    }
  };

  /**
   * Permanently destroys room from DB (creator only) and deletes local sessions.
   */
  const handleDestroyAndRemoveRoom = async () => {
    const codeToRemove = activeRoomCode;
    const idToRemove = activeRoomId;
    handleLeaveRoom();

    if (codeToRemove) {
      await deleteRoomsMutation([codeToRemove]);
    }
    if (idToRemove && codeToRemove) {
      try {
        await deleteRoomPermanently(idToRemove, codeToRemove);
      } catch (e) {}
    }
  };

  /**
   * Deletes all selected rooms from inbox.
   */
  const handleDeleteSelectedRooms = async () => {
    if (selectedRoomCodes.length === 0) return;
    await deleteRoomsMutation(selectedRoomCodes);
    setSelectedRoomCodes([]);
    setIsInboxEditMode(false);
  };

  /**
   * Deletes account and wipes all user storage and state.
   */
  const handleDeleteAccount = async () => {
    try {
      setShowSettingsModal(false);
      resetAllState();
      setCurrentScreen('welcome');
      qc.clear();

      if (Platform.OS === 'android') {
        ToastAndroid.show('Account deleted. Starting fresh!', ToastAndroid.SHORT);
      }

      const roomCodesToDelete = verifiedActiveRooms.map((r) => r.code);
      await clearAllUserData();
      if (deviceId && roomCodesToDelete.length > 0) {
        deleteRoomsMutation(roomCodesToDelete).catch(() => {});
      }
    } catch (err) {
      console.warn('Account cleanup warning:', err);
    }
  };

  return {
    loading,
    nameSavedFeedback,
    handleJoinRoom,
    handleCreateNewWhisperRoom,
    handleUniversalShare,
    handleSaveCustomRoomName,
    handleChangeAvatar,
    handleLeaveRoom,
    handleLeaveAndRemoveRoom,
    handleDestroyAndRemoveRoom,
    handleDeleteSelectedRooms,
    handleDeleteAccount,
  };
}
