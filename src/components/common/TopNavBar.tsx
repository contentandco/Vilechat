import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Settings01Icon } from '@hugeicons/core-free-icons';
import { HomeTab } from '../../types';
import { Colors } from '../../constants/theme';

interface TopNavBarProps {
  activeTab: HomeTab;
  setActiveTab: (tab: HomeTab) => void;
  hasUnread: boolean;
  userNickname: string;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeTab,
  setActiveTab,
  hasUnread,
  userNickname,
}) => {
  const showSettings = () => {
    Alert.alert(
      'Vailchat Settings',
      `Nickname: ${userNickname}\nEncryption: AES-256 CTR\nRoom Storage: Ephemeral 24h\n\nAll messages wipe clean from database automatically.`
    );
  };

  return (
    <View style={styles.topNglBar}>
      <View style={styles.topNglTabs}>
        <TouchableOpacity 
          style={styles.topNglTab}
          onPress={() => setActiveTab('whisper')}
          activeOpacity={0.8}
        >
          <Text style={[styles.topNglTabText, activeTab === 'whisper' && styles.topNglTabTextActive]}>
            Whisper
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.topNglTab}
          onPress={() => setActiveTab('inbox')}
          activeOpacity={0.8}
        >
          <Text style={[styles.topNglTabText, activeTab === 'inbox' && styles.topNglTabTextActive]}>
            Inbox
          </Text>
          {hasUnread && <View style={styles.inboxRedDot} />}
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.settingsBtn}
        onPress={showSettings}
        activeOpacity={0.7}
      >
        <HugeiconsIcon icon={Settings01Icon} size={22} color={Colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  topNglBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  topNglTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  topNglTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  topNglTabText: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textMuted,
    letterSpacing: -0.5,
  },
  topNglTabTextActive: {
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
});
