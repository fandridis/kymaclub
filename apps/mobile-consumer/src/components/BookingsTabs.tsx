import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTypedTranslation } from '../i18n/typed';

export type BookingTabType = 'upcoming' | 'cancelled' | 'history';

interface BookingsTabsProps {
    activeTab: BookingTabType;
    onTabChange: (tab: BookingTabType) => void;
}

export const BookingsTabs = memo<BookingsTabsProps>(({ activeTab, onTabChange }) => {
    const { t } = useTypedTranslation();

    return (
        <View style={styles.container}>
            <View style={styles.tabsRow}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'upcoming' && styles.tabButtonActive]}
                    onPress={() => onTabChange('upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
                        Upcoming
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'cancelled' && styles.tabButtonActive]}
                    onPress={() => onTabChange('cancelled')}
                >
                    <Text style={[styles.tabText, activeTab === 'cancelled' && styles.tabTextActive]}>
                        Cancelled
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
                    onPress={() => onTabChange('history')}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                        History
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

BookingsTabs.displayName = 'BookingsTabs';

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    tabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tabButton: {
        paddingVertical: 5,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: '#111827',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#6b7280',
    },
    tabTextActive: {
        color: '#111827',
        fontWeight: '600',
    },
});
