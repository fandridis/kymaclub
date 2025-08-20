import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Settings as SettingsContainer, SettingsRow, SettingsSectionHeader } from '../../components/Settings';

export function AccountSettings() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <SettingsSectionHeader title="Account" />
                <SettingsContainer>
                    <SettingsRow
                        title="Privacy Settings"
                        subtitle="Manage your privacy preferences"
                        showChevron
                        onPress={() => {
                            // TODO: Navigate to privacy screen
                        }}
                    />
                    <SettingsRow
                        title="Data & Storage"
                        subtitle="Manage your data and storage"
                        showChevron
                        onPress={() => {
                            // TODO: Navigate to data screen
                        }}
                    />
                    <SettingsRow
                        title="Delete Account"
                        subtitle="Permanently delete your account"
                        showChevron
                        onPress={() => {
                            // TODO: Navigate to delete account screen
                        }}
                    />
                </SettingsContainer>

                <Text style={styles.comingSoon}>
                    Account management coming soon
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    comingSoon: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 40,
    },
});