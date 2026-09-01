import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import { useRoomActions } from '../../hooks/useRoomActions';

export const RoomCreatedModal: React.FC = () => {
  const visible = useAppStore((s) => s.showCreatedModal);
  const setShowCreatedModal = useAppStore((s) => s.setShowCreatedModal);
  const customRoomNameInput = useAppStore((s) => s.customRoomNameInput);
  const setCustomRoomNameInput = useAppStore((s) => s.setCustomRoomNameInput);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const {
    nameSavedFeedback,
    handleSaveCustomRoomName,
    handleUniversalShare,
  } = useRoomActions();

  const handleClose = () => setShowCreatedModal(false);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.joinModalOverlay}
      >
        <View style={styles.joinModalCard}>
          <View style={styles.joinModalHeader}>
            <Text style={styles.joinModalTitle}>Room Created! 🎉</Text>
            {nameSavedFeedback && (
              <View style={styles.nameSavedPill}>
                <Text style={styles.nameSavedPillText}>Saved ✓</Text>
              </View>
            )}
          </View>

          <Text style={styles.joinModalSubtitle}>
            Link copied to clipboard! 📋 Give your room a name and choose an option:
          </Text>

          <TextInput
            style={styles.joinModalInput}
            placeholder="Room name (e.g. Gossip, Gaming...)"
            placeholderTextColor={Colors.textMuted}
            value={customRoomNameInput}
            onChangeText={setCustomRoomNameInput}
            onSubmitEditing={() => handleSaveCustomRoomName()}
            returnKeyType="done"
            autoCapitalize="sentences"
            autoCorrect={false}
          />

          {/* Option 1: Share Link */}
          <TouchableOpacity 
            style={styles.createdShareActionBtn}
            onPress={() => {
              handleClose();
              handleUniversalShare();
              handleSaveCustomRoomName().catch?.(() => {});
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.createdShareActionText}>Share Link 🚀</Text>
          </TouchableOpacity>

          {/* Option 2: Go to Inbox */}
          <TouchableOpacity 
            style={styles.createdInboxActionBtn}
            onPress={() => {
              handleClose();
              setActiveTab('inbox');
              handleSaveCustomRoomName().catch?.(() => {});
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.createdInboxActionText}>Go to Inbox 📥</Text>
          </TouchableOpacity>

          {/* Option 3: Stay Here */}
          <TouchableOpacity 
            style={styles.createdDismissActionBtn}
            onPress={() => {
              handleClose();
              handleSaveCustomRoomName().catch?.(() => {});
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.createdDismissActionText}>Stay on Whisper</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  joinModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  joinModalCard: {
    width: '100%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    padding: 24,
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  joinModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  joinModalTitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  nameSavedPill: {
    backgroundColor: 'rgba(0, 245, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  nameSavedPillText: {
    color: Colors.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  joinModalSubtitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  joinModalInput: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    borderWidth: 0,
    marginBottom: 16,
  },
  createdShareActionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createdShareActionText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '400',
  },
  createdInboxActionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 0,
  },
  createdInboxActionText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '400',
  },
  createdDismissActionBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createdDismissActionText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
