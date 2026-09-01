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

interface WhisperCardProps {
  themeIndex: number;
  promptIndex: number;
  setPromptIndex: React.Dispatch<React.SetStateAction<number>>;
  roomCode: string;
  userNickname?: string;
  userAvatar?: string;
  onChangeAvatar?: () => void;
  isCreated?: boolean;
}

export const WhisperCard: React.FC<WhisperCardProps> = ({
  themeIndex,
  promptIndex,
  setPromptIndex,
  roomCode,
  userNickname,
  userAvatar,
  onChangeAvatar,
  isCreated = false,
}) => {
  const currentTheme = CARD_THEMES[themeIndex] || CARD_THEMES[0];
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
          onPress={onChangeAvatar}
          activeOpacity={0.8}
        >
          <View style={styles.avatarCircle}>
            <Image 
              source={userAvatar ? { uri: userAvatar } : require('../../../assets/default_avatar.png')} 
              style={styles.avatarImg} 
              resizeMode="cover"
            />
          </View>
          <View style={styles.avatarEditBadge}>
            <HugeiconsIcon icon={Camera01Icon} size={12} color="#1A1A1E" />
          </View>
        </TouchableOpacity>
        
        <Text style={styles.userHandleText}>@{cleanHandle}</Text>
        <Text style={styles.cardCategoryLabel}>secret whispers</Text>
      </View>

      {/* Main Prompt Question & Next Button */}
      <TouchableOpacity 
        onPress={handleNextPrompt}
        style={styles.promptTextBtn}
        activeOpacity={0.85}
      >
        <Text style={styles.promptQuestionText}>
          {currentPrompt}
        </Text>
        
        <View style={styles.rollPill}>
          <Text style={styles.rollPillText}>🎲 tap to roll prompt</Text>
        </View>
      </TouchableOpacity>

      {/* Bottom Status / Room ID Tag */}
      {isCreated && roomCode ? (
        <TouchableOpacity 
          style={styles.cardRoomCodeBadge}
          onPress={() => copyRoomCodeToClipboard(roomCode)}
          activeOpacity={0.7}
        >
          <Text style={styles.cardRoomCodeLabel}>Room Code: {roomCode}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.cardRoomCodeBadge}>
          <Text style={styles.cardRoomCodeLabelEmpty}>No active room • Tap Step 1 below</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  whisperCard: {
    borderRadius: 32,
    paddingVertical: 36,
    paddingHorizontal: 22,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 380,
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    position: 'relative',
    marginBottom: 16,
  },
  topSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#C5CBD3',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  userHandleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardCategoryLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  promptTextBtn: {
    paddingHorizontal: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  promptQuestionText: {
    fontSize: 23,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  rollPill: {
    marginTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  rollPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cardRoomCodeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cardRoomCodeLabel: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardRoomCodeLabelEmpty: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
