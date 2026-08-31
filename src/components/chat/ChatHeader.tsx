import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, ArrowRight01Icon, LockKeyIcon } from '@hugeicons/core-free-icons';
import { Colors } from '../../constants/theme';

interface ChatHeaderProps {
  roomName: string;
  timeRemaining: string;
  participantsCount: number;
  onBack: () => void;
  onOpenRoomInfo: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  roomName,
  timeRemaining,
  participantsCount,
  onBack,
  onOpenRoomInfo,
}) => {
  return (
    <View style={styles.instagramHeader}>
      <TouchableOpacity onPress={onBack} style={styles.chatHeaderLeft}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={26} color={Colors.textPrimary} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.instagramHeaderCenter} 
        onPress={onOpenRoomInfo}
        activeOpacity={0.8}
      >
        {/* Padlock Anonymous Group Avatar Icon */}
        <View style={styles.headerAvatarContainer}>
          <View style={styles.headerAvatar}>
            <HugeiconsIcon icon={LockKeyIcon} size={12} color={Colors.textPrimary} />
          </View>
        </View>
        
        <View style={styles.headerTextContainer}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.roomCodeTitle} numberOfLines={1}>
              {roomName}
            </Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={Colors.textSecondary} style={{ marginLeft: 4 }} />
          </View>
          <Text style={styles.headerStatusText}>
            {timeRemaining} • {participantsCount} online
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.chatHeaderRight} />
    </View>
  );
};

const styles = StyleSheet.create({
  instagramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.background,
  },
  chatHeaderLeft: {
    padding: 8,
  },
  instagramHeaderCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerAvatarContainer: {
    marginRight: 10,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomCodeTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    maxWidth: 160,
  },
  headerStatusText: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  chatHeaderRight: {
    padding: 8,
    width: 42,
  },
});
