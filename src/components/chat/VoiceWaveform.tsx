import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Play, Pause, Volume2 } from 'lucide-react-native';
import { Colors } from '../../constants/theme';

interface VoiceWaveformProps {
  isPlaying: boolean;
  isMe: boolean;
  onTogglePlay: () => void;
}

const WAVEFORM_HEIGHTS = [8, 14, 20, 10, 16, 22, 12, 18, 14, 10, 16, 20, 12, 8];

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isPlaying,
  isMe,
  onTogglePlay,
}) => {
  return (
    <TouchableOpacity 
      style={styles.voiceNoteRow} 
      onPress={onTogglePlay}
      activeOpacity={0.8}
    >
      <View style={[styles.playButtonCircle, isMe ? styles.playButtonCircleMe : styles.playButtonCircleOther]}>
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
      
      {/* Waveform simulation */}
      <View style={styles.waveformContainer}>
        {WAVEFORM_HEIGHTS.map((h, i) => (
          <View 
            key={i} 
            style={[
              styles.waveformBar, 
              { height: h },
              isPlaying && styles.waveformBarActive,
              isMe ? styles.waveformBarMe : styles.waveformBarOther
            ]} 
          />
        ))}
      </View>
      <Volume2 size={14} color={isMe ? Colors.textWhite : Colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  voiceNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonCircleMe: {
    backgroundColor: '#FFFFFF',
  },
  playButtonCircleOther: {
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1,
    borderColor: Colors.borderInput,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 24,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
  waveformBarMe: {
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
  },
  waveformBarOther: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.6,
  },
  waveformBarActive: {
    opacity: 1,
    backgroundColor: Colors.primary,
  },
});
