import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, ScrollView } from 'react-native';
import { useUserNotificationSettings } from '../../hooks/use-user-notification-settings';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { SettingsGroup, SettingsRow } from '../../components/Settings';
import { Clock, Calendar, CreditCard } from 'lucide-react-native';
import { StackScreenHeader } from '../../components/StackScreenHeader';
import type { UserNotificationSettingsNotificationPreferences } from '@repo/api/types/notification';
import { LucideIcon } from 'lucide-react-native';

type ConsumerNotificationType = keyof UserNotificationSettingsNotificationPreferences;

type NotificationGroup = {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    notificationKeys: readonly ConsumerNotificationType[];
};

const defaultPreferences: UserNotificationSettingsNotificationPreferences = {
    booking_confirmation: { email: false, web: false, push: false },
    booking_reminder: { email: false, web: false, push: false },
    class_cancelled: { email: false, web: false, push: false },
    booking_cancelled_by_business: { email: false, web: false, push: false },
    payment_receipt: { email: false, web: false, push: false },
    class_rebookable: { email: false, web: false, push: false },
    credits_received_subscription: { email: true, web: true, push: true },
};

// Grouped notification types with their underlying notification keys
const notificationGroups: NotificationGroup[] = [
    {
        id: 'class_reminders',
        title: 'Class Reminders',
        description: 'Get a notification 1 hour before your class starts.',
        icon: Clock,
        notificationKeys: ['booking_reminder'] as const
    },
    {
        id: 'bookings_changes',
        title: 'Bookings & Changes',
        description: 'Notifications about booking cancellations, changes and rebookable classes.',
        icon: Calendar,
        notificationKeys: ['class_cancelled', 'booking_cancelled_by_business', 'class_rebookable'] as const
    },
    {
        id: 'subscriptions',
        title: 'Subscriptions & Credits',
        description: 'Payment receipts, subscription updates, and credit notifications.',
        icon: CreditCard,
        notificationKeys: ['payment_receipt', 'credits_received_subscription'] as const
    }
];

export function SettingsNotificationsScreen() {
    const navigation = useNavigation();
    const { settings, loading } = useUserNotificationSettings();
    const [preferences, setPreferences] = useState<UserNotificationSettingsNotificationPreferences>(defaultPreferences);

    // Update local state when settings are loaded
    useEffect(() => {
        if (settings) {
            setPreferences(settings.notificationPreferences);
        }
    }, [settings]);

    // Get group status - returns 'all', 'none', or 'mixed'
    const getGroupStatus = (group: typeof notificationGroups[0]) => {
        const allChannels: boolean[] = [];

        group.notificationKeys.forEach(key => {
            const pref = preferences[key];
            allChannels.push(pref.email, pref.web, pref.push);
        });

        const enabledCount = allChannels.filter(Boolean).length;

        if (enabledCount === 0) return 'none';
        if (enabledCount === allChannels.length) return 'all';
        return 'mixed';
    };

    // Get group description based on status
    const getGroupDescription = (group: typeof notificationGroups[0]) => {
        const status = getGroupStatus(group);

        if (status === 'none') return 'Disabled';
        if (status === 'all') return 'Enabled for all channels';

        // For mixed status, show which channels are enabled across all notifications in the group
        const enabledChannels = new Set<string>();
        group.notificationKeys.forEach(key => {
            const pref = preferences[key];
            if (pref.push) enabledChannels.add('Push');
            if (pref.email) enabledChannels.add('Email');
            if (pref.web) enabledChannels.add('In-app');
        });

        return enabledChannels.size > 0 ? `via ${Array.from(enabledChannels).join(', ')}` : 'Disabled';
    };

    // Handle navigation to preference screen for the group
    const handleGroupPress = (group: typeof notificationGroups[0]) => {
        // Navigate with the first notification type from the group
        // The preference screen will handle the individual notification type
        const notificationType = {
            key: group.notificationKeys[0],
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
                <Text style={styles.loadingText}>Loading notification preferences...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StackScreenHeader />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>Notifications</Text>
                <Text style={styles.subtitle}>Choose what notifications you'd like to receive</Text>

                <SettingsGroup>
                    {notificationGroups.map((group) => {
                        const status = getGroupStatus(group);
                        const description = getGroupDescription(group);

                        return (
                            <SettingsRow
                                key={group.id}
                                title={group.title}
                                subtitle={description}
                                icon={group.icon}
                                showChevron
                                onPress={() => handleGroupPress(group)}
                            />
                        );
                    })}
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
    title: {
        fontSize: theme.fontSize['2xl'],
        fontWeight: theme.fontWeight.black,
        color: theme.colors.zinc[900],
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    subtitle: {
        fontSize: theme.fontSize.base,
        color: theme.colors.zinc[600],
        paddingHorizontal: 20,
        paddingBottom: 20,
        lineHeight: 20,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 40,
    },
});