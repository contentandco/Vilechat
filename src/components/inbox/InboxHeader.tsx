import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { Colors } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';
import { useRoomActions } from '../../hooks/useRoomActions';

interface InboxHeaderProps {
  hasRooms: boolean;
}

export const InboxHeader: React.FC<InboxHeaderProps> = ({ hasRooms }) => {
  const isInboxEditMode = useAppStore((s) => s.isInboxEditMode);
  const setIsInboxEditMode = useAppStore((s) => s.setIsInboxEditMode);
  const selectedRoomCodes = useAppStore((s) => s.selectedRoomCodes);
  const setSelectedRoomCodes = useAppStore((s) => s.setSelectedRoomCodes);

  const { handleDeleteSelectedRooms } = useRoomActions();

  return (
    <View style={styles.historyHeaderRow}>
      <Text style={styles.historySectionTitle}>
        {isInboxEditMode ? `SELECT ROOMS (${selectedRoomCodes.length})` : 'ANONYMOUS INBOX'}
      </Text>

      {hasRooms && (
        isInboxEditMode ? (
          <View style={styles.editModeActionsRow}>
            <TouchableOpacity 
              style={styles.cancelEditBtn} 
              onPress={() => {
                setIsInboxEditMode(false);
                setSelectedRoomCodes([]);
              }}
            >
              <Text style={styles.cancelEditText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.deleteSelectedBtn, selectedRoomCodes.length === 0 && styles.deleteSelectedDisabled]} 
              onPress={handleDeleteSelectedRooms}
              disabled={selectedRoomCodes.length === 0}
            >
              <HugeiconsIcon icon={Delete02Icon} size={14} color={Colors.textWhite} />
              <Text style={styles.deleteSelectedText}>Delete ({selectedRoomCodes.length})</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.clearHistoryButton} 
            onPress={() => setIsInboxEditMode(true)}
          >
            <HugeiconsIcon icon={Delete02Icon} size={14} color={Colors.textWhite} />
            <Text style={styles.clearHistoryText}>Clear</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  historySectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  editModeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.surfaceMuted,
  },
  cancelEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  deleteSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  deleteSelectedDisabled: {
    opacity: 0.4,
  },
  deleteSelectedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  clearHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  clearHistoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textWhite,
  },
});
