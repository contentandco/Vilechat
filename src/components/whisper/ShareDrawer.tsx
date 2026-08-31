import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { PlusSignIcon, SentIcon } from '@hugeicons/core-free-icons';
import { Colors } from '../../constants/theme';

interface ShareDrawerProps {
  roomCode: string;
  loading: boolean;
  roomCreatedFeedback: boolean;
  onCreateNewRoom: () => void;
  onUniversalShare: () => void;
}

export const ShareDrawer: React.FC<ShareDrawerProps> = ({
  roomCode,
  loading,
  roomCreatedFeedback,
  onCreateNewRoom,
  onUniversalShare,
}) => {
  return (
    <View style={styles.shareDrawerCard}>
      {/* Step 1: Create your room */}
      <Text style={styles.shareStepTitle}>Step 1: Create your room</Text>

      <Text style={styles.shareStepSubtitle} numberOfLines={1}>
        vailchat.com/join?code={roomCode}
      </Text>
      
      {/* Step 1 Button: Create Room */}
      <View style={styles.step1ButtonsRow}>
        <TouchableOpacity 
          style={[styles.step1CreateBtn, roomCreatedFeedback && styles.step1CreateBtnSuccess]} 
          onPress={onCreateNewRoom} 
          disabled={loading}
          activeOpacity={0.8}
        >
          <HugeiconsIcon 
            icon={roomCreatedFeedback ? SentIcon : PlusSignIcon} 
            size={15} 
            color={roomCreatedFeedback ? Colors.secondary : Colors.primary} 
          />
          <View style={styles.iconTextSpacer} />
          <Text style={[styles.step1CreateBtnText, roomCreatedFeedback && styles.step1CreateBtnTextSuccess]}>
            {roomCreatedFeedback ? 'Room Created in Inbox! ✓' : 'Create Room'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Step 2: Share Anywhere */}
      <Text style={[styles.shareStepTitle, styles.step2Title]}>Step 2: Share link anywhere</Text>
      
      <TouchableOpacity 
        style={styles.mainShareBtn} 
        onPress={onUniversalShare} 
        activeOpacity={0.85}
      >
        <Text style={styles.mainShareBtnText}>Share!</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  shareDrawerCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    padding: 22,
    borderWidth: 0,
    marginTop: 34,
    marginBottom: 24,
    alignItems: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  shareStepTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textWhite,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  step2Title: {
    marginTop: 24,
    marginBottom: 14,
  },
  shareStepSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
    marginBottom: 14,
    textAlign: 'center',
  },
  step1ButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  step1CreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  iconTextSpacer: {
    width: 8,
  },
  step1CreateBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  step1CreateBtnSuccess: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  step1CreateBtnTextSuccess: {
    color: Colors.primary,
  },
  mainShareBtn: {
    backgroundColor: Colors.primary,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowOpacity: 0,
    elevation: 0,
  },
  mainShareBtnText: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
