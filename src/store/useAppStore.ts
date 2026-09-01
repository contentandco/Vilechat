import { create } from 'zustand';
import { Screen, HomeTab } from '../types';
import { generateAnonymousName, generateRoomCode } from '../lib/encryption';
import {
  getOrInitDeviceId,
  getOrInitUserId,
  getStoredUsername,
  saveStoredUsername,
  getStoredAvatar,
  saveStoredAvatar,
} from '../services/storage';
import { VibeOption } from '../screens/OnboardingVibeScreen';

export interface RoomMetaPayload {
  id: string;
  code: string;
  name?: string;
  expires_at?: string;
  creator_device_id?: string;
  creator_id?: string;
}

interface AppState {
  // Identity State
  deviceId: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  isIdentityLoaded: boolean;

  // Navigation & Active Room State
  currentScreen: Screen;
  activeTab: HomeTab;
  activeRoomId: string;
  activeRoomCode: string;
  activeRoomName: string;
  roomExpiresAt: string;
  roomCreatorDeviceId: string;
  roomCreatorId: string;

  // Whisper Studio State
  whisperRoomCode: string;
  promptIndex: number;
  chosenVibe: VibeOption | null;

  // Modals & UI Controls
  showJoinCodeModal: boolean;
  showCreatedModal: boolean;
  showRoomInfo: boolean;
  showSettingsModal: boolean;
  isInboxEditMode: boolean;
  selectedRoomCodes: string[];
  customRoomNameInput: string;
  roomCodeInput: string;

  // Actions - Identity
  initIdentity: () => Promise<void>;
  setUserNickname: (name: string) => void;
  setUserAvatar: (avatar: string) => void;
  randomizeNickname: () => string;

  // Actions - Navigation & Rooms
  setCurrentScreen: (screen: Screen) => void;
  setActiveTab: (tab: HomeTab) => void;
  enterRoom: (room: RoomMetaPayload) => void;
  leaveRoom: () => void;
  setActiveRoomName: (name: string) => void;

  // Actions - Whisper Studio
  setWhisperRoomCode: (code: string) => void;
  setPromptIndex: (index: number | ((prev: number) => number)) => void;
  setChosenVibe: (vibe: VibeOption | null) => void;
  generateNewWhisperCode: () => string;

  // Actions - Modals & UI
  setShowJoinCodeModal: (show: boolean) => void;
  setShowCreatedModal: (show: boolean) => void;
  setShowRoomInfo: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;
  setIsInboxEditMode: (edit: boolean) => void;
  setSelectedRoomCodes: (codes: string[] | ((prev: string[]) => string[])) => void;
  toggleSelectRoom: (code: string) => void;
  setCustomRoomNameInput: (input: string) => void;
  setRoomCodeInput: (input: string) => void;
  resetAllState: () => void;
}

const initialWhisperCode = generateRoomCode();

