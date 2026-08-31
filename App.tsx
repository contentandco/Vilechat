import React, { useState, useEffect } from 'react';
import { StyleSheet, StatusBar, Alert, Clipboard, Platform, ToastAndroid } from 'react-native';
import { SafeAreaProvider, SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

// Types and Constants
import { Screen, HomeTab, RecentRoom, ActiveRoomDetail } from './src/types';
import { Colors } from './src/constants/theme';
import { generateRoomCode } from './src/lib/encryption';

// Services and APIs
import {
  getLocalRecentRooms,
  saveLocalRecentRooms,
  saveStoredUsername,
  saveStoredAvatar,
  clearAllUserData,
} from './src/services/storage';
import { shareRoomLink } from './src/services/share';
import {
  createRoomInDB,
  fetchRoomByCode,
  verifyActiveRoomsFromDB,
  syncDeviceSession,
  fetchDeviceSessions,
  deleteDeviceSessions,
  renameRoomByCodeInDB,
} from './src/api/rooms';

// Custom Hooks
import { useDeviceIdentity } from './src/hooks/useDeviceIdentity';
import { useRoomTimer } from './src/hooks/useRoomTimer';
import { useHardwareBack } from './src/hooks/useHardwareBack';

// Screens and Modals
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

export default function App() {
  // Navigation and Tab state
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [activeTab, setActiveTab] = useState<HomeTab>('whisper');
  const [loading, setLoading] = useState<boolean>(false);

  // Whisper studio state
  const [whisperRoomCode, setWhisperRoomCode] = useState<string>(() => generateRoomCode());
  const [promptIndex, setPromptIndex] = useState<number>(0);
  const [themeIndex] = useState<number>(0);

  // Active Room state
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [activeRoomId, setActiveRoomId] = useState<string>('');
  const [activeRoomCode, setActiveRoomCode] = useState<string>('');
  const [activeRoomName, setActiveRoomName] = useState<string>('Secret Room');
  const [roomExpiresAt, setRoomExpiresAt] = useState<string>('');

  // Modals and Feedback
  const [showJoinCodeModal, setShowJoinCodeModal] = useState<boolean>(false);
  const [showCreatedModal, setShowCreatedModal] = useState<boolean>(false);
  const [showRoomInfo, setShowRoomInfo] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [customRoomNameInput, setCustomRoomNameInput] = useState<string>('');
  const [nameSavedFeedback, setNameSavedFeedback] = useState<boolean>(false);
  const [roomCreatedFeedback, setRoomCreatedFeedback] = useState<boolean>(false);

  // Inbox & History state
  const [isInboxEditMode, setIsInboxEditMode] = useState<boolean>(false);
  const [selectedRoomCodes, setSelectedRoomCodes] = useState<string[]>([]);
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [verifiedActiveRooms, setVerifiedActiveRooms] = useState<ActiveRoomDetail[]>([]);
  const [checkingHistory, setCheckingHistory] = useState<boolean>(false);

  // Custom Hooks
  const { 
    deviceId, 
    userId, 
    userNickname, 
    userAvatar, 
    setUserNickname, 
    setUserAvatar, 
    randomizeNickname 
  } = useDeviceIdentity();

  // Simply back to landing (room stays in inbox)
  const handleLeaveRoom = () => {
    setShowRoomInfo(false);
    setActiveRoomId('');
    setActiveRoomCode('');
    setRoomExpiresAt('');
    setActiveRoomName('');
    setCurrentScreen('landing');
  };

  // Explicitly Leave & Remove room from inbox and device sessions
  const handleLeaveAndRemoveRoom = () => {
    const codeToRemove = activeRoomCode;
    handleLeaveRoom();

    if (codeToRemove) {
      const updated = recentRooms.filter((r) => r.code !== codeToRemove);
      setRecentRooms(updated);
      setVerifiedActiveRooms((prev) => prev.filter((r) => r.code !== codeToRemove));
      saveLocalRecentRooms(updated);
      if (deviceId) {
        deleteDeviceSessions(deviceId, [codeToRemove]);
      }
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
    handleLeaveRoom,
  });

  // Load and sync rooms from storage and Supabase device sessions
  const loadRecentRooms = async (activeDevId: string = deviceId) => {
    const localRooms = await getLocalRecentRooms();
    if (localRooms.length > 0) {
      setRecentRooms(localRooms);
    }

    if (activeDevId) {
      const dbSessions = await fetchDeviceSessions(activeDevId);
      if (dbSessions.length > 0) {
        const combined = [
          ...dbSessions,
          ...localRooms.filter((lr) => !dbSessions.some((m) => m.code === lr.code)),
        ].slice(0, 25);

        setRecentRooms(combined);
        verifyRooms(combined);
        saveLocalRecentRooms(combined);
        return;
      }
    }

    if (localRooms.length > 0) {
      verifyRooms(localRooms);
    }
  };

  const verifyRooms = async (roomsList: RecentRoom[] = recentRooms) => {
    if (roomsList.length === 0) {
      setVerifiedActiveRooms([]);
      return;
    }
    setCheckingHistory(true);
    try {
      const active = await verifyActiveRoomsFromDB(roomsList);
      setVerifiedActiveRooms(active);
    } finally {
      setCheckingHistory(false);
    }
  };

  const saveRecentRoom = async (code: string, name?: string) => {
    const existing = recentRooms.find((r) => r.code === code);
    const resolvedName = name || existing?.name;
    const updated = [
      { code, timestamp: Date.now(), name: resolvedName },
      ...recentRooms.filter((r) => r.code !== code),
    ].slice(0, 25);

    setRecentRooms(updated);
    verifyRooms(updated);
    saveLocalRecentRooms(updated);
    syncDeviceSession(deviceId, code, resolvedName);
  };

  // Check if user has already completed welcome onboarding
  useEffect(() => {
    AsyncStorage.getItem('vailchat_seen_welcome').then((seen) => {
      if (seen === 'true') {
        setCurrentScreen('landing');
      }
    }).catch(() => {});
  }, []);

  // Initial Load and Inbox Tab Sync
  useEffect(() => {
    if (deviceId) {
      loadRecentRooms(deviceId);
    }
  }, [deviceId]);

  useEffect(() => {
    if (activeTab === 'inbox') {
      loadRecentRooms(deviceId);
    }
  }, [activeTab]);

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

    setLoading(true);
    try {
      const room = await fetchRoomByCode(cleanCode);
      setActiveRoomId(room.id);
      setActiveRoomCode(room.code);
      setActiveRoomName(room.resolvedName);
      setRoomExpiresAt(room.expires_at);
      saveRecentRoom(room.code, room.resolvedName);
      setShowJoinCodeModal(false);
      setRoomCodeInput('');
      setCurrentScreen('chat-room');
    } catch (err: any) {
      Alert.alert('Room Not Found', err.message || 'Could not find that room. Make sure the code is exact.');
    } finally {
      setLoading(false);
    }
  };

  // Onboarding Handlers
  const handleGetStarted = () => {
    setCurrentScreen('onboarding-vibe');
  };

  const handleVibeSelected = (vibe: VibeOption) => {
    setPromptIndex(vibe.promptIndex);
    setCurrentScreen('onboarding-username');
  };

  const handleUsernameSelected = (username: string) => {
    setUserNickname(username);
    saveStoredUsername(username);
    setCurrentScreen('onboarding-avatar');
  };

  const handleAvatarSelected = (avatarUri: string) => {
    setUserAvatar(avatarUri);
    saveStoredAvatar(avatarUri);
    AsyncStorage.setItem('vailchat_seen_welcome', 'true').catch(() => {});
    setCurrentScreen('landing');
  };

  const handleSkipAvatar = () => {
    AsyncStorage.setItem('vailchat_seen_welcome', 'true').catch(() => {});
    setCurrentScreen('landing');
  };

  // Delete Account Handler
  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      if (deviceId && recentRooms.length > 0) {
        await deleteDeviceSessions(deviceId, recentRooms.map((r) => r.code));
      }
      await clearAllUserData();
      setRecentRooms([]);
      setVerifiedActiveRooms([]);
      setSelectedRoomCodes([]);
      setActiveRoomId('');
      setActiveRoomCode('');
      setUserAvatar('');
      setUserNickname('');
      setWhisperRoomCode(generateRoomCode());
      setCurrentScreen('welcome');
      if (Platform.OS === 'android') {
        ToastAndroid.show('Account deleted successfully.', ToastAndroid.SHORT);
      } else {
        Alert.alert('Account Deleted', 'Your account and local data have been completely wiped.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to completely wipe account data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewWhisperRoom = async () => {
    const newCode = generateRoomCode();
    const shareUrl = `https://vailchat.com/join?code=${newCode}`;

    Clipboard.setString(shareUrl);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Room link copied to clipboard! 📋', ToastAndroid.SHORT);
    }

    setWhisperRoomCode(newCode);
    setActiveRoomCode(newCode);
    setCustomRoomNameInput('');
    saveRecentRoom(newCode);
    setShowCreatedModal(true);

    try {
      await createRoomInDB(newCode);
    } catch (e) {}
  };

  const handleUniversalShare = async () => {
    const targetCode = activeRoomCode || whisperRoomCode;
    try {
      await createRoomInDB(targetCode);
      saveRecentRoom(targetCode);
    } catch (e) {}
    await shareRoomLink(targetCode);
  };

  const handleSaveCustomRoomName = async (nameOverride?: string) => {
    const targetCode = activeRoomCode || whisperRoomCode;
    const nameToSave = (nameOverride !== undefined ? nameOverride : customRoomNameInput).trim();
    if (!nameToSave || !targetCode) return;

    setActiveRoomName(nameToSave);
    setNameSavedFeedback(true);
    setTimeout(() => setNameSavedFeedback(false), 2500);

    setVerifiedActiveRooms((prev) =>
      prev.map((r) => (r.code === targetCode ? { ...r, name: nameToSave } : r))
    );

    setRecentRooms((prev) => {
      const updated = prev.map((r) => (r.code === targetCode ? { ...r, name: nameToSave } : r));
      saveLocalRecentRooms(updated);
      return updated;
    });

    try {
      await renameRoomByCodeInDB(targetCode, nameToSave);
    } catch (e) {}
    syncDeviceSession(deviceId, targetCode, nameToSave);
  };

  const toggleSelectRoom = (code: string) => {
    setSelectedRoomCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleDeleteSelectedRooms = async () => {
    if (selectedRoomCodes.length === 0) return;
    const updated = recentRooms.filter((r) => !selectedRoomCodes.includes(r.code));
    setRecentRooms(updated);
    setVerifiedActiveRooms((prev) => prev.filter((r) => !selectedRoomCodes.includes(r.code)));
    saveLocalRecentRooms(updated);
    deleteDeviceSessions(deviceId, selectedRoomCodes);
    setSelectedRoomCodes([]);
    setIsInboxEditMode(false);
  };

  return (
    <SafeAreaProvider>
      <RNSafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={currentScreen === 'welcome' ? '#E5006C' : Colors.background} 
        />

        {/* Step 1: Welcome Onboarding Screen */}
        {currentScreen === 'welcome' && (
          <WelcomeScreen onGetStarted={handleGetStarted} />
        )}

        {/* Step 2: Choose Your Anonymous Vibe Screen */}
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
            initialUsername={userNickname}
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
            themeIndex={themeIndex}
            promptIndex={promptIndex}
            setPromptIndex={setPromptIndex}
            whisperRoomCode={whisperRoomCode}
            activeRoomCode={activeRoomCode}
            userNickname={userNickname}
            userAvatar={userAvatar}
            onRandomizeNickname={randomizeNickname}
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
            userNickname={userNickname}
            timeRemaining={timeRemaining}
            onBack={handleLeaveRoom}
            onLeaveRoom={handleLeaveAndRemoveRoom}
            showRoomInfo={showRoomInfo}
            setShowRoomInfo={setShowRoomInfo}
          />
        )}

        {/* Settings Modal */}
        <SettingsModal
          visible={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          userNickname={userNickname}
          userAvatar={userAvatar}
          deviceId={deviceId}
          onUpdateNickname={(newName) => {
            setUserNickname(newName);
            saveStoredUsername(newName);
          }}
          onUpdateAvatar={(newAvatar) => {
            setUserAvatar(newAvatar);
            saveStoredAvatar(newAvatar);
          }}
          onDeleteAccount={handleDeleteAccount}
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
      </RNSafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
