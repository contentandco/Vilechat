import React, { useState } from 'react';
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
  Switch,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  LockKeyIcon,
  UserGroupIcon,
  Share01Icon,
  Clock01Icon,
  Copy01Icon,
  Logout01Icon,
  PencilEdit02Icon,
  SentIcon,
  HandIcon,
  Delete02Icon,
  UserRemove01Icon,
} from '@hugeicons/core-free-icons';
import { MessageItem } from '../../types';
import { Colors } from '../../constants/theme';
import { copyRoomCodeToClipboard, copyRoomLinkToClipboard, shareRoomLink } from '../../services/share';
import { setRoomPausedInDB } from '../../api/rooms';

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
  isCreator: boolean;
  isPaused?: boolean;
  setIsPaused?: (paused: boolean) => void;
  roomNameInputText: string;
  setRoomNameInputText: (text: string) => void;
  onRenameRoom: (newName: string) => Promise<void>;
  onLeaveRoom: () => void;
  onDestroyRoom?: () => void;
  onKickParticipant?: (participantId: string, participantName: string) => void;
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
  isCreator,
  isPaused = false,
  setIsPaused,
  roomNameInputText,
  setRoomNameInputText,
  onRenameRoom,
  onLeaveRoom,
  onDestroyRoom,
  onKickParticipant,
  loading,
}) => {
  const [localPaused, setLocalPaused] = useState<boolean>(isPaused);

  const handleSaveName = async () => {
    if (!isCreator) return;
    const newName = roomNameInputText.trim();
    if (!newName) {
      Alert.alert('Error', 'Please enter a valid room name.');
      return;
    }
    await onRenameRoom(newName);
  };

  const handleTogglePause = async () => {
    if (!isCreator) return;
    const next = !localPaused;
    setLocalPaused(next);
    setIsPaused?.(next);
    await setRoomPausedInDB(activeRoomCode, next);
    Alert.alert(
      next ? 'Link Paused' : 'Link Active',
      next
        ? 'New participants cannot join until you unpause.'
        : 'Link is now active and joinable.'
    );
  };

  const handleConfirmLeave = () => {
    Alert.alert(
      'Leave Room?',
      'You will leave this room and it will be removed from your inbox. You can only rejoin with the room code or link.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave Room', 
          style: 'destructive', 
          onPress: () => {
            onClose();
            onLeaveRoom();
          } 
        },
      ]
    );
  };

  const handleConfirmDestroy = () => {
    Alert.alert(
      'Destroy & Delete Room?',
      'As the creator, this will permanently delete the entire room and all its messages for everyone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Destroy Room',
          style: 'destructive',
          onPress: () => {
            onClose();
            if (onDestroyRoom) {
              onDestroyRoom();
            } else {
              onLeaveRoom();
            }
          },
        },
      ]
    );
  };

  const handleKick = (participantId: string, participantName: string) => {
    if (!isCreator || !onKickParticipant) return;
    Alert.alert(
      `Kick ${participantName}?`,
      `This will immediately remove ${participantName} from this secret room.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Kick User',
          style: 'destructive',
          onPress: () => onKickParticipant(participantId, participantName),
        },
      ]
    );
  };

  // Deduplicate participants:
  // 1. Exclude system messages
  // 2. Exclude current user (matches userId or current userNickname)
  // 3. Deduplicate other members by clean sender_name/sender_id
  const myCleanName = (userNickname || '').replace(/^@+/, '').trim().toLowerCase();

  const otherParticipantsMap = new Map<string, { id: string; sender_id: string; sender_name: string }>();
  for (const m of messages) {
    if (m.is_system || m.sender_id === '__system__' || m.sender_name === 'System') continue;

    const msgSenderName = (m.sender_name || '').replace(/^@+/, '').trim().toLowerCase();
    // Exclude yourself
    if (m.sender_id === userId || (myCleanName && msgSenderName === myCleanName)) {
      continue;
    }

    const key = msgSenderName || m.sender_id;
    if (!otherParticipantsMap.has(key)) {
      otherParticipantsMap.set(key, {
        id: m.id,
        sender_id: m.sender_id,
        sender_name: m.sender_name,
      });
    }
  }

  const otherParticipants = Array.from(otherParticipantsMap.values());
  const totalHumanParticipants = otherParticipants.length + 1;

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
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn} activeOpacity={0.7}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScroll} 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Room Hero */}
            <View style={styles.modalHero}>
              <View style={styles.modalAvatarCircle}>
                <HugeiconsIcon icon={LockKeyIcon} size={32} color={Colors.primary} />
              </View>
              <Text style={styles.modalRoomName}>{activeRoomName}</Text>
              <View style={styles.e2eBadge}>
                <Text style={styles.e2eBadgeText}>
                  {isCreator ? '👑 Room Creator • End-to-End Encrypted' : '🔒 End-to-End Encrypted'}
                </Text>
              </View>
            </View>

            {/* 1. ROOM CODE & JOIN LINK CARD */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <HugeiconsIcon icon={Share01Icon} size={18} color={Colors.primary} />
                <Text style={styles.modalCardTitle}>Room Code & Link</Text>
              </View>

              {/* Room Code Row */}
              <Text style={styles.fieldLabel}>ROOM CODE</Text>
              <View style={styles.codeRow}>
                <Text style={styles.codeText}>{activeRoomCode}</Text>
                <TouchableOpacity 
                  style={styles.copyPillBtn}
                  onPress={() => copyRoomCodeToClipboard(activeRoomCode)}
                  activeOpacity={0.75}
                >
                  <HugeiconsIcon icon={Copy01Icon} size={14} color={Colors.primary} />
                  <View style={styles.iconTextSpacer} />
                  <Text style={styles.copyPillText}>Copy Code</Text>
                </TouchableOpacity>
              </View>

              {/* Share Link Row */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>JOIN LINK</Text>
              <View style={styles.linkRow}>
                <Text style={styles.linkText} numberOfLines={1}>
                  https://vailchat.com/join?code={activeRoomCode}
                </Text>
                <TouchableOpacity 
                  style={styles.copyPillBtn}
                  onPress={() => copyRoomLinkToClipboard(activeRoomCode)}
                  activeOpacity={0.75}
                >
                  <HugeiconsIcon icon={Copy01Icon} size={14} color={Colors.primary} />
                  <View style={styles.iconTextSpacer} />
                  <Text style={styles.copyPillText}>Copy Link</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Share Button */}
              <TouchableOpacity 
                style={styles.shareActionBtn}
                onPress={() => shareRoomLink(activeRoomCode)}
                activeOpacity={0.85}
              >
                <HugeiconsIcon icon={SentIcon} size={16} color={Colors.textWhite} />
                <View style={styles.iconTextSpacer} />
                <Text style={styles.shareActionText}>Share Invite Anywhere</Text>
              </TouchableOpacity>
            </View>

            {/* 2. CREATOR CONTROLS: RENAME & PAUSE LINK */}
            {isCreator ? (
              <>
                {/* Rename Room */}
                <View style={styles.modalCard}>
                  <View style={styles.modalCardHeader}>
                    <HugeiconsIcon icon={PencilEdit02Icon} size={18} color={Colors.primary} />
                    <Text style={styles.modalCardTitle}>Rename Room</Text>
                  </View>
                  <Text style={styles.modalCardDesc}>
                    Give this room a friendly name visible to all participants.
                  </Text>
                  <View style={styles.renameFormRow}>
                    <TextInput
                      style={styles.renameInput}
                      placeholder="Enter new room name..."
                      placeholderTextColor={Colors.textMuted}
                      value={roomNameInputText}
                      onChangeText={setRoomNameInputText}
                      maxLength={32}
                      returnKeyType="done"
                      onSubmitEditing={handleSaveName}
                    />
                    <TouchableOpacity 
                      style={styles.renameSaveBtn}
                      onPress={handleSaveName}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.renameSaveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Pause Room Link (Creator Only) */}
                <View style={styles.modalCard}>
                  <View style={styles.modalCardHeader}>
                    <HugeiconsIcon icon={HandIcon} size={18} color={Colors.primary} />
                    <Text style={styles.modalCardTitle}>Pause Room Link</Text>
                  </View>
                  <Text style={styles.modalCardDesc}>
                    Temporarily stop new people from joining this room.
                  </Text>
                  <View style={styles.pauseToggleRow}>
                    <View style={[styles.pauseStatusBadge, localPaused ? styles.badgePaused : styles.badgeActive]}>
                      <Text style={[styles.pauseStatusText, localPaused ? styles.textPaused : styles.textActive]}>
                        {localPaused ? 'PAUSED' : 'ACTIVE'}
                      </Text>
                    </View>
                    <Switch
                      value={localPaused}
                      onValueChange={handleTogglePause}
                      trackColor={{ false: '#2D3A50', true: Colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              </>
            ) : null}

            {/* 3. SELF-DESTRUCT TIMER */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <HugeiconsIcon icon={Clock01Icon} size={18} color={Colors.danger} />
                <Text style={styles.modalCardTitle}>Self-Destruct Timer</Text>
              </View>
              <Text style={styles.modalCardDesc}>
                This ephemeral room and its contents will wipe automatically in:
              </Text>
              <View style={styles.timerBadge}>
                <Text style={styles.timerBadgeText}>{timeRemaining}</Text>
              </View>
            </View>

            {/* 4. ACTIVE PARTICIPANTS (WITH KICK ACTION FOR CREATOR) */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <HugeiconsIcon icon={UserGroupIcon} size={18} color={Colors.primary} />
                <Text style={styles.modalCardTitle}>Active Participants ({totalHumanParticipants})</Text>
              </View>
              <View style={styles.participantsList}>
                {/* You */}
                <View style={styles.participantItem}>
                  <View style={styles.participantLeft}>
                    <View style={styles.participantDotMe} />
                    <Text style={styles.participantName}>
                      {userNickname} <Text style={{ color: Colors.primary }}>({isCreator ? 'Creator / You' : 'You'})</Text>
                    </Text>
                  </View>
                </View>

                {/* Other Room Members */}
                {otherParticipants.map((msg) => (
                  <View key={msg.id} style={styles.participantItem}>
                    <View style={styles.participantLeft}>
                      <View style={styles.participantDotOther} />
                      <Text style={styles.participantName}>{msg.sender_name}</Text>
                    </View>

                    {/* Creator Kick Button */}
                    {isCreator && (
                      <TouchableOpacity
                        style={styles.kickBtn}
                        onPress={() => handleKick(msg.sender_id, msg.sender_name)}
                        activeOpacity={0.75}
                      >
                        <HugeiconsIcon icon={UserRemove01Icon} size={13} color={Colors.danger} />
                        <Text style={styles.kickBtnText}>Kick</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* ACTION BUTTON: DESTROY (CREATOR) vs LEAVE (GUEST) */}
            {isCreator ? (
              <TouchableOpacity 
                style={styles.modalDeleteBtn} 
                onPress={handleConfirmDestroy}
                activeOpacity={0.8}
              >
                <HugeiconsIcon icon={Delete02Icon} size={18} color={Colors.danger} />
                <View style={styles.btnIconSpacer} />
                <Text style={styles.modalDeleteBtnText}>Destroy & Delete Room</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.modalDeleteBtn} 
                onPress={handleConfirmLeave}
                activeOpacity={0.8}
              >
                <HugeiconsIcon icon={Logout01Icon} size={18} color={Colors.danger} />
                <View style={styles.btnIconSpacer} />
                <Text style={styles.modalDeleteBtnText}>Leave Room</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '86%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
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
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCloseText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalHero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  modalRoomName: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  e2eBadge: {
    backgroundColor: 'rgba(255, 59, 105, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 105, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  e2eBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modalCardTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  modalCardDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceInput,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.borderInput,
  },
  codeText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: 'normal',
    letterSpacing: 0.5,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceInput,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.borderInput,
  },
  linkText: {
    color: Colors.textSecondary,
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  copyPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 105, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  copyPillText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'normal',
  },
  shareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  shareActionText: {
    color: Colors.textWhite,
    fontWeight: 'normal',
    fontSize: 14,
  },
  iconTextSpacer: {
    width: 6,
  },
  btnIconSpacer: {
    width: 10,
  },
  renameFormRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  renameInput: {
    flex: 1,
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  renameSaveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  renameSaveText: {
    color: Colors.textWhite,
    fontWeight: 'normal',
    fontSize: 13,
  },
  pauseToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  pauseStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeActive: {
    backgroundColor: 'rgba(50, 205, 50, 0.15)',
  },
  badgePaused: {
    backgroundColor: 'rgba(255, 59, 105, 0.15)',
  },
  pauseStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textActive: {
    color: '#32CD32',
  },
  textPaused: {
    color: Colors.primary,
  },
  timerBadge: {
    backgroundColor: Colors.dangerMuted,
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadgeText: {
    color: Colors.danger,
    fontSize: 18,
    fontWeight: 'normal',
    letterSpacing: 0.5,
  },
  participantsList: {
    gap: 10,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  participantDotMe: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  participantDotOther: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  participantName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  kickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 51, 102, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.2)',
  },
  kickBtnText: {
    color: Colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dangerMuted,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 51, 102, 0.25)',
    paddingVertical: 15,
    borderRadius: 18,
    marginTop: 8,
  },
  modalDeleteBtnText: {
    color: Colors.danger,
    fontWeight: 'normal',
    fontSize: 15,
  },
});