export const useAppStore = create<AppState>((set, get) => ({
  // Identity initial
  deviceId: '',
  userId: '',
  userNickname: '',
  userAvatar: '',
  isIdentityLoaded: false,

  // Navigation initial
  currentScreen: 'welcome',
  activeTab: 'whisper',
  activeRoomId: '',
  activeRoomCode: '',
  activeRoomName: 'Secret Room',
  roomExpiresAt: '',
  roomCreatorDeviceId: '',
  roomCreatorId: '',

  // Whisper studio initial
  whisperRoomCode: initialWhisperCode,
  promptIndex: 0,
  chosenVibe: null,

  // Modals & UI initial
  showJoinCodeModal: false,
  showCreatedModal: false,
  showRoomInfo: false,
  showSettingsModal: false,
  isInboxEditMode: false,
  selectedRoomCodes: [],
  customRoomNameInput: '',
  roomCodeInput: '',

  // Identity Actions
  initIdentity: async () => {
    const persistentUserId = await getOrInitUserId();
    const devId = await getOrInitDeviceId();
    const storedName = await getStoredUsername();
    const storedAvatar = await getStoredAvatar();

    const resolvedNickname = (storedName && storedName.trim()) 
      ? storedName.trim() 
      : generateAnonymousName();

    set({
      userId: persistentUserId,
      deviceId: devId,
      userNickname: resolvedNickname,
      userAvatar: storedAvatar?.trim() || '',
      isIdentityLoaded: true,
    });
  },

  setUserNickname: (name: string) => {
    set({ userNickname: name });
    if (name) {
      saveStoredUsername(name);
    }
  },

  setUserAvatar: (avatar: string) => {
    set({ userAvatar: avatar });
    if (avatar) {
      saveStoredAvatar(avatar);
    }
  },

  randomizeNickname: () => {
    const newName = generateAnonymousName();
    get().setUserNickname(newName);
    return newName;
  },

  // Navigation & Room Actions
  setCurrentScreen: (screen: Screen) => set({ currentScreen: screen }),
  setActiveTab: (tab: HomeTab) => set({ activeTab: tab }),

  enterRoom: (room: RoomMetaPayload) => {
    set({
      activeRoomId: room.id,
      activeRoomCode: room.code,
      activeRoomName: room.name || 'Secret Room',
      roomExpiresAt: room.expires_at || '',
      roomCreatorDeviceId: room.creator_device_id || '',
      roomCreatorId: room.creator_id || '',
      currentScreen: 'chat-room',
      showJoinCodeModal: false,
      roomCodeInput: '',
    });
  },

  leaveRoom: () => {
    set({
      activeRoomId: '',
      activeRoomCode: '',
      activeRoomName: 'Secret Room',
      roomExpiresAt: '',
      roomCreatorDeviceId: '',
      roomCreatorId: '',
      showRoomInfo: false,
      currentScreen: 'landing',
    });
  },

  setActiveRoomName: (name: string) => set({ activeRoomName: name }),

  // Whisper Studio Actions
  setWhisperRoomCode: (code: string) => set({ whisperRoomCode: code }),
  setPromptIndex: (indexOrFn) => {
    set((state) => ({
      promptIndex: typeof indexOrFn === 'function' ? indexOrFn(state.promptIndex) : indexOrFn,
    }));
  },
  setChosenVibe: (vibe: VibeOption | null) => set({ chosenVibe: vibe }),

  generateNewWhisperCode: () => {
    const newCode = generateRoomCode();
    set({
      whisperRoomCode: newCode,
      activeRoomCode: newCode,
      customRoomNameInput: '',
    });
    return newCode;
  },

  // Modals & UI Actions
  setShowJoinCodeModal: (show: boolean) => set({ showJoinCodeModal: show }),
  setShowCreatedModal: (show: boolean) => set({ showCreatedModal: show }),
  setShowRoomInfo: (show: boolean) => set({ showRoomInfo: show }),
  setShowSettingsModal: (show: boolean) => set({ showSettingsModal: show }),
  setIsInboxEditMode: (edit: boolean) => set({ isInboxEditMode: edit }),
  setSelectedRoomCodes: (codesOrFn) => {
    set((state) => ({
      selectedRoomCodes: typeof codesOrFn === 'function' ? codesOrFn(state.selectedRoomCodes) : codesOrFn,
    }));
  },
  toggleSelectRoom: (code: string) => {
    set((state) => ({
      selectedRoomCodes: state.selectedRoomCodes.includes(code)
        ? state.selectedRoomCodes.filter((c) => c !== code)
        : [...state.selectedRoomCodes, code],
    }));
  },
  setCustomRoomNameInput: (input: string) => set({ customRoomNameInput: input }),
  setRoomCodeInput: (input: string) => set({ roomCodeInput: input }),

  resetAllState: () => {
    set({
      userId: '',
      deviceId: '',
      userNickname: '',
      userAvatar: '',
      isIdentityLoaded: false,
      currentScreen: 'welcome',
      activeTab: 'whisper',
      activeRoomId: '',
      activeRoomCode: '',
      activeRoomName: 'Secret Room',
      roomExpiresAt: '',
      roomCreatorDeviceId: '',
      roomCreatorId: '',
      whisperRoomCode: generateRoomCode(),
      promptIndex: 0,
      chosenVibe: null,
      showJoinCodeModal: false,
      showCreatedModal: false,
      showRoomInfo: false,
      showSettingsModal: false,
      isInboxEditMode: false,
      selectedRoomCodes: [],
      customRoomNameInput: '',
      roomCodeInput: '',
    });
  },
}));
