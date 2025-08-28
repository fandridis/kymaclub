import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { SettingsGroup, SettingsHeader, SettingsRow } from '../../components/Settings';
import { StackScreenHeader } from '../../components/StackScreenHeader';

export function SettingsSubscriptionScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <StackScreenHeader title="Subscription" />
            <View style={styles.content}>
                <SettingsHeader title="Subscription" />
                <SettingsGroup>
                    <SettingsRow
                        title="Current Plan"
                        subtitle="Free Plan"
                    />
                    <SettingsRow
                        title="Upgrade to Premium"
                        subtitle="Access exclusive features"
                        onPress={() => {
                            // TODO: Navigate to upgrade screen
                        }}
                    />
                </SettingsGroup>

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
    },
    comingSoon: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 40,
    },
});