import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Alert,
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
import { ActiveRoomDetail } from '../../types';
import { getPausedRoomCodes, savePausedRoomCodes, getLocalRecentRooms } from '../../services/storage';
import { setRoomPausedInDB } from '../../api/rooms';
import { useAppStore } from '../../store/useAppStore';
import {
  requestNotificationPermission,
  scheduleShareReminderNotification,
  triggerTeamVileNotification,
} from '../../services/notifications';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onDeleteAccount: () => void;
  activeRooms?: ActiveRoomDetail[];
  currentWhisperCode?: string;
}

export const NOTIF_STORAGE_KEYS = {
  REMINDERS: 'vailchat_notif_reminders',
  NEW_MESSAGES: 'vailchat_notif_new_messages',
  TEAM_VAILCHAT: 'vailchat_notif_team_vailchat',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onDeleteAccount,
  activeRooms = [],
  currentWhisperCode = '',
}) => {
  const insets = useSafeAreaInsets();
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(true);
  const [newMessagesEnabled, setNewMessagesEnabled] = useState<boolean>(true);
  const [teamVailchatEnabled, setTeamVailchatEnabled] = useState<boolean>(true);

  const storeWhisperCode = useAppStore((s) => s.whisperRoomCode);
  const effectiveWhisperCode = currentWhisperCode || storeWhisperCode;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showPauseLinkModal, setShowPauseLinkModal] = useState<boolean>(false);
  const [pausedCodes, setPausedCodes] = useState<string[]>([]);
  const [localRooms, setLocalRooms] = useState<{ code: string; name?: string }[]>([]);

  // Load paused codes, local rooms, and notification settings on mount
  useEffect(() => {
    if (visible || showPauseLinkModal) {
      getPausedRoomCodes().then((codes) => setPausedCodes(codes));
      getLocalRecentRooms().then((rooms) => {
        setLocalRooms(rooms.map((r) => ({ code: r.code, name: r.name })));
      });

      AsyncStorage.multiGet([
        NOTIF_STORAGE_KEYS.REMINDERS,
        NOTIF_STORAGE_KEYS.NEW_MESSAGES,
        NOTIF_STORAGE_KEYS.TEAM_VAILCHAT,
      ]).then((results) => {
        results.forEach(([key, val]) => {
          if (val !== null) {
            const isEnabled = val === 'true';
            if (key === NOTIF_STORAGE_KEYS.REMINDERS) setRemindersEnabled(isEnabled);
            if (key === NOTIF_STORAGE_KEYS.NEW_MESSAGES) setNewMessagesEnabled(isEnabled);
            if (key === NOTIF_STORAGE_KEYS.TEAM_VAILCHAT) setTeamVailchatEnabled(isEnabled);
          }
        });
      }).catch(() => {});
    }
  }, [visible, showPauseLinkModal]);

  const handleToggleReminders = async (value: boolean) => {
    setRemindersEnabled(value);
    await AsyncStorage.setItem(NOTIF_STORAGE_KEYS.REMINDERS, String(value)).catch(() => {});
    if (value) {
      await requestNotificationPermission();
      await scheduleShareReminderNotification();
    }
  };

  const handleToggleNewMessages = async (value: boolean) => {
    setNewMessagesEnabled(value);
    await AsyncStorage.setItem(NOTIF_STORAGE_KEYS.NEW_MESSAGES, String(value)).catch(() => {});
    if (value) {
      await requestNotificationPermission();
    }
  };

  const handleToggleTeamVailchat = async (value: boolean) => {
    setTeamVailchatEnabled(value);
    await AsyncStorage.setItem(NOTIF_STORAGE_KEYS.TEAM_VAILCHAT, String(value)).catch(() => {});
    if (value) {
      await requestNotificationPermission();
      await triggerTeamVileNotification();
    }
  };

  const togglePauseRoom = async (code: string) => {
    let next: string[];
    const isCurrentlyPaused = pausedCodes.includes(code);
    const nextIsPaused = !isCurrentlyPaused;

    if (isCurrentlyPaused) {
      next = pausedCodes.filter((c) => c !== code);
    } else {
      next = [...pausedCodes, code];
    }
    setPausedCodes(next);
    await savePausedRoomCodes(next);
    await setRoomPausedInDB(code, nextIsPaused);
  };

  const showHelp = () => {
    Alert.alert(
      'Need Help?',
      'Vailchat is a 100% anonymous & ephemeral messaging studio. Have questions or feedback? Reach us anytime at support@vailchat.com.'
    );
  };

  const showSafety = () => {
    Alert.alert(
      'Safety Resources',
      'We take user safety seriously. Cyberbullying and harassment are not tolerated. All room communications self-destruct within 24 hours.'
    );
  };

  const showTerms = () => {
    Alert.alert(
      'Terms of Use',
      'By using Vailchat, you agree to treat everyone with respect and follow local laws. Ephemeral rooms are destroyed upon expiration.'
    );
  };

  const showPrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'All chats are on-device AES-256 CTR encrypted. We do not store personal profiles, phone numbers, or metadata.'
    );
  };

  const showLicenses = () => {
    Alert.alert(
      'Open Source Licenses',
      'Vailchat is built using React Native, Expo, Supabase, and open-source cryptography libraries.'
    );
  };

  const handleExecuteDelete = () => {
    setShowDeleteConfirm(false);
    onDeleteAccount();
  };

  // Construct comprehensive list of all manageable links
  const roomMap = new Map<string, string>();
  if (effectiveWhisperCode) {
    roomMap.set(effectiveWhisperCode, 'Active Whisper Link');
  }
  for (const r of activeRooms) {
    if (r?.code) {
      roomMap.set(r.code, r.name || `Room: ${r.code}`);
    }
  }
  for (const r of localRooms) {
    if (r?.code && !roomMap.has(r.code)) {
      roomMap.set(r.code, r.name || `Room: ${r.code}`);
    }
  }

  const manageableList = Array.from(roomMap.entries()).map(([code, name]) => ({
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

            <View style={styles.separator} />

            {/* Delete account */}
            <TouchableOpacity 
              style={styles.rowItem} 
              onPress={() => setShowDeleteConfirm(true)} 
              activeOpacity={0.75}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, styles.deleteIconCircle]}>
                  <HugeiconsIcon icon={Delete02Icon} size={18} color={Colors.danger} />
                </View>
                <Text style={[styles.rowLabel, { color: Colors.danger }]}>Delete account</Text>
              </View>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal: Notifications Detail View */}
        <Modal
          visible={showNotificationsModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowNotificationsModal(false)}
        >
          <View style={styles.notifContainer}>
            {/* Notifications Header */}
            <View style={styles.notifHeader}>
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
                  onPress={handleExecuteDelete}
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    flex: 1,
    marginRight: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  deleteIconCircle: {
    backgroundColor: 'rgba(255, 59, 105, 0.15)',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pausedCountSubtitle: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginLeft: 66,
  },
  pauseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  pauseContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    height: '75%',
    maxHeight: '85%',
  },
  pauseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pauseTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  pauseDoneBtn: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  pauseDoneText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  pauseDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
  pauseList: {
    flex: 1,
  },
  pauseListContent: {
    paddingBottom: 30,
  },
  pauseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  pauseCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  pauseCardTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  pauseCardCode: {
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  pauseStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeActive: {
    backgroundColor: 'rgba(50, 205, 50, 0.15)',
  },
  badgePaused: {
    backgroundColor: 'rgba(255, 59, 105, 0.15)',
  },
  pauseStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  textActive: {
    color: '#32CD32',
  },
  textPaused: {
    color: Colors.primary,
  },
  confirmModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
