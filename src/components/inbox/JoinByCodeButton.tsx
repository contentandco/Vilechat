import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/theme';

interface JoinByCodeButtonProps {
  onPress: () => void;
}

export const JoinByCodeButton: React.FC<JoinByCodeButtonProps> = ({ onPress }) => {
  return (
    <View style={styles.bottomWhoSentContainer}>
      <TouchableOpacity 
        style={styles.whoSentBtn}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text style={styles.whoSentBtnText}>Join by Code</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomWhoSentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: Colors.background,
  },
  whoSentBtn: {
    backgroundColor: Colors.primary,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  whoSentBtnText: {
    color: Colors.textWhite,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
