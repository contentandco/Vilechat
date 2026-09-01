import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, MoreVerticalIcon } from '@hugeicons/core-free-icons';
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
      <TouchableOpacity onPress={onBack} style={styles.chatHeaderLeft} activeOpacity={0.7}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={Colors.textPrimary} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.instagramHeaderCenter} 
        onPress={onOpenRoomInfo}
        activeOpacity={0.8}
      >
        {/* Mail Box Avatar */}
        <View style={styles.headerAvatarContainer}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarIcon}>💌</Text>
          </View>
        </View>
        
        <View style={styles.headerTextContainer}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.roomCodeTitle} numberOfLines={1}>
              {roomName}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.activeDot} />
            <Text style={styles.headerStatusText}>
              {timeRemaining} • {participantsCount} online
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 3-Dot Options Button */}
      <TouchableOpacity 
        style={styles.chatHeaderRightBtn} 
        onPress={onOpenRoomInfo}
        activeOpacity={0.7}
      >
        <HugeiconsIcon icon={MoreVerticalIcon} size={22} color={Colors.textPrimary} />
      </TouchableOpacity>
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
    padding: 6,
  },
  instagramHeaderCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerAvatarContainer: {
    marginRight: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarIcon: {
    fontSize: 18,
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
    fontSize: 16,
    letterSpacing: -0.2,
    maxWidth: 200,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 5,
  },
  headerStatusText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  chatHeaderRightBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
