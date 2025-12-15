import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { XIcon, EuroIcon, ClockIcon } from 'lucide-react-native';
import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { Image } from 'expo-image';
import { startOfWeek, addWeeks, format, startOfDay, isBefore } from 'date-fns';
import type { RootStackParamListWithNestedTabs } from '..';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import { theme } from '../../theme';
import { DateFilterBar } from '../../components/DateFilterBar';
// Format cents to EUR display (e.g., 1200 -> "€12.00")
const formatEuro = (cents: number) => `€${(cents / 100).toFixed(2)}`;
import { useTypedTranslation } from '../../i18n/typed';

type VenueClassInstancesRoute = RouteProp<RootStackParamListWithNestedTabs, 'VenueClassInstancesModal'>;

// Helper function to format time from timestamp
function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

export function VenueClassInstancesScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamListWithNestedTabs>>();
    const route = useRoute<VenueClassInstancesRoute>();
    const { venueId, venueName, templateId } = route.params;
    const { t } = useTypedTranslation();

    // Track if we've determined the initial date (for templateId navigation)
    const [isInitializing, setIsInitializing] = useState(!!templateId);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Convert selected date string to start/end timestamps
    const { startDate, endDate } = useMemo(() => {
        const dateObj = new Date(selectedDate);
        const start = new Date(dateObj);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateObj);
        end.setHours(23, 59, 59, 999);
        return {
            startDate: start.getTime(),
            endDate: end.getTime(),
        };
    }, [selectedDate]);

    // Calculate full 4-week date range for class counts (Monday of current week + 4 weeks)
    const { fullRangeStart, fullRangeEnd } = useMemo(() => {
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const rangeEnd = addWeeks(weekStart, 4);
        rangeEnd.setHours(23, 59, 59, 999);
        return {
            fullRangeStart: weekStart.getTime(),
            fullRangeEnd: rangeEnd.getTime(),
        };
    }, []);

    // Fetch grouped class instances for the selected date
    const groupedClasses = useQuery(
        api.queries.classInstances.getVenueClassInstancesGroupedByTemplate,
        {
            venueId: venueId as Id<"venues">,
            startDate,
            endDate,
        }
    );

    // Fetch all instances for 4-week range to compute class counts per day
    const allInstancesForRange = useQuery(
        api.queries.classInstances.getVenueClassInstancesOptimized,
        {
            venueId: venueId as Id<"venues">,
            startDate: fullRangeStart,
            endDate: fullRangeEnd,
        }
    );

    // Compute class counts by date from the full range query
    const classCountsByDate = useMemo(() => {
        if (!allInstancesForRange) return {};

        const counts: Record<string, number> = {};
        for (const instance of allInstancesForRange) {
            const dateStr = format(new Date(instance.startTime), 'yyyy-MM-dd');
            counts[dateStr] = (counts[dateStr] || 0) + 1;
        }
        return counts;
    }, [allInstancesForRange]);

    // When a templateId is provided, find the first date with an instance of that template
    // and navigate to it automatically (only once when data loads)
    useEffect(() => {
        // If no templateId, we're not initializing
        if (!templateId) {
            setIsInitializing(false);
            return;
        }

        // Wait for data to load
        if (!allInstancesForRange) return;

        const today = startOfDay(new Date());

        // Filter instances for the specific template that are not in the past
        const templateInstances = allInstancesForRange
            .filter(instance => {
                const instanceDate = new Date(instance.startTime);
                // Compare templateId - it comes as a Convex Id type, so compare as strings
                const instanceTemplateId = (instance as any).templateId;
                return (
                    instanceTemplateId &&
                    String(instanceTemplateId) === templateId &&
                    !isBefore(instanceDate, today) // Not in the past
                );
            })
            .sort((a, b) => a.startTime - b.startTime);

        if (templateInstances.length > 0) {
            const firstInstanceDate = format(new Date(templateInstances[0].startTime), 'yyyy-MM-dd');
            setSelectedDate(firstInstanceDate);
        }

        // Mark initialization as complete
        setIsInitializing(false);
    }, [templateId, allInstancesForRange]);

    // Collect all image storage IDs from grouped classes
    const imageStorageIds = useMemo(() => {
        if (!groupedClasses) return [];
        const ids: Id<"_storage">[] = [];
        groupedClasses.forEach(classGroup => {
            if (classGroup.imageStorageIds?.length) {
                ids.push(classGroup.imageStorageIds[0]); // Only first image per class
            }
        });
        return ids;
    }, [groupedClasses]);

    // Fetch image URLs
    const imageUrlsQuery = useQuery(
        api.queries.uploads.getUrls,
        imageStorageIds.length > 0 ? { storageIds: imageStorageIds } : "skip"
    );

    // Create storage ID to URL mapping
    const storageIdToUrl = useMemo(() => {
        const map = new Map<string, string | null>();
        if (imageUrlsQuery) {
            for (const { storageId, url } of imageUrlsQuery) {
                map.set(storageId, url);
            }
        }
        return map;
    }, [imageUrlsQuery]);

    const isLoading = groupedClasses === undefined || isInitializing;

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleDateChange = useCallback((date: string) => {
        setSelectedDate(date);
    }, []);

    const handleInstancePress = useCallback((instanceId: Id<"classInstances">) => {
        navigation.navigate('ClassDetailsModal', {
            classInstanceId: instanceId,
        });
    }, [navigation]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{venueName}</Text>
                    <Text style={styles.headerSubtitle}>{t('venues.schedule')}</Text>
                </View>
                <TouchableOpacity onPress={handleBackPress} style={styles.closeButton} hitSlop={10}>
                    <XIcon size={24} color={theme.colors.zinc[600]} />
                </TouchableOpacity>
            </View>

            {/* Show loading while initializing (determining initial date) */}
            {isInitializing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.emerald[600]} />
                    <Text style={styles.loadingText}>{t('venues.loadingSchedule')}</Text>
                </View>
            ) : (
                <>
                    {/* Date Picker */}
                    <DateFilterBar
                        selectedDate={selectedDate}
                        onDateChange={handleDateChange}
                        classCountsByDate={classCountsByDate}
                    />

                    {/* Content */}
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.emerald[600]} />
                            <Text style={styles.loadingText}>{t('venues.loadingSchedule')}</Text>
                        </View>
                    ) : groupedClasses && groupedClasses.length > 0 ? (
                        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                            {groupedClasses.map((classGroup, index) => {
                                const imageId = classGroup.imageStorageIds?.[0];
                                const imageUrl = imageId ? storageIdToUrl.get(imageId) : null;
                                const isLast = index === groupedClasses.length - 1;

                                return (
                                    <View key={classGroup.templateId} style={[styles.classItemContainer, !isLast && styles.classItemWithDivider]}>
                                        {/* Class Info */}
                                        <View style={styles.classDetailsRow}>
                                            <Image
                                                source={imageUrl ? { uri: imageUrl } : undefined}
                                                style={styles.classImage}
                                                contentFit="cover"
                                                transition={200}
                                            />
                                            <View style={styles.classInfo}>
                                                <Text style={styles.className}>{classGroup.name}</Text>
                                                <View style={styles.classMetaRow}>
                                                    <EuroIcon size={14} color={theme.colors.zinc[500]} />
                                                    <Text style={styles.classPrice}>{formatEuro(classGroup.price)}</Text>

                                                    <View style={styles.dotSeparator} />

                                                    <ClockIcon size={14} color={theme.colors.zinc[500]} />
                                                    <Text style={styles.classDuration}>{classGroup.duration} min</Text>
                                                </View>
                                                {classGroup.shortDescription && (
                                                    <Text style={styles.classDescription} numberOfLines={2}>
                                                        {classGroup.shortDescription}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>

                                        {/* Times Badges */}
                                        <View style={styles.badgesContainer}>
                                            {classGroup.instances.map((instance) => (
                                                <TouchableOpacity
                                                    key={instance._id}
                                                    style={[
                                                        styles.timeBadge,
                                                        instance.isBookedByUser && styles.timeBadgeBooked,
                                                        !instance.hasSpots && !instance.isBookedByUser && styles.timeBadgeDisabled
                                                    ]}
                                                    onPress={() => handleInstancePress(instance._id)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.timeBadgeText,
                                                            instance.isBookedByUser && styles.timeBadgeTextBooked,
                                                            !instance.hasSpots && !instance.isBookedByUser && styles.timeBadgeTextDisabled
                                                        ]}
                                                    >
                                                        {formatTime(instance.startTime)}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t('venues.noClassesOnDate')}</Text>
                        </View>
                    )}
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
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
    content: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: theme.colors.zinc[500],
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.zinc[500],
        textAlign: 'center',
    },
    classItemContainer: {
        paddingBottom: 20,
    },
    classItemWithDivider: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.zinc[200],
    },
    classDetailsRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center',
    },
    classImage: {
        width: 88,
        height: 84,
        borderRadius: 12,
        marginRight: 16,
        backgroundColor: '#f3f4f6',
    },
    classInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    className: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.zinc[900],
        marginBottom: 6,
    },
    classMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    classPrice: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.zinc[600],
        marginLeft: 6,
    },
    classDuration: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.zinc[600],
        marginLeft: 6,
    },
    dotSeparator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#d1d5db',
        marginHorizontal: 10,
    },
    classDescription: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
    },
    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    timeBadge: {
        backgroundColor: theme.colors.zinc[100],
        borderWidth: 1,
        borderColor: theme.colors.zinc[200],
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    timeBadgeBooked: {
        backgroundColor: theme.colors.emerald[50],
        borderColor: theme.colors.emerald[200],
    },
    timeBadgeDisabled: {
        backgroundColor: theme.colors.zinc[50],
        borderColor: theme.colors.zinc[200],
    },
    timeBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.zinc[700],
    },
    timeBadgeTextBooked: {
        color: theme.colors.emerald[700],
    },
    timeBadgeTextDisabled: {
        color: theme.colors.zinc[400],
        textDecorationLine: 'line-through',
    },
});
