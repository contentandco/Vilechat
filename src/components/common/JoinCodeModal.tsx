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
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import { useRoomActions } from '../../hooks/useRoomActions';

export const JoinCodeModal: React.FC = () => {
  const visible = useAppStore((s) => s.showJoinCodeModal);
  const setShowJoinCodeModal = useAppStore((s) => s.setShowJoinCodeModal);
  const roomCodeInput = useAppStore((s) => s.roomCodeInput);
  const setRoomCodeInput = useAppStore((s) => s.setRoomCodeInput);

  const { handleJoinRoom, loading } = useRoomActions();

  const handleClose = () => setShowJoinCodeModal(false);
  const isSubmitDisabled = !roomCodeInput.trim() || loading;

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
            <Text style={styles.joinModalTitle}>Join by Code</Text>
            <TouchableOpacity onPress={handleClose} style={styles.joinModalCloseBtn}>
              <Text style={styles.modalCloseSimpleText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.joinModalSubtitle}>
            Enter a room code or paste an invitation link to enter the secret chat.
          </Text>

          <TextInput
            style={styles.joinModalInput}
            placeholder="e.g. VL-8492 or paste link..."
            placeholderTextColor={Colors.textMuted}
            value={roomCodeInput}
            onChangeText={setRoomCodeInput}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.joinModalSubmitBtn, isSubmitDisabled && styles.joinModalSubmitDisabled]}
            disabled={isSubmitDisabled}
            onPress={() => handleJoinRoom(roomCodeInput)}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.textWhite} />
            ) : (
              <Text style={styles.joinModalSubmitText}>Enter Room →</Text>
            )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  joinModalTitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  joinModalCloseBtn: {
    padding: 4,
  },
  modalCloseSimpleText: {
    color: Colors.textMuted,
    fontSize: 18,
    fontWeight: '600',
  },
  joinModalSubtitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  joinModalInput: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    borderWidth: 0,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
  },
  joinModalSubmitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinModalSubmitDisabled: {
    opacity: 0.5,
  },
  joinModalSubmitText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textWhite,
  },
});
