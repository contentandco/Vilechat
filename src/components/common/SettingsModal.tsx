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
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Notification01Icon,
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
import { getPausedRoomCodes, savePausedRoomCodes } from '../../services/storage';
import { setRoomPausedInDB } from '../../api/rooms';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onDeleteAccount: () => void;
  activeRooms?: ActiveRoomDetail[];
  currentWhisperCode?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onDeleteAccount,
  activeRooms = [],
  currentWhisperCode = '',
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showPauseLinkModal, setShowPauseLinkModal] = useState<boolean>(false);
  const [pausedCodes, setPausedCodes] = useState<string[]>([]);

  // Load paused codes on mount
  useEffect(() => {
    if (visible) {
      getPausedRoomCodes().then((codes) => setPausedCodes(codes));
    }
  }, [visible]);

  const handleToggleNotifications = () => {
    setNotificationsEnabled((prev) => !prev);
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

  const allManageableCodes = Array.from(
    new Set([currentWhisperCode, ...activeRooms.map((r) => r.code)].filter(Boolean))
  );

  const isCurrentWhisperPaused = pausedCodes.includes(currentWhisperCode);

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
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
              onPress={handleToggleNotifications}
              activeOpacity={0.75}
            >
              <View style={styles.rowLeft}>
                <View style={styles.iconCircle}>
                  <HugeiconsIcon icon={Notification01Icon} size={18} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#2D3A50', true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
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

              <ScrollView style={styles.pauseList} showsVerticalScrollIndicator={false}>
                {allManageableCodes.map((code) => {
                  const isPaused = pausedCodes.includes(code);
                  const roomDetail = activeRooms.find((r) => r.code === code);
                  const displayName = roomDetail?.name || (code === currentWhisperCode ? 'Active Whisper Link' : `Room: ${code}`);

                  return (
                    <View key={code} style={styles.pauseCard}>
                      <View style={styles.pauseCardInfo}>
                        <Text style={styles.pauseCardTitle} numberOfLines={1}>
                          {displayName}
                        </Text>
                        <Text style={styles.pauseCardCode}>https://vailchat.com/join?code={code}</Text>
                        <View style={[styles.pauseStatusBadge, isPaused ? styles.badgePaused : styles.badgeActive]}>
                          <Text style={[styles.pauseStatusText, isPaused ? styles.textPaused : styles.textActive]}>
                            {isPaused ? 'PAUSED' : 'ACTIVE'}
                          </Text>
                        </View>
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
                If you delete your account, you will lose access to your username and all messages
              </Text>
              <View style={styles.confirmBtnRow}>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={() => setShowDeleteConfirm(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmDeleteBtn}
                  onPress={handleExecuteDelete}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmDeleteText}>Delete</Text>
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
    paddingTop: Platform.OS === 'ios' ? 54 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardGroup: {
    backgroundColor: '#182740',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#243656',
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
    gap: 14,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#243656',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconCircle: {
    backgroundColor: 'rgba(255, 51, 102, 0.15)',
  },
  rowLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  pausedCountSubtitle: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 66,
  },
  pauseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  pauseContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '75%',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  pauseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    borderWidth: 1,
    borderColor: Colors.border,
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
  pauseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
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
});
