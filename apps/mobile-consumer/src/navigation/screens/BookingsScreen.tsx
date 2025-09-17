import React, { useMemo, useState, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePaginatedQuery } from 'convex/react';
import { useNavigation } from '@react-navigation/native';

import { BookingCard } from '../../components/BookingCard';
import { BookingsTabs, BookingTabType } from '../../components/BookingsTabs';
import { useAuthenticatedUser } from '../../stores/auth-store';
import { TabScreenHeader } from '../../components/TabScreenHeader';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../index';
import { theme } from '../../theme';
import { api } from '@repo/api/convex/_generated/api';
import type { Doc } from '@repo/api/convex/_generated/dataModel';

const INITIAL_BOOKINGS_COUNT = 100;
const LOAD_MORE_COUNT = 50;

type BookingSection = {
    title: string;
    data: Doc<'bookings'>[];
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const deduplicateBookings = (bookings: Doc<'bookings'>[]): Doc<'bookings'>[] => {
    const latestByInstance = new Map<string, Doc<'bookings'>>();

    bookings.forEach((booking) => {
        const instanceId = booking.classInstanceId;
        if (!instanceId) {
            return;
        }

        const existing = latestByInstance.get(instanceId);
        if (!existing || booking.createdAt > existing.createdAt) {
            latestByInstance.set(instanceId, booking);
        }
    });

    return Array.from(latestByInstance.values());
};

const filterBookingsByTab = (bookings: Doc<'bookings'>[], tabType: BookingTabType): Doc<'bookings'>[] => {
    const todayStart = startOfDay(new Date());

    return bookings.filter((booking) => {
        const startTime = booking.classInstanceSnapshot?.startTime;
        if (!startTime) {
            return false;
        }

        const isUpcoming = startTime >= todayStart;
        const isPast = startTime < todayStart;

        switch (tabType) {
            case 'upcoming':
                return isUpcoming && booking.status === 'pending';
            case 'cancelled':
                return isUpcoming && (
                    booking.status === 'cancelled_by_consumer' ||
                    booking.status === 'cancelled_by_business' ||
                    booking.status === 'cancelled_by_business_rebookable'
                );
            case 'history':
                return isPast;
            default:
                return false;
        }
    });
};

const sortByStartTimeAsc = (bookings: Doc<'bookings'>[]) =>
    [...bookings].sort((a, b) => {
        const aTime = a.classInstanceSnapshot?.startTime ?? 0;
        const bTime = b.classInstanceSnapshot?.startTime ?? 0;
        return aTime - bTime;
    });

const sortByStartTimeDesc = (bookings: Doc<'bookings'>[]) =>
    [...bookings].sort((a, b) => {
        const aTime = a.classInstanceSnapshot?.startTime ?? 0;
        const bTime = b.classInstanceSnapshot?.startTime ?? 0;
        return bTime - aTime;
    });

const buildSections = (bookings: Doc<'bookings'>[], tabType: BookingTabType): BookingSection[] => {
    const deduped = deduplicateBookings(bookings);

    if (tabType === 'upcoming') {
        return [
            {
                title: 'Upcoming bookings',
                data: sortByStartTimeAsc(deduped),
            },
        ];
    }

    if (tabType === 'cancelled') {
        return [
            {
                title: 'Cancelled bookings',
                data: sortByStartTimeAsc(deduped),
            },
        ];
    }

    return [
        {
            title: 'Past bookings',
            data: sortByStartTimeDesc(deduped),
        },
    ];
};

export function BookingsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const user = useAuthenticatedUser();

    const [activeTab, setActiveTab] = useState<BookingTabType>('upcoming');

    const {
        results: allBookings,
        status,
        loadMore,
        isLoading,
    } = usePaginatedQuery(
        api.queries.bookings.getCurrentUserBookings,
        {
            includeHistory: true,
        },
        { initialNumItems: INITIAL_BOOKINGS_COUNT }
    );

    const sections = useMemo(() => {
        if (!allBookings?.length) {
            return [];
        }

        const filtered = filterBookingsByTab(allBookings, activeTab);
        if (!filtered.length) {
            return [];
        }

        return buildSections(filtered, activeTab).filter((section) => section.data.length > 0);
    }, [allBookings, activeTab]);

    const cards = useMemo(() => sections.flatMap((section) => section.data), [sections]);

    const hasBookingsForCurrentTab = cards.length > 0;
    const isInitialLoading = status === 'LoadingFirstPage';

    const handleTabChange = useCallback((tab: BookingTabType) => {
        setActiveTab(tab);
    }, []);

    const handleLoadMore = useCallback(() => {
        if (status === 'CanLoadMore' && !isLoading) {
            loadMore(LOAD_MORE_COUNT);
        }
    }, [status, isLoading, loadMore]);

    const handleViewClass = useCallback(
        (booking: Doc<'bookings'>) => {
            if (!booking) {
                return;
            }

            navigation.navigate('ClassDetailsModal', { classInstanceId: booking.classInstanceId });
        },
        [navigation]
    );

    const handleViewTicket = useCallback(
        (booking: Doc<'bookings'>) => {
            navigation.navigate('BookingTicketModal', { booking });
        },
        [navigation]
    );

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <TabScreenHeader title="Bookings" />
                <Text style={styles.emptyText}>Please sign in to view your bookings</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TabScreenHeader title="My Bookings" />
            <BookingsTabs activeTab={activeTab} onTabChange={handleTabChange} />

            {isInitialLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.emerald[500]} />
                    <Text style={styles.loadingText}>Loading your bookings…</Text>
                </View>
            ) : !hasBookingsForCurrentTab ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>
                        {activeTab === 'upcoming' && 'No upcoming bookings'}
                        {activeTab === 'cancelled' && 'No cancelled bookings'}
                        {activeTab === 'history' && 'No booking history'}
                    </Text>
                    <Text style={styles.emptyText}>
                        {activeTab === 'upcoming' && "When you book classes, they'll appear here. Explore classes to get started!"}
                        {activeTab === 'cancelled' && 'Your cancelled bookings will appear here.'}
                        {activeTab === 'history' && 'Your past bookings will appear here once you attend classes.'}
                    </Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.cardsStack}>
                        {cards.map((booking) => (
                            <BookingCard
                                key={booking._id}
                                booking={booking}
                                onViewClass={handleViewClass}
                                onViewTicket={handleViewTicket}
                                showFooterIcons={activeTab === 'upcoming'}
                            />
                        ))}
                    </View>

                    {status === 'CanLoadMore' && (
                        <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore} disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator size="small" color={theme.colors.emerald[500]} />
                            ) : (
                                <Text style={styles.loadMoreText}>Load more bookings</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
        color: theme.colors.zinc[500],
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.zinc[900],
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.zinc[500],
        textAlign: 'center',
        lineHeight: 24,
    },
    scrollContent: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 120,
        gap: 28,
    },
    cardsStack: {
        gap: 14,
    },
    loadMoreButton: {
        marginTop: 12,
        alignSelf: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.emerald[400],
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    loadMoreText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.emerald[600],
    },
});
