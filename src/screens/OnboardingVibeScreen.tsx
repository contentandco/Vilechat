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
import { VIBE_OPTIONS, VibeOption } from '../constants/vibes';

export { VibeOption, VIBE_OPTIONS };

interface OnboardingVibeScreenProps {
  onBack: () => void;
  onContinue: (selectedVibe: VibeOption) => void;
}

export const OnboardingVibeScreen: React.FC<OnboardingVibeScreenProps> = ({
  onBack,
  onContinue,
}) => {
  const [selectedId, setSelectedId] = useState<string>('confessions');

  const selectedVibe = VIBE_OPTIONS.find((v) => v.id === selectedId) || VIBE_OPTIONS[0];

  return (
    <View style={styles.container}>
      {/* Top Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Pick Your Daily Vibe 🔥</Text>
        <Text style={styles.subtitle}>
          Choose the question card you want on your story to get the most juicy anonymous confessions.
        </Text>

        {/* Options List */}
        <View style={styles.optionsList}>
          {VIBE_OPTIONS.map((vibe) => {
            const isSelected = vibe.id === selectedId;
            return (
              <TouchableOpacity
                key={vibe.id}
                style={[styles.vibeCard, isSelected && styles.vibeCardSelected]}
                onPress={() => setSelectedId(vibe.id)}
                activeOpacity={0.8}
              >
                <View style={styles.vibeEmojiWrapper}>
                  <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                </View>
                <View style={styles.vibeTextContainer}>
                  <Text style={[styles.vibeTitle, isSelected && styles.vibeTitleSelected]}>
                    {vibe.title}
                  </Text>
                  <Text style={styles.vibeSubtitle}>{vibe.subtitle}</Text>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Sticky Continue Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => onContinue(selectedVibe)}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  optionsList: {
    gap: 12,
  },
  vibeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  vibeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 59, 105, 0.08)',
  },
  vibeEmojiWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  vibeEmoji: {
    fontSize: 22,
  },
  vibeTextContainer: {
    flex: 1,
  },
  vibeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  vibeTitleSelected: {
    color: Colors.textPrimary,
  },
  vibeSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  continueBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '400',
  },
});
