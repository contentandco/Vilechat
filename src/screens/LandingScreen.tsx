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
                <View style={styles.nglInboxList}>
                  {verifiedActiveRooms.map((room) => {
                    const isSelected = selectedRoomCodes.includes(room.code);
                    return (
                      <InboxItem
                        key={room.code}
                        room={room}
                        isInboxEditMode={isInboxEditMode}
                        isSelected={isSelected}
                        onPress={() => isInboxEditMode ? toggleSelectRoom(room.code) : onJoinRoom(room.code)}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Floating Join by Code Button */}
          <JoinByCodeButton onPress={onOpenJoinCodeModal} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  landingContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 12 : 24,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  whisperScroll: {
    paddingBottom: 24,
  },
  inboxWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
  },
  inboxScroll: {
    paddingBottom: 24,
  },
  historyContainer: {
    flex: 1,
  },
  centeredLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  nglInboxList: {
    flex: 1,
    gap: 8,
  },
});
