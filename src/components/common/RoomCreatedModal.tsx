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

interface RoomCreatedModalProps {
  visible: boolean;
  onClose: () => void;
  customRoomNameInput: string;
  setCustomRoomNameInput: (text: string) => void;
  onSaveName: (nameOverride?: string) => Promise<void>;
  nameSavedFeedback: boolean;
  onShareLink: () => void;
  onGoToInbox: () => void;
}

export const RoomCreatedModal: React.FC<RoomCreatedModalProps> = ({
  visible,
  onClose,
  customRoomNameInput,
  setCustomRoomNameInput,
  onSaveName,
  nameSavedFeedback,
  onShareLink,
  onGoToInbox,
}) => {
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
            placeholder="Room name (e.g. My Secret Room)..."
            placeholderTextColor={Colors.textMuted}
            value={customRoomNameInput}
            onChangeText={(text) => {
              setCustomRoomNameInput(text);
              onSaveName(text);
            }}
            selectionColor="#FFFFFF"
            cursorColor="#FFFFFF"
            onSubmitEditing={() => onSaveName()}
            onBlur={() => onSaveName()}
            returnKeyType="done"
            autoCapitalize="sentences"
            autoCorrect={false}
          />

          {/* Option 1: Share Link */}
          <TouchableOpacity 
            style={styles.createdShareActionBtn}
            onPress={async () => {
              await onSaveName();
              onClose();
              onShareLink();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.createdShareActionText}>Share Link 🚀</Text>
          </TouchableOpacity>

          {/* Option 2: Go to Inbox */}
          <TouchableOpacity 
            style={styles.createdInboxActionBtn}
            onPress={async () => {
              await onSaveName();
              onClose();
              onGoToInbox();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.createdInboxActionText}>Go to Inbox 📥</Text>
          </TouchableOpacity>

          {/* Option 3: Stay Here */}
          <TouchableOpacity 
            style={styles.createdDismissActionBtn}
            onPress={async () => {
              await onSaveName();
              onClose();
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
  nameSavedPill: {
    backgroundColor: 'rgba(255, 59, 105, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 105, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  nameSavedPillText: {
    color: Colors.primary,
    fontSize: 12,
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
  createdShareActionBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  createdShareActionText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  createdInboxActionBtn: {
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1.5,
    borderColor: Colors.borderInput,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  createdInboxActionText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
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
