import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  LockKeyIcon,
  UserGroupIcon,
  Share01Icon,
  Clock01Icon,
  Copy01Icon,
  Logout01Icon,
} from '@hugeicons/core-free-icons';
import { MessageItem } from '../../types';
import { Colors } from '../../constants/theme';

interface RoomInfoModalProps {
  visible: boolean;
  onClose: () => void;
  activeRoomName: string;
  activeRoomCode: string;
  timeRemaining: string;
  participantsCount: number;
  userNickname: string;
  userId: string;
  messages: MessageItem[];
  roomNameInputText: string;
  setRoomNameInputText: (text: string) => void;
  onRenameRoom: (newName: string) => Promise<void>;
  onCopyInviteLink: () => void;
  onLeaveRoom: () => void;
  loading: boolean;
}

export const RoomInfoModal: React.FC<RoomInfoModalProps> = ({
  visible,
  onClose,
  activeRoomName,
  activeRoomCode,
  timeRemaining,
  participantsCount,
  userNickname,
  userId,
  messages,
  roomNameInputText,
  setRoomNameInputText,
  onRenameRoom,
  onCopyInviteLink,
  onLeaveRoom,
  loading,
}) => {
  const handleSaveName = async () => {
    const newName = roomNameInputText.trim();
    if (!newName) {
      Alert.alert('Error', 'Please enter a valid room name.');
      return;
    }
    await onRenameRoom(newName);
  };

  const handleConfirmLeave = () => {
    Alert.alert(
      'Leave & Destroy?',
      'This will immediately remove you from the room. If no other active users are inside, it will be cleaned up.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave Room', style: 'destructive', onPress: onLeaveRoom },
      ]
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Room Info</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Visual Avatar Hero */}
            <View style={styles.modalHero}>
              <View style={styles.modalLargeAvatar}>
                <HugeiconsIcon icon={LockKeyIcon} size={36} color={Colors.textPrimary} />
              </View>
              <Text style={styles.modalRoomName}>{activeRoomName}</Text>
              <Text style={styles.modalRoomStatus}>Anonymous Encryption Workspace</Text>
            </View>

            {/* Rename Room Action */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <HugeiconsIcon icon={UserGroupIcon} size={18} color={Colors.textPrimary} />
                <Text style={styles.modalCardTitle}>Rename Room</Text>
              </View>
              <Text style={styles.modalCardDesc}>
                Give this room a friendly name (e.g. "cousin crew 💖"). This will be end-to-end encrypted and visible to other participants.
              </Text>
              <View style={styles.renameFormRow}>
                <TextInput
                  style={styles.renameInput}
                  placeholder="Enter new room name..."
                  placeholderTextColor={Colors.textSecondary}
                  value={roomNameInputText}
                  onChangeText={setRoomNameInputText}
                  maxLength={32}
                />
                <TouchableOpacity 
                  style={styles.renameSaveBtn}
                  onPress={handleSaveName}
                  disabled={loading}
                >
                  <Text style={styles.renameSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Share Option */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <HugeiconsIcon icon={Share01Icon} size={18} color={Colors.textPrimary} />
                <Text style={styles.modalCardTitle}>Share Room Invite</Text>
              </View>
              <Text style={styles.modalCardDesc}>
                Invite others to join this room. Send them the secret code or the direct deep link.
              </Text>
              <TouchableOpacity style={styles.modalShareBtn} onPress={onCopyInviteLink}>
                <HugeiconsIcon icon={Copy01Icon} size={16} color={Colors.textWhite} style={{ marginRight: 8 }} />
                <Text style={styles.modalShareBtnText}>Copy Invite Link</Text>
              </TouchableOpacity>
            </View>

            {/* Expiration Card */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <HugeiconsIcon icon={Clock01Icon} size={18} color={Colors.danger} />
                <Text style={styles.modalCardTitle}>Self-Destruct Timer</Text>
              </View>
              <Text style={styles.modalCardDesc}>
                This room and all of its chats, images, and voice notes will be completely deleted from the database in:
              </Text>
              <Text style={styles.modalTimerHighlight}>{timeRemaining}</Text>
            </View>

            {/* Encryption Details */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <HugeiconsIcon icon={LockKeyIcon} size={18} color={Colors.textPrimary} />
                <Text style={[styles.modalCardTitle, { color: Colors.textPrimary }]}>E2E Encryption Verified</Text>
              </View>
              <Text style={styles.modalCardDesc}>
                All communications are secured on-device using AES-256 CTR stream cipher. Supabase logs only ciphertext.
              </Text>
              <View style={styles.encryptionKeyBox}>
                <Text style={styles.encryptionKeyTitle}>SECRET CIPHER KEY</Text>
                <Text style={styles.encryptionKeyText}>{activeRoomCode}</Text>
              </View>
            </View>

            {/* Participants List */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <HugeiconsIcon icon={UserGroupIcon} size={18} color={Colors.textPrimary} />
                <Text style={styles.modalCardTitle}>Active Participants ({participantsCount})</Text>
              </View>
              <View style={styles.participantsList}>
                <View style={styles.participantItem}>
                  <View style={[styles.participantDot, { backgroundColor: Colors.secondary }]} />
                  <Text style={styles.participantName}>
                    {userNickname} <Text style={{ color: Colors.textSecondary }}>(You)</Text>
                  </Text>
                </View>
                {messages
                  .filter((m, i, self) => self.findIndex((t) => t.sender_id === m.sender_id) === i && m.sender_id !== userId)
                  .map((msg) => (
                    <View key={msg.id} style={styles.participantItem}>
                      <View style={[styles.participantDot, { backgroundColor: Colors.textSecondary }]} />
                      <Text style={styles.participantName}>{msg.sender_name}</Text>
                    </View>
                  ))}
              </View>
            </View>

            {/* Actions: Leave & Destroy Room */}
            <TouchableOpacity 
              style={styles.modalDeleteBtn} 
              onPress={handleConfirmLeave}
            >
              <HugeiconsIcon icon={Logout01Icon} size={18} color={Colors.danger} style={{ marginRight: 8 }} />
              <Text style={styles.modalDeleteBtnText}>Leave & Destroy Room</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '82%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseBtn: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  modalCloseText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  modalHero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalLargeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalRoomName: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalRoomStatus: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  modalCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  modalCardTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  modalCardDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  renameFormRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
    alignItems: 'center',
  },
  renameInput: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  renameSaveBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  renameSaveText: {
    color: Colors.textWhite,
    fontWeight: '800',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  modalShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  modalShareBtnText: {
    color: Colors.textWhite,
    fontWeight: '800',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  modalTimerHighlight: {
    color: Colors.danger,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 10,
  },
  encryptionKeyBox: {
    backgroundColor: Colors.surfaceInput,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.borderInput,
  },
  encryptionKeyTitle: {
    color: Colors.textSecondary,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  encryptionKeyText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  participantsList: {
    marginTop: 6,
    gap: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  participantDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  participantName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dangerMuted,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 51, 102, 0.25)',
    paddingVertical: 16,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 40,
  },
  modalDeleteBtnText: {
    color: Colors.danger,
    fontWeight: '800',
    fontSize: 15,
  },
});
