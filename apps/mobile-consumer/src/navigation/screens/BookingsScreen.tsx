import { Text } from '@react-navigation/elements';
import { StyleSheet, View, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useActionSheet } from '@expo/react-native-action-sheet';
import { useQuery, useMutation } from 'convex/react';
import { usePaginatedQuery } from 'convex/react';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState, useCallback } from 'react';
import { FlashList } from '@shopify/flash-list';
import { api } from '@repo/api/convex/_generated/api';
import { BookingCard } from '../../components/BookingCard';
import { BookingsTabs, BookingTabType } from '../../components/BookingsTabs';
import { useAuth, useAuthenticatedUser } from '../../stores/auth-store';
import type { Doc, Id } from '@repo/api/convex/_generated/dataModel';
import { getCancellationInfo, getCancellationMessage } from '../../utils/cancellationUtils';
import { theme } from '../../theme';
import { TabScreenHeader } from '../../components/TabScreenHeader';

// Configuration for initial load and load more
const INITIAL_BOOKINGS_COUNT = 100;
const LOAD_MORE_COUNT = 50;

// Enhanced date formatting for better mobile UX
const formatDateHeader = (date: Date, isPast: boolean = false): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Reset hours for comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
        return 'Today';
    } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
        return 'Tomorrow';
    } else if (isPast) {
        // For past dates, show month and day
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    } else {
        // For future dates beyond tomorrow, show day of week and date
        const daysDiff = Math.ceil((dateOnly.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 7) {
            // Within a week - show day name and date
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            });
        } else {
            // More than a week - show month and day
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    }
};

// Filter bookings based on tab type
const filterBookingsByTab = (bookings: Doc<"bookings">[], tabType: BookingTabType): Doc<"bookings">[] => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return bookings.filter((booking: Doc<"bookings">) => {
        const startTime = booking.classInstanceSnapshot?.startTime;
        if (!startTime) return false;

        const isFuture = startTime >= todayStart;
        const isPast = startTime < todayStart;

        switch (tabType) {
            case 'upcoming':
                return isFuture && booking.status === 'pending';
            case 'cancelled':
                return isFuture && (booking.status === 'cancelled_by_consumer' ||
                    booking.status === 'cancelled_by_business' ||
                    booking.status === 'cancelled_by_business_rebookable');
            case 'history':
                return isPast; // All past bookings regardless of status
            default:
                return false;
        }
    });
};

