import { useState, useEffect } from 'react';
import { generateAnonymousName } from '../lib/encryption';
import { getOrInitDeviceId, getStoredUsername, saveStoredUsername, getStoredAvatar, saveStoredAvatar } from '../services/storage';

export function useDeviceIdentity() {
  const [deviceId, setDeviceId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [userNickname, setUserNicknameState] = useState<string>('');
  const [userAvatar, setUserAvatarState] = useState<string>('');

  useEffect(() => {
    setUserId('user_' + Math.random().toString(36).substring(2, 11));

    getOrInitDeviceId().then((id) => {
      setDeviceId(id);
    });

    getStoredUsername().then((storedName) => {
      if (storedName && storedName.trim()) {
        setUserNicknameState(storedName.trim());
      } else {
        const generated = generateAnonymousName();
        setUserNicknameState(generated);
      }
    });

    getStoredAvatar().then((storedAvatar) => {
      if (storedAvatar && storedAvatar.trim()) {
        setUserAvatarState(storedAvatar.trim());
      }
    });
  }, []);

  const setUserNickname = (newName: string) => {
    setUserNicknameState(newName);
    if (newName) {
      saveStoredUsername(newName);
    }
  };

  const setUserAvatar = (newAvatar: string) => {
    setUserAvatarState(newAvatar);
    if (newAvatar) {
      saveStoredAvatar(newAvatar);
    }
  };

  const randomizeNickname = () => {
    const newName = generateAnonymousName();
    setUserNickname(newName);
    return newName;
  };

  return {
    deviceId,
    userId,
    userNickname,
    userAvatar,
    setUserNickname,
    setUserAvatar,
    randomizeNickname,
  };
}
