import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { UserIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation';
import { theme } from '../theme';

export function ProfileIconButton() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Settings')}
      style={styles.profileButton}
      accessibilityLabel="Open settings"
      accessibilityRole="button"
    >
      <UserIcon size={22} color={theme.colors.zinc[700]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.zinc[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.zinc[200],
  },
});

