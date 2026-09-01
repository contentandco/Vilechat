import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, StatusBar, Alert, Platform, ToastAndroid } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaProvider, SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';

// Query Client & Zustand Store
import { queryClient } from './src/lib/queryClient';
import { useAppStore } from './src/store/useAppStore';

// Types and Constants
import { ActiveRoomDetail, MessageItem } from './src/types';
import { Colors } from './src/constants/theme';
import { generateRoomCode } from './src/lib/encryption';
import { supabase } from './src/lib/supabase';

// Services and APIs
import {
  clearAllUserData,
  getPausedRoomCodes,
  setRoomLastRead,
  getLocalRoomMessages,
} from './src/services/storage';
import { shareRoomLink } from './src/services/share';
import {
  fetchRoomByCode,
  deleteRoomPermanently,
} from './src/api/rooms';
import { recordOnboardingVibe } from './src/api/onboarding';

// Custom Hooks & Query Hooks
import { useDeviceIdentity } from './src/hooks/useDeviceIdentity';
import { useRoomTimer } from './src/hooks/useRoomTimer';
import { useHardwareBack } from './src/hooks/useHardwareBack';
import {
  useInboxRooms,
  useSaveRecentRoomMutation,
  useDeleteRoomsMutation,
  useMarkRoomReadMutation,
  inboxKeys,
} from './src/hooks/queries/useInboxQuery';
import {
  useCreateRoomMutation,
  useRenameRoomMutation,
} from './src/hooks/queries/useRoomQuery';
import { messageKeys } from './src/hooks/queries/useMessagesQuery';
import { useGlobalMessageNotifications } from './src/hooks/useGlobalMessageNotifications';
import { addSafeNotificationClickListener } from './src/services/notifications';

// Screens and Modals
import { SplashScreen } from './src/screens/SplashScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { OnboardingVibeScreen, VibeOption } from './src/screens/OnboardingVibeScreen';
import { OnboardingUsernameScreen } from './src/screens/OnboardingUsernameScreen';
import { OnboardingAvatarScreen } from './src/screens/OnboardingAvatarScreen';
import { LandingScreen } from './src/screens/LandingScreen';
import { RoomDashboardScreen } from './src/screens/RoomDashboardScreen';
import { ChatRoomScreen } from './src/screens/ChatRoomScreen';
import { JoinCodeModal } from './src/components/common/JoinCodeModal';
import { RoomCreatedModal } from './src/components/common/RoomCreatedModal';
import { SettingsModal } from './src/components/common/SettingsModal';

