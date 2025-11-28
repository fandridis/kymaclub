import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUserSettings } from '../../hooks/use-user-notification-settings';
import { useRoute, RouteProp } from '@react-navigation/native';
import { SettingsGroup, SettingsRow } from '../../components/Settings';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { theme } from '../../theme';
import { useTypedTranslation } from '../../i18n/typed';
import { DEFAULT_USER_NOTIFICATION_PREFERENCES } from '../../../../../packages/api/types/userSettings';

type NotificationChannels = { email: boolean; web: boolean; push: boolean; };

type RootStackParamList = {
    SettingsNotificationsPreference: {
        notificationType: {
            keys: readonly string[];
            title: string;
            description: string;
        };
    };
};

type SettingsNotificationsPreferenceScreenRouteProp = RouteProp<RootStackParamList, 'SettingsNotificationsPreference'>;

export function SettingsNotificationsPreferenceScreen() {
    const route = useRoute<SettingsNotificationsPreferenceScreenRouteProp>();
    const { notificationType } = route.params;
    const { settings, updateSettings } = useUserSettings();
    const { t } = useTypedTranslation();
    const [channels, setChannels] = useState<NotificationChannels>({ email: false, web: false, push: false });
    const [globalOptOut, setGlobalOptOut] = useState(false);

    // Update local state when settings are loaded
    useEffect(() => {
        if (settings?.notifications?.preferences) {
            // We use the first key to determine the state of the group
            // In a consistent state, all keys in the group should have the same values
            const firstKey = notificationType.keys[0];
            const typePreferences = settings.notifications.preferences[firstKey as keyof typeof settings.notifications.preferences];
            if (typePreferences) {
                setChannels(typePreferences);
            }
            setGlobalOptOut(settings.notifications.globalOptOut);
        }
    }, [settings, notificationType.keys]);

    const handleChannelToggle = async (channel: keyof NotificationChannels, value: boolean) => {
        const newChannels = {
            ...channels,
            [channel]: value
        };
        setChannels(newChannels);

        const notificationPreferences = {
            ...DEFAULT_USER_NOTIFICATION_PREFERENCES,
            ...settings?.notifications?.preferences
        };

        try {
            const updatedPreferences = {
                ...notificationPreferences,
            };

            // Update all keys in the group
            notificationType.keys.forEach(key => {
                updatedPreferences[key as keyof typeof updatedPreferences] = newChannels;
            });

            await updateSettings({
                notifications: {
                    globalOptOut,
                    preferences: updatedPreferences
                }
            });
        } catch (error) {
            console.error('Failed to save notification preferences:', error);
            Alert.alert(t('common.error'), t('settings.notifications.saveError'));
            // Revert the change on error
            setChannels(channels);
        }
    };

    const channelLabels = useMemo(() => [
        {
            key: 'push' as const,
            label: t('settings.notifications.channelLabels.push.label'),
            description: t('settings.notifications.channelLabels.push.description')
        },
        {
            key: 'web' as const,
            label: t('settings.notifications.channelLabels.inApp.label'),
            description: t('settings.notifications.channelLabels.inApp.description')
        },
        {
            key: 'email' as const,
            label: t('settings.notifications.channelLabels.email.label'),
            description: t('settings.notifications.channelLabels.email.description')
        }
    ], [t]);

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
                        {t('settings.notifications.globalOptOut')}
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