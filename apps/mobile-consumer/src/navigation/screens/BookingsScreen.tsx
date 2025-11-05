import React, { useMemo, useState, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePaginatedQuery } from 'convex/react';
import { useNavigation } from '@react-navigation/native';

import { BookingCard } from '../../components/BookingCard';
import { AppTabs, AppTabItem } from '../../components/AppTabs';
import { useAuthenticatedUser } from '../../stores/auth-store';
import { TabScreenHeader } from '../../components/TabScreenHeader';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../index';
import { theme } from '../../theme';
import { api } from '@repo/api/convex/_generated/api';
import type { Doc } from '@repo/api/convex/_generated/dataModel';
import { CreditsBadge } from '../../components/CreditsBadge';
import { useQuery } from 'convex/react';
import { ProfileIconButton } from '../../components/ProfileIconButton';
import { useTypedTranslation } from '../../i18n/typed';
import { ChevronLeftIcon } from 'lucide-react-native';

const INITIAL_BOOKINGS_COUNT = 100;
const LOAD_MORE_COUNT = 50;

type BookingTabType = 'upcoming' | 'history';

type BookingSection = {
    title: string;
    data: Doc<'bookings'>[];
};

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
    const now = Date.now();
    const THIRTY_MINUTES_MS = 30 * 60 * 1000;

    return bookings.filter((booking) => {
        const startTime = booking.classInstanceSnapshot?.startTime;
        if (!startTime) {
            return false;
        }

        const thirtyMinutesAfterStart = startTime + THIRTY_MINUTES_MS;
        const isWithinThirtyMinutesAfterStart = now <= thirtyMinutesAfterStart;

        switch (tabType) {
            case 'upcoming':
                // Show bookings that start in the future or have started within the last 30 minutes
                return isWithinThirtyMinutesAfterStart;
            case 'history':
                // Show bookings that started more than 30 minutes ago
                return !isWithinThirtyMinutesAfterStart;
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
    const { t } = useTypedTranslation();

    const [activeTab, setActiveTab] = useState<BookingTabType>('upcoming');

    const tabItems = useMemo<AppTabItem<BookingTabType>[]>(
        () => [
            { key: 'upcoming', label: t('bookings.upcoming') },
            { key: 'history', label: t('bookings.history') },
        ],
        [t]
    );

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

    // Get user credit balance
    const creditBalance = useQuery(api.queries.credits.getUserBalance, user ? { userId: user._id } : "skip");

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
                <TabScreenHeader
                    renderRightSide={() => (
                        <>
                            {creditBalance !== undefined && (
                                <CreditsBadge creditBalance={creditBalance.balance} />
                            )}
                            <ProfileIconButton />
                        </>
                    )}
                />
                <Text style={styles.emptyText}>{t('bookings.signInToView')}</Text>
            </SafeAreaView>
        );
    }

    const handleBackPress = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <TabScreenHeader
                renderLeftSide={() => (
                    <TouchableOpacity
                        onPress={handleBackPress}
                        style={styles.backButton}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityLabel={t('common.back')}
                        accessibilityRole="button"
                    >
                        <ChevronLeftIcon size={24} color="#111827" />
                    </TouchableOpacity>
                )}
                renderRightSide={() => (
                    <>
                        {creditBalance !== undefined && (
                            <CreditsBadge creditBalance={creditBalance.balance} />
                        )}
                        <ProfileIconButton />
                    </>
                )}
            />
            <AppTabs
                items={tabItems}
                activeKey={activeTab}
                onChange={handleTabChange}
                containerStyle={styles.tabsContainer}
            />

            {isInitialLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.emerald[500]} />
                    <Text style={styles.loadingText}>{t('bookings.loadingBookings')}</Text>
                </View>
            ) : !hasBookingsForCurrentTab ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>
                        {activeTab === 'upcoming' && t('bookings.noUpcomingBookings')}
                        {activeTab === 'history' && t('bookings.noBookingHistory')}
                    </Text>
                    <Text style={styles.emptyText}>
                        {activeTab === 'upcoming' && t('bookings.whenYouBookClasses')}
                        {activeTab === 'history' && t('bookings.pastBookingsWillAppear')}
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
                                <Text style={styles.loadMoreText}>{t('bookings.loadMore')}</Text>
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
    tabsContainer: {
        paddingHorizontal: 12,
        paddingVertical: 10,
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
        paddingTop: 4,
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
    backButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 20,
    },
});
