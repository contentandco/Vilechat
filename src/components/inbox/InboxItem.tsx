import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { ActiveRoomDetail } from '../../types';
import { Colors } from '../../constants/theme';
import { formatTimeLeft } from '../../hooks/useRoomTimer';

interface InboxItemProps {
  room: ActiveRoomDetail;
  isInboxEditMode: boolean;
  isSelected: boolean;
  onPress: () => void;
}

export const InboxItem: React.FC<InboxItemProps> = ({
  room,
  isInboxEditMode,
  isSelected,
  onPress,
}) => {
  const isUnread = Boolean(room.hasUnread);
  const displayName = room.name && room.name !== room.code ? room.name : `Room: ${room.code}`;

  return (
    <TouchableOpacity
      style={[styles.inboxItem, isInboxEditMode && isSelected && styles.inboxItemSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Selection Checkbox in Edit Mode */}
      {isInboxEditMode && (
        <View style={[styles.selectCheckboxCircle, isSelected && styles.selectCheckboxCircleActive]}>
          {isSelected && <Text style={styles.selectCheckboxCheckmark}>✓</Text>}
        </View>
      )}

      {/* Left Envelope Avatar */}
      <View style={[styles.inboxAvatar, isUnread ? styles.avatarUnread : styles.avatarDark]}>
        <Text style={styles.envelopeIcon}>💌</Text>
      </View>

      {/* Middle Details */}
      <View style={styles.inboxInfo}>
        <Text 
          style={[styles.inboxMsgTitle, isUnread ? styles.msgTitleUnread : styles.msgTitleRead]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <Text style={styles.inboxTimeText}>
          {formatTimeLeft(room.expires_at)}
        </Text>
      </View>

      {/* Right Side: New Badge & Chevron */}
      {!isInboxEditMode && (
        <View style={styles.rightActionContainer}>
          {isUnread && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>New</Text>
            </View>
          )}
          <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={isUnread ? '#FF3355' : Colors.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  inboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  inboxItemSelected: {
    backgroundColor: 'rgba(255, 59, 105, 0.06)',
    borderRadius: 16,
    paddingHorizontal: 8,
  },
  selectCheckboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#384A68',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectCheckboxCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectCheckboxCheckmark: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: '900',
  },
  inboxAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarUnread: {
    backgroundColor: 'rgba(255, 51, 85, 0.2)',
    borderWidth: 2,
    borderColor: '#FF3355',
  },
  avatarDark: {
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  envelopeIcon: {
    fontSize: 26,
  },
  inboxInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  inboxMsgTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  msgTitleUnread: {
    color: '#FF3355',
    fontWeight: '800',
  },
  msgTitleRead: {
    color: Colors.textPrimary,
  },
  inboxTimeText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  rightActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newBadge: {
    backgroundColor: '#FF3355',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
