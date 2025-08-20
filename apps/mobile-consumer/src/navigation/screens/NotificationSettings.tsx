import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { NotificationsSettings } from '../../components/NotificationsSettings';

export function NotificationSettings() {
    return (
        <SafeAreaView style={styles.container}>
            <NotificationsSettings />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
});