import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { Settings as SettingsContainer, SettingsRow, SettingsSectionHeader } from '../../components/Settings';
import { useNavigation } from '@react-navigation/native';

export function Settings() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSectionHeader title="Settings" />
        
        <SettingsContainer>
          <SettingsRow
            title="Profile"
            subtitle="Account information and sign out"
            showChevron
            onPress={() => navigation.navigate('ProfileSettings')}
          />
          <SettingsRow
            title="Notifications"
            subtitle="Manage notification preferences"
            showChevron
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          <SettingsRow
            title="Subscription"
            subtitle="Manage your subscription"
            showChevron
            onPress={() => navigation.navigate('SubscriptionSettings')}
          />
          <SettingsRow
            title="Account"
            subtitle="Privacy and account settings"
            showChevron
            onPress={() => navigation.navigate('AccountSettings')}
          />
        </SettingsContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Extra padding to avoid bottom navigation
  },
});