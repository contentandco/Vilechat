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
      style={[styles.nglInboxItem, isInboxEditMode && isSelected && styles.nglInboxItemSelected]}
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
      <View style={[styles.nglInboxAvatar, isUnread ? styles.nglAvatarUnread : styles.nglAvatarDark]}>
        <Text style={styles.nglEnvelopeIcon}>💌</Text>
      </View>

      {/* Middle Details */}
      <View style={styles.nglInboxInfo}>
        <Text 
          style={[styles.nglInboxMsgTitle, isUnread ? styles.nglMsgTitleUnread : styles.nglMsgTitleRead]}
          numberOfLines={1}
        >
          {isUnread ? 'New message' : displayName}
        </Text>
        <Text style={styles.nglInboxTimeText}>
          {formatTimeLeft(room.expires_at)}
        </Text>
      </View>

      {/* Right Chevron */}
      {!isInboxEditMode && (
        <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.textMuted} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  nglInboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  nglInboxItemSelected: {
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
  nglInboxAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nglAvatarUnread: {
    backgroundColor: 'rgba(255, 51, 85, 0.2)',
    borderWidth: 2,
    borderColor: '#FF3355',
  },
  nglAvatarDark: {
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  nglEnvelopeIcon: {
    fontSize: 26,
  },
  nglInboxInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nglInboxMsgTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  nglMsgTitleUnread: {
    color: '#FF3355',
    fontWeight: '800',
  },
  nglMsgTitleRead: {
    color: Colors.textPrimary,
  },
  nglInboxTimeText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
