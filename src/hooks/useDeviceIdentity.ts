import { useState, useEffect } from 'react';
import { generateAnonymousName } from '../lib/encryption';
import { getOrInitDeviceId } from '../services/storage';

export function useDeviceIdentity() {
  const [deviceId, setDeviceId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [userNickname, setUserNickname] = useState<string>('');

  useEffect(() => {
    setUserNickname(generateAnonymousName());
    setUserId('user_' + Math.random().toString(36).substring(2, 11));

    getOrInitDeviceId().then((id) => {
      setDeviceId(id);
    });
  }, []);

  const randomizeNickname = () => {
    const newName = generateAnonymousName();
    setUserNickname(newName);
    return newName;
  };

  return {
    deviceId,
    userId,
    userNickname,
    setUserNickname,
    randomizeNickname,
  };
}
