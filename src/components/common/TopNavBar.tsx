import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Settings } from 'lucide-react-native';
import { HomeTab } from '../../types';
import { Colors } from '../../constants/theme';

interface TopNavBarProps {
  activeTab: HomeTab;
  setActiveTab: (tab: HomeTab) => void;
  hasUnread: boolean;
  userNickname: string;
  onOpenSettings: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeTab,
  setActiveTab,
  hasUnread,
  onOpenSettings,
}) => {
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
        onPress={onOpenSettings}
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
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  topNavTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  topNavTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  topNavTabText: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textMuted,
    letterSpacing: -0.5,
  },
  topNavTabTextActive: {
    color: Colors.textPrimary,
  },
  inboxRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
