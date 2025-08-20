import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { useUserNotificationSettings } from '../../hooks/use-user-notification-settings';
import { RouteProp } from '@react-navigation/native';
import { Settings as SettingsContainer, SettingsRow, SettingsSectionHeader } from '../../components/Settings';

type NotificationChannels = { email: boolean; web: boolean; push: boolean; };

type RootStackParamList = {
    NotificationPreference: {
        notificationType: {
            key: string;
            title: string;
            description: string;
        };
    };
};

type NotificationPreferenceScreenRouteProp = RouteProp<RootStackParamList, 'NotificationPreference'>;

interface NotificationPreferenceScreenProps {
    route: NotificationPreferenceScreenRouteProp;
}

export function NotificationPreferenceScreen({ route }: NotificationPreferenceScreenProps) {
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

        // Save immediately
        if (settings) {
            try {
                const updatedPreferences = {
                    ...settings.notificationPreferences,
                    [notificationType.key]: newChannels
                };

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
            }
        }
    };


    const channelLabels = [
        { key: 'push' as const, label: 'Push Notifications', description: 'Notifications on your device' },
        { key: 'web' as const, label: 'In-App Notifications', description: 'Notifications within the app' },
        { key: 'email' as const, label: 'Email Notifications', description: 'Email notifications' }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <SettingsSectionHeader title={notificationType.title} />
                <Text style={styles.description}>{notificationType.description}</Text>

                <SettingsContainer>
                    {channelLabels.map((channel) => (
                        <SettingsRow
                            key={channel.key}
                            title={channel.label}
                            subtitle={channel.description}
                            toggle={{
                                value: channels[channel.key],
                                onToggle: (value) => handleChannelToggle(channel.key, value),
                                disabled: globalOptOut
                            }}
                        />
                    ))}
                </SettingsContainer>

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
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    description: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    disabledNote: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
    },
});