// Enhanced grouping for better mobile UX - separates future from past bookings
const groupBookingsByDate = (bookings: Doc<"bookings">[], tabType: BookingTabType): Record<string, Doc<"bookings">[]> => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Filter bookings based on tab type first
    const filteredBookings = filterBookingsByTab(bookings, tabType);

    // First, deduplicate bookings by showing only the latest booking per class instance
    const latestBookingsByClass = new Map<string, Doc<"bookings">>();

    filteredBookings.forEach((booking: Doc<"bookings">) => {
        const classInstanceId = booking.classInstanceId;
        if (!classInstanceId) return;

        const existing = latestBookingsByClass.get(classInstanceId);
        if (!existing || booking.createdAt > existing.createdAt) {
            latestBookingsByClass.set(classInstanceId, booking);
        }
    });

    // Convert back to array with only latest bookings per class
    const deduplicatedBookings = Array.from(latestBookingsByClass.values());

    // For history tab, separate future and past logic is not needed
    if (tabType === 'history') {
        // Group by date for history
        const historyGrouped: Record<string, Doc<"bookings">[]> = {};
        deduplicatedBookings.forEach((booking: Doc<"bookings">) => {
            const startTime = booking.classInstanceSnapshot?.startTime;
            const date = new Date(startTime!);
            const dateKey = formatDateHeader(date, true);

            if (!historyGrouped[dateKey]) {
                historyGrouped[dateKey] = [];
            }
            historyGrouped[dateKey].push(booking);
        });

        // Sort bookings within each day by start time (most recent first for history)
        Object.keys(historyGrouped).forEach(dateKey => {
            historyGrouped[dateKey].sort((a: Doc<"bookings">, b: Doc<"bookings">) => {
                const aTime = a.classInstanceSnapshot?.startTime || 0;
                const bTime = b.classInstanceSnapshot?.startTime || 0;
                return bTime - aTime; // Reverse order for history
            });
        });

        // Sort dates in reverse chronological order for history
        const historyDateOrder = Object.keys(historyGrouped).sort((a, b) => {
            const aFirstBooking = historyGrouped[a][0];
            const bFirstBooking = historyGrouped[b][0];
            const aTime = aFirstBooking.classInstanceSnapshot?.startTime || 0;
            const bTime = bFirstBooking.classInstanceSnapshot?.startTime || 0;
            return bTime - aTime; // Reverse order for history
        });

        const orderedHistoryResult: Record<string, Doc<"bookings">[]> = {};
        historyDateOrder.forEach(dateKey => {
            orderedHistoryResult[dateKey] = historyGrouped[dateKey];
        });

        return orderedHistoryResult;
    }

    // For upcoming and cancelled tabs, use the existing future/past logic
    const futureBookings: Doc<"bookings">[] = [];
    const pastBookings: Doc<"bookings">[] = [];

    deduplicatedBookings.forEach((booking: Doc<"bookings">) => {
        // Use classInstanceSnapshot.startTime first, fallback to classInstance.startTime for backward compatibility
        const startTime = booking.classInstanceSnapshot?.startTime;
        if (!startTime) return;

        if (startTime >= todayStart) {
            futureBookings.push(booking);
        } else {
            pastBookings.push(booking);
        }
    });

    // Sort future bookings by start time (earliest first)
    futureBookings.sort((a: Doc<"bookings">, b: Doc<"bookings">) => {
        const aTime = a.classInstanceSnapshot?.startTime || 0;
        const bTime = b.classInstanceSnapshot?.startTime || 0;
        return aTime - bTime;
    });

    // Sort past bookings by start time (most recent first)
    pastBookings.sort((a: Doc<"bookings">, b: Doc<"bookings">) => {
        const aTime = a.classInstanceSnapshot?.startTime || 0;
        const bTime = b.classInstanceSnapshot?.startTime || 0;
        return bTime - aTime;
    });

    // Group future bookings by date
    const futureGrouped: Record<string, Doc<"bookings">[]> = {};
    futureBookings.forEach((booking: Doc<"bookings">) => {
        const startTime = booking.classInstanceSnapshot?.startTime;
        const date = new Date(startTime!);
        const dateKey = formatDateHeader(date, false);

        if (!futureGrouped[dateKey]) {
            futureGrouped[dateKey] = [];
        }
        futureGrouped[dateKey].push(booking);
    });

    // Group past bookings by date
    const pastGrouped: Record<string, Doc<"bookings">[]> = {};
    pastBookings.forEach((booking: Doc<"bookings">) => {
        const startTime = booking.classInstanceSnapshot?.startTime;
        const date = new Date(startTime!);
        const dateKey = formatDateHeader(date, true);

        if (!pastGrouped[dateKey]) {
            pastGrouped[dateKey] = [];
        }
        pastGrouped[dateKey].push(booking);
    });

    // Sort bookings within each day by start time
    Object.keys(futureGrouped).forEach(dateKey => {
        futureGrouped[dateKey].sort((a: Doc<"bookings">, b: Doc<"bookings">) => {
            const aTime = a.classInstanceSnapshot?.startTime || 0;
            const bTime = b.classInstanceSnapshot?.startTime || 0;
            return aTime - bTime;
        });
    });

    Object.keys(pastGrouped).forEach(dateKey => {
        pastGrouped[dateKey].sort((a: Doc<"bookings">, b: Doc<"bookings">) => {
            const aTime = a.classInstanceSnapshot?.startTime || 0;
            const bTime = b.classInstanceSnapshot?.startTime || 0;
            return aTime - bTime;
        });
    });

    // For upcoming/cancelled tabs, don't need separators since they're already filtered
    const orderedResult: Record<string, Doc<"bookings">[]> = {};

    // Add future bookings in chronological order
    const futureDateOrder = ['Today', 'Tomorrow'];

    // Add Today and Tomorrow first if they exist
    futureDateOrder.forEach(dateKey => {
        if (futureGrouped[dateKey]) {
            orderedResult[dateKey] = futureGrouped[dateKey];
            delete futureGrouped[dateKey];
        }
    });

    // Add remaining future dates in chronological order
    const remainingFutureDates = Object.keys(futureGrouped).sort((a, b) => {
        // Get the first booking from each date group to compare dates
        const aFirstBooking = futureGrouped[a][0];
        const bFirstBooking = futureGrouped[b][0];
        const aTime = aFirstBooking.classInstanceSnapshot?.startTime || 0;
        const bTime = bFirstBooking.classInstanceSnapshot?.startTime || 0;
        return aTime - bTime;
    });

    remainingFutureDates.forEach(dateKey => {
        orderedResult[dateKey] = futureGrouped[dateKey];
    });

    // Since we're showing only the filtered bookings for each tab,
    // we don't need to show past bookings for upcoming/cancelled tabs

    return orderedResult;
};

