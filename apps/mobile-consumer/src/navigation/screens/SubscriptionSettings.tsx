import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Settings as SettingsContainer, SettingsRow, SettingsSectionHeader } from '../../components/Settings';

export function SubscriptionSettings() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <SettingsSectionHeader title="Subscription" />
                <SettingsContainer>
                    <SettingsRow
                        title="Current Plan"
                        subtitle="Free Plan"
                    />
                    <SettingsRow
                        title="Upgrade to Premium"
                        subtitle="Access exclusive features"
                        showChevron
                        onPress={() => {
                            // TODO: Navigate to upgrade screen
                        }}
                    />
                </SettingsContainer>

                <Text style={styles.comingSoon}>
                    Subscription management coming soon
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