import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../constants/theme';
import { TopNavBar } from '../components/common/TopNavBar';
import { WhisperTab } from './WhisperTab';
import { InboxTab } from './InboxTab';
import { useAppStore } from '../store/useAppStore';

export const LandingScreen: React.FC = () => {
  const activeTab = useAppStore((s) => s.activeTab);

  return (
    <View style={styles.landingContainer}>
      <TopNavBar />
      {activeTab === 'whisper' ? <WhisperTab /> : <InboxTab />}
    </View>
  );
};

const styles = StyleSheet.create({
  landingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
