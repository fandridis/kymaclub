import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { User, Bell, CreditCard, Shield } from 'lucide-react-native';
import { theme } from '../../theme';
import { SettingsHeader, SettingsRow } from '../../components/Settings';
import { SettingsGroup } from '../../components/Settings';

export function SettingsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <SettingsGroup>
        <SettingsRow
          title="Profile"
          subtitle="Account information and sign out"
          showChevron
          onPress={() => navigation.navigate('SettingsProfile')}
          icon={User}
        />
        <SettingsRow
          title="Notifications"
          subtitle="Manage notification preferences"
          showChevron
          onPress={() => navigation.navigate('SettingsNotifications')}
          icon={Bell}
        />
        <SettingsRow
          title="Subscription"
          subtitle="Manage your subscription"
          showChevron
          onPress={() => navigation.navigate('SettingsSubscription')}
          icon={CreditCard}
        />
        <SettingsRow
          title="Account"
          subtitle="Privacy and account settings"
          showChevron
          onPress={() => navigation.navigate('SettingsAccount')}
          icon={Shield}
        />
      </SettingsGroup>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.zinc[50],
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.black,
    color: theme.colors.zinc[900],
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
});