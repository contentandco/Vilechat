import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { PlusSignIcon, SentIcon } from '@hugeicons/core-free-icons';
import { Colors } from '../../constants/theme';
import { useRoomActions } from '../../hooks/useRoomActions';

export const ShareDrawer: React.FC = () => {
  const {
    loading,
    nameSavedFeedback,
    handleCreateNewWhisperRoom,
    handleUniversalShare,
  } = useRoomActions();

  return (
    <View style={styles.shareDrawerCard}>
      {/* Step 1: Create your room */}
      <Text style={styles.shareStepTitle}>Step 1: Create your room</Text>
      
      {/* Step 1 Button: Create Room */}
      <View style={styles.step1ButtonsRow}>
        <TouchableOpacity 
          style={[styles.step1CreateBtn, nameSavedFeedback && styles.step1CreateBtnSuccess]} 
          onPress={handleCreateNewWhisperRoom} 
          disabled={loading}
          activeOpacity={0.8}
        >
          <HugeiconsIcon 
            icon={nameSavedFeedback ? SentIcon : PlusSignIcon} 
            size={15} 
            color={nameSavedFeedback ? Colors.secondary : Colors.primary} 
          />
          <View style={styles.iconTextSpacer} />
          <Text style={[styles.step1CreateBtnText, nameSavedFeedback && styles.step1CreateBtnTextSuccess]}>
            {nameSavedFeedback ? 'Room Created in Inbox! ✓' : 'Create Room'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Step 2: Share Anywhere */}
      <Text style={[styles.shareStepTitle, styles.step2Title]}>Step 2: Share link anywhere</Text>
      
      <TouchableOpacity 
        style={styles.mainShareBtn} 
        onPress={handleUniversalShare} 
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
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  shareStepTitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  step2Title: {
    marginTop: 20,
  },
  step1ButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  step1CreateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceMuted,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  step1CreateBtnSuccess: {
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    borderColor: Colors.secondary,
  },
  step1CreateBtnText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  step1CreateBtnTextSuccess: {
    color: Colors.secondary,
  },
  iconTextSpacer: {
    width: 6,
  },
  mainShareBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  mainShareBtnText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    color: Colors.textWhite,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
