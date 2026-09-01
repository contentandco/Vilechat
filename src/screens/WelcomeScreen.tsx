import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  const showTerms = () => {
    Alert.alert(
      'Terms of Use',
      'By using Vailchat, you agree to treat others with respect. Harassment, hate speech, and illegal activities are strictly prohibited. All rooms self-destruct automatically.'
    );
  };

  const showPrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'Vailchat is end-to-end encrypted. We do not store your personal identity, phone number, or email. Room messages are ephemeral and permanently wipe upon expiration.'
    );
  };

  return (
    <LinearGradient
      colors={['#E5006C', '#FF1E6C', '#FF4E36', '#FF7700']}
      locations={[0, 0.35, 0.75, 1]}
      style={styles.container}
    >
      {/* Center Logo Area */}
      <View style={styles.centerContainer}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/logo-transparent.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Bottom Action Area */}
      <View style={styles.bottomContainer}>
        {/* Get Started Button (White, No Shadow, Normal Weight) */}
        <TouchableOpacity
          style={styles.getStartedBtn}
          onPress={onGetStarted}
          activeOpacity={0.85}
        >
          <Text style={styles.getStartedBtnText}>Get Started!</Text>
        </TouchableOpacity>

        {/* Legal Disclaimer */}
        <Text style={styles.legalText}>
          By continuing, you agree to our{' '}
          <Text style={styles.legalLink} onPress={showTerms}>
            Terms of Use
          </Text>{' '}
          and have read and agreed to our{' '}
          <Text style={styles.legalLink} onPress={showPrivacy}>
            Privacy Policy
          </Text>
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    transform: [{ rotate: '-4deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: Math.min(width - 32, 360),
    height: 220,
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 8,
  },
  getStartedBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowOpacity: 0,
    elevation: 0,
  },
  getStartedBtnText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'normal',
    letterSpacing: 0.2,
  },
  legalText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    fontWeight: 'normal',
  },
  legalLink: {
    textDecorationLine: 'underline',
    fontWeight: 'normal',
    color: '#FFFFFF',
  },
});
