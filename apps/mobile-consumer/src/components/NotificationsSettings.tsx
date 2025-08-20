import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useUserNotificationSettings } from '../hooks/use-user-notification-settings';
import { useNavigation } from '@react-navigation/native';
import { Settings as SettingsContainer, SettingsRow, SettingsSectionHeader } from './Settings';

type UserNotificationPreferences = {
    booking_confirmation: { email: boolean; web: boolean; push: boolean; };
    booking_reminder: { email: boolean; web: boolean; push: boolean; };
    class_cancelled: { email: boolean; web: boolean; push: boolean; };
    booking_cancelled_by_business: { email: boolean; web: boolean; push: boolean; };
    payment_receipt: { email: boolean; web: boolean; push: boolean; };
};

const defaultPreferences: UserNotificationPreferences = {
    booking_confirmation: { email: true, web: true, push: true },
    booking_reminder: { email: true, web: true, push: true },
    class_cancelled: { email: true, web: true, push: true },
    booking_cancelled_by_business: { email: true, web: true, push: true },
    payment_receipt: { email: true, web: true, push: true },
};

const getEnabledChannels = (setting: { email: boolean; web: boolean; push: boolean }): string => {
    const channels = [];
    if (setting.push) channels.push('Push');
    if (setting.web) channels.push('In-app');
    if (setting.email) channels.push('Email');

    if (channels.length === 0) return 'Disabled';
    return `via ${channels.join(', ')}`;
};

const notificationTypes = [
    {
        key: 'booking_confirmation' as const,
        title: 'Booking Confirmation',
        description: 'When your booking is confirmed'
    },
    {
        key: 'booking_reminder' as const,
        title: 'Class Reminders',
        description: 'Reminders before your class starts'
    },
    {
        key: 'class_cancelled' as const,
        title: 'Class Cancelled',
        description: 'When a class you booked is cancelled'
    },
    {
        key: 'booking_cancelled_by_business' as const,
        title: 'Booking Cancelled',
        description: 'When business cancels your booking'
    },
    {
        key: 'payment_receipt' as const,
        title: 'Payment Receipt',
        description: 'Payment confirmations and receipts'
    }
];

export function NotificationsSettings() {
    const navigation = useNavigation();
    const { settings, loading, updateSettings } = useUserNotificationSettings();
    const [preferences, setPreferences] = useState<UserNotificationPreferences>(defaultPreferences);
    const [globalOptOut, setGlobalOptOut] = useState(false);

    // Update local state when settings are loaded
    useEffect(() => {
        if (settings) {
            setPreferences(settings.notificationPreferences);
            setGlobalOptOut(settings.globalOptOut);
        }
    }, [settings]);

    const handleNotificationPress = (notification: typeof notificationTypes[0]) => {
        navigation.navigate('NotificationPreference', {
            notificationType: notification
        });
    };

    const handleGlobalOptOutChange = async (value: boolean) => {
        setGlobalOptOut(value);

        // Save immediately
        try {
            await updateSettings({
                settings: {
                    globalOptOut: value,
                    notificationPreferences: preferences
                }
            });
        } catch (error) {
            console.error('Failed to save notification preferences:', error);
            Alert.alert('Error', 'Failed to save notification preferences');
            // Revert the change on error
            setGlobalOptOut(!value);
        }
    };


    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading notification preferences...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.notificationsContainer}>
                <SettingsSectionHeader title="Notification Types" />

                <SettingsContainer>
                    {notificationTypes.map((notificationType) => {
                        const enabledChannels = getEnabledChannels(preferences[notificationType.key]);

                        return (
                            <SettingsRow
                                key={notificationType.key}
                                title={notificationType.title}
                                subtitle={enabledChannels}
                                onPress={() => handleNotificationPress(notificationType)}
                                showChevron={true}
                            />
                        );
                    })}
                </SettingsContainer>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 40,
    },
    notificationsContainer: {
        marginTop: 20,
    },
});