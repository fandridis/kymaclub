import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { SettingsGroup, SettingsHeader, SettingsRow } from '../../components/Settings';
import { StackScreenHeader } from '../../components/StackScreenHeader';

export function SettingsAccountScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <StackScreenHeader />
            <View style={styles.content}>
                <SettingsHeader title="Account" />
                <SettingsGroup>
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
                </SettingsGroup>

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
        backgroundColor: '#f9fafb',
    },
    content: {
        flex: 1,
    },
    comingSoon: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 40,
    },
});