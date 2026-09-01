import { useEffect, useRef } from 'react';
import { BackHandler, Platform, ToastAndroid } from 'react-native';
import { Screen, HomeTab } from '../types';

interface UseHardwareBackProps {
  currentScreen: Screen;
  activeTab: HomeTab;
  showCreatedModal: boolean;
  showJoinCodeModal: boolean;
  showRoomInfo: boolean;
  setShowCreatedModal: (show: boolean) => void;
  setShowJoinCodeModal: (show: boolean) => void;
  setShowRoomInfo: (show: boolean) => void;
  setActiveTab: (tab: HomeTab) => void;
  setCurrentScreen: (screen: Screen) => void;
  handleLeaveRoom: () => void;
}

export function useHardwareBack({
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
}: UseHardwareBackProps) {
  const lastBackPressTime = useRef<number>(0);

  useEffect(() => {
    const onBackPress = () => {
      // 1. Close open modals first
      if (showCreatedModal) {
        setShowCreatedModal(false);
        return true;
      }

      if (showJoinCodeModal) {
        setShowJoinCodeModal(false);
        return true;
      }

      if (showRoomInfo) {
        setShowRoomInfo(false);
        return true;
      }

      // 2. Onboarding steps back navigation
      if (currentScreen === 'onboarding-avatar') {
        setCurrentScreen('onboarding-username');
        return true;
      }

      if (currentScreen === 'onboarding-username') {
        setCurrentScreen('onboarding-vibe');
        return true;
      }

      if (currentScreen === 'onboarding-vibe') {
        setCurrentScreen('welcome');
        return true;
      }

      // 3. Welcome / Start screen: Double back to exit app
      if (currentScreen === 'welcome') {
        const now = Date.now();
        if (now - lastBackPressTime.current < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastBackPressTime.current = now;
        if (Platform.OS === 'android') {
          ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        }
        return true;
      }

      // 4. If in Chat Room or Dashboard, return to landing
      if (currentScreen === 'chat-room' || currentScreen === 'room-dashboard') {
        handleLeaveRoom();
        return true;
      }

      // 5. If in Inbox tab, switch to Whisper tab
      if (currentScreen === 'landing' && activeTab === 'inbox') {
        setActiveTab('whisper');
        return true;
      }

      // 6. If in Whisper tab on landing screen, double back within 2 seconds to exit app
      const now = Date.now();
      if (now - lastBackPressTime.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressTime.current = now;
      if (Platform.OS === 'android') {
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
      }
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [
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
  ]);
}
