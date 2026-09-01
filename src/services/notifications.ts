import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

let Notifications: any = null;

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    if (Notifications?.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (e) {}
}

/**
 * Requests local notification permissions from the OS.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!Notifications) return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Vile Chat Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF2A6D',
        sound: 'default',
      });
    }

    return finalStatus === 'granted';
  } catch (e) {
    console.warn('Failed to request notification permission:', e);
    return false;
  }
}

/**
 * Triggers a local system notification banner immediately.
 */
export async function triggerLocalMessageNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    if (!Notifications?.scheduleNotificationAsync) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // Immediate
    });
  } catch (e) {
    console.warn('Failed to schedule local notification:', e);
  }
}

/**
 * Schedules a friendly reminder notification to share links and chat.
 */
export async function scheduleShareReminderNotification(): Promise<void> {
  try {
    if (!Notifications?.scheduleNotificationAsync) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Vile Chat 💬',
        body: 'Share your whisper link to chat privately with friends!',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60 * 60 * 6, // 6 hours
        repeats: true,
      },
    });
  } catch (e) {}
}

/**
 * Triggers a welcome message from Team Vile Chat.
 */
export async function triggerTeamVileNotification(): Promise<void> {
  try {
    if (!Notifications?.scheduleNotificationAsync) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Team Vile Chat ⚡',
        body: 'Welcome to Vile Chat! Your messages are 100% encrypted and disappear in 24 hours.',
        sound: true,
      },
      trigger: null,
    });
  } catch (e) {}
}

/**
 * Safely adds notification click listener.
 */
export function addSafeNotificationClickListener(callback: (roomCode: string) => void) {
  try {
    if (!Notifications?.addNotificationResponseReceivedListener) return () => {};

    const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response?.notification?.request?.content?.data;
      if (data?.roomCode) {
        callback(data.roomCode);
      }
    });

    return () => {
      subscription?.remove?.();
    };
  } catch (e) {
    return () => {};
  }
}
