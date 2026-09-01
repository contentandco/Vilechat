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
          <Text style={styles.atPrefix}>@</Text>
          <TextInput
            style={styles.usernameInput}
            placeholder="username"
            placeholderTextColor="#6F7B8C"
            value={usernameInput.replace(/^@+/, '')}
            onChangeText={(text) => setUsernameInput(text.replace(/^@+/, ''))}
            selectionColor={Colors.primary}
            cursorColor={Colors.primary}
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
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  atPrefix: {
    color: '#6F7B8C',
    fontSize: 22,
    fontWeight: '700',
    marginRight: 6,
  },
  usernameInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'left',
    paddingVertical: 4,
  },
  bottomContainer: {
    paddingBottom: 12,
  },
  continueBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnDisabled: {
    backgroundColor: '#232D3F',
    opacity: 0.6,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  continueBtnTextDisabled: {
    color: '#65758D',
  },
});
