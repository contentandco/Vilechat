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

interface JoinCodeModalProps {
  visible: boolean;
  onClose: () => void;
  roomCodeInput: string;
  setRoomCodeInput: (text: string) => void;
  onJoin: (code?: string) => void;
  loading: boolean;
}

export const JoinCodeModal: React.FC<JoinCodeModalProps> = ({
  visible,
  onClose,
  roomCodeInput,
  setRoomCodeInput,
  onJoin,
  loading,
}) => {
  const isSubmitDisabled = !roomCodeInput.trim() || loading;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.joinModalOverlay}
      >
        <View style={styles.joinModalCard}>
          <View style={styles.joinModalHeader}>
            <Text style={styles.joinModalTitle}>Join by Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.joinModalCloseBtn}>
              <Text style={styles.modalCloseSimpleText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.joinModalSubtitle}>
            Enter a room code or paste an invitation link to enter the secret chat.
          </Text>

          <TextInput
            style={styles.joinModalInput}
            placeholder="e.g. funny-tiger-42 or paste link..."
            placeholderTextColor={Colors.textMuted}
            value={roomCodeInput}
            onChangeText={setRoomCodeInput}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={true}
          />

          <TouchableOpacity 
            style={[styles.joinModalSubmitBtn, isSubmitDisabled && styles.joinModalSubmitDisabled]}
            onPress={() => onJoin(roomCodeInput)}
            disabled={isSubmitDisabled}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.textWhite} />
            ) : (
              <Text style={styles.joinModalSubmitText}>Join Chat</Text>
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
    paddingHorizontal: 20,
  },
  joinModalCard: {
    width: '100%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  joinModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  joinModalTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  joinModalCloseBtn: {
    width: 32,
    height: 32,
    backgroundColor: Colors.surfaceInput,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseSimpleText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  joinModalSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
  joinModalInput: {
    backgroundColor: Colors.surfaceInput,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: 15,
    marginBottom: 16,
  },
  joinModalSubmitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinModalSubmitDisabled: {
    opacity: 0.4,
  },
  joinModalSubmitText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
