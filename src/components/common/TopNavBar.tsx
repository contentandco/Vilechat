import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Settings } from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { useInboxRooms } from '../../hooks/queries/useInboxQuery';
import { Colors } from '../../constants/theme';

export const TopNavBar: React.FC = () => {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setShowSettingsModal = useAppStore((s) => s.setShowSettingsModal);
  const deviceId = useAppStore((s) => s.deviceId);

  const { data: verifiedActiveRooms = [] } = useInboxRooms(deviceId);
  const hasUnread = verifiedActiveRooms.some((r) => r.hasUnread);

  return (
    <View style={styles.topNavBar}>
      <View style={styles.topNavTabs}>
        <TouchableOpacity 
          style={styles.topNavTab}
          onPress={() => setActiveTab('whisper')}
          activeOpacity={0.8}
        >
          <Text style={[styles.topNavTabText, activeTab === 'whisper' && styles.topNavTabTextActive]}>
            Whisper
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topNavTab}
          onPress={() => setActiveTab('inbox')}
          activeOpacity={0.8}
        >
          <Text style={[styles.topNavTabText, activeTab === 'inbox' && styles.topNavTabTextActive]}>
            Inbox
          </Text>
          {hasUnread && <View style={styles.inboxRedDot} />}
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.settingsBtn}
        onPress={() => setShowSettingsModal(true)}
        activeOpacity={0.7}
      >
        <Settings size={20} color={Colors.textPrimary} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  topNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  topNavTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  topNavTab: {
    position: 'relative',
    paddingVertical: 4,
  },
  topNavTabText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  topNavTabTextActive: {
    color: Colors.textPrimary,
  },
  inboxRedDot: {
    position: 'absolute',
    top: 2,
    right: -8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