export function BookingsScreen() {
    const { showActionSheetWithOptions } = useActionSheet();
    const navigation = useNavigation();
    const user = useAuthenticatedUser()

    const [activeTab, setActiveTab] = useState<BookingTabType>('upcoming');
    const [cancelingBookingId, setCancelingBookingId] = useState<string | null>(null);
    const [rebookingBookingId, setRebookingBookingId] = useState<string | null>(null);

    // Mutations
    const cancelBooking = useMutation(api.mutations.bookings.cancelBooking);
    const bookClass = useMutation(api.mutations.bookings.bookClass);

    // Paginated query for all bookings (future and past)
    const {
        results: allBookings,
        status,
        loadMore,
        isLoading
    } = usePaginatedQuery(
        api.queries.bookings.getCurrentUserBookings,
        {
            includeHistory: true,
        },
        { initialNumItems: INITIAL_BOOKINGS_COUNT }
    );

    // Group bookings by date for FlashList based on active tab
    const bookingsSections = useMemo(() => {
        if (!allBookings?.length) return [];

        const grouped = groupBookingsByDate(allBookings, activeTab);
        return Object.entries(grouped).map(([dateKey, bookings]) => ({
            title: dateKey,
            data: bookings,
        }));
    }, [allBookings, activeTab]);

    // Build flattened list with header indices for FlashList sticky headers and load more button
    const { flattenedItems, headerIndices } = useMemo(() => {
        const items: Array<{
            type: 'header';
            title: string
        } | {
            type: 'booking';
            data: Doc<"bookings">
        } | {
            type: 'loadMore'
        }> = [];
        const headerIdx: number[] = [];
        let i = 0;

        bookingsSections.forEach(section => {
            items.push({ type: 'header', title: section.title });
            headerIdx.push(i++);
            section.data.forEach(booking => {
                items.push({ type: 'booking', data: booking });
                i++;
            });
        });

        // Add load more button if there are more items to load
        if (status === 'CanLoadMore') {
            items.push({ type: 'loadMore' });
        }

        return { flattenedItems: items, headerIndices: headerIdx };
    }, [bookingsSections, status]);

    const handleTabChange = useCallback((tab: BookingTabType) => {
        setActiveTab(tab);
    }, []);

    const handleCancelBooking = (booking: Doc<"bookings">) => {
        const options = ['Cancel Booking', 'Keep Booking'];
        const destructiveButtonIndex = 0;
        const cancelButtonIndex = 1;

        // Calculate cancellation info for detailed message
        const className = booking.classInstanceSnapshot?.name ?? 'Class';
        let message = 'This action cannot be undone. You may not get a full refund depending on the cancellation policy.';

        if (booking.classInstanceSnapshot?.startTime && booking.classInstanceSnapshot?.cancellationWindowHours) {
            const cancellationInfo = getCancellationInfo(
                booking.classInstanceSnapshot.startTime,
                booking.classInstanceSnapshot.cancellationWindowHours
            );
            message = getCancellationMessage(className, cancellationInfo);
        }

        showActionSheetWithOptions({
            title: `Cancel "${className}"?`,
            message,
            options,
            cancelButtonIndex,
            destructiveButtonIndex,
        }, async (selectedIndex?: number) => {
            if (selectedIndex === undefined) return;

            switch (selectedIndex) {
                case destructiveButtonIndex:
                    await performBookingCancellation(booking);
                    break;

                case cancelButtonIndex:
                    break;
            }
        });
    };

    const performBookingCancellation = async (booking: Doc<"bookings">) => {
        try {
            setCancelingBookingId(booking._id);

            await cancelBooking({
                bookingId: booking._id as Id<"bookings">,
                reason: 'Cancelled by user via mobile app',
                cancelledBy: 'consumer'
            });

            // Success feedback
            Alert.alert(
                'Booking Cancelled',
                'Your booking has been successfully cancelled. Any applicable refund will be processed according to the cancellation policy.',
                [{ text: 'OK', style: 'default' }]
            );

        } catch (error: any) {
            console.error('Failed to cancel booking:', error);

            // Extract error message
            const errorMessage = error?.data?.message ||
                error?.message ||
                'Failed to cancel booking. Please try again or contact support.';

            Alert.alert(
                'Cancellation Failed',
                errorMessage,
                [{ text: 'OK', style: 'default' }]
            );
        } finally {
            setCancelingBookingId(null);
        }
    };



    const handleViewClass = (booking: Doc<"bookings">) => {
        if (!booking) {
            return;
        }

        // Navigate to ClassDetailsModal
        navigation.navigate('ClassDetailsModal', { classInstanceId: booking.classInstanceId });
    };

    const handleLoadMore = useCallback(() => {
        if (status === 'CanLoadMore' && !isLoading) {
            loadMore(LOAD_MORE_COUNT);
        }
    }, [status, isLoading, loadMore]);

    const renderFlashListItem = useCallback(({ item }: {
        item: {
            type: 'header';
            title: string
        } | {
            type: 'booking';
            data: Doc<"bookings">
        } | {
            type: 'loadMore'
        }
    }) => {
        if (item.type === 'header') {
            return (
                <View style={styles.stickyDateHeader}>
                    <Text style={styles.dateHeaderText}>
                        {item.title}
                    </Text>
                </View>
            );
        }

        if (item.type === 'loadMore') {
            return (
                <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={handleLoadMore}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#ff4747" />
                    ) : (
                        <Text style={styles.loadMoreText}>Load More</Text>
                    )}
                </TouchableOpacity>
            );
        }

        return (
            <BookingCard
                booking={item.data}
                onCancel={handleCancelBooking}
                onViewClass={handleViewClass}
                isCanceling={cancelingBookingId === item.data._id}
            />
        );
    }, [handleCancelBooking, handleViewClass, cancelingBookingId, handleLoadMore, isLoading]);

    // Check if there are bookings for the current tab
    const hasBookingsForCurrentTab = useMemo(() => {
        if (!allBookings?.length) return false;
        const filteredBookings = filterBookingsByTab(allBookings, activeTab);
        return filteredBookings.length > 0;
    }, [allBookings, activeTab]);
    const isInitialLoading = status === 'LoadingFirstPage';

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
                    <ActivityIndicator size="large" color="#ff4747" />
                    <Text style={styles.loadingText}>Loading your bookings...</Text>
                </View>
            ) : !hasBookingsForCurrentTab ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>
                        {activeTab === 'upcoming' && 'No upcoming bookings'}
                        {activeTab === 'cancelled' && 'No cancelled bookings'}
                        {activeTab === 'history' && 'No booking history'}
                    </Text>
                    <Text style={styles.emptyText}>
                        {activeTab === 'upcoming' && 'When you book classes, they\'ll appear here.\nExplore classes to get started!'}
                        {activeTab === 'cancelled' && 'Your cancelled bookings will appear here.'}
                        {activeTab === 'history' && 'Your past bookings will appear here once you attend classes.'}
                    </Text>
                </View>
            ) : (
                <FlashList
                    data={flattenedItems}
                    renderItem={renderFlashListItem}
                    keyExtractor={(item) => {
                        if (item.type === 'header') return `header-${item.title}`;
                        if (item.type === 'loadMore') return 'loadMore';
                        return `booking-${item.data._id}`;
                    }}
                    getItemType={(item) => item.type}
                    stickyHeaderIndices={headerIndices}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                />
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
        color: '#6b7280',
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
        color: '#111827',
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    listContainer: {
        paddingBottom: 100, // Account for tab bar
    },
    stickyDateHeader: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        zIndex: 2,
    },
    dateHeaderText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    loadMoreButton: {
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    loadMoreText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ff4747',
    },
}); 
