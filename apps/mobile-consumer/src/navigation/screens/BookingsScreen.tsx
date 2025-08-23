import { Text } from '@react-navigation/elements';
import { StyleSheet, View, SafeAreaView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useQuery, useMutation } from 'convex/react';
import { usePaginatedQuery } from 'convex/react';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState, useCallback } from 'react';
import { FlashList } from '@shopify/flash-list';
import { api } from '@repo/api/convex/_generated/api';
import { BookingCard } from '../../components/BookingCard';
import { useAuth, useAuthenticatedUser } from '../../stores/auth-store';
import type { Doc, Id } from '@repo/api/convex/_generated/dataModel';
import { getCancellationInfo, getCancellationMessage } from '../../utils/cancellationUtils';
import { BookingWithDetails } from '@repo/api/types/booking';
import { theme } from '../../theme';

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

// Enhanced grouping for better mobile UX - separates future from past bookings
const groupBookingsByDate = (bookings: any[]): Record<string, any[]> => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // First, deduplicate bookings by showing only the latest booking per class instance
    const latestBookingsByClass = new Map<string, any>();
    
    bookings.forEach((booking: any) => {
        const classInstanceId = booking.classInstanceId;
        if (!classInstanceId) return;
        
        const existing = latestBookingsByClass.get(classInstanceId);
        if (!existing || booking.createdAt > existing.createdAt) {
            latestBookingsByClass.set(classInstanceId, booking);
        }
    });
    
    // Convert back to array with only latest bookings per class
    const deduplicatedBookings = Array.from(latestBookingsByClass.values());
    
    // Separate future and past bookings
    const futureBookings: any[] = [];
    const pastBookings: any[] = [];

    deduplicatedBookings.forEach((booking: any) => {
        // Use classInstanceSnapshot.startTime first, fallback to classInstance.startTime for backward compatibility
        const startTime = booking.classInstanceSnapshot?.startTime || booking.classInstance?.startTime;
        if (!startTime) return;

        if (startTime >= todayStart) {
            futureBookings.push(booking);
        } else {
            pastBookings.push(booking);
        }
    });

    // Sort future bookings by start time (earliest first)
    futureBookings.sort((a: any, b: any) => {
        const aTime = a.classInstanceSnapshot?.startTime || a.classInstance?.startTime || 0;
        const bTime = b.classInstanceSnapshot?.startTime || b.classInstance?.startTime || 0;
        return aTime - bTime;
    });

    // Sort past bookings by start time (most recent first)
    pastBookings.sort((a: any, b: any) => {
        const aTime = a.classInstanceSnapshot?.startTime || a.classInstance?.startTime || 0;
        const bTime = b.classInstanceSnapshot?.startTime || b.classInstance?.startTime || 0;
        return bTime - aTime;
    });

    // Group future bookings by date
    const futureGrouped: Record<string, any[]> = {};
    futureBookings.forEach((booking: any) => {
        const startTime = booking.classInstanceSnapshot?.startTime || booking.classInstance?.startTime;
        const date = new Date(startTime);
        const dateKey = formatDateHeader(date, false);

        if (!futureGrouped[dateKey]) {
            futureGrouped[dateKey] = [];
        }
        futureGrouped[dateKey].push(booking);
    });

    // Group past bookings by date
    const pastGrouped: Record<string, any[]> = {};
    pastBookings.forEach((booking: any) => {
        const startTime = booking.classInstanceSnapshot?.startTime || booking.classInstance?.startTime;
        const date = new Date(startTime);
        const dateKey = formatDateHeader(date, true);

        if (!pastGrouped[dateKey]) {
            pastGrouped[dateKey] = [];
        }
        pastGrouped[dateKey].push(booking);
    });

    // Sort bookings within each day by start time
    Object.keys(futureGrouped).forEach(dateKey => {
        futureGrouped[dateKey].sort((a: any, b: any) => {
            const aTime = a.classInstanceSnapshot?.startTime || a.classInstance?.startTime || 0;
            const bTime = b.classInstanceSnapshot?.startTime || b.classInstance?.startTime || 0;
            return aTime - bTime;
        });
    });

    Object.keys(pastGrouped).forEach(dateKey => {
        pastGrouped[dateKey].sort((a: any, b: any) => {
            const aTime = a.classInstanceSnapshot?.startTime || a.classInstance?.startTime || 0;
            const bTime = b.classInstanceSnapshot?.startTime || b.classInstance?.startTime || 0;
            return aTime - bTime;
        });
    });

    // Combine future and past with separator
    const orderedResult: Record<string, any[]> = {};

    // Add "UPCOMING BOOKINGS" separator first if there are future bookings
    const hasFutureBookings = Object.keys(futureGrouped).length > 0;
    if (hasFutureBookings) {
        orderedResult['UPCOMING BOOKINGS'] = []; // Empty array for separator
    }

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
        const aTime = aFirstBooking.classInstanceSnapshot?.startTime || aFirstBooking.classInstance?.startTime || 0;
        const bTime = bFirstBooking.classInstanceSnapshot?.startTime || bFirstBooking.classInstance?.startTime || 0;
        return aTime - bTime;
    });

    remainingFutureDates.forEach(dateKey => {
        orderedResult[dateKey] = futureGrouped[dateKey];
    });

    // Add separator if there are past bookings
    if (Object.keys(pastGrouped).length > 0) {
        orderedResult['PAST BOOKINGS'] = []; // Empty array for separator
    }

    // Add past bookings in reverse chronological order (most recent first)
    const pastDateOrder = Object.keys(pastGrouped).sort((a, b) => {
        // Get the first booking from each date group to compare dates
        const aFirstBooking = pastGrouped[a][0];
        const bFirstBooking = pastGrouped[b][0];
        const aTime = aFirstBooking.classInstanceSnapshot?.startTime || aFirstBooking.classInstance?.startTime || 0;
        const bTime = bFirstBooking.classInstanceSnapshot?.startTime || bFirstBooking.classInstance?.startTime || 0;
        return bTime - aTime; // Reverse order for past bookings
    });

    pastDateOrder.forEach(dateKey => {
        orderedResult[dateKey] = pastGrouped[dateKey];
    });

    return orderedResult;
};

