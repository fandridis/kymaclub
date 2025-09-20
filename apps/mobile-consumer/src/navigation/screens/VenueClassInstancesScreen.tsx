import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { XIcon } from 'lucide-react-native';
import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { ClassCard } from '../../components/ClassCard';
import { ScheduleList } from '../../components/ScheduleList';
import { useVenueClassInstances } from '../../hooks/use-venue-class-instances';
import type { RootStackParamListWithNestedTabs } from '..';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import type { VenueClassInstance } from '../../hooks/use-venue-class-instances';
import { theme } from '../../theme';

const now = Date.now();

type VenueClassInstancesRoute = RouteProp<RootStackParamListWithNestedTabs, 'VenueClassInstancesModal'>;

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

// Group classes by date (same as VenueDetailsScreen)
const groupClassesByDate = (classes: VenueClassInstance[]): Record<string, VenueClassInstance[]> => {
    const grouped: Record<string, VenueClassInstance[]> = {};

    classes.forEach((classInstance) => {
        const date = new Date(classInstance.startTime);
        const dateKey = formatDateHeader(date);

        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(classInstance);
    });

    // Sort classes within each day by start time
    Object.keys(grouped).forEach(dateKey => {
        grouped[dateKey].sort((a, b) => a.startTime - b.startTime);
    });

    return grouped;
};

export function VenueClassInstancesScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamListWithNestedTabs>>();
    const route = useRoute<VenueClassInstancesRoute>();
    const { venueId, venueName } = route.params;

    // Fetch next 14 days of class instances for this venue
    const fourteenDaysFromNow = useMemo(() => {
        const now = new Date();
        const fourteenDays = new Date(now);
        fourteenDays.setDate(now.getDate() + 14);
        fourteenDays.setHours(23, 59, 59, 999); // End of 14th day
        return fourteenDays.getTime();
    }, []);

    // 🚀 OPTIMIZED: Use venue-specific hook instead of filtering all classes
    const { classInstances: venueClasses, loading } = useVenueClassInstances({
        venueId: venueId as Id<"venues">,
        startDate: now,
        endDate: fourteenDaysFromNow,
        includeBookingStatus: true,
    });

    // Group classes by date for ScheduleList
    const scheduleSections = useMemo(() => {
        if (!venueClasses.length) return [];

        const grouped = groupClassesByDate(venueClasses);
        return Object.entries(grouped).map(([dateKey, classes]) => ({
            group: dateKey,
            items: classes,
        }));
    }, [venueClasses]);

    // Render function for individual class items
    const renderClassItem = useCallback((classInstance: VenueClassInstance) => (
        <ClassCard
            classInstance={classInstance as any}
            onPress={(classInstance) =>
                navigation.navigate('ClassDetailsModal', { classInstance })
            }
        />
    ), [navigation]);

    const handleBackPress = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{venueName}</Text>
                    <Text style={styles.headerSubtitle}>All Classes</Text>
                </View>
                <XIcon
                    size={24}
                    color={theme.colors.zinc[600]}
                    onPress={handleBackPress}
                    style={styles.closeButton}
                />
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff4747" />
                    <Text style={styles.loadingText}>Loading classes...</Text>
                </View>
            ) : scheduleSections.length > 0 ? (
                <View style={styles.listContainer}>
                    <ScheduleList
                        data={scheduleSections}
                        renderItem={renderClassItem}
                        keyExtractor={(classInstance) => classInstance._id}
                        contentContainerStyle={styles.scheduleListContent}
                    />
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>No upcoming classes</Text>
                    <Text style={styles.emptyText}>This venue doesn't have any classes scheduled for the next 14 days.</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.zinc[50],
    },
    header: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.zinc[200],
        backgroundColor: '#ffffff',
    },
    headerCenter: {
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 20,
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.zinc[950],
        marginBottom: 2,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.zinc[600],
        textAlign: 'center',
    },
    listContainer: {
        flex: 1,
    },
    scheduleListContent: {
        paddingBottom: 100, // Account for tab bar
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
        color: theme.colors.zinc[600],
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
        color: theme.colors.zinc[950],
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.zinc[600],
        textAlign: 'center',
        lineHeight: 24,
    },
});