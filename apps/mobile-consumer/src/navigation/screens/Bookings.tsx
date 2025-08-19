import { Text } from '@react-navigation/elements';
import { StyleSheet, View, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useQuery, useMutation } from 'convex/react';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState, useCallback } from 'react';
import { FlashList } from '@shopify/flash-list';
import { api } from '@repo/api/convex/_generated/api';
import { BookingCard } from '../../components/BookingCard';
import { useAuth, useAuthenticatedUser } from '../../stores/auth-store';
import type { Doc, Id } from '@repo/api/convex/_generated/dataModel';
import { getCancellationInfo, getCancellationMessage } from '../../utils/cancellationUtils';
import { BookingWithDetails } from '@repo/api/types/booking';

// Date formatting utilities (same as VenueDetailsScreen)
const formatDateHeader = (date: Date): string => {
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
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }
};

// Group bookings by date
const groupBookingsByDate = (bookings: any[]): Record<string, any[]> => {
    const grouped: Record<string, any[]> = {};

    bookings.forEach((booking: any) => {
        const startTime = booking.classInstance?.startTime;
        if (!startTime) return;

        const date = new Date(startTime);
        const dateKey = formatDateHeader(date);

        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(booking);
    });

    // Sort bookings within each day by start time
    Object.keys(grouped).forEach(dateKey => {
        grouped[dateKey].sort((a: any, b: any) => {
            const aTime = a.classInstance?.startTime || 0;
            const bTime = b.classInstance?.startTime || 0;
            return aTime - bTime;
        });
    });

    return grouped;
};

export function Bookings() {
    const { showActionSheetWithOptions } = useActionSheet();
    const navigation = useNavigation();
    const user = useAuthenticatedUser()

    const [cancelingBookingId, setCancelingBookingId] = useState<string | null>(null);

    // Mutations
    const cancelBooking = useMutation(api.mutations.bookings.cancelBooking);

    // Query for upcoming bookings
    const upcomingBookings = useQuery(api.queries.bookings.getCurrentUserUpcomingBookings, {
        daysAhead: 30,
    })

    // Group bookings by date for FlashList
    const bookingsSections = useMemo(() => {
        if (!upcomingBookings?.length) return [];

        const grouped = groupBookingsByDate(upcomingBookings);
        return Object.entries(grouped).map(([dateKey, bookings]) => ({
            title: dateKey,
            data: bookings,
        }));
    }, [upcomingBookings]);

    // Build flattened list with header indices for FlashList sticky headers
    const { flattenedItems, headerIndices } = useMemo(() => {
        const items: Array<{ type: 'header'; title: string } | { type: 'booking'; data: any }> = [];
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

        return { flattenedItems: items, headerIndices: headerIdx };
    }, [bookingsSections]);

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

    const handleViewClass = (classInstance: Doc<"classInstances">) => {
        if (!classInstance) {
            console.log('No class instance available');
            return;
        }

        // Navigate to ClassDetailsModal
        navigation.navigate('ClassDetailsModal', { classInstance });
    };

    const renderFlashListItem = useCallback(({ item }: { item: { type: 'header'; title: string } | { type: 'booking'; data: any } }) => {
        if (item.type === 'header') {
            return (
                <View style={styles.stickyDateHeader}>
                    <Text style={styles.dateHeaderText}>{item.title}</Text>
                </View>
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
    }, [handleCancelBooking, handleViewClass, cancelingBookingId]);

    const hasBookings = upcomingBookings && upcomingBookings.length > 0;

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

            {upcomingBookings === undefined ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff4747" />
                    <Text style={styles.loadingText}>Loading your bookings...</Text>
                </View>
            ) : !hasBookings ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>No upcoming bookings</Text>
                    <Text style={styles.emptyText}>
                        When you book classes, they'll appear here.{'\n'}
                        Explore classes to get started!
                    </Text>
                </View>
            ) : (
                <FlashList
                    data={flattenedItems}
                    renderItem={renderFlashListItem}
                    keyExtractor={(item) => item.type === 'header' ? `header-${item.title}` : `booking-${item.data._id}`}
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
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
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
}); 
