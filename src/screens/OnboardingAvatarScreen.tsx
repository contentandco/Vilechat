import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Add01Icon, UserIcon } from '@hugeicons/core-free-icons';
import { Colors } from '../constants/theme';

interface OnboardingAvatarScreenProps {
  onBack: () => void;
  onContinue: (avatarUri: string) => void;
  onSkip: () => void;
  initialAvatar?: string;
}

export const OnboardingAvatarScreen: React.FC<OnboardingAvatarScreenProps> = ({
  onBack,
  onContinue,
  onSkip,
  initialAvatar = '',
}) => {
  const [avatarUri, setAvatarUri] = useState<string>(initialAvatar);

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'We need access to your gallery to let you choose a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open image picker.');
    }
  };

  const handleDone = () => {
    if (avatarUri) {
      onContinue(avatarUri);
    } else {
      onSkip();
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>skip</Text>
        </TouchableOpacity>
      </View>

      {/* Center Content */}
      <View style={styles.centerContent}>
        <Text style={styles.titleText}>Choose a{'\n'}profile picture</Text>

        {/* Large Circular Avatar Placeholder with Plus Badge */}
        <TouchableOpacity 
          style={styles.avatarTouchable}
          onPress={handlePickImage}
          activeOpacity={0.85}
        >
          <View style={styles.avatarCircle}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.defaultSilhouette}>
                <HugeiconsIcon icon={UserIcon} size={84} color="#60718A" />
              </View>
            )}
          </View>

          {/* White Plus Badge */}
          <View style={styles.plusBadge}>
            <HugeiconsIcon icon={Add01Icon} size={22} color="#000000" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        {avatarUri ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleDone}
            activeOpacity={0.9}
          >
            <Text style={styles.actionBtnText}>Continue</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handlePickImage}
            activeOpacity={0.9}
          >
            <Text style={styles.actionBtnText}>Choose photo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  skipText: {
    color: '#8E9BAE',
    fontSize: 16,
    fontWeight: '700',
  },
  centerContent: {
    alignItems: 'center',
    marginTop: -40,
  },
  titleText: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 44,
    letterSpacing: -0.4,
    lineHeight: 36,
  },
  avatarTouchable: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: '#1E2738',
    borderWidth: 4,
    borderColor: '#38475E',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 88,
  },
  defaultSilhouette: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E2738',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  bottomContainer: {
    paddingBottom: 12,
  },
  actionBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
});
