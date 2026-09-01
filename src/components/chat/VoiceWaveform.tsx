import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { Colors } from '../../constants/theme';

interface VoiceWaveformProps {
  isPlaying: boolean;
  isMe: boolean;
  onTogglePlay: () => void;
  duration?: number;
}

const BAR_PATTERNS = [8, 14, 22, 12, 18, 24, 10, 16, 20, 14, 18, 10, 16, 8];

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isPlaying,
  isMe,
  onTogglePlay,
  duration = 5,
}) => {
  const [elapsedSecs, setElapsedSecs] = useState<number>(0);
  const animProg = useRef(new Animated.Value(0)).current;

  // Track playback time
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      setElapsedSecs(0);
      timer = setInterval(() => {
        setElapsedSecs((prev) => (prev >= duration ? 0 : prev + 1));
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(animProg, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(animProg, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      setElapsedSecs(0);
      animProg.setValue(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, duration]);

  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <TouchableOpacity
      style={styles.voiceNoteRow}
      onPress={onTogglePlay}
      activeOpacity={0.85}
    >
      {/* Play/Pause Button Circle */}
      <View
        style={[
          styles.playButtonCircle,
          isMe ? styles.playButtonCircleMe : styles.playButtonCircleOther,
        ]}
      >
        {isPlaying ? (
          <Pause
            size={14}
            color={isMe ? Colors.primary : Colors.textPrimary}
            fill={isMe ? Colors.primary : Colors.textPrimary}
          />
        ) : (
          <Play
            size={14}
            color={isMe ? Colors.primary : Colors.textPrimary}
            fill={isMe ? Colors.primary : Colors.textPrimary}
            style={{ marginLeft: 2 }}
          />
        )}
      </View>

      {/* Waveform Bars with dynamic animation */}
      <View style={styles.waveformContainer}>
        {BAR_PATTERNS.map((baseHeight, idx) => {
          const isBarPlayed = isPlaying && idx <= (elapsedSecs / (duration || 1)) * BAR_PATTERNS.length;
          return (
            <View
              key={idx}
              style={[
                styles.waveformBar,
                { height: baseHeight },
                isMe
                  ? isBarPlayed
                    ? styles.barMeActive
                    : styles.barMeInactive
                  : isBarPlayed
                  ? styles.barOtherActive
                  : styles.barOtherInactive,
              ]}
            />
          );
        })}
      </View>

      {/* Duration / Progress Text */}
      <Text style={[styles.durationText, isMe ? styles.durationMe : styles.durationOther]}>
        {isPlaying ? formatSecs(elapsedSecs) : formatSecs(duration)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  voiceNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
    minWidth: 160,
  },
  playButtonCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonCircleMe: {
    backgroundColor: '#FFFFFF',
  },
  playButtonCircleOther: {
    backgroundColor: Colors.surfaceInput,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 28,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
  },
  barMeActive: {
    backgroundColor: '#FFFFFF',
    opacity: 1,
  },
  barMeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  barOtherActive: {
    backgroundColor: '#FF2A6D',
    opacity: 1,
  },
  barOtherInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
  durationMe: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  durationOther: {
    color: Colors.textSecondary,
  },
});
