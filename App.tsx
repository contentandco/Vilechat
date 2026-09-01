import React, { useState, useEffect } from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

// Query Client & Zustand Store
import { queryClient } from './src/lib/queryClient';
import { useAppStore } from './src/store/useAppStore';

// Constants & Theme
import { Colors } from './src/constants/theme';
import { VibeOption } from './src/constants/vibes';

// Services and APIs
import { getLocalRoomMessages } from './src/services/storage';
import { recordOnboardingVibe } from './src/api/onboarding';

// Custom Hooks
import { useDeviceIdentity } from './src/hooks/useDeviceIdentity';
import { useHardwareBack } from './src/hooks/useHardwareBack';
import { useInboxRooms } from './src/hooks/queries/useInboxQuery';
import { messageKeys } from './src/hooks/queries/useMessagesQuery';
import { useGlobalMessageNotifications } from './src/hooks/useGlobalMessageNotifications';
import { useRoomActions } from './src/hooks/useRoomActions';
import {
  addSafeNotificationClickListener,
  requestNotificationPermission,
  scheduleDailyEngagementNotifications,
} from './src/services/notifications';

// Screens and Modals
import { SplashScreen } from './src/screens/SplashScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { OnboardingVibeScreen } from './src/screens/OnboardingVibeScreen';
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

  // Zustand Navigation & Identity State
  const currentScreen = useAppStore((s) => s.currentScreen);
  const setCurrentScreen = useAppStore((s) => s.setCurrentScreen);
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setPromptIndex = useAppStore((s) => s.setPromptIndex);
  const chosenVibe = useAppStore((s) => s.chosenVibe);
  const setChosenVibe = useAppStore((s) => s.setChosenVibe);
  const showCreatedModal = useAppStore((s) => s.showCreatedModal);
  const setShowCreatedModal = useAppStore((s) => s.setShowCreatedModal);
  const showJoinCodeModal = useAppStore((s) => s.showJoinCodeModal);
  const setShowJoinCodeModal = useAppStore((s) => s.setShowJoinCodeModal);
  const showRoomInfo = useAppStore((s) => s.showRoomInfo);
  const setShowRoomInfo = useAppStore((s) => s.setShowRoomInfo);

  // Initialize identity hook once at root
  const {
    deviceId,
    userNickname,
    userAvatar,
    setUserNickname,
    setUserAvatar,
  } = useDeviceIdentity();

  const { handleJoinRoom, handleLeaveRoom } = useRoomActions();
  const { data: verifiedActiveRooms = [] } = useInboxRooms(deviceId);

  const [isSplashActive, setIsSplashActive] = useState<boolean>(true);

  // Hydrate local disk-cached messages into QueryClient on startup for 0ms cold loads
  useEffect(() => {
    if (verifiedActiveRooms.length > 0) {
      verifiedActiveRooms.slice(0, 10).forEach(async (room) => {
        try {
          const cachedMsgs = await getLocalRoomMessages(room.code);
          if (cachedMsgs.length > 0) {
            const key = room.id || room.code;
            qc.setQueryData(
              messageKeys.room(key),
              (existing: any) => (existing && existing.length > 0 ? existing : cachedMsgs)
            );
          }
        } catch (e) {}
      });
    }
  }, [verifiedActiveRooms, qc]);

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
  }, [handleJoinRoom]);

  // Request Notification Permissions on startup & schedule engaging daily reminders
  useEffect(() => {
    requestNotificationPermission().then((granted) => {
      if (granted) {
        scheduleDailyEngagementNotifications();
      }
    });
  }, []);

  // Notification Response Listener (Opens room when tapping notification)
  useEffect(() => {
    const removeListener = addSafeNotificationClickListener((roomCode) => {
      handleJoinRoom(roomCode);
    });

    return () => {
      removeListener();
    };
  }, [handleJoinRoom]);

  // Onboarding Step Handlers
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

  return (
    <SafeAreaProvider>
      <RNSafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

        {isSplashActive ? (
          <SplashScreen onFinish={() => setIsSplashActive(false)} duration={1200} />
        ) : (
          <>
            {/* Step 1: Welcome */}
            {currentScreen === 'welcome' && (
              <WelcomeScreen onGetStarted={() => setCurrentScreen('onboarding-vibe')} />
            )}

            {/* Step 2: Daily Vibe */}
            {currentScreen === 'onboarding-vibe' && (
              <OnboardingVibeScreen
                onBack={() => setCurrentScreen('welcome')}
                onContinue={handleVibeSelected}
              />
            )}

            {/* Step 3: Username */}
            {currentScreen === 'onboarding-username' && (
              <OnboardingUsernameScreen
                onBack={() => setCurrentScreen('onboarding-vibe')}
                onContinue={handleUsernameSelected}
                initialUsername=""
              />
            )}

            {/* Step 4: Avatar */}
            {currentScreen === 'onboarding-avatar' && (
              <OnboardingAvatarScreen
                onBack={() => setCurrentScreen('onboarding-username')}
                onContinue={handleAvatarSelected}
                onSkip={handleSkipAvatar}
                initialAvatar={userAvatar}
              />
            )}

            {/* Main App Screens */}
            {currentScreen === 'landing' && <LandingScreen />}
            {currentScreen === 'room-dashboard' && <RoomDashboardScreen />}
            {currentScreen === 'chat-room' && <ChatRoomScreen />}

            {/* Global Modals (Self-contained) */}
            <SettingsModal />
            <JoinCodeModal />
            <RoomCreatedModal />
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
