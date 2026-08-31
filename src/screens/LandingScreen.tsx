import React from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { HomeTab, ActiveRoomDetail } from '../types';
import { Colors } from '../constants/theme';
import { TopNavBar } from '../components/common/TopNavBar';
import { NglCard } from '../components/whisper/NglCard';
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
}) => {
  const currentRoomCode = activeRoomCode || whisperRoomCode;

  return (
    <View style={styles.landingContainer}>
      {/* Top Bar: Whisper / Inbox Switcher + Settings */}
      <TopNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasUnread={verifiedActiveRooms.length > 0}
        userNickname={userNickname}
      />

      {/* Tab 1: Whisper Studio */}
      {activeTab === 'whisper' && (
        <ScrollView 
          contentContainerStyle={styles.whisperScroll} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
        >
          <NglCard
            themeIndex={themeIndex}
            promptIndex={promptIndex}
            setPromptIndex={setPromptIndex}
            roomCode={currentRoomCode}
            userAvatar={userAvatar}
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

      {/* Tab 2: Inbox Stream */}
      {activeTab === 'inbox' && (
        <View style={styles.inboxWrapper}>
          <ScrollView 
            contentContainerStyle={styles.inboxScroll} 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="handled"
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

              {checkingHistory ? (
                <View style={styles.centeredLoading}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              ) : verifiedActiveRooms.length === 0 ? (
                <EmptyInbox onGoToWhisper={() => setActiveTab('whisper')} />
              ) : (
                <View style={styles.roomsList}>
                  {verifiedActiveRooms.map((room) => (
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
    paddingVertical: 12,
    paddingBottom: 40,
  },
  inboxWrapper: {
    flex: 1,
  },
  inboxScroll: {
    paddingBottom: 40,
  },
  historyContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  centeredLoading: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomsList: {
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
});
