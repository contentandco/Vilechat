import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  RefreshControl,
} from 'react-native';
import { Colors } from '../constants/theme';
import { InboxHeader } from '../components/inbox/InboxHeader';
import { InboxItem } from '../components/inbox/InboxItem';
import { EmptyInbox } from '../components/inbox/EmptyInbox';
import { JoinByCodeButton } from '../components/inbox/JoinByCodeButton';
import { useAppStore } from '../store/useAppStore';
import { useInboxRooms } from '../hooks/queries/useInboxQuery';
import { useRoomActions } from '../hooks/useRoomActions';

export const InboxTab: React.FC = () => {
  const deviceId = useAppStore((s) => s.deviceId);
  const isInboxEditMode = useAppStore((s) => s.isInboxEditMode);
  const selectedRoomCodes = useAppStore((s) => s.selectedRoomCodes);
  const toggleSelectRoom = useAppStore((s) => s.toggleSelectRoom);
  const setShowJoinCodeModal = useAppStore((s) => s.setShowJoinCodeModal);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const { data: verifiedActiveRooms = [], refetch: refetchInbox } = useInboxRooms(deviceId);
  const { handleJoinRoom } = useRoomActions();

  const [inboxPage, setInboxPage] = useState<number>(1);
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);
  const PAGE_SIZE = 10;

  const handleManualRefresh = async () => {
    try {
      setIsManualRefreshing(true);
      await refetchInbox();
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const visibleRooms = verifiedActiveRooms.slice(0, inboxPage * PAGE_SIZE);
  const hasMoreRooms = verifiedActiveRooms.length > visibleRooms.length;

  return (
    <View style={styles.inboxWrapper}>
      <ScrollView 
        contentContainerStyle={styles.inboxScroll} 
        showsVerticalScrollIndicator={false} 
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isManualRefreshing}
            onRefresh={handleManualRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
            progressBackgroundColor={Colors.cardBackground}
          />
        }
      >
        <View style={styles.historyContainer}>
          <InboxHeader hasRooms={verifiedActiveRooms.length > 0} />

          {verifiedActiveRooms.length === 0 ? (
            <EmptyInbox onGoToWhisper={() => setActiveTab('whisper')} />
          ) : (
            <View style={styles.historyList}>
              {visibleRooms.map((room) => (
                <InboxItem
                  key={room.code}
                  room={room}
                  isInboxEditMode={isInboxEditMode}
                  isSelected={selectedRoomCodes.includes(room.code)}
                  onPress={() => {
                    if (isInboxEditMode) {
                      toggleSelectRoom(room.code);
                    } else {
                      handleJoinRoom(room.code);
                    }
                  }}
                />
              ))}

              {/* Load More Pagination Button */}
              {hasMoreRooms && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={() => setInboxPage((prev) => prev + 1)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loadMoreText}>
                    Load More ({verifiedActiveRooms.length - visibleRooms.length} remaining)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Join by Code Entry Button */}
          <JoinByCodeButton onPress={() => setShowJoinCodeModal(true)} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  inboxWrapper: {
    flex: 1,
  },
  inboxScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  historyContainer: {
    flex: 1,
  },
  historyList: {
    gap: 8,
    marginBottom: 20,
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  loadMoreText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
