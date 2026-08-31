import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  RefreshControl,
} from 'react-native';
import { HomeTab, ActiveRoomDetail } from '../types';
import { Colors } from '../constants/theme';
import { TopNavBar } from '../components/common/TopNavBar';
import { WhisperCard } from '../components/whisper/WhisperCard';
import { ShareDrawer } from '../components/whisper/ShareDrawer';
import { InboxHeader } from '../components/inbox/InboxHeader';
import { InboxItem } from '../components/inbox/InboxItem';
import { EmptyInbox } from '../components/inbox/EmptyInbox';
import { JoinByCodeButton } from '../components/inbox/JoinByCodeButton';

interface LandingScreenProps {
  activeTab: HomeTab;
  setActiveTab: (tab: HomeTab) => void;
  themeIndex: number;
  promptIndex: number;
  setPromptIndex: React.Dispatch<React.SetStateAction<number>>;
  whisperRoomCode: string;
  activeRoomCode: string;
  userNickname: string;
  userAvatar?: string;
  onRandomizeNickname: () => string;
  onCreateNewWhisperRoom: () => void;
  onUniversalShare: () => void;
  roomCreatedFeedback: boolean;
  loading: boolean;
  verifiedActiveRooms: ActiveRoomDetail[];
  checkingHistory: boolean;
  isInboxEditMode: boolean;
  setIsInboxEditMode: (edit: boolean) => void;
  selectedRoomCodes: string[];
  setSelectedRoomCodes: (codes: string[]) => void;
  toggleSelectRoom: (code: string) => void;
  onDeleteSelectedRooms: () => void;
  onJoinRoom: (code: string) => void;
  onOpenJoinCodeModal: () => void;
  onOpenSettings: () => void;
  onRefreshInbox?: () => void;
  isRefetchingInbox?: boolean;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  activeTab,
  setActiveTab,
  themeIndex,
  promptIndex,
  setPromptIndex,
  whisperRoomCode,
  activeRoomCode,
  userNickname,
  userAvatar,
  onRandomizeNickname,
  onCreateNewWhisperRoom,
  onUniversalShare,
  roomCreatedFeedback,
  loading,
  verifiedActiveRooms,
  checkingHistory,
  isInboxEditMode,
  setIsInboxEditMode,
  selectedRoomCodes,
  setSelectedRoomCodes,
  toggleSelectRoom,
  onDeleteSelectedRooms,
  onJoinRoom,
  onOpenJoinCodeModal,
  onOpenSettings,
  onRefreshInbox,
  isRefetchingInbox = false,
}) => {
  const currentRoomCode = activeRoomCode || whisperRoomCode;
  const [inboxPage, setInboxPage] = useState<number>(1);
  const PAGE_SIZE = 10;

  const visibleRooms = verifiedActiveRooms.slice(0, inboxPage * PAGE_SIZE);
  const hasMoreRooms = verifiedActiveRooms.length > visibleRooms.length;

  return (
    <View style={styles.landingContainer}>
      {/* Top Bar: Whisper / Inbox Switcher + Settings */}
      <TopNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasUnread={verifiedActiveRooms.some((r) => r.hasUnread)}
        userNickname={userNickname}
        onOpenSettings={onOpenSettings}
      />

      {/* Tab 1: Whisper Studio */}
      {activeTab === 'whisper' && (
        <ScrollView 
          contentContainerStyle={styles.whisperScroll} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
        >
          <WhisperCard
            userAvatar={userAvatar}
            themeIndex={themeIndex}
            promptIndex={promptIndex}
            setPromptIndex={setPromptIndex}
            roomCode={currentRoomCode}
            onRandomizeNickname={onRandomizeNickname}
          />

          <ShareDrawer
            roomCode={currentRoomCode}
            loading={loading}
            roomCreatedFeedback={roomCreatedFeedback}
            onCreateNewRoom={onCreateNewWhisperRoom}
            onUniversalShare={onUniversalShare}
          />
        </ScrollView>
      )}

      {/* Tab 2: Inbox Stream (10-Item Pagination & Pull-to-Refresh) */}
      {activeTab === 'inbox' && (
        <View style={styles.inboxWrapper}>
          <ScrollView 
            contentContainerStyle={styles.inboxScroll} 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="handled"
            refreshControl={
              onRefreshInbox ? (
                <RefreshControl
                  refreshing={isRefetchingInbox}
                  onRefresh={onRefreshInbox}
                  tintColor={Colors.primary}
                  colors={[Colors.primary]}
                  progressBackgroundColor={Colors.cardBackground}
                />
              ) : undefined
            }
          >
            <View style={styles.historyContainer}>
              <InboxHeader
                isInboxEditMode={isInboxEditMode}
                setIsInboxEditMode={setIsInboxEditMode}
                selectedRoomCodes={selectedRoomCodes}
                setSelectedRoomCodes={setSelectedRoomCodes}
                hasRooms={verifiedActiveRooms.length > 0}
                onDeleteSelected={onDeleteSelectedRooms}
              />

              {checkingHistory && verifiedActiveRooms.length === 0 ? (
                <View style={styles.centeredLoading}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              ) : verifiedActiveRooms.length === 0 ? (
                <EmptyInbox onGoToWhisper={() => setActiveTab('whisper')} />
              ) : (
                <View style={styles.roomsList}>
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
                          onJoinRoom(room.code);
                        }
                      }}
                    />
                  ))}

                  {/* 10-Item Pagination Button */}
                  {hasMoreRooms && (
                    <TouchableOpacity
                      style={styles.loadMoreBtn}
                      onPress={() => setInboxPage((p) => p + 1)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.loadMoreText}>
                        Load 10 more rooms ({verifiedActiveRooms.length - visibleRooms.length} remaining)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <JoinByCodeButton onPress={onOpenJoinCodeModal} />
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  landingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  whisperScroll: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  inboxWrapper: {
    flex: 1,
  },
  inboxScroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  historyContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  roomsList: {
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  centeredLoading: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  loadMoreText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
