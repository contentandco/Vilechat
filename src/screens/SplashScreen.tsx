import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  duration = 1400,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Pop-in spring animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Timer to complete splash
    const timer = setTimeout(() => {
      if (onFinish) {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish, opacityAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }, { rotate: '-4deg' }],
          },
        ]}
      >
        <Svg height="160" width={Math.min(width - 32, 340)} viewBox="0 0 340 160">
          {/* Outer Thick Black Outline & 3D Shadow */}
          <SvgText
            x="170"
            y="110"
            fill="#000000"
            stroke="#000000"
            strokeWidth="28"
            strokeLinejoin="round"
            strokeLinecap="round"
            fontSize="92"
            fontWeight="900"
            textAnchor="middle"
            fontFamily={Platform.OS === 'ios' ? 'Arial-Black' : 'sans-serif-black'}
          >
            VAIL
          </SvgText>

          {/* Inner Crisp White Bubble Fill */}
          <SvgText
            x="170"
            y="110"
            fill="#FFFFFF"
            fontSize="92"
            fontWeight="900"
            textAnchor="middle"
            fontFamily={Platform.OS === 'ios' ? 'Arial-Black' : 'sans-serif-black'}
          >
            VAIL
          </SvgText>
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF2A6D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
