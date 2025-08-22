import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, Text } from 'react-native';
import { useUserNotificationSettings } from '../../hooks/use-user-notification-settings';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { user } from '../../../../../packages/api/convex/testResources';
import { SettingsGroup, SettingsHeader, SettingsRow } from '../../components/Settings';

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
        key: 'booking_reminder' as const,
        title: 'Class Reminders',
        description: 'We will remind you an hour before your class starts.'
    },
    {
        key: 'class_cancelled' as const,
        title: 'Class Cancelled',
        description: 'If the class is cancelled by the business, we will send you a notification.'
    },
    {
        key: 'booking_cancelled_by_business' as const,
        title: 'Booking Cancelled',
        description: 'If the business cancels your booking, we will send you a notification.'
    },
];

export function SettingsNotificationsScreen() {
    const navigation = useNavigation();
    const { settings, loading } = useUserNotificationSettings();
    const [preferences, setPreferences] = useState<UserNotificationPreferences>(defaultPreferences);

    // Update local state when settings are loaded
    useEffect(() => {
        if (settings) {
            setPreferences(settings.notificationPreferences);
        }
    }, [settings]);

    const handleNotificationPress = (notification: typeof notificationTypes[0]) => {
        navigation.navigate('SettingsNotificationsPreference', {
            notificationType: notification
        });
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading notification preferences...</Text>
            </View>
        );
    }

    console.log('preferences', preferences);

    return (
        <View style={styles.container}>
            <SettingsHeader title="Notification Types" />
            <SettingsGroup>
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
            </SettingsGroup>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.zinc[50],
    },

    loadingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 40,
    },
});