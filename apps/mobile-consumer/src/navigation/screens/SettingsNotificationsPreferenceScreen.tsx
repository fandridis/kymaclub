import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { useUserNotificationSettings } from '../../hooks/use-user-notification-settings';
import { useRoute, RouteProp } from '@react-navigation/native';
import { SettingsGroup, SettingsHeader, SettingsRow } from '../../components/Settings';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { getDefaultUserNotificationSettings } from '../../../../../packages/api/operations/notifications';
import { theme } from '../../theme';

type NotificationChannels = { email: boolean; web: boolean; push: boolean; };

type RootStackParamList = {
    SettingsNotificationsPreference: {
        notificationType: {
            key: string;
            title: string;
            description: string;
        };
    };
};

type SettingsNotificationsPreferenceScreenRouteProp = RouteProp<RootStackParamList, 'SettingsNotificationsPreference'>;

export function SettingsNotificationsPreferenceScreen() {
    const route = useRoute<SettingsNotificationsPreferenceScreenRouteProp>();
    const { notificationType } = route.params;
    const { settings, updateSettings } = useUserNotificationSettings();
    const [channels, setChannels] = useState<NotificationChannels>({ email: false, web: false, push: false });
    const [globalOptOut, setGlobalOptOut] = useState(false);

    // Update local state when settings are loaded
    useEffect(() => {
        if (settings && settings.notificationPreferences[notificationType.key as keyof typeof settings.notificationPreferences]) {
            const typePreferences = settings.notificationPreferences[notificationType.key as keyof typeof settings.notificationPreferences];
            setChannels(typePreferences);
            setGlobalOptOut(settings.globalOptOut);
        }
    }, [settings, notificationType.key]);

    const handleChannelToggle = async (channel: keyof NotificationChannels, value: boolean) => {
        const newChannels = {
            ...channels,
            [channel]: value
        };
        setChannels(newChannels);

        console.log('🔥🔥🔥 NEW SETTINGS: ', settings);

        const notificationPreferences = settings?.notificationPreferences || getDefaultUserNotificationSettings();

        // Save immediately
        // if (settings) {
        try {
            const updatedPreferences = {
                ...notificationPreferences,
                [notificationType.key]: newChannels
            };

            console.log('🔥🔥🔥 UPDATED PREFERENCES: ', updatedPreferences);

            await updateSettings({
                settings: {
                    globalOptOut,
                    notificationPreferences: updatedPreferences
                }
            });
        } catch (error) {
            console.error('Failed to save notification preferences:', error);
            Alert.alert('Error', 'Failed to save notification preferences');
            // Revert the change on error
            setChannels(channels);
            // }
        }
    };


    const channelLabels = [
        { key: 'push' as const, label: 'Push Notifications', description: 'Notifications on your device' },
        { key: 'web' as const, label: 'In-App Notifications', description: 'Notifications within the app' },
        { key: 'email' as const, label: 'Email Notifications', description: 'Email notifications' }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StackScreenHeader title={notificationType.title} />
            <View style={styles.content}>
                <Text style={styles.description}>{notificationType.description}</Text>

                <SettingsGroup>
                    {channelLabels.map((channel) => (
                        <SettingsRow
                            key={channel.key}
                            title={channel.label}
                            subtitle={channel.description}
                            renderRightSide={() => (
                                <Switch
                                    value={channels[channel.key]}
                                    onValueChange={(value) => handleChannelToggle(channel.key, value)}
                                    trackColor={{ false: '#767577', true: '#007AFF' }}
                                    thumbColor={channels[channel.key] ? '#fff' : '#f4f3f4'}
                                />
                            )}
                        />
                    ))}
                </SettingsGroup>

                {globalOptOut && (
                    <Text style={styles.disabledNote}>
                        All notifications are currently disabled in your global settings.
                    </Text>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.zinc[50],
    },
    content: {
        flex: 1,
        padding: theme.spacing.lg,
    },
    description: {
        fontSize: theme.fontSize.base,
        color: theme.colors.zinc[600],
        marginBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
    },
    disabledNote: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.zinc[500],
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
    },
});