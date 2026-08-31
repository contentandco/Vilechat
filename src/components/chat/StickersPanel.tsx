import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { STICKERS } from '../../constants';
import { Colors } from '../../constants/theme';

interface StickersPanelProps {
  onSelectSticker: (url: string) => void;
}

export const StickersPanel: React.FC<StickersPanelProps> = ({ onSelectSticker }) => {
  return (
    <View style={styles.stickersPanel}>
      <View style={styles.stickersHeader}>
        <Text style={styles.stickersTitle}>TAP TO SEND INSTANT STICKER</Text>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.stickersScroll}
      >
        {STICKERS.map((sticker) => (
          <TouchableOpacity 
            key={sticker.id}
            style={styles.stickerCard}
            onPress={() => onSelectSticker(sticker.url)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: sticker.url }} style={styles.stickerPreview} />
            <Text style={styles.stickerLabel}>{sticker.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  stickersPanel: {
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
    height: 190,
  },
  stickersHeader: {
    marginBottom: 12,
  },
  stickersTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  stickersScroll: {
    gap: 14,
    alignItems: 'center',
  },
  stickerCard: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    padding: 8,
    borderRadius: 16,
    width: 90,
  },
  stickerPreview: {
    width: 60,
    height: 60,
    marginBottom: 6,
  },
  stickerLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
});
