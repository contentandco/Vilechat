import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Clipboard,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
  Share,
  ToastAndroid,
  BackHandler,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { 
  BubbleChatSpark01Icon,
  ChatFeedback01Icon,
  Chatting01Icon,
  ChatTranslateIcon,
  Comment03Icon,
  MessageCircleWarningIcon,
  MessageCircleQuestionMarkIcon,
  SentIcon,
  Settings01Icon,
  Search01Icon,
  UserGroupIcon,
  LockKeyIcon,
  ArrowLeft01Icon,
  Camera01Icon,
  Mic01Icon,
  Image01Icon,
  SmileIcon,
  Share01Icon,
  Clock01Icon,
  PlusSignIcon,
  ArrowRight01Icon,
  Delete02Icon,
  Logout01Icon,
  Copy01Icon,
  PencilEdit02Icon,
  PaintBrush01Icon,
} from '@hugeicons/core-free-icons';
import { 
  Play, 
  Pause, 
  Volume2
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
let Audio: any = null;
let FileSystem: any = null;

try {
  Audio = require('expo-av').Audio;
} catch (e) {
  console.log('Audio (expo-av) module is not available in this Expo Go environment.');
}

try {
  FileSystem = require('expo-file-system/legacy');
} catch (e) {
  console.log('FileSystem module is not available in this Expo Go environment.');
}

// Import our custom Supabase and Encryption libraries
import { supabase } from './src/lib/supabase';
import { 
  encryptMessage, 
  decryptMessage, 
  generateAnonymousName, 
  generateRoomCode 
} from './src/lib/encryption';

// Define the Screens and Tabs in our State Machine
type Screen = 'landing' | 'room-setup' | 'room-dashboard' | 'chat-room';
type HomeTab = 'whisper' | 'inbox';

interface RecentRoom {
  code: string;
  timestamp: number;
  name?: string;
}

interface ActiveRoomDetail {
  code: string;
  expires_at: string;
  name?: string;
  hasUnread?: boolean;
}

// NGL-Style prompt templates
const PROMPTS = [
  "send me anonymous messages!",
  "ask me anything... 🤫",
  "tell me a secret you never told anyone 🔥",
  "what was your first impression of me? 👀",
  "drop a confession or truth 💖",
  "roast me anonymously 😂",
  "tell me who you have a crush on 💘",
];

// Card background themes (Moody blurry warm brown NGL aesthetic)
const CARD_THEMES = [
  { id: 'ngl-brown', bg: '#3C291E', cardBorder: '#4E3628', accent: '#D4A373' },
  { id: 'ngl-mocha', bg: '#483327', cardBorder: '#5C4132', accent: '#E0A96D' },
  { id: 'ngl-espresso', bg: '#2B1C14', cardBorder: '#3C281D', accent: '#E7B892' },
  { id: 'ngl-velvet', bg: '#2C1B33', cardBorder: '#3E2748', accent: '#C77DFF' },
  { id: 'ngl-obsidian', bg: '#1C2430', cardBorder: '#293545', accent: '#00B4D8' },
];

// Gen Z / Pop culture stickers list (premium, high-quality transparent GIFs/PNGs)
const STICKERS = [
  { id: 'slay', url: 'https://media.giphy.com/media/l41YmQjOz9qgIZw4g/giphy.gif', label: '💅 Slay' },
  { id: 'mindblown', url: 'https://media.giphy.com/media/26ufdipOdBgTE77R6/giphy.gif', label: '🤯 Mind Blown' },
  { id: 'cry', url: 'https://media.giphy.com/media/2WxWfiav9b0UrXMh4S/giphy.gif', label: '😭 Cry' },
  { id: 'popcat', url: 'https://media.giphy.com/media/S5Ju6tCE6OxlS93G14/giphy.gif', label: '🙀 Popcat' },
  { id: 'vibes', url: 'https://media.giphy.com/media/1ZDHvI41Dt0Rsi82Sk/giphy.gif', label: '✨ Vibes' },
  { id: 'no', url: 'https://media.giphy.com/media/vyTnNTrs3qyQ0/giphy.gif', label: '🙅 No' },
  { id: 'yes', url: 'https://media.giphy.com/media/3o7abKhOpu0NXS3lXW/giphy.gif', label: '🙌 Yes' },
  { id: 'dance', url: 'https://media.giphy.com/media/tsX3YMWYzDPjAARfJ1/giphy.gif', label: '🕺 Dance' },
  { id: 'skull', url: 'https://media.giphy.com/media/hS9M9vPJ9pZUk/giphy.gif', label: '💀 Dead' },
  { id: 'heart', url: 'https://media.giphy.com/media/l0EwYcQ1M4L95OTqE/giphy.gif', label: '❤️ Heart' }
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [activeTab, setActiveTab] = useState<HomeTab>('whisper');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Whisper & NGL Studio states
  const [whisperRoomCode, setWhisperRoomCode] = useState<string>(() => generateRoomCode());
  const [promptIndex, setPromptIndex] = useState<number>(0);
  const [themeIndex, setThemeIndex] = useState<number>(0);

  // Room variables
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [activeRoomId, setActiveRoomId] = useState<string>('');
  const [activeRoomCode, setActiveRoomCode] = useState<string>('');
  const [activeRoomName, setActiveRoomName] = useState<string>('Secret Room');
  const [roomNameInputText, setRoomNameInputText] = useState<string>('');
  const [showRoomInfo, setShowRoomInfo] = useState<boolean>(false);
  const [showJoinCodeModal, setShowJoinCodeModal] = useState<boolean>(false);
  const [showCreatedModal, setShowCreatedModal] = useState<boolean>(false);
  const [customRoomNameInput, setCustomRoomNameInput] = useState<string>('');
  const [nameSavedFeedback, setNameSavedFeedback] = useState<boolean>(false);
  const [isInboxEditMode, setIsInboxEditMode] = useState<boolean>(false);
  const [selectedRoomCodes, setSelectedRoomCodes] = useState<string[]>([]);
  const [roomCreatedFeedback, setRoomCreatedFeedback] = useState<boolean>(false);
  const [roomExpiresAt, setRoomExpiresAt] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [verifiedActiveRooms, setVerifiedActiveRooms] = useState<ActiveRoomDetail[]>([]);
  const [checkingHistory, setCheckingHistory] = useState<boolean>(false);

  // Chat variables
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [userNickname, setUserNickname] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string>('');
  const [participantsCount, setParticipantsCount] = useState<number>(1);

  // Voice Note states
  const [recording, setRecording] = useState<any>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [soundInstance, setSoundInstance] = useState<any>(null);

  // Stickers Panel state
  const [showStickers, setShowStickers] = useState<boolean>(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // Helper to generate cryptographically strong unique device key
  const generateUniqueDeviceId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let rand = '';
    for (let i = 0; i < 28; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `vail_dev_${Date.now()}_${rand}`;
  };

  // Initialize unique device key and load device sessions from storage + database
  const initDeviceKeyAndRooms = async () => {
    let currentDeviceId = '';
    try {
      let storedId = await AsyncStorage.getItem('vailchat_device_id');
      if (!storedId) {
        storedId = generateUniqueDeviceId();
        await AsyncStorage.setItem('vailchat_device_id', storedId);
      }
      currentDeviceId = storedId;
      setDeviceId(storedId);
    } catch (e) {
      currentDeviceId = generateUniqueDeviceId();
      setDeviceId(currentDeviceId);
    }
    loadRecentRooms(currentDeviceId);
  };

  // Initialize random anonymous identity and load recent rooms
  useEffect(() => {
    setUserNickname(generateAnonymousName());
    setUserId('user_' + Math.random().toString(36).substr(2, 9));
    initDeviceKeyAndRooms();

    // Set Audio settings for iOS and Android if module is available
    if (Audio) {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      }).catch((err: any) => console.log('Audio init failed:', err));
    }
  }, []);

  // Sync / verify active rooms when tab changes to inbox
  useEffect(() => {
    if (activeTab === 'inbox') {
      loadRecentRooms(deviceId);
    }
  }, [activeTab]);

  // Handle Expo Deep Linking on Startup & Runtime
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const parsed = Linking.parse(event.url);
      const code = parsed.queryParams?.code;
      if (code && typeof code === 'string') {
        handleJoinRoom(code);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url: string | null) => {
      if (url) {
        const parsed = Linking.parse(url);
        const code = parsed.queryParams?.code;
        if (code && typeof code === 'string') {
          handleJoinRoom(code);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Handle Android Hardware / Swipe Back Navigation
  const lastBackPressTime = useRef<number>(0);

  useEffect(() => {
    const onBackPress = () => {
      // 1. If any modal is open, close it
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

      // 2. If in Chat Room or Dashboard, return to main landing page
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

    const backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandlerSubscription.remove();
  }, [currentScreen, activeTab, showJoinCodeModal, showRoomInfo, showCreatedModal]);

  // Update room timer remaining minutes/hours
  useEffect(() => {
    if (!roomExpiresAt) return;
    
    const updateTimer = () => {
      const difference = new Date(roomExpiresAt).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeRemaining('Expired');
        handleLeaveRoom();
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
  }, [roomExpiresAt]);

  // Handle Real-time messaging subscription & room metadata updates in active room
  useEffect(() => {
    if (!activeRoomId) return;

    fetchMessages();

    const messageChannel = supabase
      .channel(`room_${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${activeRoomId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            
            const decryptedContent = decryptMessage(newMsg.content_encrypted, activeRoomCode);
            const formattedMsg = {
              id: newMsg.id,
              sender_id: newMsg.sender_id,
              sender_name: newMsg.sender_name,
              content: decryptedContent,
              is_image: newMsg.is_image,
              is_voice: newMsg.is_voice,
              is_sticker: newMsg.is_sticker,
              created_at: newMsg.created_at,
            };
            
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
            return [...prev, formattedMsg];
          });
        }
      )
      .subscribe();

    // Subscribe to room updates (for live renaming)
    const roomChannel = supabase
      .channel(`room_meta_${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${activeRoomId}`,
        },
        (payload) => {
          const updatedRoom = payload.new;
          if (updatedRoom.name) {
            setActiveRoomName(updatedRoom.name);
          } else if (updatedRoom.name_encrypted) {
            try {
              const decrypted = decryptMessage(updatedRoom.name_encrypted, activeRoomCode);
              setActiveRoomName(decrypted);
            } catch (e) {
              console.log('Failed to decrypt updated room name');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [activeRoomId]);

  // Scroll to bottom on load
  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // --- RECENT ROOMS PERSISTENCE & DB VERIFICATION ---

  const loadRecentRooms = async (activeDevId: string = deviceId) => {
    // 1. Load local rooms from AsyncStorage for instant render
    let localRooms: RecentRoom[] = [];
    try {
      const stored = await AsyncStorage.getItem('vailchat_recent_rooms');
      if (stored) {
        localRooms = JSON.parse(stored);
        setRecentRooms(localRooms);
      }
    } catch (e) {}

    // 2. Fetch and sync from database device_sessions table
    if (activeDevId) {
      try {
        const { data: dbSessions, error } = await supabase
          .from('device_sessions')
          .select('room_code, room_name, created_at, last_active_at')
          .eq('device_id', activeDevId)
          .order('last_active_at', { ascending: false });

        if (!error && dbSessions && dbSessions.length > 0) {
          const merged: RecentRoom[] = dbSessions.map((s: any) => ({
            code: s.room_code,
            name: s.room_name || undefined,
            timestamp: new Date(s.last_active_at || s.created_at).getTime(),
          }));

          const combined = [
            ...merged,
            ...localRooms.filter((lr) => !merged.some((m) => m.code === lr.code))
          ].slice(0, 25);

          setRecentRooms(combined);
          verifyActiveRoomsFromDB(combined);
          AsyncStorage.setItem('vailchat_recent_rooms', JSON.stringify(combined)).catch(() => {});
          return;
        }
      } catch (err) {}
    }

    if (localRooms.length > 0) {
      verifyActiveRoomsFromDB(localRooms);
    }
  };

  const saveRecentRoom = async (code: string, name?: string) => {
    const existing = recentRooms.find((r) => r.code === code);
    const resolvedName = name || existing?.name;
    const updated = [
      { code, timestamp: Date.now(), name: resolvedName },
      ...recentRooms.filter((r) => r.code !== code)
    ].slice(0, 25); // Keep last 25 rooms

    setRecentRooms(updated);
    verifyActiveRoomsFromDB(updated); // Sync active rooms immediately!

    try {
      await AsyncStorage.setItem('vailchat_recent_rooms', JSON.stringify(updated));
    } catch (e) {}

    // Persist to Supabase device_sessions table
    const currentDevId = deviceId;
    if (currentDevId) {
      try {
        await supabase
          .from('device_sessions')
          .upsert({
            device_id: currentDevId,
            room_code: code,
            room_name: resolvedName || null,
            last_active_at: new Date().toISOString(),
          }, { onConflict: 'device_id,room_code' });
      } catch (e) {}
    }
  };

  // Queries Supabase to filter out expired or deleted rooms
  const verifyActiveRoomsFromDB = async (roomsList: RecentRoom[] = recentRooms) => {
    if (roomsList.length === 0) {
      setVerifiedActiveRooms([]);
      return;
    }

    setCheckingHistory(true);
    try {
      const codes = roomsList.map((r) => r.code);
      const { data, error } = await supabase
        .from('rooms')
        .select('code, expires_at, name, name_encrypted')
        .in('code', codes)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      const formattedRooms: ActiveRoomDetail[] = (data || []).map((r: any) => {
        let roomName = r.name || r.code;
        if ((!roomName || roomName === r.code) && r.name_encrypted) {
          try {
            const dec = decryptMessage(r.name_encrypted, r.code);
            if (dec && dec.trim()) {
              roomName = dec.trim();
            }
          } catch (e) {}
        }
        if (!roomName || roomName === r.code) {
          const localMatch = roomsList.find((rm) => rm.code === r.code);
          if (localMatch?.name) {
            roomName = localMatch.name;
          }
        }
        return {
          code: r.code,
          expires_at: r.expires_at,
          name: roomName || r.code,
          hasUnread: false,
        };
      });
      setVerifiedActiveRooms(formattedRooms);
    } catch (err) {
      console.error('Failed to verify active rooms from Supabase:', err);
      setVerifiedActiveRooms(
        roomsList.map((r) => ({
          code: r.code,
          expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          name: r.name || r.code,
          hasUnread: false,
        }))
      );
    } finally {
      setCheckingHistory(false);
    }
  };

  // Clears all history local state
  const handleClearHistory = async () => {
    setRecentRooms([]);
    setVerifiedActiveRooms([]);
    try {
      await AsyncStorage.removeItem('vailchat_recent_rooms');
    } catch (e) {
      console.log('Failed to clear persisted recent rooms.');
    }
  };

  // --- DATABASE FUNCTIONS ---

  // Create a new room
  const handleCreateRoom = async () => {
    setLoading(true);
    setErrorMsg(null);
    const code = generateRoomCode();

    try {
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('your-project-id')) {
        throw new Error('Supabase URL is not configured.');
      }

      const { data, error } = await supabase
        .from('rooms')
        .insert([{ code, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }])
        .select()
        .single();

      if (error) throw error;

      setActiveRoomId(data.id);
      setActiveRoomCode(data.code);
      setRoomExpiresAt(data.expires_at);
      setActiveRoomName(data.code); // Default name matches room code
      saveRecentRoom(data.code);
      setCurrentScreen('room-dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create room');
      Alert.alert('Configuration Required', 'Please set up your Supabase project keys.');
    } finally {
      setLoading(false);
    }
  };

  // Join an existing room via Code or Link
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
    setErrorMsg(null);

    try {
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('your-project-id')) {
        throw new Error('Supabase URL is not configured.');
      }

      const { data, error } = await supabase
        .from('rooms')
        .select()
        .eq('code', cleanCode)
        .single();

      if (error || !data) {
        throw new Error('Room not found or has expired.');
      }

      if (new Date(data.expires_at).getTime() < Date.now()) {
        throw new Error('This room has expired.');
      }

      // Resolve Room Name: prioritize plain name, fallback to decrypted name, fallback to code
      let roomName = data.name || data.code;
      if ((!roomName || roomName === data.code) && data.name_encrypted) {
        try {
          const dec = decryptMessage(data.name_encrypted, cleanCode);
          if (dec && dec.trim()) {
            roomName = dec.trim();
          }
        } catch (e) {}
      }

      setActiveRoomId(data.id);
      setActiveRoomCode(data.code);
      setActiveRoomName(roomName);
      setRoomExpiresAt(data.expires_at);
      saveRecentRoom(data.code, roomName);
      setShowJoinCodeModal(false);
      setRoomCodeInput('');
      
      setMessages([]);
      setCurrentScreen('chat-room');
    } catch (err: any) {
      setErrorMsg(err.message || 'Room not found');
      Alert.alert('Room Not Found', err.message || 'Could not find that room. Make sure the code or link is exact and the room hasn\'t expired.');
    } finally {
      setLoading(false);
    }
  };

  // Universal Multi-Platform Sharing (Instagram Story, WhatsApp, iMessage, Telegram, Snapchat, etc.)
  const handleUniversalShare = async () => {
    try {
      const targetCode = activeRoomCode || whisperRoomCode;
      
      // Ensure the room exists in DB
      try {
        await supabase
          .from('rooms')
          .insert([{ code: targetCode, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }]);
        saveRecentRoom(targetCode);
      } catch (e) {
        // Room might already exist
      }

      const shareUrl = `https://vailchat.com/join?code=${targetCode}`;
      const shareText = `Send me anonymous messages on Vailchat! 🤫💬\n\nLink: ${shareUrl}\nSecret Room Code: ${targetCode}`;
      
      await Share.share({
        message: shareText,
        url: shareUrl,
        title: 'Send me anonymous messages on Vailchat!',
      });
    } catch (err: any) {
      console.log('Share error:', err);
    }
  };

  const handleCopyWhisperLink = async () => {
    const targetCode = activeRoomCode || whisperRoomCode;
    const shareUrl = `https://vailchat.com/join?code=${targetCode}`;
    Clipboard.setString(shareUrl);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Room Link copied to clipboard! 📋', ToastAndroid.SHORT);
    } else {
      Alert.alert('Link Copied! 🔗', `Share this link with your friends to receive anonymous messages.\n\nCode: ${targetCode}`);
    }

    try {
      await supabase
        .from('rooms')
        .insert([{ code: targetCode, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }]);
      saveRecentRoom(targetCode);
    } catch (e) {}
  };

  const handleEnterWhisperRoom = async () => {
    const targetCode = activeRoomCode || whisperRoomCode;
    try {
      await supabase
        .from('rooms')
        .insert([{ code: targetCode, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }]);
      saveRecentRoom(targetCode);
    } catch (e) {}
    await handleJoinRoom(targetCode);
  };

  const handleSaveCustomRoomName = async (nameOverride?: string) => {
    const targetCode = activeRoomCode || whisperRoomCode;
    const nameToSave = (nameOverride !== undefined ? nameOverride : customRoomNameInput).trim();
    if (nameToSave && targetCode) {
      setActiveRoomName(nameToSave);
      setNameSavedFeedback(true);
      setTimeout(() => setNameSavedFeedback(false), 2500);

      // 1. Immediately update verifiedActiveRooms state
      setVerifiedActiveRooms((prev) => 
        prev.map((r) => r.code === targetCode ? { ...r, name: nameToSave } : r)
      );

      // 2. Immediately update recentRooms state & storage
      setRecentRooms((prev) => {
        const updated = prev.map((r) => r.code === targetCode ? { ...r, name: nameToSave } : r);
        AsyncStorage.setItem('vailchat_recent_rooms', JSON.stringify(updated)).catch(() => {});
        return updated;
      });

      // 3. Persist to rooms table in Supabase
      try {
        const encrypted = encryptMessage(nameToSave, targetCode);
        await supabase
          .from('rooms')
          .update({ 
            name: nameToSave,
            name_encrypted: encrypted 
          })
          .eq('code', targetCode);
      } catch (e) {}

      // 4. Update device_sessions table in Supabase
      if (deviceId) {
        try {
          await supabase
            .from('device_sessions')
            .upsert({
              device_id: deviceId,
              room_code: targetCode,
              room_name: nameToSave,
              last_active_at: new Date().toISOString(),
            }, { onConflict: 'device_id,room_code' });
        } catch (e) {}
      }
    }
  };

  const toggleSelectRoom = (code: string) => {
    setSelectedRoomCodes((prev) => 
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleDeleteSelectedRooms = async () => {
    if (selectedRoomCodes.length === 0) return;

    const updatedRecent = recentRooms.filter((r) => !selectedRoomCodes.includes(r.code));
    setRecentRooms(updatedRecent);
    setVerifiedActiveRooms((prev) => prev.filter((r) => !selectedRoomCodes.includes(r.code)));
    
    try {
      await AsyncStorage.setItem('vailchat_recent_rooms', JSON.stringify(updatedRecent));
    } catch (e) {}

    // Delete selected rooms from device_sessions in Supabase
    if (deviceId) {
      try {
        await supabase
          .from('device_sessions')
          .delete()
          .eq('device_id', deviceId)
          .in('room_code', selectedRoomCodes);
      } catch (e) {}
    }

    setSelectedRoomCodes([]);
    setIsInboxEditMode(false);
  };

  // Generate & Add a New Secret Room to the account
  const handleCreateNewWhisperRoom = async () => {
    const newCode = generateRoomCode();
    const shareUrl = `https://vailchat.com/join?code=${newCode}`;

    // 1. Copy link immediately to clipboard with notification
    Clipboard.setString(shareUrl);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Room link copied to clipboard! 📋', ToastAndroid.SHORT);
    }

    // 2. Persist room for Step 1 display & save to local history
    setWhisperRoomCode(newCode);
    setActiveRoomCode(newCode);
    setCustomRoomNameInput('');
    saveRecentRoom(newCode);

    // 3. Open Room Created Naming & Options Modal
    setShowCreatedModal(true);

    // 4. Insert room into Supabase in background
    try {
      await supabase
        .from('rooms')
        .insert([{ code: newCode, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }]);
    } catch (e: any) {}
  };

  // Fetch messages from database
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select()
        .eq('room_id', activeRoomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((msg: any) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_name,
        content: decryptMessage(msg.content_encrypted, activeRoomCode),
        is_image: msg.is_image,
        is_voice: msg.is_voice,
        is_sticker: msg.is_sticker,
        created_at: msg.created_at,
      }));

      setMessages(formatted);
      const participants = new Set(formatted.map(m => m.sender_id));
      participants.add(userId);
      setParticipantsCount(participants.size);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  // Helper to generate a valid client-side UUID for optimistic updates
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Send a text message
  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    const msgId = generateUUID();
    const encryptedText = encryptMessage(text, activeRoomCode);

    // OPTIMISTIC UPDATE: Add to UI immediately
    const optimisticMsg = {
      id: msgId,
      sender_id: userId,
      sender_name: userNickname,
      content: text, // Plain text for local instant rendering
      is_image: false,
      is_voice: false,
      is_sticker: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            id: msgId, // Use local UUID
            room_id: activeRoomId,
            sender_id: userId,
            sender_name: userNickname,
            content_encrypted: encryptedText,
            is_image: false,
            is_voice: false,
            is_sticker: false,
          },
        ]);

      if (error) throw error;
    } catch (err) {
      // Revert state if failed
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  // Send an image (taken from camera or gallery)
  const handleSendImage = async (useCamera: boolean = false) => {
    const { status } = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync() 
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', `We need access to your ${useCamera ? 'camera' : 'gallery'} to send images.`);
      return;
    }

    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.3,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.3,
            base64: true,
          });

      if (result.canceled || !result.assets || !result.assets[0].base64) {
        return;
      }

      setLoading(true);

      const base64Data = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const msgId = generateUUID();
      const encryptedImage = encryptMessage(base64Data, activeRoomCode);

      // OPTIMISTIC UPDATE: Add to UI immediately
      const optimisticMsg = {
        id: msgId,
        sender_id: userId,
        sender_name: userNickname,
        content: base64Data, // Display instantly
        is_image: true,
        is_voice: false,
        is_sticker: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);

      const { error } = await supabase
        .from('messages')
        .insert([
          {
            id: msgId,
            room_id: activeRoomId,
            sender_id: userId,
            sender_name: userNickname,
            content_encrypted: encryptedImage,
            is_image: true,
            is_voice: false,
            is_sticker: false,
          },
        ]);

      if (error) throw error;
    } catch (err) {
      Alert.alert('Error', 'Failed to send image.');
    } finally {
      setLoading(false);
    }
  };

  // Send GIF Sticker
  const handleSendSticker = async (stickerUrl: string) => {
    setShowStickers(false);
    const msgId = generateUUID();
    const encryptedSticker = encryptMessage(stickerUrl, activeRoomCode);

    // OPTIMISTIC UPDATE: Add to UI immediately
    const optimisticMsg = {
      id: msgId,
      sender_id: userId,
      sender_name: userNickname,
      content: stickerUrl,
      is_image: false,
      is_voice: false,
      is_sticker: true,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            id: msgId,
            room_id: activeRoomId,
            sender_id: userId,
            sender_name: userNickname,
            content_encrypted: encryptedSticker,
            is_image: false,
            is_voice: false,
            is_sticker: true,
          },
        ]);

      if (error) throw error;
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      Alert.alert('Error', 'Failed to send sticker.');
    }
  };

  // --- AUDIO VOICE NOTE RECORDING ---

  const startRecording = async () => {
    try {
      if (!Audio) {
        Alert.alert('Voice Note Support', 'Voice notes are not supported on your phone\'s current Expo Go version. Tap or paste links to chat!');
        return;
      }

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Denied', 'We need microphone access to record voice notes.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.LOW_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording audio.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setRecording(null);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) return;

      if (!FileSystem) {
        Alert.alert('Error', 'FileSystem is not available to save audio.');
        return;
      }

      setLoading(true);

      // Read audio file as base64 string
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const audioData = `data:audio/aac;base64,${base64Audio}`;
      const encryptedAudio = encryptMessage(audioData, activeRoomCode);

      const { error } = await supabase
        .from('messages')
        .insert([
          {
            room_id: activeRoomId,
            sender_id: userId,
            sender_name: userNickname,
            content_encrypted: encryptedAudio,
            is_image: false,
            is_voice: true,
            is_sticker: false,
          },
        ]);

      if (error) throw error;
    } catch (err) {
      console.error('Recording stop/save failed:', err);
      Alert.alert('Error', 'Failed to save voice note.');
    } finally {
      setLoading(false);
    }
  };

  // Play/Pause voice note audio
  const handlePlayAudio = async (messageId: string, base64Audio: string) => {
    try {
      if (!Audio || !FileSystem) {
        Alert.alert('Playback Error', 'Voice playback is not supported on this version of Expo Go. Please update Expo Go.');
        return;
      }

      // If tapping currently playing audio, stop it
      if (playingAudioId === messageId && soundInstance) {
        await soundInstance.stopAsync();
        await soundInstance.unloadAsync();
        setSoundInstance(null);
        setPlayingAudioId(null);
        return;
      }

      // Stop any other currently playing sound first
      if (soundInstance) {
        await soundInstance.stopAsync();
        await soundInstance.unloadAsync();
        setSoundInstance(null);
        setPlayingAudioId(null);
      }

      const tempFileUri = `${FileSystem.cacheDirectory}temp_voice_${messageId}.aac`;
      
      // Extract clean base64 data (strip prefix data:audio/aac;base64,)
      const rawBase64 = base64Audio.replace(/^data:audio\/[a-z0-9]+;base64,/, '');

      await FileSystem.writeAsStringAsync(tempFileUri, rawBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: tempFileUri },
        { shouldPlay: true }
      );

      setSoundInstance(sound);
      setPlayingAudioId(messageId);

      // Listen for sound playback finished event
      sound.setOnPlaybackStatusUpdate(async (status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
          setSoundInstance(null);
          setPlayingAudioId(null);
        }
      });
    } catch (err) {
      console.error('Failed to play sound', err);
      Alert.alert('Playback Error', 'Could not play voice note.');
    }
  };

  // Leave active room
  const handleLeaveRoom = () => {
    // Stop audio playback if leaving screen
    if (soundInstance) {
      soundInstance.unloadAsync();
      setSoundInstance(null);
      setPlayingAudioId(null);
    }
    setShowRoomInfo(false);
    setActiveRoomId('');
    setActiveRoomCode('');
    setRoomExpiresAt('');
    setActiveRoomName('');
    setRoomNameInputText('');
    setMessages([]);
    setCurrentScreen('landing');
  };

  // Copy shareable web link to Clipboard
  const handleCopyLink = () => {
    const webLink = `https://vailchat.com/join?code=${activeRoomCode}`;
    Clipboard.setString(webLink);
    Alert.alert('Web Link Copied! 🔗', `Share this clickable web link with your friends to join directly:\n\n${webLink}`);
  };

  // Helper to calculate hours/minutes left for room list preview
  const formatTimeLeft = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - new Date().getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };
  // --- RENDERS ---

  return (
    <SafeAreaProvider>
      <RNSafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#101624" />

        {/* Landing Screen */}
        {currentScreen === 'landing' && (
          <View style={styles.landingContainer}>
            {/* Top Bar: whisper vs inbox + Settings gear */}
            <View style={styles.topNglBar}>
              <View style={styles.topNglTabs}>
                <TouchableOpacity 
                  style={[styles.topNglTab, activeTab === 'whisper' && styles.topNglTabActive]}
                  onPress={() => setActiveTab('whisper')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.topNglTabText, activeTab === 'whisper' && styles.topNglTabTextActive]}>
                    Whisper
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.topNglTab, activeTab === 'inbox' && styles.topNglTabActive]}
                  onPress={() => setActiveTab('inbox')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.topNglTabText, activeTab === 'inbox' && styles.topNglTabTextActive]}>
                    Inbox
                  </Text>
                  {verifiedActiveRooms.length > 0 && (
                    <View style={styles.inboxRedDot} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Settings Gear Button */}
              <TouchableOpacity 
                style={styles.settingsBtn}
                onPress={() => Alert.alert('Vailchat Settings', `Nickname: ${userNickname}\nEncryption: AES-256 CTR\nRoom Storage: Ephemeral 24h\n\nAll messages wipe clean from database automatically.`)}
                activeOpacity={0.7}
              >
                <HugeiconsIcon icon={Settings01Icon} size={22} color="#EEEEEE" />
              </TouchableOpacity>
            </View>

            {/* TAB CONTENT 1: WHISPER (NGL Card Studio & Universal Sharer) */}
            {activeTab === 'whisper' && (
              <ScrollView contentContainerStyle={styles.whisperScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* The Interactive NGL-Style Card (0 border stroke, 0 shadow) */}
                <View style={[styles.nglCard, { backgroundColor: CARD_THEMES[themeIndex].bg }]}>
                  {/* User Profile Avatar with Edit Badge */}
                  <View style={styles.nglAvatarContainer}>
                    <View style={styles.nglAvatarCircle}>
                      <Image 
                        source={require('./assets/default_avatar.png')} 
                        style={styles.nglAvatarImg} 
                        resizeMode="cover"
                      />
                    </View>
                    <TouchableOpacity 
                      style={styles.avatarEditBadge}
                      onPress={() => {
                        const newName = generateAnonymousName();
                        setUserNickname(newName);
                        Alert.alert('New Anonymous Alias', `Your alias is now: ${newName}`);
                      }}
                      activeOpacity={0.8}
                    >
                      <HugeiconsIcon icon={PencilEdit02Icon} size={13} color="#1A1A1E" />
                    </TouchableOpacity>
                  </View>

                  {/* Prompt Question Text */}
                  <TouchableOpacity 
                    onPress={() => {
                      setPromptIndex((prev) => (prev + 1) % PROMPTS.length);
                    }}
                    style={styles.promptTextBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.promptQuestionText}>
                      {PROMPTS[promptIndex]}
                    </Text>
                  </TouchableOpacity>

                  {/* Clickable Room ID Tag */}
                  <TouchableOpacity 
                    style={styles.cardRoomCodeBadge}
                    onPress={() => {
                      const code = activeRoomCode || whisperRoomCode;
                      Clipboard.setString(code);
                      if (Platform.OS === 'android') {
                        ToastAndroid.show(`Room code ${code} copied! 📋`, ToastAndroid.SHORT);
                      } else {
                        Alert.alert('Copied! 📋', `Room code copied to clipboard: ${code}`);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cardRoomCodeLabel}>Room Code: {activeRoomCode || whisperRoomCode}</Text>
                  </TouchableOpacity>
                </View>

                {/* Step 1 & Step 2 Sharing Panel - Centered & Aligned */}
                <View style={styles.shareDrawerCard}>
                  {/* Step 1: Create your room */}
                  <Text style={styles.shareStepTitle}>Step 1: Create your room</Text>

                  <Text style={styles.shareStepSubtitle} numberOfLines={1}>
                    vailchat.com/join?code={activeRoomCode || whisperRoomCode}
                  </Text>
                  
                  {/* Step 1 Button: Create Room */}
                  <View style={styles.step1ButtonsRow}>
                    <TouchableOpacity 
                      style={[styles.step1CreateBtn, roomCreatedFeedback && styles.step1CreateBtnSuccess]} 
                      onPress={handleCreateNewWhisperRoom} 
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <HugeiconsIcon 
                        icon={roomCreatedFeedback ? SentIcon : PlusSignIcon} 
                        size={15} 
                        color={roomCreatedFeedback ? '#00ADB5' : '#FF3B69'} 
                      />
                      <View style={styles.iconTextSpacer} />
                      <Text style={[styles.step1CreateBtnText, roomCreatedFeedback && styles.step1CreateBtnTextSuccess]}>
                        {roomCreatedFeedback ? 'Room Created in Inbox! ✓' : 'Create Room'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Step 2: Share Anywhere Centered */}
                  <Text style={[styles.shareStepTitle, styles.step2Title]}>Step 2: Share link anywhere</Text>
                  
                  <TouchableOpacity style={styles.nglShareBtn} onPress={handleUniversalShare} activeOpacity={0.85}>
                    <Text style={styles.nglShareBtnText}>Share!</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {/* TAB CONTENT 2: INBOX (NGL-Style Clean Message Stream) */}
            {activeTab === 'inbox' && (
              <View style={styles.inboxWrapper}>
                <ScrollView 
                  contentContainerStyle={styles.inboxScroll} 
                  showsVerticalScrollIndicator={false} 
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Active Messages / Rooms List */}
                  <View style={styles.historyContainer}>
                    <View style={styles.historyHeaderRow}>
                      <Text style={styles.historySectionTitle}>
                        {isInboxEditMode ? `SELECT ROOMS (${selectedRoomCodes.length})` : 'ANONYMOUS INBOX'}
                      </Text>
                      {verifiedActiveRooms.length > 0 && (
                        isInboxEditMode ? (
                          <View style={styles.editModeActionsRow}>
                            <TouchableOpacity 
                              style={styles.cancelEditBtn} 
                              onPress={() => {
                                setIsInboxEditMode(false);
                                setSelectedRoomCodes([]);
                              }}
                            >
                              <Text style={styles.cancelEditText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                              style={[styles.deleteSelectedBtn, selectedRoomCodes.length === 0 && styles.deleteSelectedDisabled]} 
                              onPress={handleDeleteSelectedRooms}
                              disabled={selectedRoomCodes.length === 0}
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={14} color="#FFFFFF" />
                              <Text style={styles.deleteSelectedText}>Delete ({selectedRoomCodes.length})</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity 
                            style={styles.clearHistoryButton} 
                            onPress={() => setIsInboxEditMode(true)}
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={14} color="#ff3366" />
                            <Text style={styles.clearHistoryText}>Clear</Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>

                    {checkingHistory ? (
                      <View style={styles.centeredLoading}>
                        <ActivityIndicator size="small" color="#FF3B69" />
                        <Text style={styles.loadingHistoryText}>Checking messages...</Text>
                      </View>
                    ) : verifiedActiveRooms.length === 0 ? (
                      <View style={styles.emptyHistoryState}>
                        <View style={styles.emptyInboxIconCircle}>
                          <Text style={{ fontSize: 32 }}>💌</Text>
                        </View>
                        <Text style={styles.emptyHistoryTitle}>Your Inbox is Empty</Text>
                        <Text style={styles.emptyHistoryDesc}>
                          Share your whisper card link on your story to start receiving anonymous messages!
                        </Text>
                        <TouchableOpacity 
                          style={styles.emptyShareShortcutBtn}
                          onPress={() => setActiveTab('whisper')}
                        >
                          <Text style={styles.emptyShareShortcutText}>Go to Whisper Card</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.nglInboxList}>
                        {verifiedActiveRooms.map((room) => {
                          const isUnread = Boolean(room.hasUnread);
                          const isSelected = selectedRoomCodes.includes(room.code);
                          const displayName = room.name && room.name !== room.code ? room.name : `Room: ${room.code}`;
                          return (
                            <TouchableOpacity
                              key={room.code}
                              style={[styles.nglInboxItem, isInboxEditMode && isSelected && styles.nglInboxItemSelected]}
                              onPress={() => isInboxEditMode ? toggleSelectRoom(room.code) : handleJoinRoom(room.code)}
                              activeOpacity={0.75}
                            >
                              {/* Selection Checkbox in Edit Mode */}
                              {isInboxEditMode && (
                                <View style={[styles.selectCheckboxCircle, isSelected && styles.selectCheckboxCircleActive]}>
                                  {isSelected && <Text style={styles.selectCheckboxCheckmark}>✓</Text>}
                                </View>
                              )}

                              {/* Left Envelope Avatar */}
                              <View style={[styles.nglInboxAvatar, isUnread ? styles.nglAvatarGrad : styles.nglAvatarDark]}>
                                <Text style={styles.nglEnvelopeIcon}>💌</Text>
                              </View>

                              {/* Middle Details */}
                              <View style={styles.nglInboxInfo}>
                                <Text 
                                  style={[styles.nglInboxMsgTitle, isUnread ? styles.nglMsgTitleUnread : styles.nglMsgTitleRead]}
                                  numberOfLines={1}
                                >
                                  {isUnread ? 'New Message!' : displayName}
                                </Text>
                                <Text style={styles.nglInboxTimeText}>
                                  {formatTimeLeft(room.expires_at)}
                                </Text>
                              </View>

                              {/* Right Chevron */}
                              {!isInboxEditMode && (
                                <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#6F7B8C" />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </ScrollView>

                {/* Bottom Floating "Join by Code" Action Button */}
                <View style={styles.bottomWhoSentContainer}>
                  <TouchableOpacity 
                    style={styles.whoSentBtn}
                    onPress={() => setShowJoinCodeModal(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.whoSentBtnText}>Join by Code</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Join by Code Modal */}
        <Modal
          visible={showJoinCodeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowJoinCodeModal(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={styles.joinModalOverlay}
          >
            <View style={styles.joinModalCard}>
              <View style={styles.joinModalHeader}>
                <Text style={styles.joinModalTitle}>Join by Code</Text>
                <TouchableOpacity onPress={() => setShowJoinCodeModal(false)} style={styles.joinModalCloseBtn}>
                  <Text style={styles.modalCloseSimpleText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.joinModalSubtitle}>
                Enter a room code or paste an invitation link to enter the secret chat.
              </Text>

              <TextInput
                style={styles.joinModalInput}
                placeholder="e.g. funny-tiger-42 or paste link..."
                placeholderTextColor="#6F7B8C"
                value={roomCodeInput}
                onChangeText={setRoomCodeInput}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
              />

              <TouchableOpacity 
                style={[styles.joinModalSubmitBtn, !roomCodeInput.trim() && styles.joinModalSubmitDisabled]}
                onPress={() => handleJoinRoom()}
                disabled={loading || !roomCodeInput.trim()}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.joinModalSubmitText}>Join Chat</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Room Created Naming & Action Modal */}
        <Modal
          visible={showCreatedModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCreatedModal(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={styles.joinModalOverlay}
          >
            <View style={styles.joinModalCard}>
              <View style={styles.joinModalHeader}>
                <Text style={styles.joinModalTitle}>Room Created! 🎉</Text>
                {nameSavedFeedback && (
                  <View style={styles.nameSavedPill}>
                    <Text style={styles.nameSavedPillText}>Saved ✓</Text>
                  </View>
                )}
              </View>

              <Text style={styles.joinModalSubtitle}>
                Link copied to clipboard! 📋 Give your room a name and choose an option:
              </Text>

              {/* Room Name Input - Saves on typing, submit, and blur */}
              <TextInput
                style={styles.joinModalInput}
                placeholder="Room name (e.g. My Secret Room)..."
                placeholderTextColor="#6F7B8C"
                value={customRoomNameInput}
                onChangeText={(text) => {
                  setCustomRoomNameInput(text);
                  handleSaveCustomRoomName(text);
                }}
                onSubmitEditing={() => handleSaveCustomRoomName()}
                onBlur={() => handleSaveCustomRoomName()}
                returnKeyType="done"
                autoCapitalize="sentences"
                autoCorrect={false}
              />

              {/* Option 1: Share Link */}
              <TouchableOpacity 
                style={styles.createdShareActionBtn}
                onPress={async () => {
                  await handleSaveCustomRoomName();
                  setShowCreatedModal(false);
                  handleUniversalShare();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.createdShareActionText}>Share Link 🚀</Text>
              </TouchableOpacity>

              {/* Option 2: Go to Inbox */}
              <TouchableOpacity 
                style={styles.createdInboxActionBtn}
                onPress={async () => {
                  await handleSaveCustomRoomName();
                  setShowCreatedModal(false);
                  setActiveTab('inbox');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.createdInboxActionText}>Go to Inbox 📥</Text>
              </TouchableOpacity>

              {/* Option 3: Stay Here */}
              <TouchableOpacity 
                style={styles.createdDismissActionBtn}
                onPress={async () => {
                  await handleSaveCustomRoomName();
                  setShowCreatedModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.createdDismissActionText}>Stay on Whisper</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      {/* Room Dashboard Screen */}
      {currentScreen === 'room-dashboard' && (
        <View style={styles.dashboardContainer}>
          <TouchableOpacity style={styles.backNavButton} onPress={handleLeaveRoom}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#8E8E93" />
            <Text style={styles.backNavText}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.dashboardHero}>
            <Text style={styles.dashboardTitle}>Room Created! 🎉</Text>
            <Text style={styles.dashboardSub}>Share this private web link with your friends to start chatting securely.</Text>
          </View>

          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>SECRET WEB LINK</Text>
            <TouchableOpacity style={styles.linkShareCard} onPress={handleCopyLink}>
              <Text style={styles.linkShareText} numberOfLines={1}>
                https://vailchat.com/join?code={activeRoomCode}
              </Text>
              <View style={styles.copyBadge}>
                <HugeiconsIcon icon={Copy01Icon} size={16} color="#1A1A1E" />
              </View>
            </TouchableOpacity>
            <View style={styles.cardDivider} />
            <Text style={styles.codeLabel}>OR SHARE RAW CODE</Text>
            <Text style={styles.rawCodeText}>{activeRoomCode}</Text>
          </View>

          <View style={styles.timerCard}>
            <HugeiconsIcon icon={Clock01Icon} size={20} color="#ff3366" />
            <Text style={styles.timerText}>Self-destructs in: <Text style={styles.timerHighlight}>{timeRemaining}</Text></Text>
          </View>

          <TouchableOpacity style={styles.enterButton} onPress={() => setCurrentScreen('chat-room')}>
            <Text style={styles.enterButtonText}>Enter Chat Room</Text>
            <HugeiconsIcon icon={Comment03Icon} size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Chat Room Screen */}
      {currentScreen === 'chat-room' && (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
          style={styles.chatWrapper}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Header (Instagram Inspired with group avatar, info links, back arrow) */}
          <View style={styles.instagramHeader}>
            <TouchableOpacity onPress={handleLeaveRoom} style={styles.chatHeaderLeft}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={26} color="#EEEEEE" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.instagramHeaderCenter} 
              onPress={() => {
                setRoomNameInputText(activeRoomName);
                setShowRoomInfo(true);
              }}
            >
              {/* Padlock Anonymous Group Avatar Icon */}
              <View style={styles.headerAvatarContainer}>
                <View style={styles.headerAvatar}>
                  <HugeiconsIcon icon={LockKeyIcon} size={12} color="#EEEEEE" />
                </View>
              </View>
              
              <View style={styles.headerTextContainer}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.roomCodeTitle} numberOfLines={1}>
                    {activeRoomName}
                  </Text>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="#9BAEC8" style={{ marginLeft: 4 }} />
                </View>
                <Text style={styles.headerStatusText}>
                  {timeRemaining} • {participantsCount} online
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.chatHeaderRight} />
          </View>

          {/* Messages Panel */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesListContent}
            onScrollBeginDrag={() => setShowStickers(false)} // Dismiss stickers panel on scroll
          >
            {messages.length === 0 ? (
              <View style={styles.emptyChatPlaceholder}>
                <HugeiconsIcon icon={BubbleChatSpark01Icon} size={48} color="#4E5766" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>Secure Workspace Initiated</Text>
                <Text style={styles.emptyDesc}>
                  Your messages are encrypted end-to-end. Eavesdroppers (and even this database server) see nothing but random letters.
                </Text>
              </View>
            ) : (
              messages.map((item, index) => {
                const isMe = item.sender_id === userId;
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

                const isFirstInGroup = !prevMsg || prevMsg.sender_id !== item.sender_id;
                const isLastInGroup = !nextMsg || nextMsg.sender_id !== item.sender_id;

                const formatMsgTime = (dateStr: string) => {
                  try {
                    const date = new Date(dateStr);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                  } catch (e) {
                    return '';
                  }
                };

                // Dynamic border radiuses for organic grouped stack
                const bubbleStyle = isMe 
                  ? {
                      borderTopLeftRadius: 18,
                      borderBottomLeftRadius: 18,
                      borderTopRightRadius: isFirstInGroup ? 18 : 4,
                      borderBottomRightRadius: isLastInGroup ? 4 : 4,
                    }
                  : {
                      borderTopRightRadius: 18,
                      borderBottomRightRadius: 18,
                      borderTopLeftRadius: isFirstInGroup ? 18 : 4,
                      borderBottomLeftRadius: isLastInGroup ? 4 : 4,
                    };

                return (
                  <View 
                    key={item.id} 
                    style={[
                      styles.messageRow, 
                      isMe ? styles.messageRowRight : styles.messageRowLeft,
                      { marginBottom: isLastInGroup ? 12 : 2 }
                    ]}
                  >
                    {!isMe && isFirstInGroup && (
                      <Text style={styles.senderName}>{item.sender_name}</Text>
                    )}
                    <View style={[
                      styles.msgBubble, 
                      isMe ? styles.msgBubbleRight : styles.msgBubbleLeft,
                      bubbleStyle,
                      (item.is_image || item.is_sticker) && styles.msgBubbleImage,
                      item.is_voice && styles.msgBubbleVoice,
                    ]}>
                      {item.is_image ? (
                        <Image 
                          source={{ uri: item.content }} 
                          style={styles.sentImage} 
                          resizeMode="cover"
                        />
                      ) : item.is_sticker ? (
                        <Image 
                          source={{ uri: item.content }} 
                          style={styles.sentSticker} 
                          resizeMode="contain"
                        />
                      ) : item.is_voice ? (
                        /* Voice Note Bubble UI (Instagram Waveform style) */
                        <TouchableOpacity 
                          style={styles.voiceNoteRow} 
                          onPress={() => handlePlayAudio(item.id, item.content)}
                        >
                          <View style={[styles.playButtonCircle, isMe ? styles.playButtonCircleMe : styles.playButtonCircleOther]}>
                            {playingAudioId === item.id ? (
                              <Pause size={14} color={isMe ? "#00ADB5" : "#EEEEEE"} fill={isMe ? "#00ADB5" : "#EEEEEE"} />
                            ) : (
                              <Play size={14} color={isMe ? "#00ADB5" : "#EEEEEE"} fill={isMe ? "#00ADB5" : "#EEEEEE"} style={{ marginLeft: 2 }} />
                            )}
                          </View>
                          
                          {/* Static Audio Waveform simulation */}
                          <View style={styles.waveformContainer}>
                            {[8, 14, 20, 10, 16, 22, 12, 18, 14, 10, 16, 20, 12, 8].map((h, i) => (
                              <View 
                                key={i} 
                                style={[
                                  styles.waveformBar, 
                                  { height: h },
                                  playingAudioId === item.id && styles.waveformBarActive,
                                  isMe ? styles.waveformBarMe : styles.waveformBarOther
                                ]} 
                              />
                            ))}
                          </View>
                          <Volume2 size={14} color={isMe ? "#FFFFFF" : "#9BAEC8"} />
                        </TouchableOpacity>
                      ) : (
                        <Text style={[styles.msgText, isMe ? styles.msgTextRight : styles.msgTextLeft]}>
                          {item.content}
                        </Text>
                      )}
                    </View>
                    {isLastInGroup && (
                      <Text style={[styles.msgTime, isMe ? styles.msgTimeRight : styles.msgTimeLeft]}>
                        {formatMsgTime(item.created_at)}
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Typing Area - INSTAGRAM INSPIRED LOOK & CONTROLS */}
          <View style={styles.instagramInputBar}>
            {/* Left Button: Instagram Style Blue Camera Circular Button */}
            <TouchableOpacity 
              style={styles.instagramCamBtn} 
              onPress={() => handleSendImage(true)}
              disabled={loading}
            >
              <HugeiconsIcon icon={Camera01Icon} size={20} color="#EEEEEE" />
            </TouchableOpacity>
            
            {/* Middle Message Input Box */}
            <View style={styles.instagramInputBox}>
              <TextInput
                style={styles.instagramTextInput}
                placeholder="Message..."
                placeholderTextColor="#9BAEC8"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
                onFocus={() => setShowStickers(false)}
              />

              {/* Inside right side controls if text is empty */}
              {!inputText.trim() && (
                <View style={styles.instagramRightIconsRow}>
                  {/* Microphone Icon for Voice Notes */}
                  <TouchableOpacity 
                    style={styles.innerIconBtn} 
                    onPressIn={startRecording}
                    onPressOut={stopRecording}
                  >
                    <HugeiconsIcon icon={Mic01Icon} size={20} color={isRecording ? "#ff3366" : "#EEEEEE"} />
                  </TouchableOpacity>

                  {/* Photo/Gallery Icon */}
                  <TouchableOpacity 
                    style={styles.innerIconBtn} 
                    onPress={() => handleSendImage(false)}
                    disabled={loading}
                  >
                    <HugeiconsIcon icon={Image01Icon} size={20} color="#EEEEEE" />
                  </TouchableOpacity>

                  {/* Sticker/Smile Icon */}
                  <TouchableOpacity 
                    style={styles.innerIconBtn} 
                    onPress={() => setShowStickers(!showStickers)}
                  >
                    <HugeiconsIcon icon={SmileIcon} size={20} color={showStickers ? "#00ADB5" : "#EEEEEE"} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Show send button inside if text has content */}
              {inputText.trim() !== '' && (
                <TouchableOpacity 
                  style={styles.instagramSendTextBtn} 
                  onPress={handleSendMessage}
                  disabled={loading}
                >
                  <Text style={styles.instagramSendText}>Send</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* E2E GIF & STICKERS BOTTOM SHEET PANEL */}
          {showStickers && (
            <View style={styles.stickersPanel}>
              <View style={styles.stickersHeader}>
                <Text style={styles.stickersTitle}>TAP TO SEND INSTANT STICKER</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickersScroll}>
                {STICKERS.map((sticker) => (
                  <TouchableOpacity 
                    key={sticker.id}
                    style={styles.stickerCard}
                    onPress={() => handleSendSticker(sticker.url)}
                  >
                    <Image source={{ uri: sticker.url }} style={styles.stickerPreview} />
                    <Text style={styles.stickerLabel}>{sticker.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

        </KeyboardAvoidingView>
      )}
        {/* ROOM DETAILS OVERLAY MODAL (ENGAGING INFO SCREEN) */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showRoomInfo}
          onRequestClose={() => setShowRoomInfo(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Room Info</Text>
                <TouchableOpacity onPress={() => setShowRoomInfo(false)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseText}>Done</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                {/* Visual Avatar */}
                <View style={styles.modalHero}>
                  <View style={styles.modalLargeAvatar}>
                    <HugeiconsIcon icon={LockKeyIcon} size={36} color="#EEEEEE" />
                  </View>
                  <Text style={styles.modalRoomName}>{activeRoomName}</Text>
                  <Text style={styles.modalRoomStatus}>Anonymous Encryption Workspace</Text>
                </View>

                {/* Rename Room Action */}
                <View style={styles.modalCard}>
                  <View style={styles.modalCardHeader}>
                    <HugeiconsIcon icon={UserGroupIcon} size={18} color="#EEEEEE" />
                    <Text style={styles.modalCardTitle}>Rename Room</Text>
                  </View>
                  <Text style={styles.modalCardDesc}>
                    Give this room a friendly name (e.g. "cousin crew 💖"). This will be end-to-end encrypted and visible to other participants.
                  </Text>
                  <View style={styles.renameFormRow}>
                    <TextInput
                      style={styles.renameInput}
                      placeholder="Enter new room name..."
                      placeholderTextColor="#9BAEC8"
                      value={roomNameInputText}
                      onChangeText={setRoomNameInputText}
                      maxLength={32}
                    />
                    <TouchableOpacity 
                      style={styles.renameSaveBtn}
                      onPress={async () => {
                        const newName = roomNameInputText.trim();
                        if (!newName) {
                          Alert.alert('Error', 'Please enter a valid room name.');
                          return;
                        }
                        try {
                          setLoading(true);
                          const encryptedName = encryptMessage(newName, activeRoomCode);
                          const { error } = await supabase
                            .from('rooms')
                            .update({ name_encrypted: encryptedName })
                            .eq('id', activeRoomId);

                          if (error) throw error;
                          setActiveRoomName(newName);
                          Alert.alert('Success', 'Room renamed successfully!');
                        } catch (e: any) {
                          Alert.alert('Error', 'Failed to update room name.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      <Text style={styles.renameSaveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Share Option */}
                <View style={styles.modalCard}>
                  <View style={styles.modalCardHeader}>
                    <HugeiconsIcon icon={Share01Icon} size={18} color="#EEEEEE" />
                    <Text style={styles.modalCardTitle}>Share Room Invite</Text>
                  </View>
                  <Text style={styles.modalCardDesc}>
                    Invite others to join this room. Send them the secret code or the direct deep link.
                  </Text>
                  <TouchableOpacity style={styles.modalShareBtn} onPress={handleCopyLink}>
                    <HugeiconsIcon icon={Copy01Icon} size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.modalShareBtnText}>Copy Invite Link</Text>
                  </TouchableOpacity>
                </View>

                {/* Expiration Card */}
                <View style={styles.modalCard}>
                  <View style={styles.modalCardHeader}>
                    <HugeiconsIcon icon={Clock01Icon} size={18} color="#ff3366" />
                    <Text style={styles.modalCardTitle}>Self-Destruct Timer</Text>
                  </View>
                  <Text style={styles.modalCardDesc}>
                    This room and all of its chats, images, and voice notes will be completely deleted from the database in:
                  </Text>
                  <Text style={styles.modalTimerHighlight}>{timeRemaining}</Text>
                </View>

                {/* Encryption Details */}
                <View style={styles.modalCard}>
                  <View style={styles.modalCardHeader}>
                    <HugeiconsIcon icon={LockKeyIcon} size={18} color="#EEEEEE" />
                    <Text style={[styles.modalCardTitle, { color: '#EEEEEE' }]}>E2E Encryption Verified</Text>
                  </View>
                  <Text style={styles.modalCardDesc}>
                    All communications are secured on-device using AES-256 CTR stream cipher. Supabase logs only ciphertext.
                  </Text>
                  <View style={styles.encryptionKeyBox}>
                    <Text style={styles.encryptionKeyTitle}>SECRET CIPHER KEY</Text>
                    <Text style={styles.encryptionKeyText}>{activeRoomCode}</Text>
                  </View>
                </View>

                {/* Participants List */}
                <View style={styles.modalCard}>
                  <View style={styles.modalCardHeader}>
                    <HugeiconsIcon icon={UserGroupIcon} size={18} color="#EEEEEE" />
                    <Text style={styles.modalCardTitle}>Active Participants ({participantsCount})</Text>
                  </View>
                  <View style={styles.participantsList}>
                    <View style={styles.participantItem}>
                      <View style={[styles.participantDot, { backgroundColor: '#00ADB5' }]} />
                      <Text style={styles.participantName}>{userNickname} <Text style={{ color: '#9BAEC8' }}>(You)</Text></Text>
                    </View>
                    {messages
                      .filter((m, i, self) => self.findIndex((t) => t.sender_id === m.sender_id) === i && m.sender_id !== userId)
                      .map((msg) => (
                        <View key={msg.id} style={styles.participantItem}>
                          <View style={[styles.participantDot, { backgroundColor: '#9BAEC8' }]} />
                          <Text style={styles.participantName}>{msg.sender_name}</Text>
                        </View>
                      ))
                    }
                  </View>
                </View>

                {/* Actions */}
                <TouchableOpacity 
                  style={styles.modalDeleteBtn} 
                  onPress={() => {
                    Alert.alert(
                      'Leave & Destroy?',
                      'This will immediately remove you from the room. If no other active users are inside, it will be cleaned up.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Leave Room', style: 'destructive', onPress: handleLeaveRoom }
                      ]
                    );
                  }}
                >
                  <HugeiconsIcon icon={Logout01Icon} size={18} color="#ff3366" style={{ marginRight: 8 }} />
                  <Text style={styles.modalDeleteBtnText}>Leave & Destroy Room</Text>
                </TouchableOpacity>

              </ScrollView>
            </View>
          </View>
        </Modal>

      </RNSafeAreaView>
    </SafeAreaProvider>
  );
}

// Styling (#101624 Deep Midnight Theme with #101b2e Step Box)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101624',
  },
  // Landing CSS
  landingContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 12 : 24,
    paddingHorizontal: 20,
    backgroundColor: '#101624',
  },
  // NGL Top Bar
  topNglBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  topNglTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  topNglTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  topNglTabActive: {},
  topNglTabText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#6F7B8C',
    letterSpacing: -0.5,
  },
  topNglTabTextActive: {
    color: '#EEEEEE',
  },
  inboxBadge: {
    backgroundColor: '#FF3366',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  inboxBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#101b2e',
    borderWidth: 1,
    borderColor: '#1F2E49',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },

  // Whisper Screen CSS
  whisperScroll: {
    paddingBottom: 24,
  },
  nglCard: {
    borderRadius: 32,
    paddingVertical: 36,
    paddingHorizontal: 22,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 360,
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    position: 'relative',
    marginBottom: 16,
  },
  nglAvatarContainer: {
    position: 'relative',
    marginTop: 10,
    marginBottom: 14,
  },
  nglAvatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#C5CBD3',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nglAvatarImg: {
    width: 69,
    height: 69,
    borderRadius: 34.5,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  promptTextBtn: {
    paddingHorizontal: 16,
    marginVertical: 14,
  },
  promptQuestionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 32,
  },
  cardRoomCodeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardRoomCodeLabel: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardThemeBrushBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Share Drawer
  shareDrawerCard: {
    backgroundColor: '#101b2e',
    borderRadius: 24,
    padding: 22,
    borderWidth: 0,
    marginTop: 34,
    marginBottom: 24,
    alignItems: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  shareStepTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  step2Title: {
    marginTop: 24,
    marginBottom: 14,
  },
  shareStepSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6F7B8C',
    marginBottom: 14,
    textAlign: 'center',
  },
  step1ButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  step1CreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF3B69',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  iconTextSpacer: {
    width: 8,
  },
  step1CreateBtnText: {
    color: '#FF3B69',
    fontSize: 13,
    fontWeight: '700',
  },
  step1CreateBtnSuccess: {
    borderColor: '#FF3B69',
    backgroundColor: 'rgba(255, 59, 105, 0.12)',
  },
  step1CreateBtnTextSuccess: {
    color: '#FF3B69',
  },
  nglCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B69',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  nglCopyBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  shareStepDesc: {
    fontSize: 12,
    color: '#9BAEC8',
    marginBottom: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  nglShareBtn: {
    backgroundColor: '#FF3B69',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowOpacity: 0,
    elevation: 0,
  },
  nglShareBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  enterDirectBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#182740',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 0,
    opacity: 0.85,
    shadowOpacity: 0,
    elevation: 0,
  },
  enterDirectBtnText: {
    color: '#EEEEEE',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  inboxRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B69',
    marginLeft: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  inboxWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
  },
  inboxScroll: {
    paddingBottom: 24,
  },
  inboxJoinCard: {
    backgroundColor: '#101b2e',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1F2E49',
    marginBottom: 16,
    shadowOpacity: 0,
    elevation: 0,
  },
  inboxJoinTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    color: '#9BAEC8',
    marginBottom: 10,
  },
  joinInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#182740',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#243656',
    padding: 5,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#EEEEEE',
    paddingHorizontal: 12,
    fontSize: 13,
    height: 40,
  },
  joinButton: {
    backgroundColor: '#FF3B69',
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#182740',
    opacity: 0.4,
  },
  emptyShareShortcutBtn: {
    marginTop: 14,
    backgroundColor: '#FF3B69',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 20,
  },
  emptyShareShortcutText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  footerText: {
    color: '#6F7B8C',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
  },

  // Active History Tab CSS
  historyContainer: {
    flex: 1,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  historySectionTitle: {
    color: '#9BAEC8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  clearHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearHistoryText: {
    color: '#ff3366',
    fontSize: 12,
    fontWeight: '600',
  },
  centeredLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  loadingHistoryText: {
    color: '#9BAEC8',
    fontSize: 13,
  },
  emptyHistoryState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyInboxIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E2738',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyHistoryTitle: {
    color: '#EEEEEE',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptyHistoryDesc: {
    color: '#9BAEC8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  nglInboxList: {
    flex: 1,
    gap: 8,
  },
  nglInboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  nglInboxAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nglAvatarGrad: {
    backgroundColor: '#FF4D6D',
    borderWidth: 2,
    borderColor: '#FF758F',
  },
  nglAvatarDark: {
    backgroundColor: '#1E2738',
    borderWidth: 1.5,
    borderColor: '#2D3A50',
  },
  nglEnvelopeIcon: {
    fontSize: 26,
  },
  nglInboxInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nglInboxMsgTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  nglMsgTitleUnread: {
    color: '#FF4D6D',
  },
  nglMsgTitleRead: {
    color: '#EEEEEE',
  },
  nglInboxTimeText: {
    color: '#6F7B8C',
    fontSize: 13,
    fontWeight: '500',
  },
  bottomWhoSentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: '#101624',
  },
  whoSentBtn: {
    backgroundColor: '#FF3B69',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  whoSentBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Join by Code Modal CSS
  joinModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  joinModalCard: {
    width: '100%',
    backgroundColor: '#101b2e',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#1F2E49',
    shadowOpacity: 0,
    elevation: 0,
  },
  joinModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  joinModalTitle: {
    color: '#EEEEEE',
    fontSize: 20,
    fontWeight: '800',
  },
  joinModalCloseBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#182740',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseSimpleText: {
    color: '#9BAEC8',
    fontSize: 15,
    fontWeight: '700',
  },
  joinModalSubtitle: {
    color: '#9BAEC8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
  joinModalInput: {
    backgroundColor: '#182740',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#243656',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#EEEEEE',
    fontSize: 15,
    marginBottom: 16,
  },
  joinModalSubmitBtn: {
    backgroundColor: '#FF3B69',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinModalSubmitDisabled: {
    opacity: 0.4,
  },
  joinModalSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Created Room Action Modal Buttons
  createdShareActionBtn: {
    backgroundColor: '#FF3B69',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  // Inbox Edit Mode Styles
  editModeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelEditBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#182740',
    borderRadius: 12,
  },
  cancelEditText: {
    color: '#9BAEC8',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF3B69',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  deleteSelectedDisabled: {
    opacity: 0.35,
  },
  deleteSelectedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  selectCheckboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#384A68',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectCheckboxCircleActive: {
    backgroundColor: '#FF3B69',
    borderColor: '#FF3B69',
  },
  selectCheckboxCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  nglInboxItemSelected: {
    backgroundColor: 'rgba(255, 59, 105, 0.06)',
    borderRadius: 16,
    paddingHorizontal: 8,
  },

  // Name Saved Pill in Modal
  nameSavedPill: {
    backgroundColor: 'rgba(255, 59, 105, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 105, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  nameSavedPillText: {
    color: '#FF3B69',
    fontSize: 12,
    fontWeight: '700',
  },
  createdShareActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  createdInboxActionBtn: {
    backgroundColor: '#182740',
    borderWidth: 1.5,
    borderColor: '#243656',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  createdInboxActionText: {
    color: '#EEEEEE',
    fontSize: 15,
    fontWeight: '700',
  },
  createdDismissActionBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createdDismissActionText: {
    color: '#6F7B8C',
    fontSize: 13,
    fontWeight: '600',
  },

  // Room Setup / Dashboard CSS
  dashboardContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#101624',
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 20,
    left: 24,
  },
  backNavText: {
    color: '#9BAEC8',
    fontSize: 16,
    marginLeft: 8,
  },
  dashboardHero: {
    alignItems: 'center',
    marginBottom: 36,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#EEEEEE',
    marginBottom: 12,
    textAlign: 'center',
  },
  dashboardSub: {
    fontSize: 14,
    color: '#9BAEC8',
    textAlign: 'center',
    lineHeight: 20,
  },
  codeCard: {
    backgroundColor: '#101b2e',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F2E49',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 2,
  },
  codeLabel: {
    color: '#9BAEC8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  linkShareCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#182740',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#243656',
  },
  linkShareText: {
    color: '#EEEEEE',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  copyBadge: {
    padding: 6,
    backgroundColor: 'rgba(238, 238, 238, 0.1)',
    borderRadius: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#1F2E49',
    marginVertical: 16,
  },
  rawCodeText: {
    color: '#EEEEEE',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.2)',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 32,
  },
  timerText: {
    color: '#9BAEC8',
    fontSize: 13,
    marginLeft: 8,
  },
  timerHighlight: {
    color: '#ff3366',
    fontWeight: 'bold',
  },
  enterButton: {
    backgroundColor: '#00ADB5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  enterButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    marginRight: 8,
  },

  // Chat Screen CSS
  chatWrapper: {
    flex: 1,
    backgroundColor: '#101624',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#172237',
    backgroundColor: '#101624',
  },
  chatHeaderLeft: {
    padding: 8,
  },
  chatHeaderCenter: {
    alignItems: 'center',
  },
  roomCodeTitle: {
    color: '#EEEEEE',
    fontWeight: '700',
    fontSize: 15,
    maxWidth: 120,
  },
  roomSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  roomTimer: {
    fontSize: 10,
    color: '#9BAEC8',
    marginLeft: 4,
  },
  roomDot: {
    fontSize: 10,
    color: '#9BAEC8',
    marginHorizontal: 6,
  },
  chatHeaderRight: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#101624',
  },
  messagesListContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyChatPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#EEEEEE',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDesc: {
    color: '#9BAEC8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  messageRow: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  messageRowLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageRowRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  senderName: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    color: '#9BAEC8',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 8,
  },
  msgBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  msgBubbleLeft: {
    backgroundColor: '#101b2e',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#1F2E49',
  },
  msgBubbleRight: {
    backgroundColor: '#00ADB5',
    borderBottomRightRadius: 4,
  },
  msgBubbleImage: {
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#101b2e',
    borderWidth: 1,
    borderColor: '#1F2E49',
  },
  msgBubbleVoice: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    minWidth: 180,
  },
  msgText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 15,
    lineHeight: 20,
  },
  msgTextLeft: {
    color: '#EEEEEE',
  },
  msgTextRight: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  sentImage: {
    width: 220,
    height: 180,
    borderRadius: 12,
  },
  sentSticker: {
    width: 120,
    height: 120,
  },
  
  // Voice Note Row Styling inside Chat Bubble
  voiceNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonCircleMe: {
    backgroundColor: '#FFFFFF',
  },
  playButtonCircleOther: {
    backgroundColor: '#182740',
    borderWidth: 1,
    borderColor: '#243656',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 24,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
  waveformBarMe: {
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
  },
  waveformBarOther: {
    backgroundColor: '#9BAEC8',
    opacity: 0.6,
  },
  waveformBarActive: {
    opacity: 1,
    backgroundColor: '#00ADB5',
  },

  // INSTAGRAM CHAT INPUT BAR STYLES
  instagramInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101624',
    borderTopWidth: 1,
    borderTopColor: '#172237',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  instagramCamBtn: {
    backgroundColor: '#101b2e',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#1F2E49',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instagramInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101b2e',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#1F2E49',
  },
  instagramTextInput: {
    flex: 1,
    color: '#EEEEEE',
    fontSize: 15,
    paddingTop: 8,
    paddingBottom: 8,
    maxHeight: 100,
  },
  instagramRightIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  innerIconBtn: {
    padding: 4,
  },
  instagramSendTextBtn: {
    paddingHorizontal: 8,
  },
  instagramSendText: {
    color: '#00ADB5',
    fontWeight: '700',
    fontSize: 15,
  },

  // E2E Stickers panel styling
  stickersPanel: {
    backgroundColor: '#101b2e',
    borderTopWidth: 1,
    borderTopColor: '#1F2E49',
    paddingVertical: 16,
    paddingHorizontal: 16,
    height: 190,
  },
  stickersHeader: {
    marginBottom: 12,
  },
  stickersTitle: {
    color: '#9BAEC8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  stickersScroll: {
    gap: 14,
    alignItems: 'center',
  },
  stickerCard: {
    alignItems: 'center',
    backgroundColor: '#182740',
    borderWidth: 1,
    borderColor: '#243656',
    padding: 8,
    borderRadius: 16,
    width: 90,
  },
  stickerPreview: {
    width: 60,
    height: 60,
    marginBottom: 6,
  },
  stickerLabel: {
    color: '#9BAEC8',
    fontSize: 10,
    fontWeight: '700',
  },
  msgTime: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 9,
    color: '#9BAEC8',
    marginTop: 4,
  },
  msgTimeLeft: {
    alignSelf: 'flex-start',
    marginLeft: 12,
  },
  msgTimeRight: {
    alignSelf: 'flex-end',
    marginRight: 12,
  },

  // INSTAGRAM HEADER COMPONENT STYLES
  instagramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#172237',
    backgroundColor: '#101624',
  },
  instagramHeaderCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerAvatarContainer: {
    marginRight: 10,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#101b2e',
    borderWidth: 1.5,
    borderColor: '#1F2E49',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerStatusText: {
    color: '#9BAEC8',
    fontSize: 10,
    marginTop: 2,
  },
  infoBadgeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // ROOM INFO MODAL STYLES (ENGAGING LAYOUT)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#101624',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '82%',
    borderWidth: 1,
    borderColor: '#1F2E49',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#172237',
  },
  modalTitle: {
    color: '#EEEEEE',
    fontSize: 18,
    fontWeight: '800',
  },
  renameFormRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
    alignItems: 'center',
  },
  renameInput: {
    flex: 1,
    backgroundColor: '#101b2e',
    borderWidth: 1.5,
    borderColor: '#1F2E49',
    color: '#EEEEEE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  renameSaveBtn: {
    backgroundColor: '#00ADB5',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  renameSaveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  modalShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ADB5',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  modalShareBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  modalCloseBtn: {
    backgroundColor: '#101b2e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  modalCloseText: {
    color: '#EEEEEE',
    fontWeight: '700',
    fontSize: 14,
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  modalHero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalLargeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#101b2e',
    borderWidth: 2,
    borderColor: '#1F2E49',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#00ADB5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalRoomName: {
    color: '#EEEEEE',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalRoomStatus: {
    color: '#9BAEC8',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  modalCard: {
    backgroundColor: '#101b2e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1F2E49',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  modalCardTitle: {
    color: '#EEEEEE',
    fontWeight: '700',
    fontSize: 14,
  },
  modalCardDesc: {
    color: '#9BAEC8',
    fontSize: 12,
    lineHeight: 18,
  },
  modalTimerHighlight: {
    color: '#ff3366',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 10,
  },
  encryptionKeyBox: {
    backgroundColor: '#182740',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#243656',
  },
  encryptionKeyTitle: {
    color: '#9BAEC8',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  encryptionKeyText: {
    color: '#EEEEEE',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  participantsList: {
    marginTop: 6,
    gap: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  participantDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  participantName: {
    color: '#EEEEEE',
    fontSize: 13,
    fontWeight: '600',
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 51, 102, 0.25)',
    paddingVertical: 16,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 40,
  },
  modalDeleteBtnText: {
    color: '#ff3366',
    fontWeight: '800',
    fontSize: 15,
  },
});
