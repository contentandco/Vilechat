import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { GIFS } from '../../constants';
import { Colors } from '../../constants/theme';

interface StickersPanelProps {
  onSelectSticker: (url: string) => void;
  onSelectEmoji?: (emoji: string) => void;
}

export const StickersPanel: React.FC<StickersPanelProps> = ({ 
  onSelectSticker, 
}) => {
  return (
    <View style={styles.stickersPanel}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.gifBadge}>
          <Text style={styles.gifBadgeText}>GIF</Text>
        </View>
        <Text style={styles.headerTitle}>TRENDING GIFS</Text>
      </View>

      {/* GIFs Scroll View */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.gifsScroll}
      >
        {GIFS.map((gif) => (
          <TouchableOpacity 
            key={gif.id}
            style={styles.gifCard}
            onPress={() => onSelectSticker(gif.url)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: gif.url }} style={styles.gifPreview} />
            <Text style={styles.gifLabel}>{gif.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  stickersPanel: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 12,
    paddingHorizontal: 16,
    height: 180,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  gifBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  gifsScroll: {
    gap: 12,
    alignItems: 'center',
    paddingBottom: 16,
  },
  gifCard: {
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 8,
    borderRadius: 16,
    width: 96,
  },
  gifPreview: {
    width: 76,
    height: 76,
    borderRadius: 12,
    marginBottom: 6,
  },
  gifLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
