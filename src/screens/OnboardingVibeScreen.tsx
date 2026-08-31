import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { Colors } from '../constants/theme';

export interface VibeOption {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  promptIndex: number;
}

export const VIBE_OPTIONS: VibeOption[] = [
  {
    id: 'confessions',
    emoji: '🤫',
    title: 'Secret Confessions',
    subtitle: 'Drop truths, secrets & tea',
    promptIndex: 2, // "tell me a secret you never told anyone 🔥"
  },
  {
    id: 'ama',
    emoji: '🔥',
    title: 'Ask Me Anything',
    subtitle: 'Answer spicy & fun questions',
    promptIndex: 1, // "ask me anything... 🤫"
  },
  {
    id: 'latenight',
    emoji: '💬',
    title: 'Late Night Chats',
    subtitle: 'Deep anonymous talks with friends',
    promptIndex: 0, // "send me anonymous messages!"
  },
  {
    id: 'crush',
    emoji: '💘',
    title: 'Crush & Truths',
    subtitle: 'Anonymous compliments & crushes',
    promptIndex: 4, // "drop a confession or truth 💖"
  },
  {
    id: 'roast',
    emoji: '😂',
    title: 'Roast Me Anonymously',
    subtitle: 'No filter, pure fun roasts',
    promptIndex: 5, // "roast me anonymously 😂"
  },
];

interface OnboardingVibeScreenProps {
  onBack: () => void;
  onContinue: (selectedVibe: VibeOption) => void;
}

export const OnboardingVibeScreen: React.FC<OnboardingVibeScreenProps> = ({
  onBack,
  onContinue,
}) => {
  const [selectedId, setSelectedId] = useState<string>('confessions');

  const handleContinue = () => {
    const chosen = VIBE_OPTIONS.find((v) => v.id === selectedId) || VIBE_OPTIONS[0];
    onContinue(chosen);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Screen Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>What's your anonymous vibe?</Text>
      </View>

      {/* Vibe Option Cards */}
      <ScrollView 
        style={styles.optionsScroll} 
        contentContainerStyle={styles.optionsContent}
        showsVerticalScrollIndicator={false}
      >
        {VIBE_OPTIONS.map((vibe) => {
          const isSelected = vibe.id === selectedId;
          return (
            <TouchableOpacity
              key={vibe.id}
              style={[styles.vibeCard, isSelected && styles.vibeCardSelected]}
              onPress={() => setSelectedId(vibe.id)}
              activeOpacity={0.85}
            >
              <View style={styles.vibeLeft}>
                <View style={styles.emojiCircle}>
                  <Text style={styles.emojiText}>{vibe.emoji}</Text>
                </View>
                <View style={styles.vibeTextContainer}>
                  <Text style={[styles.vibeTitle, isSelected && styles.vibeTitleSelected]}>
                    {vibe.title}
                  </Text>
                  <Text style={styles.vibeSubtitle}>{vibe.subtitle}</Text>
                </View>
              </View>

              {/* Radio Indicator */}
              <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom Continue CTA */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.9}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  header: {
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  titleContainer: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  titleText: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  optionsScroll: {
    flex: 1,
  },
  optionsContent: {
    paddingVertical: 10,
    gap: 14,
  },
  vibeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E2738',
    borderRadius: 26,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vibeCardSelected: {
    backgroundColor: '#27344C',
    borderColor: '#FFFFFF',
  },
  vibeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  emojiText: {
    fontSize: 22,
  },
  vibeTextContainer: {
    flex: 1,
  },
  vibeTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  vibeTitleSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  vibeSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#4A5B75',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  radioCircleSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#101624',
  },
  bottomContainer: {
    paddingTop: 12,
  },
  continueBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
});
