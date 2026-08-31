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
  Image,
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
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    subtitle: string;
    confirmText: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const handleSaveName = async () => {
    if (!isCreator) return;
    const newName = roomNameInputText.trim();
    if (!newName) {
      setConfirmDialog({
        title: 'Invalid Name',
        subtitle: 'Please enter a valid room name before saving.',
        confirmText: 'OK',
        onConfirm: () => {},
      });
      return;
    }
    await onRenameRoom(newName);
    setIsEditingName(false);
  };

  const handleTogglePause = async () => {
    if (!isCreator) return;
    const next = !localPaused;
    setLocalPaused(next);
    setIsPaused?.(next);
    await setRoomPausedInDB(activeRoomCode, next);
  };

  const handleConfirmLeave = () => {
    setConfirmDialog({
      title: 'Leave Room?',
      subtitle: 'You will leave this room and it will be removed from your inbox. You can rejoin anytime with the code or link.',
      confirmText: 'Leave Room',
      isDestructive: true,
      onConfirm: () => {
        onClose();
        onLeaveRoom();
      },
    });
  };

  const handleConfirmDestroy = () => {
    setConfirmDialog({
      title: 'Destroy & Delete Room?',
      subtitle: 'As the creator, this will permanently delete the entire room and all its messages for everyone.',
      confirmText: 'Destroy Room',
      isDestructive: true,
      onConfirm: () => {
        onClose();
        if (onDestroyRoom) {
          onDestroyRoom();
        } else {
          onLeaveRoom();
        }
      },
    });
  };

  const handleKick = (participantId: string, participantName: string) => {
    if (!isCreator || !onKickParticipant) return;
    setConfirmDialog({
      title: `Kick ${participantName}?`,
      subtitle: `This will immediately remove ${participantName} from this secret room.`,
      confirmText: 'Kick User',
      isDestructive: true,
      onConfirm: () => onKickParticipant(participantId, participantName),
    });
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
                <Text style={styles.modalAvatarIcon}>💌</Text>
              </View>

              {isCreator ? (
                isEditingName ? (
                  <View style={styles.heroInlineRenameRow}>
                    <TextInput
                      style={styles.heroInlineRenameInput}
                      placeholder="Room name..."
                      placeholderTextColor={Colors.textMuted}
                      value={roomNameInputText}
                      onChangeText={setRoomNameInputText}
                      maxLength={32}
                      autoFocus={true}
                      returnKeyType="done"
                      onSubmitEditing={handleSaveName}
                    />
                    <TouchableOpacity 
                      style={styles.heroInlineSaveBtn}
                      onPress={handleSaveName}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.heroInlineSaveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.heroNameTouchable} 
                    onPress={() => {
                      setRoomNameInputText(activeRoomName);
                      setIsEditingName(true);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.modalRoomName}>{activeRoomName}</Text>
                    <View style={styles.pencilIconWrapper}>
                      <HugeiconsIcon icon={PencilEdit02Icon} size={15} color={Colors.textPrimary} />
                    </View>
                  </TouchableOpacity>
                )
              ) : (
                <Text style={styles.modalRoomName}>{activeRoomName}</Text>
              )}
            </View>

            {/* 1. ROOM CODE & JOIN LINK CARD */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <HugeiconsIcon icon={Share01Icon} size={18} color={Colors.textPrimary} />
                <Text style={styles.modalCardTitle}>Room Code & Link</Text>
              </View>

              {/* Room Code Row */}
              <Text style={styles.fieldLabel}>ROOM CODE</Text>
              <View style={styles.codeRow}>
                <Text style={styles.codeText}>{activeRoomCode}</Text>
                <TouchableOpacity 
                  style={styles.copySquareBtn}
                  onPress={() => copyRoomCodeToClipboard(activeRoomCode)}
                  activeOpacity={0.75}
                >
                  <HugeiconsIcon icon={Copy01Icon} size={18} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Share Link Row */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>JOIN LINK</Text>
              <View style={styles.linkRow}>
                <Text style={styles.linkText} numberOfLines={1}>
                  https://vailchat.com/join?code={activeRoomCode}
                </Text>
                <TouchableOpacity 
                  style={styles.copySquareBtn}
                  onPress={() => copyRoomLinkToClipboard(activeRoomCode)}
                  activeOpacity={0.75}
                >
                  <HugeiconsIcon icon={Copy01Icon} size={18} color={Colors.textPrimary} />
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

            {/* 2. PAUSE LINK (CREATOR ONLY) */}
            {isCreator ? (
              <View style={[styles.modalCard, styles.compactPauseCard]}>
                <View style={styles.pauseCardHeaderRow}>
                  <View style={styles.modalCardHeaderNoMargin}>
                    <HugeiconsIcon icon={HandIcon} size={18} color={Colors.textPrimary} />
                    <Text style={styles.modalCardTitle}>Pause Room Link</Text>
                  </View>
                  <Switch
                    value={localPaused}
                    onValueChange={handleTogglePause}
                    trackColor={{ false: '#2D3A50', true: Colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            ) : null}

            {/* 3. SELF-DESTRUCT TIMER */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <HugeiconsIcon icon={Clock01Icon} size={18} color={Colors.textPrimary} />
                <Text style={styles.modalCardTitle}>Self-Destruct Timer</Text>
              </View>
              <Text style={styles.modalCardDesc}>
                This ephemeral room and its contents will wipe automatically in:
              </Text>
              <View style={styles.timerBadge}>
                <Text style={styles.timerHourglass}>⏳</Text>
                <Text style={styles.timerBadgeText}>{timeRemaining}</Text>
              </View>
            </View>

            {/* 4. ACTIVE PARTICIPANTS (WITH KICK ACTION FOR CREATOR) */}
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <HugeiconsIcon icon={UserGroupIcon} size={18} color={Colors.textPrimary} />
                <Text style={styles.modalCardTitle}>Active Participants ({totalHumanParticipants})</Text>
              </View>
              <View style={styles.participantsList}>
                {/* You */}
                <View style={styles.participantItem}>
                  <View style={styles.participantLeft}>
                    <View style={styles.participantDotMe} />
                    <Text style={styles.participantName}>
                      {userNickname} <Text style={styles.participantRole}>({isCreator ? 'Creator / You' : 'You'})</Text>
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
                <HugeiconsIcon icon={Delete02Icon} size={18} color={Colors.textWhite} />
                <View style={styles.btnIconSpacer} />
                <Text style={styles.modalDeleteBtnText}>Destroy & Delete Room</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.modalDeleteBtn} 
                onPress={handleConfirmLeave}
                activeOpacity={0.8}
              >
                <HugeiconsIcon icon={Logout01Icon} size={18} color={Colors.textWhite} />
                <View style={styles.btnIconSpacer} />
                <Text style={styles.modalDeleteBtnText}>Leave Room</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Custom Theme Confirmation Dialog */}
          {confirmDialog && (
            <View style={styles.confirmModalOverlay}>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>{confirmDialog.title}</Text>
                <Text style={styles.confirmSubtitle}>{confirmDialog.subtitle}</Text>
                <View style={styles.confirmBtnRow}>
                  <TouchableOpacity
                    style={styles.confirmCancelBtn}
                    onPress={() => setConfirmDialog(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.confirmCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmActionBtn,
                      confirmDialog.isDestructive && styles.confirmDestructiveBtn,
                    ]}
                    onPress={() => {
                      const fn = confirmDialog.onConfirm;
                      setConfirmDialog(null);
                      fn();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.confirmActionText}>{confirmDialog.confirmText}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
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
    width: 76,
    height: 76,
    borderRadius: 38,
    marginBottom: 12,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarIcon: {
    fontSize: 34,
  },
  modalRoomName: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  heroNameTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    maxWidth: '92%',
  },
  pencilIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  heroInlineRenameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingHorizontal: 12,
    marginTop: 6,
  },
  heroInlineRenameInput: {
    flex: 1,
    backgroundColor: Colors.surfaceInput,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroInlineSaveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInlineSaveText: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: '500',
  },
  modalCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  compactPauseCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modalCardHeaderNoMargin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  },
  linkText: {
    color: Colors.textSecondary,
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  copySquareBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
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
  pauseCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1.5,
    borderColor: '#E5A910',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  timerHourglass: {
    fontSize: 18,
    marginRight: 8,
  },
  timerBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
    backgroundColor: '#22C55E',
  },
  participantDotOther: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  participantName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  participantRole: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '400',
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
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  modalDeleteBtnText: {
    color: Colors.textWhite,
    fontWeight: '700',
    fontSize: 15,
  },
  confirmModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999,
  },
  confirmCard: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  confirmTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmSubtitle: {
    color: '#8B949E',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: '#21262D',
    borderWidth: 1,
    borderColor: '#30363D',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    color: '#C9D1D9',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmActionBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDestructiveBtn: {
    backgroundColor: Colors.primary,
  },
  confirmActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
