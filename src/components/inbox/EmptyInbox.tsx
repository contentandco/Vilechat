import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/theme';

interface EmptyInboxProps {
  onGoToWhisper: () => void;
}

export const EmptyInbox: React.FC<EmptyInboxProps> = ({ onGoToWhisper }) => {
  return (
    <View style={styles.emptyHistoryState}>
      <View style={styles.emptyInboxIconCircle}>
        <Text style={{ fontSize: 32 }}>💌</Text>
      </View>
      <Text style={styles.emptyHistoryTitle}>Your Inbox is Empty</Text>
      <Text style={styles.emptyHistoryDesc}>
        Share your whisper card link on your story to start receiving anonymous messages!
      </Text>
      <TouchableOpacity 
        style={styles.emptyTextLink}
        onPress={onGoToWhisper}
        activeOpacity={0.7}
      >
        <Text style={styles.emptyTextLinkText}>Go to Whisper Card →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyHistoryState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyInboxIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyHistoryTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptyHistoryDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyTextLink: {
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  emptyTextLinkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'normal',
    textAlign: 'center',
  },
});
