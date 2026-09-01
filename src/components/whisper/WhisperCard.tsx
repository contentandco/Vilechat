import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Camera01Icon } from '@hugeicons/core-free-icons';
import { copyRoomCodeToClipboard } from '../../services/share';
import { CARD_THEMES, PROMPTS } from '../../constants';
import { useAppStore } from '../../store/useAppStore';
import { useRoomActions } from '../../hooks/useRoomActions';

export const WhisperCard: React.FC = () => {
  const whisperRoomCode = useAppStore((s) => s.whisperRoomCode);
  const activeRoomCode = useAppStore((s) => s.activeRoomCode);
  const promptIndex = useAppStore((s) => s.promptIndex);
  const setPromptIndex = useAppStore((s) => s.setPromptIndex);
  const userNickname = useAppStore((s) => s.userNickname);
  const userAvatar = useAppStore((s) => s.userAvatar);

  const { handleChangeAvatar } = useRoomActions();

  const currentRoomCode = activeRoomCode || whisperRoomCode;
  const currentTheme = CARD_THEMES[0];
  const currentPrompt = PROMPTS[promptIndex] || PROMPTS[0];

  const handleNextPrompt = () => {
    setPromptIndex((prev) => (prev + 1) % PROMPTS.length);
  };

  const cleanHandle = (userNickname || 'anonymous').replace(/^@+/, '');

  return (
    <View style={[styles.whisperCard, { backgroundColor: currentTheme.bg }]}>
      {/* Top Section: Avatar with Photo Change Button + Clean Handle */}
      <View style={styles.topSection}>
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={handleChangeAvatar}
          activeOpacity={0.8}
        >
          <View style={styles.avatarCircle}>
            <Image 
              source={userAvatar ? { uri: userAvatar } : require('../../../assets/default_avatar.png')} 
              style={styles.avatarImg} 
              resizeMode="cover"
            />
          </View>
          <View style={styles.cameraIconBadge}>
            <HugeiconsIcon icon={Camera01Icon} size={12} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.handleText}>@{cleanHandle}</Text>
      </View>

      {/* Main Question / Prompt */}
      <TouchableOpacity 
        style={styles.promptArea} 
        onPress={handleNextPrompt}
        activeOpacity={0.85}
      >
        <Text style={styles.promptText}>
          {currentPrompt}
        </Text>
      </TouchableOpacity>

      {/* Interactive Dice Prompt Switcher Button */}
      <View style={styles.bottomRow}>
        <TouchableOpacity 
          style={styles.diceButton} 
          onPress={handleNextPrompt}
          activeOpacity={0.7}
        >
          <Text style={styles.diceIcon}>🎲</Text>
          <Text style={styles.diceText}>dice</Text>
        </TouchableOpacity>
      </View>

      {/* Ephemeral Notice */}
      <View style={styles.bottomNotice}>
        <Text style={styles.bottomNoticeText}>
          🔒 100% anonymous & encrypted • disappears in 24h
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  whisperCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 280,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FF2A6D',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3C291E',
  },
  handleText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  promptArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  promptText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  bottomRow: {
    marginTop: 12,
    marginBottom: 12,
  },
  diceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  diceIcon: {
    fontSize: 16,
  },
  diceText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomNotice: {
    marginTop: 4,
  },
  bottomNoticeText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '500',
    textAlign: 'center',
  },
});