function MainApp() {
  useGlobalMessageNotifications();
  const qc = useQueryClient();

  // Zustand Store State & Actions
  const currentScreen = useAppStore((s) => s.currentScreen);
  const setCurrentScreen = useAppStore((s) => s.setCurrentScreen);
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const activeRoomId = useAppStore((s) => s.activeRoomId);
  const activeRoomCode = useAppStore((s) => s.activeRoomCode);
  const activeRoomName = useAppStore((s) => s.activeRoomName);
  const setActiveRoomName = useAppStore((s) => s.setActiveRoomName);
  const roomExpiresAt = useAppStore((s) => s.roomExpiresAt);
  const roomCreatorDeviceId = useAppStore((s) => s.roomCreatorDeviceId);
  const roomCreatorId = useAppStore((s) => s.roomCreatorId);
  const enterRoom = useAppStore((s) => s.enterRoom);
  const leaveRoom = useAppStore((s) => s.leaveRoom);

  const whisperRoomCode = useAppStore((s) => s.whisperRoomCode);
  const promptIndex = useAppStore((s) => s.promptIndex);
  const setPromptIndex = useAppStore((s) => s.setPromptIndex);
  const chosenVibe = useAppStore((s) => s.chosenVibe);
  const setChosenVibe = useAppStore((s) => s.setChosenVibe);
  const generateNewWhisperCode = useAppStore((s) => s.generateNewWhisperCode);

  const showJoinCodeModal = useAppStore((s) => s.showJoinCodeModal);
  const setShowJoinCodeModal = useAppStore((s) => s.setShowJoinCodeModal);
  const showCreatedModal = useAppStore((s) => s.showCreatedModal);
  const setShowCreatedModal = useAppStore((s) => s.setShowCreatedModal);
  const showRoomInfo = useAppStore((s) => s.showRoomInfo);
  const setShowRoomInfo = useAppStore((s) => s.setShowRoomInfo);
  const showSettingsModal = useAppStore((s) => s.showSettingsModal);
  const setShowSettingsModal = useAppStore((s) => s.setShowSettingsModal);

  const isInboxEditMode = useAppStore((s) => s.isInboxEditMode);
  const setIsInboxEditMode = useAppStore((s) => s.setIsInboxEditMode);
  const selectedRoomCodes = useAppStore((s) => s.selectedRoomCodes);
  const setSelectedRoomCodes = useAppStore((s) => s.setSelectedRoomCodes);
  const toggleSelectRoom = useAppStore((s) => s.toggleSelectRoom);
  const customRoomNameInput = useAppStore((s) => s.customRoomNameInput);
  const setCustomRoomNameInput = useAppStore((s) => s.setCustomRoomNameInput);
  const roomCodeInput = useAppStore((s) => s.roomCodeInput);
  const setRoomCodeInput = useAppStore((s) => s.setRoomCodeInput);
  const resetAllState = useAppStore((s) => s.resetAllState);

  // Local UI transient feedback state
  const [isSplashActive, setIsSplashActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [nameSavedFeedback, setNameSavedFeedback] = useState<boolean>(false);
  const [roomCreatedFeedback] = useState<boolean>(false);
  const debounceTimerRef = useRef<any>(null);

  // Identity Hook
  const {
    deviceId,
    userId,
    userNickname,
    userAvatar,
    setUserNickname,
    setUserAvatar,
    randomizeNickname,
  } = useDeviceIdentity();

  // TanStack Query: Inbox and Rooms
  const {
    data: verifiedActiveRooms = [],
    isLoading: checkingHistory,
    isRefetching: isRefetchingInbox,
    refetch: refetchInbox,
  } = useInboxRooms(deviceId);

  // Hydrate local disk-cached messages into QueryClient on startup for 0ms cold loads
  useEffect(() => {
    if (verifiedActiveRooms.length > 0) {
      verifiedActiveRooms.slice(0, 10).forEach(async (room) => {
        try {
          const cachedMsgs = await getLocalRoomMessages(room.code);
          if (cachedMsgs.length > 0) {
            const key = room.id || room.code;
            qc.setQueryData<MessageItem[]>(
              messageKeys.room(key),
              (existing) => (existing && existing.length > 0 ? existing : cachedMsgs)
            );
          }
        } catch (e) {}
      });
    }
  }, [verifiedActiveRooms]);

  const { mutateAsync: saveRecentRoomMutation } = useSaveRecentRoomMutation(deviceId);
  const { mutateAsync: deleteRoomsMutation } = useDeleteRoomsMutation(deviceId);
  const { mutateAsync: markRoomReadMutation } = useMarkRoomReadMutation(deviceId);
  const { mutateAsync: createRoomMutation } = useCreateRoomMutation(deviceId, userId);
  const { mutateAsync: renameRoomMutation } = useRenameRoomMutation(deviceId);

  const isCurrentRoomCreator = Boolean(
    (roomCreatorDeviceId && roomCreatorDeviceId === deviceId) ||
    (roomCreatorId && roomCreatorId === userId) ||
    activeRoomCode === whisperRoomCode
  );

  // Simply back to landing (room stays in inbox)
  const handleLeaveRoom = async () => {
    const code = activeRoomCode;
    if (code) {
      setRoomLastRead(code, Date.now()).catch(() => {});
      markRoomReadMutation(code);
    }
    leaveRoom();
  };

  // Explicitly Leave & Remove room from inbox and device sessions
  const handleLeaveAndRemoveRoom = async () => {
    const codeToRemove = activeRoomCode;
    handleLeaveRoom();

    if (codeToRemove) {
      await deleteRoomsMutation([codeToRemove]);
    }
  };

  // Explicitly Destroy Room from DB and local sessions (Creator only)
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

  const timeRemaining = useRoomTimer(roomExpiresAt, handleLeaveRoom);

  // Hardware Back Button Controller
  useHardwareBack({
    currentScreen,
    activeTab,
    showCreatedModal,
    showJoinCodeModal,
    showRoomInfo,
    setShowCreatedModal,
    setShowJoinCodeModal,
    setShowRoomInfo,
    setActiveTab,
    setCurrentScreen,
    handleLeaveRoom,
  });

  // Check if user has already completed welcome onboarding
  useEffect(() => {
    AsyncStorage.getItem('vailchat_seen_welcome')
      .then((seen) => {
        if (seen === 'true') {
          setCurrentScreen('landing');
        }
      })
      .catch(() => {});
  }, [setCurrentScreen]);

  // Real-time listener for new messages with instant optimistic cache updates
  useEffect(() => {
    if (!deviceId) return;

    const channel = supabase
      .channel('global_inbox_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg?.room_id) {
            qc.invalidateQueries({ queryKey: messageKeys.room(newMsg.room_id) });
          }
        }
      )
      .on(
        'broadcast',
        { event: 'new_message' },
        (event) => {
          const payload = event.payload;
          if (!payload) return;

          // Instant 0ms optimistic cache mutation: Pop room directly to top with 'New' badge
          const targetCode = (payload.roomCode || '').toLowerCase();
          if (targetCode) {
            qc.setQueryData<ActiveRoomDetail[]>(
              inboxKeys.byDevice(deviceId),
              (old = []) => {
                const targetRoom = old.find((r) => r.code.toLowerCase() === targetCode);
                const remainingRooms = old.filter((r) => r.code.toLowerCase() !== targetCode);

                const updatedRoom: ActiveRoomDetail = targetRoom
                  ? { ...targetRoom, hasUnread: true }
                  : {
                      code: payload.roomCode,
                      name: payload.roomCode,
                      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                      hasUnread: true,
                    };

                return [updatedRoom, ...remainingRooms];
              }
            );
          }

          if (payload.roomId) {
            qc.invalidateQueries({ queryKey: messageKeys.room(payload.roomId) });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [deviceId, qc]);

  // Deep Linking Navigation
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const parsed = Linking.parse(event.url);
      const code = parsed.queryParams?.code;
      if (code && typeof code === 'string') {
        handleJoinRoom(code);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) {
        const parsed = Linking.parse(url);
        const code = parsed.queryParams?.code;
        if (code && typeof code === 'string') {
          handleJoinRoom(code);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  // Notification Response Listener (Opens room when tapping notification)
  useEffect(() => {
    const removeListener = addSafeNotificationClickListener((roomCode) => {
      handleJoinRoom(roomCode);
    });

    return () => {
      removeListener();
    };
  }, [verifiedActiveRooms, whisperRoomCode]);

  // Room Actions
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

    // 1. INSTANT 0ms TRANSITION IF ROOM IS ALREADY IN INBOX / RECENT ROOMS
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

      // Enrich details in background without blocking navigation
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

    // If joining whisper room code, ensure created in DB
    if (cleanCode === whisperRoomCode.toLowerCase()) {
      createRoomMutation({ code: whisperRoomCode }).catch(() => {});
    }

    // Check if the room link is paused locally
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

      // Save newly joined room to inbox
      saveRecentRoomMutation({ code: room.code, name: room.resolvedName });
      markRoomReadMutation(cleanCode);
    } catch (err: any) {
      Alert.alert('Unable to Join', err.message || 'Could not find that room. Make sure the code is exact.');
    } finally {
      setLoading(false);
    }
  };

  // Onboarding Handlers
  const handleGetStarted = () => {
    setCurrentScreen('onboarding-vibe');
  };

  const handleVibeSelected = (vibe: VibeOption) => {
    setChosenVibe(vibe);
    setPromptIndex(vibe.promptIndex);
    if (deviceId) {
      recordOnboardingVibe({
        deviceId,
        vibeId: vibe.id,
        vibeTitle: vibe.title,
        username: userNickname,
      });
    }
    setCurrentScreen('onboarding-username');
  };

  const handleUsernameSelected = (username: string) => {
    setUserNickname(username);
    if (deviceId) {
      recordOnboardingVibe({
        deviceId,
        vibeId: chosenVibe?.id || 'confessions',
        vibeTitle: chosenVibe?.title || 'Secret Confessions',
        username,
      });
    }
    setCurrentScreen('onboarding-avatar');
  };

  const handleAvatarSelected = (avatarUri: string) => {
    setUserAvatar(avatarUri);
    AsyncStorage.setItem('vailchat_seen_welcome', 'true').catch(() => {});
    setCurrentScreen('landing');
  };

  const handleSkipAvatar = () => {
    AsyncStorage.setItem('vailchat_seen_welcome', 'true').catch(() => {});
    setCurrentScreen('landing');
  };

  // Delete Account Handler (Instant 0ms Transition)
  const handleDeleteAccount = async () => {
    try {
      setShowSettingsModal(false);
      resetAllState();
      setCurrentScreen('welcome');
      queryClient.clear();

      if (Platform.OS === 'android') {
        ToastAndroid.show('Account deleted. Starting fresh!', ToastAndroid.SHORT);
      }

      // Cleanup storage and background network sessions in parallel
      const roomCodesToDelete = verifiedActiveRooms.map((r) => r.code);
      await clearAllUserData();
      if (deviceId && roomCodesToDelete.length > 0) {
        deleteRoomsMutation(roomCodesToDelete).catch(() => {});
      }
    } catch (err) {
      console.warn('Account cleanup warning:', err);
    }
  };

  const handleCreateNewWhisperRoom = async () => {
    const newCode = generateNewWhisperCode();
    const shareUrl = `https://vilechat.app/join?code=${newCode}`;

    Clipboard.setStringAsync(shareUrl);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Room link copied to clipboard! 📋', ToastAndroid.SHORT);
    }

    setShowCreatedModal(true);

    try {
      await createRoomMutation({ code: newCode });
    } catch (e) {
      console.warn('createRoomInDB warning on new whisper room:', e);
    }
  };

  const handleUniversalShare = () => {
    const targetCode = activeRoomCode || whisperRoomCode;
    // 1. Open native share sheet instantly (0ms)
    shareRoomLink(targetCode);
    // 2. Ensure room exists in database asynchronously in background
    createRoomMutation({ code: targetCode }).catch(() => {});
  };

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

  const handleDeleteSelectedRooms = async () => {
    if (selectedRoomCodes.length === 0) return;
    await deleteRoomsMutation(selectedRoomCodes);
    setSelectedRoomCodes([]);
    setIsInboxEditMode(false);
  };

  return (
    <SafeAreaProvider>
      <RNSafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

        {/* Brand Splash Screen on App Launch */}
        {isSplashActive ? (
          <SplashScreen onFinish={() => setIsSplashActive(false)} duration={1200} />
        ) : (
          <>
            {/* Step 1: Welcome / Splash Screen */}
            {currentScreen === 'welcome' && (
              <WelcomeScreen onGetStarted={() => setCurrentScreen('onboarding-vibe')} />
            )}

            {/* Step 2: Daily Vibe Screen */}
            {currentScreen === 'onboarding-vibe' && (
              <OnboardingVibeScreen
                onBack={() => setCurrentScreen('welcome')}
                onContinue={handleVibeSelected}
              />
            )}

            {/* Step 3: Choose Your Username Screen */}
            {currentScreen === 'onboarding-username' && (
              <OnboardingUsernameScreen
                onBack={() => setCurrentScreen('onboarding-vibe')}
                onContinue={handleUsernameSelected}
                initialUsername=""
              />
            )}

            {/* Step 4: Choose Your Profile Picture Screen */}
            {currentScreen === 'onboarding-avatar' && (
              <OnboardingAvatarScreen
                onBack={() => setCurrentScreen('onboarding-username')}
                onContinue={handleAvatarSelected}
                onSkip={handleSkipAvatar}
                initialAvatar={userAvatar}
              />
            )}

            {/* Main App: Landing Screen */}
            {currentScreen === 'landing' && (
              <LandingScreen
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                themeIndex={0}
                promptIndex={promptIndex}
                setPromptIndex={setPromptIndex}
                whisperRoomCode={whisperRoomCode}
                activeRoomCode={activeRoomCode}
                userNickname={userNickname}
                userAvatar={userAvatar}
                onChangeAvatar={handleChangeAvatar}
                onCreateNewWhisperRoom={handleCreateNewWhisperRoom}
                onUniversalShare={handleUniversalShare}
                roomCreatedFeedback={roomCreatedFeedback}
                loading={loading}
                verifiedActiveRooms={verifiedActiveRooms}
                checkingHistory={checkingHistory}
                isInboxEditMode={isInboxEditMode}
                setIsInboxEditMode={setIsInboxEditMode}
                selectedRoomCodes={selectedRoomCodes}
                setSelectedRoomCodes={setSelectedRoomCodes}
                toggleSelectRoom={toggleSelectRoom}
                onDeleteSelectedRooms={handleDeleteSelectedRooms}
                onJoinRoom={handleJoinRoom}
                onOpenJoinCodeModal={() => setShowJoinCodeModal(true)}
                onOpenSettings={() => setShowSettingsModal(true)}
                onRefreshInbox={refetchInbox}
                isRefetchingInbox={isRefetchingInbox}
              />
            )}

            {/* Room Dashboard Screen */}
            {currentScreen === 'room-dashboard' && (
              <RoomDashboardScreen
                activeRoomCode={activeRoomCode}
                timeRemaining={timeRemaining}
                onLeaveRoom={handleLeaveRoom}
                onEnterChatRoom={() => setCurrentScreen('chat-room')}
              />
            )}

            {/* Chat Room Screen */}
            {currentScreen === 'chat-room' && (
              <ChatRoomScreen
                roomId={activeRoomId}
                roomCode={activeRoomCode}
                roomName={activeRoomName}
                setRoomName={setActiveRoomName}
                userId={userId}
                deviceId={deviceId}
                userNickname={userNickname}
                timeRemaining={timeRemaining}
                isCreator={isCurrentRoomCreator}
                onBack={handleLeaveRoom}
                onLeaveRoom={handleLeaveAndRemoveRoom}
                onDestroyRoom={handleDestroyAndRemoveRoom}
                showRoomInfo={showRoomInfo}
                setShowRoomInfo={setShowRoomInfo}
              />
            )}

            {/* Settings Modal */}
            <SettingsModal
              visible={showSettingsModal}
              onClose={() => setShowSettingsModal(false)}
              onDeleteAccount={handleDeleteAccount}
              activeRooms={verifiedActiveRooms}
              currentWhisperCode={whisperRoomCode}
            />

            {/* Join by Code Modal */}
            <JoinCodeModal
              visible={showJoinCodeModal}
              onClose={() => setShowJoinCodeModal(false)}
              roomCodeInput={roomCodeInput}
              setRoomCodeInput={setRoomCodeInput}
              onJoin={handleJoinRoom}
              loading={loading}
            />

            {/* Room Created Modal */}
            <RoomCreatedModal
              visible={showCreatedModal}
              onClose={() => setShowCreatedModal(false)}
              customRoomNameInput={customRoomNameInput}
              setCustomRoomNameInput={setCustomRoomNameInput}
              onSaveName={handleSaveCustomRoomName}
              nameSavedFeedback={nameSavedFeedback}
              onShareLink={handleUniversalShare}
              onGoToInbox={() => setActiveTab('inbox')}
            />
          </>
        )}
      </RNSafeAreaView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
