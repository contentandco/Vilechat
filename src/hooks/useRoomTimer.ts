import { useState, useEffect } from 'react';

/**
 * Calculates remaining time formatted as hours, minutes, seconds and detects expiry.
 */
export function useRoomTimer(expiresAt: string, onExpired?: () => void) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const difference = new Date(expiresAt).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeRemaining('Expired');
        if (onExpired) onExpired();
        return;
      }
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      let timeStr = '';
      if (hours > 0) timeStr += `${hours}h `;
      timeStr += `${minutes}m ${seconds}s`;
      setTimeRemaining(timeStr);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  return timeRemaining;
}

/**
 * Helper to calculate concise hours/minutes left for room list previews.
 */
export function formatTimeLeft(expiresAtStr: string): string {
  const diff = new Date(expiresAtStr).getTime() - new Date().getTime();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}
