import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { Colors } from '../constants/theme';

interface OnboardingUsernameScreenProps {
  onBack: () => void;
  onContinue: (username: string) => void;
  initialUsername?: string;
}

export const OnboardingUsernameScreen: React.FC<OnboardingUsernameScreenProps> = ({
  onBack,
  onContinue,
  initialUsername = '',
}) => {
  const [usernameInput, setUsernameInput] = useState<string>(initialUsername);

  const cleanUsername = usernameInput.trim();
  const isValid = cleanUsername.length > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    const formatted = cleanUsername.startsWith('@') ? cleanUsername : `@${cleanUsername}`;
    onContinue(formatted);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Center Content */}
      <View style={styles.centerContent}>
        <Text style={styles.titleText}>Choose a username</Text>

        {/* Username Input Pill */}
        <View style={styles.inputPillContainer}>
          <TextInput
            style={styles.usernameInput}
            placeholder="@"
            placeholderTextColor="#6F7B8C"
            value={usernameInput}
            onChangeText={setUsernameInput}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={true}
            maxLength={24}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </View>
      </View>

      {/* Bottom Continue Action */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.continueBtn, !isValid && styles.continueBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isValid}
          activeOpacity={0.9}
        >
          <Text style={[styles.continueBtnText, !isValid && styles.continueBtnTextDisabled]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centerContent: {
    alignItems: 'center',
    marginTop: -80,
  },
  titleText: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -0.4,
  },
  inputPillContainer: {
    width: '100%',
    backgroundColor: '#1E2738',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#2D3A50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  usernameInput: {
    width: '100%',
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 4,
  },
  bottomContainer: {
    paddingBottom: 12,
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
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnDisabled: {
    backgroundColor: '#354359',
    opacity: 0.7,
  },
  continueBtnText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  continueBtnTextDisabled: {
    color: '#8E9BAE',
  },
});
