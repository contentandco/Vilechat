import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { Colors } from '../../constants/theme';

interface InboxHeaderProps {
  isInboxEditMode: boolean;
  setIsInboxEditMode: (edit: boolean) => void;
  selectedRoomCodes: string[];
  setSelectedRoomCodes: (codes: string[]) => void;
  hasRooms: boolean;
  onDeleteSelected: () => void;
}

export const InboxHeader: React.FC<InboxHeaderProps> = ({
  isInboxEditMode,
  setIsInboxEditMode,
  selectedRoomCodes,
  setSelectedRoomCodes,
  hasRooms,
  onDeleteSelected,
}) => {
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
              onPress={onDeleteSelected}
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
            <HugeiconsIcon icon={Delete02Icon} size={14} color={Colors.danger} />
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
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  clearHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearHistoryText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  editModeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelEditBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: Colors.surfaceInput,
    borderRadius: 12,
  },
  cancelEditText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  deleteSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  deleteSelectedDisabled: {
    opacity: 0.35,
  },
  deleteSelectedText: {
    color: Colors.textWhite,
    fontSize: 12,
    fontWeight: '700',
  },
});
