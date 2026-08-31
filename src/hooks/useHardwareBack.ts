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

      // 2. If in Chat Room or Dashboard, return to landing
      if (currentScreen !== 'landing') {
        handleLeaveRoom();
        return true;
      }

      // 3. If in Inbox tab, switch to Whisper tab
      if (activeTab === 'inbox') {
        setActiveTab('whisper');
        return true;
      }

      // 4. If in Whisper tab, double back within 2 seconds to exit app
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
    handleLeaveRoom,
  ]);
}
