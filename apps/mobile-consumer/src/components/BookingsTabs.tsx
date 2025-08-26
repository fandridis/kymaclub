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
        <View style={styles.header}>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                    onPress={() => onTabChange('upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                        Upcoming
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
                    onPress={() => onTabChange('cancelled')}
                >
                    <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>
                        Cancelled
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                    onPress={() => onTabChange('history')}
                >
                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                        History
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

BookingsTabs.displayName = 'BookingsTabs';

const styles = StyleSheet.create({
    header: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#333',
    },
});
