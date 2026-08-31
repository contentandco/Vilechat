import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  Copy01Icon,
  Clock01Icon,
  Comment03Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '../constants/theme';
import { copyRoomLinkToClipboard } from '../services/share';

interface RoomDashboardScreenProps {
  activeRoomCode: string;
  timeRemaining: string;
  onLeaveRoom: () => void;
  onEnterChatRoom: () => void;
}

export const RoomDashboardScreen: React.FC<RoomDashboardScreenProps> = ({
  activeRoomCode,
  timeRemaining,
  onLeaveRoom,
  onEnterChatRoom,
}) => {
  return (
    <View style={styles.dashboardContainer}>
      <TouchableOpacity style={styles.backNavButton} onPress={onLeaveRoom} activeOpacity={0.7}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={Colors.textSecondary} />
        <Text style={styles.backNavText}>Cancel</Text>
      </TouchableOpacity>

      <View style={styles.dashboardHero}>
        <Text style={styles.dashboardTitle}>Room Created! 🎉</Text>
        <Text style={styles.dashboardSub}>
          Share this private web link with your friends to start chatting securely.
        </Text>
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>SECRET WEB LINK</Text>
        <TouchableOpacity 
          style={styles.linkShareCard} 
          onPress={() => copyRoomLinkToClipboard(activeRoomCode)}
          activeOpacity={0.8}
        >
          <Text style={styles.linkShareText} numberOfLines={1}>
            https://vailchat.com/join?code={activeRoomCode}
          </Text>
          <View style={styles.copyBadge}>
            <HugeiconsIcon icon={Copy01Icon} size={16} color={Colors.primary} />
          </View>
        </TouchableOpacity>
        <View style={styles.cardDivider} />
        <Text style={styles.codeLabel}>OR SHARE RAW CODE</Text>
        <Text style={styles.rawCodeText}>{activeRoomCode}</Text>
      </View>

      <View style={styles.timerCard}>
        <HugeiconsIcon icon={Clock01Icon} size={20} color={Colors.danger} />
        <Text style={styles.timerText}>
          Self-destructs in: <Text style={styles.timerHighlight}>{timeRemaining}</Text>
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.enterButton} 
        onPress={onEnterChatRoom}
        activeOpacity={0.85}
      >
        <Text style={styles.enterButtonText}>Enter Chat Room</Text>
        <HugeiconsIcon icon={Comment03Icon} size={20} color={Colors.textWhite} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  dashboardContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 20,
    left: 24,
  },
  backNavText: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginLeft: 8,
  },
  dashboardHero: {
    alignItems: 'center',
    marginBottom: 36,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  dashboardSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  codeCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 2,
  },
  codeLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  linkShareCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceInput,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderInput,
  },
  linkShareText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  copyBadge: {
    padding: 6,
    backgroundColor: 'rgba(255, 59, 105, 0.12)',
    borderRadius: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  rawCodeText: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dangerMuted,
    borderWidth: 1,
    borderColor: 'rgba(255, 51, 102, 0.2)',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 32,
  },
  timerText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginLeft: 8,
  },
  timerHighlight: {
    color: Colors.danger,
    fontWeight: 'bold',
  },
  enterButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 24,
  },
  enterButtonText: {
    color: Colors.textWhite,
    fontWeight: '800',
    fontSize: 16,
    marginRight: 8,
  },
});
