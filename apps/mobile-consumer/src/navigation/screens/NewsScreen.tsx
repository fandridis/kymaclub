import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Carousel from 'react-native-reanimated-carousel';
import { useQuery } from 'convex/react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { api } from '@repo/api/convex/_generated/api';
import { useTypedTranslation } from '../../i18n/typed';
import { theme } from '../../theme';
import { TabScreenHeader } from '../../components/TabScreenHeader';
import { useAuthenticatedUser } from '../../stores/auth-store';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import { useCurrentTime } from '../../hooks/use-current-time';
import { VenueCard } from '../../components/VenueCard';
import { useAllVenues } from '../../features/explore/hooks/useAllVenues';
import type { RootStackParamListWithNestedTabs } from '../index';

const { width: screenWidth } = Dimensions.get('window');
const ITEM_SPACING = 12; // Spacing between cards
// Calculate width to show 2 full cards + 1/4 of 3rd card
// Total visible = 2 + 0.25 = 2.25 cards, accounting for spacing
const ITEM_WIDTH = (screenWidth - (ITEM_SPACING * 4)) / 2; // 4 spacings: left padding, between cards, right padding

// Mock data for carousels
const mockUpcomingClasses = [
    { id: 1, title: 'Yoga Flow', time: '10:00 AM', instructor: 'Sarah Johnson', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' },
    { id: 2, title: 'Pilates Core', time: '2:00 PM', instructor: 'Mike Chen', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' },
    { id: 3, title: 'HIIT Training', time: '6:00 PM', instructor: 'Emma Davis', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' },
    { id: 4, title: 'Zumba Dance', time: '7:30 PM', instructor: 'Carlos Rodriguez', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' },
];

const mockLastMinuteOffers = [
    { id: 1, title: '50% Off Yoga', originalPrice: '$30', discountedPrice: '$15', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' },
    { id: 2, title: 'Flash Sale Pilates', originalPrice: '$25', discountedPrice: '$12', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' },
    { id: 3, title: 'HIIT Bundle Deal', originalPrice: '$40', discountedPrice: '$20', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' },
];

const mockNewClasses = [
    { id: 1, title: 'Aerial Yoga', level: 'Intermediate', instructor: 'Lisa Park', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' },
    { id: 2, title: 'Boxing Basics', level: 'Beginner', instructor: 'Tom Wilson', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' },
    { id: 3, title: 'Meditation & Mindfulness', level: 'All Levels', instructor: 'Dr. Zen', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' },
    { id: 4, title: 'Functional Training', level: 'Advanced', instructor: 'Alex Thompson', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' },
];

const mockCategories = [
    { id: 1, name: 'Yoga', count: '24 classes', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' },
    { id: 2, name: 'Strength', count: '18 classes', image: 'https://images.unsplash.com/photo-1571019613454-1fcb009e0b?w=400&h=300&fit=crop' },
    { id: 3, name: 'Cardio', count: '15 classes', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop' },
    { id: 4, name: 'Mind & Body', count: '12 classes', image: 'https://images.unsplash.com/photo-1571019613454-1fcb009e0b?w=400&h=300&fit=crop' },
];

const WhatsNewBanner = () => (
    <View style={styles.whatsNewBanner}>
        <View style={styles.bannerIcon}>
            <Text style={styles.bannerIconText}>🎉</Text>
        </View>
        <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>What's New!!!</Text>
            <Text style={styles.bannerSubtitle}>New yoga studio opening next week</Text>
        </View>
        <View style={styles.bannerAction}>
            <Text style={styles.bannerActionText}>Learn More</Text>
        </View>
    </View>
);

const NoUpcomingClassesMessage = ({ onExplorePress }: { onExplorePress: () => void }) => (
    <View style={styles.noClassesContainer}>
        <View style={styles.noClassesIcon}>
            <Text style={styles.noClassesIconText}>📅</Text>
        </View>
        <Text style={styles.noClassesTitle}>You have no upcoming classes</Text>
        <TouchableOpacity onPress={onExplorePress} style={styles.exploreButton}>
            <Text style={styles.exploreButtonText}>explore here</Text>
        </TouchableOpacity>
    </View>
);

const CarouselItem = ({ item, type }: { item: any; type: string }) => {
    const renderContent = () => {
        switch (type) {
            case 'upcoming':
                return (
                    <View style={styles.upcomingItem}>
                        <View style={styles.upcomingImageContainer}>
                            {item.imageUrl ? (
                                <Image
                                    source={{ uri: item.imageUrl }}
                                    style={styles.upcomingImage}
                                    contentFit="cover"
                                    transition={200}
                                    cachePolicy="memory-disk"
                                />
                            ) : (
                                <View style={[styles.upcomingImage, styles.placeholderImage]} />
                            )}
                        </View>
                        <View style={styles.upcomingContent}>
                            <Text style={styles.upcomingTitle} numberOfLines={1}>{item.title}</Text>
                            <View style={styles.upcomingTimeRow}>
                                <Text style={styles.upcomingTime}>{item.time}</Text>
                                {item.date && <Text style={styles.upcomingDate}>{item.date}</Text>}
                            </View>
                            <Text style={styles.upcomingInstructor} numberOfLines={1}>{item.instructor}</Text>
                            {item.venue && <Text style={styles.upcomingVenue} numberOfLines={1}>{item.venue}</Text>}
                            {item.price && <Text style={styles.upcomingPrice}>{item.price}</Text>}
                        </View>
                    </View>
                );
            case 'offers':
                return (
                    <View style={styles.offerItem}>
                        <View style={styles.offerImageContainer}>
                            {item.imageUrl ? (
                                <Image
                                    source={{ uri: item.imageUrl }}
                                    style={styles.offerImage}
                                    contentFit="cover"
                                    transition={200}
                                    cachePolicy="memory-disk"
                                />
                            ) : (
                                <View style={[styles.offerImage, styles.placeholderImage]} />
                            )}
                            <View style={styles.offerBadge}>
                                <Text style={styles.offerBadgeText}>20% OFF</Text>
                            </View>
                        </View>
                        <View style={styles.offerContent}>
                            <Text style={styles.offerTitle} numberOfLines={1}>{item.title}</Text>
                            {item.subtitle && <Text style={styles.offerSubtitle}>{item.subtitle}</Text>}
                            {item.venueName && <Text style={styles.offerVenue} numberOfLines={1}>{item.venueName}</Text>}
                            {item.instructor && <Text style={styles.offerInstructor} numberOfLines={1}>{item.instructor}</Text>}
                            <View style={styles.priceContainer}>
                                <Text style={styles.originalPrice}>{item.originalPrice}</Text>
                                <Text style={styles.discountedPrice}>{item.discountedPrice}</Text>
                            </View>
                        </View>
                    </View>
                );
            case 'new':
                return (
                    <View style={styles.newVenueItem}>
                        <View style={styles.newVenueImageContainer}>
                            {item.imageUrl ? (
                                <Image
                                    source={{ uri: item.imageUrl }}
                                    style={styles.newVenueImage}
                                    contentFit="cover"
                                    transition={200}
                                    cachePolicy="memory-disk"
                                />
                            ) : (
                                <View style={[styles.newVenueImage, styles.placeholderImage]} />
                            )}
                            <View style={styles.newVenueBadge}>
                                <Text style={styles.newVenueBadgeText}>NEW</Text>
                            </View>
                        </View>
                        <View style={styles.newVenueContent}>
                            <Text style={styles.newVenueTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.newVenueLevel}>{item.level}</Text>
                            <Text style={styles.newVenueLocation} numberOfLines={1}>{item.instructor}</Text>
                            {item.description && <Text style={styles.newVenueDescription} numberOfLines={2}>{item.description}</Text>}
                        </View>
                    </View>
                );
            case 'categories':
                return (
                    <View style={styles.categoryItem}>
                        <View style={styles.categoryImageContainer}>
                            <View style={styles.categoryImage} />
                        </View>
                        <View style={styles.categoryContent}>
                            <Text style={styles.categoryName}>{item.name}</Text>
                            <Text style={styles.categoryCount}>{item.count}</Text>
                        </View>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.carouselItem}>
            {renderContent()}
        </View>
    );
};

const CarouselSection = ({ title, data, type }: { title: string; data: any[]; type: string }) => {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.carouselContainer}>
                <Carousel
                    loop={false}
                    width={ITEM_WIDTH}
                    height={200}
                    data={data}
                    scrollAnimationDuration={500}
                    renderItem={({ item }) => <CarouselItem item={item} type={type} />}
                    style={styles.carousel}
                    onConfigurePanGesture={(gestureChain) => {
                        gestureChain
                            .activeOffsetX([-10, 10])    // Activate on 10px horizontal movement
                            .failOffsetY([-15, 15]);     // Fail if vertical movement > 15px first
                    }}
                />
            </View>
        </View>
    );
};

export function NewsScreen() {
    const { t } = useTypedTranslation();
    const navigation = useNavigation<NavigationProp<RootStackParamListWithNestedTabs>>();
    const user = useAuthenticatedUser();

    const now = useCurrentTime();
    const next12Hours = useMemo(() => new Date(now.getTime() + (12 * 60 * 60 * 1000)), [now]);
    const thirtyDaysAgo = useMemo(() => new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)), [now]);

    // Query for user's upcoming bookings (for "Your upcoming classes")
    const userBookings = useQuery(
        api.queries.bookings.getCurrentUserUpcomingBookings,
        user ? { daysAhead: 7 } : "skip"
    );

    // Query for last minute offers (classes starting in next 12 hours)
    const lastMinuteClassInstances = useQuery(
        api.queries.classInstances.getClassInstances,
        {
            startDate: now.getTime(),
            endDate: next12Hours.getTime()
        }
    );

    // Get venues with image URLs using custom hook
    const { venues: allVenues, venuesLoading, storageIdToUrl } = useAllVenues();

    // Get class instance IDs from user bookings to fetch full class instances
    const upcomingClassInstanceIds = useMemo(() => {
        if (!userBookings?.length) return [];

        return userBookings
            .filter(booking => booking.status === 'pending')
            .slice(0, 4) // Limit to first 4
            .map(booking => booking.classInstanceId)
            .filter(Boolean) as string[];
    }, [userBookings]);

    // Fetch full class instances for upcoming bookings to get template images
    const upcomingClassInstances = useQuery(
        api.queries.classInstances.getClassInstances,
        upcomingClassInstanceIds.length > 0 ? {
            startDate: now.getTime() - (24 * 60 * 60 * 1000), // Start from yesterday to catch today's classes
            endDate: now.getTime() + (30 * 24 * 60 * 60 * 1000) // Next 30 days
        } : "skip"
    );

    // Collect image storage IDs for class instances only (venues handled by useAllVenues hook)
    const classImageIds = useMemo(() => {
        const ids: string[] = [];

        // From upcoming class instances (template snapshots) - for upcoming classes
        upcomingClassInstances?.forEach(instance => {
            if (instance.templateSnapshot?.imageStorageIds) {
                ids.push(...instance.templateSnapshot.imageStorageIds);
            }
            if (instance.venueSnapshot?.imageStorageIds) {
                ids.push(...instance.venueSnapshot.imageStorageIds);
            }
        });

        // From last minute class instances (template snapshots) - for last minute offers
        lastMinuteClassInstances?.forEach(instance => {
            if (instance.templateSnapshot?.imageStorageIds) {
                ids.push(...instance.templateSnapshot.imageStorageIds);
            }
            if (instance.venueSnapshot?.imageStorageIds) {
                ids.push(...instance.venueSnapshot.imageStorageIds);
            }
        });

        return [...new Set(ids)]; // Remove duplicates
    }, [upcomingClassInstances, lastMinuteClassInstances]);

    // Fetch image URLs for class instances only
    const classImageUrlsQuery = useQuery(
        api.queries.uploads.getUrls,
        classImageIds.length > 0 ? { storageIds: classImageIds as Id<"_storage">[] } : "skip"
    );

    // Create storage ID to URL mapping for class instances (merge with venue URLs from hook)
    const classImageStorageIdToUrl = useMemo(() => {
        const map = new Map<string, string | null>();
        if (classImageUrlsQuery) {
            for (const { storageId, url } of classImageUrlsQuery) {
                map.set(storageId, url);
            }
        }
        return map;
    }, [classImageUrlsQuery]);

    // Combine both storage ID to URL mappings
    const combinedStorageIdToUrl = useMemo(() => {
        const combined = new Map(storageIdToUrl);
        for (const [storageId, url] of classImageStorageIdToUrl) {
            combined.set(storageId, url);
        }
        return combined;
    }, [storageIdToUrl, classImageStorageIdToUrl]);

    // Process data for upcoming classes - use stale data when available
    const upcomingClasses = useMemo(() => {
        // Always use the most recent data available, even if some queries are refreshing
        const bookingsData = userBookings || [];
        if (!bookingsData.length) return [];

        return bookingsData
            .filter(booking => booking.status === 'pending')
            .slice(0, 4) // Show max 4 items
            .map(booking => {
                // Find the matching class instance
                const classInstance = upcomingClassInstances?.find(instance =>
                    instance._id === booking.classInstanceId
                );

                // Get image URL (prioritize template images, fallback to venue images)
                const templateImageId = classInstance?.templateSnapshot?.imageStorageIds?.[0];
                const venueImageId = classInstance?.venueSnapshot?.imageStorageIds?.[0];
                const imageUrl = templateImageId ? combinedStorageIdToUrl.get(templateImageId) :
                    venueImageId ? combinedStorageIdToUrl.get(venueImageId) : null;

                // Enhanced date/time formatting
                const startTime = booking.classInstanceSnapshot?.startTime;
                const startDate = startTime ? new Date(startTime) : null;
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);

                // Format date with relative context
                let dateDisplay = '';
                if (startDate) {
                    const isToday = startDate.toDateString() === today.toDateString();
                    const isTomorrow = startDate.toDateString() === tomorrow.toDateString();

                    if (isToday) {
                        dateDisplay = 'Today';
                    } else if (isTomorrow) {
                        dateDisplay = 'Tomorrow';
                    } else {
                        dateDisplay = startDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                        });
                    }
                }

                // Time formatting
                const timeDisplay = startDate ? startDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                }) : '';

                // Get venue address from class instance
                const venueAddress = classInstance?.venueSnapshot?.address;
                const addressText = venueAddress ?
                    `${venueAddress.street}, ${venueAddress.city}${venueAddress.zipCode ? ` ${venueAddress.zipCode}` : ''}` :
                    '';

                return {
                    id: booking._id,
                    title: booking.classInstanceSnapshot?.name || 'Class',
                    time: timeDisplay,
                    date: dateDisplay,
                    dateTime: startDate ? `${dateDisplay} at ${timeDisplay}` : '',
                    instructor: booking.classInstanceSnapshot?.instructor || 'Instructor',
                    venue: booking.venueSnapshot?.name || 'Venue',
                    venueAddress: addressText,
                    price: booking.finalPrice ? `${booking.finalPrice} credits` : 'Free',
                    imageUrl,
                    startTime: booking.classInstanceSnapshot?.startTime,
                    classInstanceId: booking.classInstanceId
                };
            })
            .sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    }, [userBookings, upcomingClassInstances, combinedStorageIdToUrl]);

    // Process data for last minute offers - use stale data when available
    const lastMinuteOffers = useMemo(() => {
        // Use most recent data available, even if refreshing
        const classInstancesData = lastMinuteClassInstances || [];
        if (!classInstancesData.length) return [];

        return classInstancesData
            .filter(instance => {
                const timeUntilStart = (instance.startTime - now.getTime()) / (1000 * 60 * 60);
                return timeUntilStart <= 12 && timeUntilStart > 0;
            })
            .slice(0, 4)
            .map(instance => {
                const timeUntilStart = (instance.startTime - now.getTime()) / (1000 * 60 * 60);
                const templateImageId = instance.templateSnapshot?.imageStorageIds?.[0];
                const venueImageId = instance.venueSnapshot?.imageStorageIds?.[0];
                const imageUrl = templateImageId ? combinedStorageIdToUrl.get(templateImageId) :
                    venueImageId ? combinedStorageIdToUrl.get(venueImageId) : null;

                return {
                    id: instance._id,
                    title: instance.name || 'Class',
                    subtitle: `Starting in ${Math.floor(timeUntilStart)}h`,
                    originalPrice: instance.price ? `${(instance.price / 100).toFixed(0)}€` : '25€',
                    discountedPrice: instance.price ? `${Math.floor(instance.price * 0.8 / 100)}€` : '20€',
                    venueName: instance.venueSnapshot?.name,
                    venueCity: instance.venueSnapshot?.address?.city,
                    instructor: instance.templateSnapshot?.instructor,
                    imageUrl,
                    startTime: instance.startTime,
                    classInstanceId: instance._id
                };
            });
    }, [lastMinuteClassInstances, now, combinedStorageIdToUrl]);

    // Process data for new venues - use stale data when available
    const newVenues = useMemo(() => {
        // Use most recent data available, even if refreshing
        const venuesData = allVenues || [];
        if (!venuesData.length) return [];

        return venuesData
            .filter(venue => {
                const venueAge = now.getTime() - venue.createdAt;
                const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
                return venueAge <= thirtyDaysInMs;
            })
            .sort((a, b) => b.createdAt - a.createdAt) // Newest first
            .slice(0, 4)
            .map(venue => {
                const imageUrl = venue.imageStorageIds?.[0] ? combinedStorageIdToUrl.get(venue.imageStorageIds[0]) : null;
                const daysOld = Math.floor((now.getTime() - venue.createdAt) / (1000 * 60 * 60 * 24));

                return {
                    id: venue._id,
                    title: venue.name,
                    level: daysOld === 0 ? 'Opened Today!' : `${daysOld} days old`,
                    instructor: `${venue.address?.city || 'Location'}${venue.address?.country ? `, ${venue.address.country}` : ''}`,
                    description: venue.description || 'New fitness studio',
                    imageUrl,
                    createdAt: venue.createdAt,
                    venueId: venue._id
                };
            });
    }, [allVenues, now, combinedStorageIdToUrl]);

    // Get actual venue objects for VenueCard (new studios section)
    const newVenuesForCards = useMemo(() => {
        const venuesData = allVenues || [];
        if (!venuesData.length) return [];

        return venuesData
            .filter(venue => {
                const venueAge = now.getTime() - venue.createdAt;
                const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
                return venueAge <= thirtyDaysInMs;
            })
            .sort((a, b) => b.createdAt - a.createdAt) // Newest first
            .slice(0, 4);
    }, [allVenues, now]);

    // Handle navigation to explore screen
    const handleExplorePress = () => {
        navigation.navigate('Home', { screen: 'Explore' });
    };

    // Separate initial loading from refetching - only show loading screen on very first load
    const isInitialLoading = user && (
        userBookings === undefined &&
        lastMinuteClassInstances === undefined &&
        (allVenues === undefined || venuesLoading)
    );

    // Loading state - only show loading screen if we have no data at all (initial load)
    if (isInitialLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <TabScreenHeader title={t('welcome.title')} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff4747" />
                    <Text style={styles.loadingText}>Loading news...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TabScreenHeader title={t('welcome.title')} />
            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.subtitleContainer}>
                    <Text style={styles.subtitleText}>Discover amazing fitness classes</Text>
                </View>

                <WhatsNewBanner />

                {/* Your Schedule - Horizontal scroll section */}
                {upcomingClasses.length > 0 ? (
                    <View style={styles.scheduleSection}>
                        <Text style={styles.scheduleSectionTitle}>Your Schedule</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.scheduleScrollContainer}
                            decelerationRate="fast"
                            snapToInterval={screenWidth * 0.8 + 16}
                            snapToAlignment="start"
                        >
                            {upcomingClasses.map((classItem, index) => (
                                <View key={classItem.id} style={styles.scheduleCard}>
                                    {/* Image section with overlay */}
                                    <View style={styles.scheduleImageContainer}>
                                        {classItem.imageUrl ? (
                                            <Image
                                                source={{ uri: classItem.imageUrl }}
                                                style={styles.scheduleImage}
                                                contentFit="cover"
                                                transition={200}
                                                cachePolicy="memory-disk"
                                            />
                                        ) : (
                                            <View style={[styles.scheduleImage, styles.placeholderImage]} />
                                        )}

                                        {/* Gradient overlay */}
                                        <LinearGradient
                                            pointerEvents="none"
                                            colors={[
                                                'transparent',
                                                'rgba(0,0,0,0.25)',
                                                'rgba(0,0,0,0.65)',
                                            ]}
                                            locations={[0, 0.5, 1]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 0, y: 1 }}
                                            style={styles.scheduleImageGradient}
                                        />

                                        {/* Text overlay on image */}
                                        <View style={styles.scheduleImageOverlay}>
                                            <Text style={styles.scheduleOverlayClassName} numberOfLines={1}>
                                                {classItem.title}
                                            </Text>
                                            <Text style={styles.scheduleOverlayInstructor} numberOfLines={1}>
                                                with {classItem.instructor}
                                            </Text>
                                        </View>

                                        {/* Price badge */}
                                        <View style={styles.schedulePriceBadge}>
                                            <Text style={styles.schedulePriceBadgeText}>{classItem.price}</Text>
                                        </View>
                                    </View>

                                    {/* Simplified content section */}
                                    <View style={styles.scheduleContent}>
                                        <View style={styles.scheduleTimeRow}>
                                            <Text style={styles.scheduleDate}>{classItem.date}</Text>
                                            <Text style={styles.scheduleTime}>{classItem.time}</Text>
                                        </View>

                                        <Text style={styles.scheduleVenue} numberOfLines={1}>
                                            {classItem.venue}
                                        </Text>
                                        {classItem.venueAddress && (
                                            <Text style={styles.scheduleAddress} numberOfLines={2}>
                                                {classItem.venueAddress}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                ) : (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Schedule</Text>
                        <NoUpcomingClassesMessage onExplorePress={handleExplorePress} />
                    </View>
                )}

                <CarouselSection
                    title="Last minute offers"
                    data={lastMinuteOffers.length > 0 ? lastMinuteOffers : mockLastMinuteOffers}
                    type="offers"
                />

                {/* New studios section - horizontal carousel with VenueCards */}
                {newVenuesForCards.length > 0 && (
                    <View style={styles.newStudiosSection}>
                        <Text style={styles.newStudiosSectionTitle}>New studios</Text>
                        <Carousel
                            width={ITEM_WIDTH}
                            height={300}
                            data={newVenuesForCards}
                            scrollAnimationDuration={600}
                            style={styles.carousel}
                            loop={false}
                            renderItem={({ item: venue }) => (
                                <View style={styles.carouselItem}>
                                    <VenueCard
                                        venue={venue}
                                        storageIdToUrl={storageIdToUrl}
                                        onPress={(selectedVenue) => {
                                            // Handle venue press - you can navigate to venue details
                                            console.log('Venue pressed:', selectedVenue.name);
                                        }}
                                    />
                                </View>
                            )}
                        />
                    </View>
                )}

                <CarouselSection
                    title="Categories"
                    data={mockCategories}
                    type="categories"
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollContainer: {
        flex: 1,
        backgroundColor: theme.colors.zinc[50],
    },
    scrollContent: {
        paddingBottom: 80,
    },
    subtitleContainer: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: theme.colors.zinc[50],
    },
    subtitleText: {
        fontSize: 16,
        color: '#6c757d',
    },
    section: {
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    carouselContainer: {
        paddingHorizontal: 20,
    },
    carousel: {
        width: screenWidth,
    },
    carouselItem: {
        width: ITEM_WIDTH,
        paddingHorizontal: ITEM_SPACING / 2,
    },
    // Upcoming classes styles
    upcomingItem: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    upcomingImageContainer: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    upcomingImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#e9ecef',
        borderRadius: 12,
    },
    upcomingContent: {
        flex: 1,
    },
    upcomingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    upcomingTime: {
        fontSize: 14,
        color: '#007bff',
        fontWeight: '500',
        marginBottom: 2,
    },
    upcomingInstructor: {
        fontSize: 12,
        color: '#6c757d',
    },
    upcomingTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    upcomingDate: {
        fontSize: 11,
        color: '#8b5cf6',
        fontWeight: '500',
    },
    upcomingVenue: {
        fontSize: 11,
        color: '#9ca3af',
        fontStyle: 'italic',
        marginBottom: 2,
    },
    upcomingPrice: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '600',
        backgroundColor: '#d1fae5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    // Offers styles
    offerItem: {
        backgroundColor: '#fff3cd',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#ffc107',
    },
    offerImageContainer: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    offerImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#ffeaa7',
        borderRadius: 12,
    },
    offerContent: {
        flex: 1,
    },
    offerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#856404',
        marginBottom: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    originalPrice: {
        fontSize: 14,
        color: '#6c757d',
        textDecorationLine: 'line-through',
    },
    discountedPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#dc3545',
    },
    offerBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#dc3545',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    offerBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ffffff',
    },
    offerSubtitle: {
        fontSize: 12,
        color: '#856404',
        fontWeight: '500',
        marginBottom: 2,
    },
    offerVenue: {
        fontSize: 11,
        color: '#6c757d',
        marginBottom: 2,
    },
    offerInstructor: {
        fontSize: 11,
        color: '#8b5cf6',
        marginBottom: 6,
    },
    // New venues styles
    newVenueItem: {
        backgroundColor: '#d1ecf1',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#17a2b8',
    },
    newVenueImageContainer: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    newVenueImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#bee5eb',
        borderRadius: 12,
    },
    newVenueBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#17a2b8',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    newVenueBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ffffff',
    },
    newVenueContent: {
        flex: 1,
    },
    newVenueTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0c5460',
        marginBottom: 4,
    },
    newVenueLevel: {
        fontSize: 12,
        color: '#17a2b8',
        fontWeight: '500',
        marginBottom: 2,
    },
    newVenueLocation: {
        fontSize: 11,
        color: '#6c757d',
        marginBottom: 4,
    },
    newVenueDescription: {
        fontSize: 10,
        color: '#8899a6',
        lineHeight: 14,
    },
    // Categories styles
    categoryItem: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    categoryImageContainer: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    categoryImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#e9ecef',
        borderRadius: 12,
    },
    categoryContent: {
        flex: 1,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    categoryCount: {
        fontSize: 12,
        color: '#6c757d',
    },
    // Whats New Banner styles
    whatsNewBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 16,
        marginBottom: 16,
        marginHorizontal: 20,
    },
    bannerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#64b5f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    bannerIconText: {
        fontSize: 24,
    },
    bannerContent: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    bannerSubtitle: {
        fontSize: 12,
        color: '#6c757d',
    },
    bannerAction: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#42a5f5',
        borderRadius: 8,
    },
    bannerActionText: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: '500',
    },
    // Loading styles
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
    // Image placeholder styles
    placeholderImage: {
        backgroundColor: '#f3f4f6',
    },
    // Your Schedule horizontal scroll section
    scheduleSection: {
        marginVertical: 10,
    },
    scheduleSectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    scheduleScrollContainer: {
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    scheduleCard: {
        width: screenWidth * 0.8,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    scheduleImageContainer: {
        width: '100%',
        height: 160,
        overflow: 'hidden',
        position: 'relative',
    },
    scheduleImage: {
        width: '100%',
        height: '100%',
    },
    scheduleImageGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
        zIndex: 1,
    },
    scheduleImageOverlay: {
        position: 'absolute',
        left: 12,
        bottom: 12,
        right: 60,
        zIndex: 2,
    },
    scheduleOverlayClassName: {
        fontSize: 22,
        fontWeight: '700',
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        marginBottom: 2,
    },
    scheduleOverlayInstructor: {
        fontSize: 15,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.9)',
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    schedulePriceBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        zIndex: 2,
    },
    schedulePriceBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8b5cf6',
    },
    scheduleContent: {
        padding: 16,
    },
    scheduleTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    scheduleDate: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8b5cf6',
        backgroundColor: '#ede9fe',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    scheduleTime: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    scheduleVenue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    scheduleAddress: {
        fontSize: 12,
        color: '#6b7280',
        lineHeight: 16,
    },
    // New studios section styles
    newStudiosSection: {
        marginVertical: 10,
    },
    newStudiosSectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    // No upcoming classes styles
    noClassesContainer: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
        backgroundColor: theme.colors.zinc[50],
        borderRadius: 12,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: theme.colors.zinc[200],
    },
    noClassesIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.zinc[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    noClassesIconText: {
        fontSize: 24,
    },
    noClassesTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.zinc[700],
        textAlign: 'center',
        marginBottom: 12,
    },
    exploreButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: theme.colors.zinc[800],
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.zinc[950],
    },
    exploreButtonText: {
        fontSize: 14,
        color: theme.colors.zinc[50],
        fontWeight: '500',
    },
});
