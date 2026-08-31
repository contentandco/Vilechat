import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { PencilEdit02Icon } from '@hugeicons/core-free-icons';
import { copyRoomCodeToClipboard } from '../../services/share';
import { CARD_THEMES, PROMPTS } from '../../constants';

interface NglCardProps {
  themeIndex: number;
  promptIndex: number;
  setPromptIndex: React.Dispatch<React.SetStateAction<number>>;
  roomCode: string;
  userAvatar?: string;
  onRandomizeNickname: () => string;
}

export const NglCard: React.FC<NglCardProps> = ({
  themeIndex,
  promptIndex,
  setPromptIndex,
  roomCode,
  userAvatar,
  onRandomizeNickname,
}) => {
  const currentTheme = CARD_THEMES[themeIndex] || CARD_THEMES[0];
  const currentPrompt = PROMPTS[promptIndex] || PROMPTS[0];

  const handleEditNickname = () => {
    const newName = onRandomizeNickname();
    Alert.alert('New Anonymous Alias', `Your alias is now: ${newName}`);
  };

  const handleNextPrompt = () => {
    setPromptIndex((prev) => (prev + 1) % PROMPTS.length);
  };

  return (
    <View style={[styles.nglCard, { backgroundColor: currentTheme.bg }]}>
      {/* User Profile Avatar with Edit Badge */}
      <View style={styles.nglAvatarContainer}>
        <View style={styles.nglAvatarCircle}>
          <Image 
            source={userAvatar ? { uri: userAvatar } : require('../../../assets/default_avatar.png')} 
            style={styles.nglAvatarImg} 
            resizeMode="cover"
          />
        </View>
        <TouchableOpacity 
          style={styles.avatarEditBadge}
          onPress={handleEditNickname}
          activeOpacity={0.8}
        >
          <HugeiconsIcon icon={PencilEdit02Icon} size={13} color="#1A1A1E" />
        </TouchableOpacity>
      </View>

      {/* Prompt Question Text */}
      <TouchableOpacity 
        onPress={handleNextPrompt}
        style={styles.promptTextBtn}
        activeOpacity={0.8}
      >
        <Text style={styles.promptQuestionText}>
          {currentPrompt}
        </Text>
      </TouchableOpacity>

      {/* Clickable Room ID Tag */}
      <TouchableOpacity 
        style={styles.cardRoomCodeBadge}
        onPress={() => copyRoomCodeToClipboard(roomCode)}
        activeOpacity={0.7}
      >
        <Text style={styles.cardRoomCodeLabel}>Room Code: {roomCode}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