export function BookingsScreen() {
    const { showActionSheetWithOptions } = useActionSheet();
    const navigation = useNavigation();
    const user = useAuthenticatedUser()

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

    // Group bookings by date for FlashList
    const bookingsSections = useMemo(() => {
        if (!allBookings?.length) return [];

        // TEST: Add fake past bookings for testing date grouping
        const fakeBookings = [
            {
                _id: 'fake-1',
                status: 'completed',
                classInstanceSnapshot: {
                    startTime: new Date('2024-08-21T10:00:00').getTime(),
                    name: 'Morning Yoga',
                },
                classTemplate: { name: 'Morning Yoga', cancellationWindowHours: 24 },
                venue: { name: 'Wellness Center' }
            },
            {
                _id: 'fake-2', 
                status: 'completed',
                classInstanceSnapshot: {
                    startTime: new Date('2024-08-21T15:30:00').getTime(),
                    name: 'Pilates Class',
                },
                classTemplate: { name: 'Pilates Class', cancellationWindowHours: 24 },
                venue: { name: 'Fitness Studio' }
            },
            {
                _id: 'fake-3',
                status: 'completed', 
                classInstanceSnapshot: {
                    startTime: new Date('2024-08-20T09:00:00').getTime(),
                    name: 'HIIT Workout',
                },
                classTemplate: { name: 'HIIT Workout', cancellationWindowHours: 24 },
                venue: { name: 'Gym Plus' }
            },
            {
                _id: 'fake-4',
                status: 'completed',
                classInstanceSnapshot: {
                    startTime: new Date('2024-08-15T18:00:00').getTime(),
                    name: 'Evening Meditation',
                },
                classTemplate: { name: 'Evening Meditation', cancellationWindowHours: 24 },
                venue: { name: 'Zen Center' }
            },
            {
                _id: 'fake-5',
                status: 'completed',
                classInstanceSnapshot: {
                    startTime: new Date('2024-08-14T11:30:00').getTime(),
                    name: 'CrossFit Training',
                },
                classTemplate: { name: 'CrossFit Training', cancellationWindowHours: 24 },
                venue: { name: 'Box Gym' }
            },
        ];

        // Combine real bookings with fake test bookings
        const allBookingsWithTest = [...allBookings, ...fakeBookings];

        const grouped = groupBookingsByDate(allBookingsWithTest);
        return Object.entries(grouped).map(([dateKey, bookings]) => ({
            title: dateKey,
            data: bookings,
        }));
    }, [allBookings]);

    // Build flattened list with header indices for FlashList sticky headers and load more button
    const { flattenedItems, headerIndices } = useMemo(() => {
        const items: Array<{
            type: 'header';
            title: string
        } | {
            type: 'booking';
            data: any
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

    const handleCancelBooking = (booking: BookingWithDetails) => {
        const options = ['Cancel Booking', 'Keep Booking'];
        const destructiveButtonIndex = 0;
        const cancelButtonIndex = 1;

        // Calculate cancellation info for detailed message
        const className = booking.classInstance?.name ?? booking.classTemplate?.name ?? 'Class';
        let message = 'This action cannot be undone. You may not get a full refund depending on the cancellation policy.';

        if (booking.classInstance?.startTime && booking.classTemplate?.cancellationWindowHours) {
            const cancellationInfo = getCancellationInfo(
                booking.classInstance.startTime,
                booking.classTemplate.cancellationWindowHours
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
                    console.log('Keep booking');
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

    const handleRebookClass = async (booking: BookingWithDetails) => {
        if (!booking.classInstanceId) {
            Alert.alert('Error', 'Cannot rebook this class. Class information is missing.');
            return;
        }

        try {
            setRebookingBookingId(booking._id);

            await bookClass({
                classInstanceId: booking.classInstanceId,
                description: `Rebooking for ${booking.classInstance?.name || 'class'}`,
            });

            Alert.alert(
                'Rebooked Successfully',
                'Your class has been rebooked successfully!',
                [{ text: 'OK', style: 'default' }]
            );
        } catch (error: any) {
            console.error('Failed to rebook class:', error);

            const errorMessage = error?.data?.message ||
                error?.message ||
                'Failed to rebook class. Please try again or contact support.';

            Alert.alert(
                'Rebooking Failed',
                errorMessage,
                [{ text: 'OK', style: 'default' }]
            );
        } finally {
            setRebookingBookingId(null);
        }
    };

    const handleViewClass = (classInstance: Doc<"classInstances">) => {
        if (!classInstance) {
            console.log('No class instance available');
            return;
        }

        // Navigate to ClassDetailsModal
        navigation.navigate('ClassDetailsModal', { classInstance });
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
            data: any
        } | {
            type: 'loadMore'
        }
    }) => {
        if (item.type === 'header') {
            // Special styling for section separators
            const isPastBookingsSeparator = item.title === 'PAST BOOKINGS';
            const isUpcomingBookingsSeparator = item.title === 'UPCOMING BOOKINGS';
            const isSectionSeparator = isPastBookingsSeparator || isUpcomingBookingsSeparator;
            
            return (
                <View style={[
                    styles.stickyDateHeader,
                    isSectionSeparator && styles.sectionSeparator
                ]}>
                    <Text style={[
                        styles.dateHeaderText,
                        isSectionSeparator && styles.sectionSeparatorText
                    ]}>
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

    const hasBookings = allBookings && allBookings.length > 0;
    const isInitialLoading = status === 'LoadingFirstPage';

    // log the statuses of all bookings, each on a separate line: bookingId : booking.status
    console.log(
        '----- [BookingsScreen] allBookings -----\n' +
        allBookings.map((booking) => `${booking._id} : ${booking.status}`).join('\n')
    );

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.title}>Bookings</Text>
                <Text style={styles.emptyText}>Please sign in to view your bookings</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>My Bookings</Text>

            {isInitialLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff4747" />
                    <Text style={styles.loadingText}>Loading your bookings...</Text>
                </View>
            ) : !hasBookings ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>No bookings yet</Text>
                    <Text style={styles.emptyText}>
                        When you book classes, they'll appear here.{'\n'}
                        Explore classes to get started!
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
    title: {
        fontSize: theme.fontSize['2xl'],
        fontWeight: theme.fontWeight.black,
        color: theme.colors.zinc[900],
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
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
    sectionSeparator: {
        paddingTop: 32,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
        borderBottomColor: '#d1d5db',
        borderBottomWidth: 2,
    },
    sectionSeparatorText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#374151',
        letterSpacing: 1,
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
