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
import { useAppStore } from '../store/useAppStore';
import { useRoomTimer } from '../hooks/useRoomTimer';
import { useRoomActions } from '../hooks/useRoomActions';

export const RoomDashboardScreen: React.FC = () => {
  const activeRoomCode = useAppStore((s) => s.activeRoomCode);
  const roomExpiresAt = useAppStore((s) => s.roomExpiresAt);
  const setCurrentScreen = useAppStore((s) => s.setCurrentScreen);

  const { handleLeaveRoom } = useRoomActions();
  const timeRemaining = useRoomTimer(roomExpiresAt, handleLeaveRoom);

  return (
    <View style={styles.dashboardContainer}>
      <TouchableOpacity style={styles.backNavButton} onPress={handleLeaveRoom} activeOpacity={0.7}>
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
        <Text style={styles.timerText}>Disappears in {timeRemaining || '24h'}</Text>
      </View>

      <TouchableOpacity 
        style={styles.enterChatButton} 
        onPress={() => setCurrentScreen('chat-room')}
        activeOpacity={0.85}
      >
        <HugeiconsIcon icon={Comment03Icon} size={20} color={Colors.textWhite} />
        <Text style={styles.enterChatButtonText}>Enter Chat Room →</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  dashboardContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backNavText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  dashboardHero: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dashboardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  dashboardSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  codeCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  linkShareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    width: '100%',
    gap: 10,
  },
  linkShareText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  copyBadge: {
    backgroundColor: 'rgba(255, 59, 105, 0.15)',
    padding: 6,
    borderRadius: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
    marginVertical: 18,
  },
  rawCodeText: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textWhite,
    letterSpacing: 6,
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 59, 105, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 105, 0.2)',
  },
  timerText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  enterChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  enterChatButtonText: {
    color: Colors.textWhite,
    fontSize: 17,
    fontWeight: '800',
  },
});
