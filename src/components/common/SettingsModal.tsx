import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  LockKeyIcon,
  UserIcon,
  Delete02Icon,
  PencilEdit02Icon,
  Shield01Icon,
  Camera01Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '../../constants/theme';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  userNickname: string;
  userAvatar: string;
  deviceId: string;
  onUpdateNickname: (name: string) => void;
  onUpdateAvatar: (avatarUri: string) => void;
  onDeleteAccount: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  userNickname,
  userAvatar,
  deviceId,
  onUpdateNickname,
  onUpdateAvatar,
  onDeleteAccount,
}) => {
  const [isEditingUsername, setIsEditingUsername] = useState<boolean>(false);
  const [usernameText, setUsernameText] = useState<string>(userNickname);

  const handleSaveUsername = () => {
    const trimmed = usernameText.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a valid username.');
      return;
    }
    const formatted = trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
    onUpdateNickname(formatted);
    setIsEditingUsername(false);
    Alert.alert('Success', 'Username updated!');
  };

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'We need access to your gallery to update your profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onUpdateAvatar(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick photo.');
    }
  };

  const handleConfirmDelete = () => {
    Alert.alert(
      'Delete Account?',
      'Are you sure you want to delete your account? This will permanently wipe your profile photo, username, local chats, and active rooms from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            onClose();
            onDeleteAccount();
          },
        },
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
            <Text style={styles.modalTitle}>Settings</Text>
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
            {/* Profile Section */}
            <View style={styles.sectionCard}>
              <View style={styles.avatarRow}>
                <TouchableOpacity 
                  style={styles.avatarWrapper} 
                  onPress={handlePickPhoto}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarCircle}>
                    {userAvatar ? (
                      <Image source={{ uri: userAvatar }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.defaultAvatarPlaceholder}>
                        <HugeiconsIcon icon={UserIcon} size={42} color="#60718A" />
                      </View>
                    )}
                  </View>
                  <View style={styles.cameraIconBadge}>
                    <HugeiconsIcon icon={Camera01Icon} size={14} color="#000000" />
                  </View>
                </TouchableOpacity>

                <View style={styles.profileInfo}>
                  {isEditingUsername ? (
                    <View style={styles.editUsernameRow}>
                      <TextInput
                        style={styles.usernameInput}
                        value={usernameText}
                        onChangeText={setUsernameText}
                        placeholder="@username"
                        placeholderTextColor={Colors.textMuted}
                        autoFocus={true}
                        autoCapitalize="none"
                        maxLength={24}
                      />
                      <TouchableOpacity 
                        style={styles.saveUsernameBtn} 
                        onPress={handleSaveUsername}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.saveUsernameText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      <View style={styles.usernameDisplayRow}>
                        <Text style={styles.usernameText}>{userNickname || 'Anonymous'}</Text>
                        <TouchableOpacity 
                          style={styles.editPencilBtn}
                          onPress={() => {
                            setUsernameText(userNickname);
                            setIsEditingUsername(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <HugeiconsIcon icon={PencilEdit02Icon} size={14} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.userStatusSub}>Anonymous Identity</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Privacy & Encryption */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <HugeiconsIcon icon={Shield01Icon} size={18} color={Colors.primary} />
                <Text style={styles.cardSectionTitle}>Privacy & Security</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>End-to-End Encryption</Text>
                <Text style={styles.infoValue}>AES-256 CTR</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Message Auto-Wipe</Text>
                <Text style={styles.infoValue}>24 Hours</Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Anonymous Device Key</Text>
                <Text style={styles.infoValueMonospace} numberOfLines={1}>
                  {deviceId ? `${deviceId.slice(0, 14)}...` : 'Generated'}
                </Text>
              </View>
            </View>

            {/* Danger Zone: Delete Account */}
            <View style={styles.dangerCard}>
              <View style={styles.cardHeaderRow}>
                <HugeiconsIcon icon={Delete02Icon} size={18} color={Colors.danger} />
                <Text style={[styles.cardSectionTitle, { color: Colors.danger }]}>Danger Zone</Text>
              </View>
              <Text style={styles.dangerDesc}>
                Permanently delete your account, wipe all active room history, and reset your local device keys.
              </Text>
              <TouchableOpacity
                style={styles.deleteAccBtn}
                onPress={handleConfirmDelete}
                activeOpacity={0.85}
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} color={Colors.danger} />
                <View style={{ width: 8 }} />
                <Text style={styles.deleteAccBtnText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
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
    height: '78%',
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
  sectionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E2738',
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  defaultAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    flex: 1,
  },
  usernameDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usernameText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  editPencilBtn: {
    padding: 4,
  },
  userStatusSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  editUsernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usernameInput: {
    flex: 1,
    backgroundColor: Colors.surfaceInput,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.borderInput,
  },
  saveUsernameBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  saveUsernameText: {
    color: Colors.textWhite,
    fontWeight: '700',
    fontSize: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardSectionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  infoValueMonospace: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  dangerCard: {
    backgroundColor: 'rgba(255, 51, 102, 0.05)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 51, 102, 0.25)',
    padding: 16,
    marginBottom: 16,
  },
  dangerDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  deleteAccBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dangerMuted,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 51, 102, 0.3)',
    paddingVertical: 14,
    borderRadius: 16,
  },
  deleteAccBtnText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});
