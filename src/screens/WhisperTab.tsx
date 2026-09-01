import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { WhisperCard } from '../components/whisper/WhisperCard';
import { ShareDrawer } from '../components/whisper/ShareDrawer';

export const WhisperTab: React.FC = () => {
  return (
    <ScrollView 
      contentContainerStyle={styles.whisperScroll} 
      showsVerticalScrollIndicator={false} 
      keyboardShouldPersistTaps="handled"
    >
      <WhisperCard />
      <ShareDrawer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  whisperScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
});
