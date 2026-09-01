import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Notification01Icon,
  Mail01Icon,
  Add01Icon,
  FavouriteIcon,
  HandIcon,
  HelpCircleIcon,
  Shield01Icon,
  File01Icon,
  LockKeyIcon,
  CodeCircleIcon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '../../constants/theme';
import { getPausedRoomCodes, savePausedRoomCodes, getLocalRecentRooms } from '../../services/storage';
import { setRoomPausedInDB } from '../../api/rooms';
import { useAppStore } from '../../store/useAppStore';
import { useInboxRooms } from '../../hooks/queries/useInboxQuery';
import { useRoomActions } from '../../hooks/useRoomActions';
import {
  requestNotificationPermission,
  scheduleShareReminderNotification,
  triggerTeamVileNotification,
} from '../../services/notifications';

export const NOTIF_STORAGE_KEYS = {
  REMINDERS: 'vailchat_notif_reminders',
  NEW_MESSAGES: 'vailchat_notif_new_messages',
  TEAM_VAILCHAT: 'vailchat_notif_team_vailchat',
};

export const SettingsModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const visible = useAppStore((s) => s.showSettingsModal);
  const setShowSettingsModal = useAppStore((s) => s.setShowSettingsModal);
  const whisperRoomCode = useAppStore((s) => s.whisperRoomCode);
  const deviceId = useAppStore((s) => s.deviceId);

  const { data: activeRooms = [] } = useInboxRooms(deviceId);
  const { handleDeleteAccount } = useRoomActions();

  const onClose = () => setShowSettingsModal(false);

  // Sub-modal states
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [showPauseLinkModal, setShowPauseLinkModal] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Notification toggles
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(true);
  const [newMessagesEnabled, setNewMessagesEnabled] = useState<boolean>(true);
  const [teamVailchatEnabled, setTeamVailchatEnabled] = useState<boolean>(true);

  // Paused rooms state
  const [pausedCodes, setPausedCodes] = useState<string[]>([]);
  const [allRecentRooms, setAllRecentRooms] = useState<{ code: string; name?: string }[]>([]);

  // Simple static modal views for "More" section
  const [simpleModalTitle, setSimpleModalTitle] = useState<string>('');
  const [simpleModalContent, setSimpleModalContent] = useState<string>('');
  const [showSimpleModal, setShowSimpleModal] = useState<boolean>(false);

  // Load initial notification preferences & paused rooms
  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem(NOTIF_STORAGE_KEYS.REMINDERS).then((val) => {
        if (val !== null) setRemindersEnabled(val === 'true');
      });
      AsyncStorage.getItem(NOTIF_STORAGE_KEYS.NEW_MESSAGES).then((val) => {
        if (val !== null) setNewMessagesEnabled(val === 'true');
      });
      AsyncStorage.getItem(NOTIF_STORAGE_KEYS.TEAM_VAILCHAT).then((val) => {
        if (val !== null) setTeamVailchatEnabled(val === 'true');
      });

      getPausedRoomCodes().then((codes) => setPausedCodes(codes));
      getLocalRecentRooms().then((rooms) => setAllRecentRooms(rooms));
    }
  }, [visible]);

  // Handlers for notification toggles
  const handleToggleReminders = async (value: boolean) => {
    setRemindersEnabled(value);
    await AsyncStorage.setItem(NOTIF_STORAGE_KEYS.REMINDERS, value.toString());
    if (value) {
      const granted = await requestNotificationPermission();
      if (granted) {
        scheduleShareReminderNotification();
      }
    }
  };

  const handleToggleNewMessages = async (value: boolean) => {
    setNewMessagesEnabled(value);
    await AsyncStorage.setItem(NOTIF_STORAGE_KEYS.NEW_MESSAGES, value.toString());
    if (value) {
      await requestNotificationPermission();
    }
  };

  const handleToggleTeamVailchat = async (value: boolean) => {
    setTeamVailchatEnabled(value);
    await AsyncStorage.setItem(NOTIF_STORAGE_KEYS.TEAM_VAILCHAT, value.toString());
    if (value) {
      const granted = await requestNotificationPermission();
      if (granted) {
        triggerTeamVileNotification();
      }
    }
  };

  // Toggle pause for a specific room link
  const togglePauseRoom = async (roomCode: string) => {
    const isCurrentlyPaused = pausedCodes.includes(roomCode);
    let updated: string[];

    if (isCurrentlyPaused) {
      updated = pausedCodes.filter((c) => c !== roomCode);
    } else {
      updated = [...pausedCodes, roomCode];
    }

    setPausedCodes(updated);
    await savePausedRoomCodes(updated);
    await setRoomPausedInDB(roomCode, !isCurrentlyPaused);
  };

  // Helper to open simple modal
  const openSimpleInfo = (title: string, content: string) => {
    setSimpleModalTitle(title);
    setSimpleModalContent(content);
    setShowSimpleModal(true);
  };

  const showHelp = () => {
    openSimpleInfo(
      'I Need Help',
      `Need assistance or experiencing an issue?

• How Vile Chat Works:
Your messages and rooms are 100% ephemeral and anonymous. Every room self-destructs 24 hours after creation.

• Joining Rooms:
Enter a 6-character room code or open any share link sent by a friend.

• Deleting Data:
You can permanently delete any room you created, or delete your entire account and local data anytime from Settings.`
    );
  };

  const showSafety = () => {
    openSimpleInfo(
      'Safety Resources',
      `Your safety and privacy are our top priorities.

• End-to-End Encryption:
All messages are encrypted directly on your device before transmission. No unencrypted content ever touches our servers.

• Zero Data Retention:
All messages, rooms, and media permanently expire and are purged after 24 hours.

• Reporting & Blocking:
If someone is abusive, you can immediately leave and remove the room from your inbox or delete the room permanently.`
    );
  };

  const showTerms = () => {
    openSimpleInfo(
      'Terms of Use',
      `Welcome to Vile Chat. By using this application, you agree to:

1. Use the service respectfully and lawfully.
2. Not use the service to harass, bully, or threaten others.
3. Understand that messages and rooms expire permanently after 24 hours.
4. Accept that this service is provided as-is for private, anonymous communication.`
    );
  };

  const showPrivacy = () => {
    openSimpleInfo(
      'Privacy Policy',
      `Our Privacy Promise:

• No Phone Numbers or Emails Required.
• No Tracking or Ad Profiles.
• Messages are encrypted on-device.
• All rooms self-destruct after 24 hours.
• Deleting your account wipes all device sessions and local cryptographic keys immediately.`
    );
  };

  const showLicenses = () => {
    openSimpleInfo(
      'Open Source Licenses',
      `Vile Chat is built with love using amazing open source software:

• React Native & Expo
• TanStack Query (React Query)
• Zustand
• Supabase Client
• Lucide Icons & Hugeicons
• AES-JS Cryptography Library

Thank you to the global open-source developer community!`
    );
  };

  const effectiveWhisperCode = whisperRoomCode || '';

  // Consolidate active room list
  const combinedRoomMap = new Map<string, string>();
  if (effectiveWhisperCode) {
    combinedRoomMap.set(effectiveWhisperCode, 'Active Whisper Link');
  }

  activeRooms.forEach((r) => {
    combinedRoomMap.set(r.code, r.name || r.code);
  });

  allRecentRooms.forEach((r) => {
    if (!combinedRoomMap.has(r.code)) {
      combinedRoomMap.set(r.code, r.name || r.code);
    }
  });

  const manageableList = Array.from(combinedRoomMap.entries()).map(([code, name]) => ({
    code,
    displayName: code === effectiveWhisperCode && (!name || name === code) ? 'Active Whisper Link' : name,
  }));

  const topPadding = Math.max(insets.top + 8, Platform.OS === 'ios' ? 54 : 48);
  const isCurrentWhisperPaused = pausedCodes.includes(effectiveWhisperCode);

  return (
    <Modal
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Top Header with Safe Area Inset */}
        <View style={[styles.header, { paddingTop: topPadding }]}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView 
          style={styles.scroll} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Preferences */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>

          <View style={styles.cardGroup}>
            <TouchableOpacity 
              style={styles.rowItem} 
              onPress={() => setShowNotificationsModal(true)}
              activeOpacity={0.75}
            >
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <HugeiconsIcon icon={Notification01Icon} size={18} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>Notifications</Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Section 2: Safety controls */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Safety controls</Text>
          </View>

          <View style={styles.cardGroup}>
            <TouchableOpacity 
              style={styles.rowItem} 
              onPress={() => setShowPauseLinkModal(true)}
              activeOpacity={0.75}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, isCurrentWhisperPaused && { backgroundColor: 'rgba(255, 59, 105, 0.2)' }]}>
                  <HugeiconsIcon 
                    icon={HandIcon} 
                    size={18} 
                    color={isCurrentWhisperPaused ? Colors.primary : Colors.textPrimary} 
                  />
                </View>
                <View>
                  <Text style={styles.rowLabel}>Pause my link</Text>
                  {pausedCodes.length > 0 && (
                    <Text style={styles.pausedCountSubtitle}>
                      {pausedCodes.length} {pausedCodes.length === 1 ? 'link' : 'links'} paused
                    </Text>
                  )}
                </View>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Section 3: More */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>More</Text>
          </View>

          <View style={styles.cardGroup}>
            {/* I need help */}
            <TouchableOpacity style={styles.rowItem} onPress={showHelp} activeOpacity={0.75}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <HugeiconsIcon icon={HelpCircleIcon} size={18} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>I need help</Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Safety resources */}
            <TouchableOpacity style={styles.rowItem} onPress={showSafety} activeOpacity={0.75}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <HugeiconsIcon icon={Shield01Icon} size={18} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>Safety resources</Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Terms of use */}
            <TouchableOpacity style={styles.rowItem} onPress={showTerms} activeOpacity={0.75}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <HugeiconsIcon icon={File01Icon} size={18} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>Terms of use</Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Privacy policy */}
            <TouchableOpacity style={styles.rowItem} onPress={showPrivacy} activeOpacity={0.75}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <HugeiconsIcon icon={LockKeyIcon} size={18} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>Privacy policy</Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Open source licenses */}
            <TouchableOpacity style={styles.rowItem} onPress={showLicenses} activeOpacity={0.75}>
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <HugeiconsIcon icon={CodeCircleIcon} size={18} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>Open source licenses</Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Section 4: Account Actions (Delete Account) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>

          <View style={styles.cardGroup}>
            <TouchableOpacity 
              style={styles.rowItem} 
              onPress={() => setShowDeleteConfirm(true)}
              activeOpacity={0.75}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, styles.deleteIconCircle]}>
                  <HugeiconsIcon icon={Delete02Icon} size={18} color="#FF3B69" />
                </View>
                <Text style={[styles.rowLabel, styles.deleteLabel]}>Delete account</Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomVersionContainer}>
            <Text style={styles.bottomVersionText}>Vile Chat v1.0.0 (Encrypted)</Text>
          </View>
        </ScrollView>

        {/* Modal: Simple Info */}
        <Modal
          visible={showSimpleModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowSimpleModal(false)}
        >
          <View style={styles.simpleModalContainer}>
            <View style={[styles.simpleModalHeader, { paddingTop: topPadding }]}>
              <TouchableOpacity 
                style={styles.backBtn} 
                onPress={() => setShowSimpleModal(false)} 
                activeOpacity={0.7}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.simpleModalTitle}>{simpleModalTitle}</Text>
              <View style={styles.headerRightPlaceholder} />
            </View>

            <ScrollView style={styles.simpleModalScroll} contentContainerStyle={styles.simpleModalScrollContent}>
              <Text style={styles.simpleModalBodyText}>{simpleModalContent}</Text>
            </ScrollView>
          </View>
        </Modal>

        {/* Modal: Notifications Manager */}
        <Modal
          visible={showNotificationsModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowNotificationsModal(false)}
        >
          <View style={styles.notifContainer}>
            {/* Notifications Header */}
            <View style={[styles.notifHeader, { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 44) : Math.max(insets.top, 28) + 8 }]}>
              <TouchableOpacity 
                style={styles.backBtn} 
                onPress={() => setShowNotificationsModal(false)} 
                activeOpacity={0.7}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.notifHeaderTitle}>Notifications</Text>
              <View style={styles.headerRightPlaceholder} />
            </View>

            <ScrollView 
              style={styles.notifScroll} 
              contentContainerStyle={styles.notifScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Notification Options Card */}
              <View style={styles.notifCard}>
                {/* 1. Reminders to share */}
                <View style={styles.notifRow}>
                  <View style={styles.notifLeft}>
                    <View style={styles.notifIconCircle}>
                      <HugeiconsIcon icon={Add01Icon} size={18} color={Colors.textPrimary} />
                    </View>
                    <View style={styles.notifTextContainer}>
                      <Text style={styles.notifTitle}>Reminders to share</Text>
                      <Text style={styles.notifSubtitle}>Share your link & talk privately with friends 🤫</Text>
                    </View>
                  </View>
                  <Switch
                    value={remindersEnabled}
                    onValueChange={handleToggleReminders}
                    trackColor={{ false: '#2D3A50', true: Colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.notifSeparator} />

                {/* 2. New messages */}
                <View style={styles.notifRow}>
                  <View style={styles.notifLeft}>
                    <View style={styles.notifIconCircle}>
                      <HugeiconsIcon icon={Mail01Icon} size={18} color={Colors.textPrimary} />
                    </View>
                    <View style={styles.notifTextContainer}>
                      <Text style={styles.notifTitle}>New messages</Text>
                      <Text style={styles.notifSubtitle}>Get notified when someone sends a message</Text>
                    </View>
                  </View>
                  <Switch
                    value={newMessagesEnabled}
                    onValueChange={handleToggleNewMessages}
                    trackColor={{ false: '#2D3A50', true: Colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.notifSeparator} />

                {/* 3. Team Vile Chat */}
                <View style={styles.notifRow}>
                  <View style={styles.notifLeft}>
                    <View style={styles.notifIconCircle}>
                      <HugeiconsIcon icon={FavouriteIcon} size={18} color={Colors.textPrimary} />
                    </View>
                    <View style={styles.notifTextContainer}>
                      <Text style={styles.notifTitle}>Team Vile Chat</Text>
                      <Text style={styles.notifSubtitle}>
                        Updates, tips, and secret drops from the Vile team ⚡
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={teamVailchatEnabled}
                    onValueChange={handleToggleTeamVailchat}
                    trackColor={{ false: '#2D3A50', true: Colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Modal: Pause My Link Manager */}
        <Modal
          visible={showPauseLinkModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPauseLinkModal(false)}
        >
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseContainer}>
              <View style={styles.pauseHeader}>
                <Text style={styles.pauseTitle}>Pause My Links</Text>
                <TouchableOpacity 
                  style={styles.pauseDoneBtn} 
                  onPress={() => setShowPauseLinkModal(false)} 
                  activeOpacity={0.7}
                >
                  <Text style={styles.pauseDoneText}>Done</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.pauseDesc}>
                Temporarily pause links to stop receiving new messages. Anyone opening a paused link will see that it is on hold.
              </Text>

              <ScrollView 
                style={styles.pauseList} 
                contentContainerStyle={styles.pauseListContent}
                showsVerticalScrollIndicator={false}
              >
                {manageableList.map(({ code, displayName }) => {
                  const isPaused = pausedCodes.includes(code);

                  return (
                    <View key={code} style={styles.pauseCard}>
                      <View style={styles.pauseCardInfo}>
                        <Text style={styles.pauseCardTitle} numberOfLines={1}>
                          {displayName}
                        </Text>
                        <Text style={styles.pauseCardCode}>https://vailchat.com/join?code={code}</Text>
                      </View>

                      <Switch
                        value={isPaused}
                        onValueChange={() => togglePauseRoom(code)}
                        trackColor={{ false: '#2D3A50', true: Colors.primary }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Custom Confirmation Dialog for Delete Account */}
        {showDeleteConfirm && (
          <View style={styles.confirmModalOverlay}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>Are you sure?</Text>
              <Text style={styles.confirmSubtitle}>
                Deleting your account will delete all your inbox data and active sessions. This action cannot be undone.
              </Text>
              <View style={styles.confirmBtnRow}>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={() => setShowDeleteConfirm(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmDeleteBtn}
                  onPress={async () => {
                    setShowDeleteConfirm(false);
                    await handleDeleteAccount();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmDeleteText}>Delete Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardGroup: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deleteIconCircle: {
    backgroundColor: 'rgba(255, 59, 105, 0.12)',
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  deleteLabel: {
    color: '#FF3B69',
  },
  pausedCountSubtitle: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 62,
  },
  bottomVersionContainer: {
    marginTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomVersionText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  // Pause modal styles
  pauseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  pauseContainer: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  pauseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pauseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  pauseDoneBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 14,
  },
  pauseDoneText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  pauseDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  pauseList: {
    flexGrow: 0,
  },
  pauseListContent: {
    gap: 10,
    paddingBottom: 20,
  },
  pauseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceMuted,
    padding: 14,
    borderRadius: 16,
  },
  pauseCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  pauseCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  pauseCardCode: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  // Simple modal styles
  simpleModalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  simpleModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  simpleModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  simpleModalScroll: {
    flex: 1,
  },
  simpleModalScrollContent: {
    padding: 24,
  },
  simpleModalBodyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  confirmModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 9999,
  },
  confirmCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmTitle: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmSubtitle: {
    color: '#333333',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: '#7A8699',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#FF3355',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Notifications View Styles
  notifContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 14,
    paddingBottom: 10,
  },
  notifHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  notifScroll: {
    flex: 1,
  },
  notifScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  notifCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  notifLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  notifIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  notifTextContainer: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  notifSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    fontWeight: '400',
  },
  notifSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginLeft: 52,
  },
});
