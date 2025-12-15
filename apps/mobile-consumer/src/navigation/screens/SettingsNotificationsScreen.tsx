import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUserSettings } from '../../hooks/use-user-notification-settings';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { SettingsGroup, SettingsRow } from '../../components/Settings';
import { Clock, Calendar, Receipt } from 'lucide-react-native';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import { LucideIcon } from 'lucide-react-native';
import { useTypedTranslation } from '../../i18n/typed';

type ConsumerNotificationType = 'booking_confirmation' | 'booking_reminder' | 'class_cancelled' | 'booking_cancelled_by_business' | 'payment_receipt' | 'class_rebookable' | 'points_earned' | 'coupon_received';

type NotificationGroup = {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    notificationKeys: readonly ConsumerNotificationType[];
};

type NotificationChannels = { email: boolean; web: boolean; push: boolean; };

const defaultPreferences: Record<ConsumerNotificationType, NotificationChannels> = {
    booking_confirmation: { email: false, web: false, push: false },
    booking_reminder: { email: false, web: false, push: false },
    class_cancelled: { email: false, web: false, push: false },
    booking_cancelled_by_business: { email: false, web: false, push: false },
    payment_receipt: { email: false, web: false, push: false },
    class_rebookable: { email: false, web: false, push: false },
    points_earned: { email: true, web: true, push: true },
    coupon_received: { email: true, web: true, push: true },
};

export function SettingsNotificationsScreen() {
    const navigation = useNavigation();
    const { settings, loading } = useUserSettings();
    const { t } = useTypedTranslation();
    const [preferences, setPreferences] = useState<Record<ConsumerNotificationType, NotificationChannels>>(defaultPreferences);

    // Grouped notification types with their underlying notification keys
    const notificationGroups = useMemo<NotificationGroup[]>(() => [
        {
            id: 'class_reminders',
            title: t('settings.notifications.groups.classReminders.title'),
            description: t('settings.notifications.groups.classReminders.description'),
            icon: Clock,
            notificationKeys: ['booking_reminder'] as const
        },
        {
            id: 'bookings_changes',
            title: t('settings.notifications.groups.bookingsChanges.title'),
            description: t('settings.notifications.groups.bookingsChanges.description'),
            icon: Calendar,
            notificationKeys: ['class_cancelled', 'booking_cancelled_by_business', 'class_rebookable'] as const
        },
        {
            id: 'payments',
            title: t('settings.notifications.groups.payments.title'),
            description: t('settings.notifications.groups.payments.description'),
            icon: Receipt,
            notificationKeys: ['payment_receipt', 'points_earned', 'coupon_received'] as const
        }
    ], [t]);

    // Update local state when settings are loaded
    useEffect(() => {
        if (settings?.notifications?.preferences) {
            setPreferences({
                ...defaultPreferences,
                ...settings.notifications.preferences,
            } as Record<ConsumerNotificationType, NotificationChannels>);
        }
    }, [settings]);

    // Get group description showing enabled channels
    // Note: We only show push and email on mobile (web/in-app notifications don't apply)
    const getGroupDescription = (group: typeof notificationGroups[0]) => {
        // Collect which channels are enabled across all notifications in the group
        const enabledChannels = new Set<string>();
        group.notificationKeys.forEach(key => {
            const pref = preferences[key];
            if (pref.push) enabledChannels.add(t('settings.notifications.channels.push'));
            if (pref.email) enabledChannels.add(t('settings.notifications.channels.email'));
        });

        return enabledChannels.size > 0
            ? `${t('settings.notifications.status.via')} ${Array.from(enabledChannels).join(', ')}`
            : t('settings.notifications.status.disabled');
    };

    // Handle navigation to preference screen for the group
    const handleGroupPress = (group: typeof notificationGroups[0]) => {
        // Navigate with the first notification type from the group
        // The preference screen will handle the individual notification type
        const notificationType = {
            keys: group.notificationKeys,
            title: group.title,
            description: group.description
        };

        navigation.navigate('SettingsNotificationsPreference', {
            notificationType
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StackScreenHeader />
                <Text style={styles.loadingText}>{t('settings.notifications.loadingPreferences')}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StackScreenHeader title={t('settings.notifications.title')} />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <Text style={styles.screenSubtitle}>
                        {t('settings.notifications.chooseNotifications')}
                    </Text>
                </View>

                <SettingsGroup>
                    {notificationGroups.map((group) => (
                        <SettingsRow
                            key={group.id}
                            title={group.title}
                            subtitle={getGroupDescription(group)}
                            icon={group.icon}
                            onPress={() => handleGroupPress(group)}
                        />
                    ))}
                </SettingsGroup>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 60,
    },
    headerSection: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.lg,
    },
    screenSubtitle: {
        fontSize: theme.fontSize.base,
        color: theme.colors.zinc[600],
        lineHeight: theme.fontSize.base * 1.4,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 40,
    },
});