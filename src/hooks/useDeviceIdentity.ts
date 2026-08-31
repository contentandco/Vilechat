import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

/**
 * Hook to access and manage device identity powered by the global Zustand store.
 */
export function useDeviceIdentity() {
  const deviceId = useAppStore((state) => state.deviceId);
  const userId = useAppStore((state) => state.userId);
  const userNickname = useAppStore((state) => state.userNickname);
  const userAvatar = useAppStore((state) => state.userAvatar);
  const isIdentityLoaded = useAppStore((state) => state.isIdentityLoaded);
  const initIdentity = useAppStore((state) => state.initIdentity);
  const setUserNickname = useAppStore((state) => state.setUserNickname);
  const setUserAvatar = useAppStore((state) => state.setUserAvatar);
  const randomizeNickname = useAppStore((state) => state.randomizeNickname);

  useEffect(() => {
    if (!isIdentityLoaded) {
      initIdentity();
    }
  }, [isIdentityLoaded, initIdentity]);

  return {
    deviceId,
    userId,
    userNickname,
    userAvatar,
    setUserNickname,
    setUserAvatar,
    randomizeNickname,
    isIdentityLoaded,
  };
}
