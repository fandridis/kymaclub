import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MapPinIcon } from 'lucide-react-native';
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
import { centsToCredits } from '@repo/utils/credits';

const { width: screenWidth } = Dimensions.get('window');

// Unified carousel constants
const CAROUSEL_HEIGHT = 220; // Unified height for all carousels
const ITEM_GAP = 8; // Gap between items
const SECTION_PADDING = 20; // Horizontal padding for sections
const CAROUSEL_PADDING = SECTION_PADDING - (ITEM_GAP / 2); // Adjust for item gaps

const CAROUSEL_ITEM_WIDTH = (screenWidth - (SECTION_PADDING * 2)) / 2.05;


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

export function NewsScreen() {
    const { t } = useTypedTranslation();
    const navigation = useNavigation<NavigationProp<RootStackParamListWithNestedTabs>>();
    const user = useAuthenticatedUser();

    const now = useCurrentTime();
    const next8Hours = useMemo(() => new Date(now.getTime() + (8 * 60 * 60 * 1000)), [now]);
    const thirtyDaysAgo = useMemo(() => new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)), [now]);

    // Query for user's upcoming bookings
    const userBookings = useQuery(
        api.queries.bookings.getCurrentUserUpcomingBookings,
        user ? { daysAhead: 7 } : "skip"
    );

    // Query for last minute offers
    const lastMinuteDiscountedInstances = useQuery(
        api.queries.classInstances.getLastMinuteDiscountedClassInstances,
        {
            startDate: now.getTime(),
            endDate: next8Hours.getTime(),
            limit: 6
        }
    );

    // Get venues with image URLs using custom hook
    const { venues: allVenues, venuesLoading, storageIdToUrl } = useAllVenues();

    // Get class instance IDs from user bookings
    const upcomingClassInstanceIds = useMemo(() => {
        if (!userBookings?.length) return [];

        return userBookings
            .filter(booking => booking.status === 'pending')
            .slice(0, 6)
            .map(booking => booking.classInstanceId)
            .filter(Boolean) as string[];
    }, [userBookings]);

    // Fetch full class instances
    const upcomingClassInstances = useQuery(
        api.queries.classInstances.getClassInstances,
        upcomingClassInstanceIds.length > 0 ? {
            startDate: now.getTime() - (24 * 60 * 60 * 1000),
            endDate: now.getTime() + (30 * 24 * 60 * 60 * 1000)
        } : "skip"
    );

    // Collect image storage IDs
    const classImageIds = useMemo(() => {
        const ids: string[] = [];

        upcomingClassInstances?.forEach(instance => {
            if (instance.templateSnapshot?.imageStorageIds) {
                ids.push(...instance.templateSnapshot.imageStorageIds);
            }
            if (instance.venueSnapshot?.imageStorageIds) {
                ids.push(...instance.venueSnapshot.imageStorageIds);
            }
        });

        lastMinuteDiscountedInstances?.forEach(instance => {
            if (instance.templateSnapshot?.imageStorageIds) {
                ids.push(...instance.templateSnapshot.imageStorageIds);
            }
            if (instance.venueSnapshot?.imageStorageIds) {
                ids.push(...instance.venueSnapshot.imageStorageIds);
            }
        });

        return [...new Set(ids)];
    }, [upcomingClassInstances, lastMinuteDiscountedInstances]);

    // Fetch image URLs
    const classImageUrlsQuery = useQuery(
        api.queries.uploads.getUrls,
        classImageIds.length > 0 ? { storageIds: classImageIds as Id<"_storage">[] } : "skip"
    );

    // Create storage ID to URL mapping
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

    // Process data for upcoming classes
    const upcomingClasses = useMemo(() => {
        const bookingsData = userBookings || [];
        if (!bookingsData.length) return [];

        return bookingsData
            .filter(booking => {
                if (booking.status !== 'pending') return false;
                const startTime = booking.classInstanceSnapshot?.startTime;
                if (!startTime) return false;
                return startTime > now.getTime();
            })
            .map(booking => {
                const classInstance = upcomingClassInstances?.find(instance =>
                    instance._id === booking.classInstanceId
                );

                const templateImageId = classInstance?.templateSnapshot?.imageStorageIds?.[0];
                const venueImageId = classInstance?.venueSnapshot?.imageStorageIds?.[0];
                const imageUrl = templateImageId ? combinedStorageIdToUrl.get(templateImageId) :
                    venueImageId ? combinedStorageIdToUrl.get(venueImageId) : null;

                const startTime = booking.classInstanceSnapshot?.startTime;
                const startDate = startTime ? new Date(startTime) : null;
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);

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
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                        });
                    }
                }

                const timeDisplay = startDate ? startDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                }) : '';

                const venueAddress = classInstance?.venueSnapshot?.address;
                const addressText = venueAddress ?
                    `${venueAddress.street}, ${venueAddress.city}` : '';

                return {
                    id: booking._id,
                    title: booking.classInstanceSnapshot?.name || 'Class',
                    time: timeDisplay,
                    date: dateDisplay,
                    instructor: booking.classInstanceSnapshot?.instructor || 'Instructor',
                    venue: booking.venueSnapshot?.name || 'Venue',
                    venueAddress: addressText,
                    price: booking.finalPrice ? `${centsToCredits(booking.finalPrice)} credits` : 'Free',
                    imageUrl,
                    startTime: booking.classInstanceSnapshot?.startTime,
                    classInstanceId: booking.classInstanceId
                };
            })
            .sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    }, [userBookings, upcomingClassInstances, combinedStorageIdToUrl, now]);

    // Process data for last minute offers
    const lastMinuteOffers = useMemo(() => {
        const discountedInstancesData = lastMinuteDiscountedInstances || [];
        if (!discountedInstancesData.length) return [];

        return discountedInstancesData
            .slice(0, 6)
            .map(instance => {
                const timeUntilStartMs = instance.startTime - now.getTime();
                const timeUntilStartHours = Math.floor(timeUntilStartMs / (1000 * 60 * 60));
                const timeUntilStartMinutes = Math.floor((timeUntilStartMs % (1000 * 60 * 60)) / (1000 * 60));

                const templateImageId = instance.templateSnapshot?.imageStorageIds?.[0];
                const venueImageId = instance.venueSnapshot?.imageStorageIds?.[0];
                const imageUrl = templateImageId ? combinedStorageIdToUrl.get(templateImageId) :
                    venueImageId ? combinedStorageIdToUrl.get(venueImageId) : null;

                const originalPrice = instance.pricing.originalPrice;
                const finalPrice = instance.pricing.finalPrice;
                const discountPercentage = instance.discountPercentage;

                let timeDisplay = '';
                if (timeUntilStartHours > 0) {
                    timeDisplay = `In ${timeUntilStartHours}h ${timeUntilStartMinutes}m`;
                } else if (timeUntilStartMinutes > 0) {
                    timeDisplay = `In ${timeUntilStartMinutes}m`;
                } else {
                    timeDisplay = 'Starting soon';
                }

                return {
                    id: instance._id,
                    title: instance.name || 'Class',
                    subtitle: timeDisplay,
                    originalPrice: `${centsToCredits(originalPrice)}`,
                    discountedPrice: `${centsToCredits(finalPrice)}`,
                    discountPercentage: `${discountPercentage}%`,
                    venueName: instance.venueSnapshot?.name,
                    venueCity: instance.venueSnapshot?.address?.city,
                    instructor: instance.templateSnapshot?.instructor,
                    imageUrl,
                    startTime: instance.startTime,
                    classInstanceId: instance._id
                };
            });
    }, [lastMinuteDiscountedInstances, now, combinedStorageIdToUrl]);

    // Get new venues for VenueCard
    const newVenuesForCards = useMemo(() => {
        const venuesData = allVenues || [];
        if (!venuesData.length) return [];

        return venuesData
            .filter(venue => {
                const venueAge = now.getTime() - venue.createdAt;
                const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
                return venueAge <= thirtyDaysInMs;
            })
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 6);
    }, [allVenues, now]);

    // Handle navigation
    const handleExplorePress = () => {
        navigation.navigate('Home', { screen: 'Explore' });
    };

    // Loading state
    const isInitialLoading = user && (
        userBookings === undefined &&
        lastMinuteDiscountedInstances === undefined &&
        (allVenues === undefined || venuesLoading)
    );

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

                {/* Your Schedule Section */}
                {upcomingClasses.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Schedule</Text>
                        <View style={styles.carouselContainer}>
                            <Carousel
                                loop={false}
                                width={CAROUSEL_ITEM_WIDTH + ITEM_GAP}
                                height={CAROUSEL_HEIGHT}
                                data={upcomingClasses}
                                scrollAnimationDuration={500}
                                style={styles.carousel}
                                snapEnabled
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.carouselCard}
                                        onPress={() => {
                                            if (item.classInstanceId) {
                                                navigation.navigate('ClassDetailsModal', {
                                                    classInstanceId: item.classInstanceId
                                                });
                                            }
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.cardImageContainer}>
                                            {item.imageUrl ? (
                                                <Image
                                                    source={{ uri: item.imageUrl }}
                                                    style={styles.cardImage}
                                                    contentFit="cover"
                                                    transition={200}
                                                    cachePolicy="memory-disk"
                                                />
                                            ) : (
                                                <View style={[styles.cardImage, styles.placeholderImage]} />
                                            )}
                                            <LinearGradient
                                                pointerEvents="none"
                                                colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.65)']}
                                                locations={[0, 0.5, 1]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 0, y: 1 }}
                                                style={styles.imageGradient}
                                            />
                                            <View style={styles.imageOverlay}>
                                                <Text style={styles.overlayTitle} numberOfLines={1}>
                                                    {item.title}
                                                </Text>
                                                <Text style={styles.overlaySubtitle} numberOfLines={1}>
                                                    with {item.instructor}
                                                </Text>
                                            </View>
                                            <View style={[styles.badge, styles.timeBadge]}>
                                                <Text style={styles.badgeText}>{item.date}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.cardContent}>
                                            <View style={styles.contentRow}>
                                                <Text style={styles.primaryText}>{item.time}</Text>
                                                <Text style={styles.priceText}>{item.price}</Text>
                                            </View>
                                            <Text style={styles.secondaryText} numberOfLines={1}>
                                                {item.venue}
                                            </Text>
                                            {item.venueAddress && (
                                                <Text style={styles.tertiaryText} numberOfLines={1}>
                                                    {item.venueAddress}
                                                </Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                )}
                                onConfigurePanGesture={(gestureChain) => {
                                    gestureChain
                                        .activeOffsetX([-10, 10])
                                        .failOffsetY([-15, 15]);
                                }}
                            />
                        </View>
                    </View>
                ) : (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Schedule</Text>
                        <NoUpcomingClassesMessage onExplorePress={handleExplorePress} />
                    </View>
                )}

                {/* Last Minute Offers Section */}
                {lastMinuteOffers.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Last minute offers</Text>
                        <View style={styles.carouselContainer}>
                            <Carousel
                                loop={false}
                                width={CAROUSEL_ITEM_WIDTH + ITEM_GAP}
                                height={CAROUSEL_HEIGHT}
                                data={lastMinuteOffers}
                                scrollAnimationDuration={500}
                                style={styles.carousel}
                                snapEnabled
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.carouselCard}
                                        onPress={() => {
                                            if (item.classInstanceId) {
                                                navigation.navigate('ClassDetailsModal', {
                                                    classInstanceId: item.classInstanceId
                                                });
                                            }
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.cardImageContainer}>
                                            {item.imageUrl ? (
                                                <Image
                                                    source={{ uri: item.imageUrl }}
                                                    style={styles.cardImage}
                                                    contentFit="cover"
                                                    transition={200}
                                                    cachePolicy="memory-disk"
                                                />
                                            ) : (
                                                <View style={[styles.cardImage, styles.placeholderImage]} />
                                            )}
                                            <LinearGradient
                                                pointerEvents="none"
                                                colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.65)']}
                                                locations={[0, 0.5, 1]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 0, y: 1 }}
                                                style={styles.imageGradient}
                                            />
                                            <View style={styles.imageOverlay}>
                                                <Text style={styles.overlayTitle} numberOfLines={1}>
                                                    {item.title}
                                                </Text>
                                                <Text style={styles.overlaySubtitle} numberOfLines={1}>
                                                    with {item.instructor}
                                                </Text>
                                            </View>
                                            <View style={[styles.badge, styles.offerBadge]}>
                                                <Text style={styles.badgeText}>{item.subtitle}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.cardContent}>
                                            <View style={styles.contentRow}>
                                                <View style={styles.priceContainer}>
                                                    <Text style={styles.originalPrice}>{item.originalPrice}</Text>
                                                    <Text style={styles.discountedPrice}>{item.discountedPrice} credits</Text>
                                                </View>
                                                <View style={styles.discountBadge}>
                                                    <Text style={styles.discountText}>-{item.discountPercentage}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.secondaryText} numberOfLines={1}>
                                                {item.venueName}
                                            </Text>
                                            {item.venueCity && (
                                                <Text style={styles.tertiaryText} numberOfLines={1}>
                                                    {item.venueCity}
                                                </Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                )}
                                onConfigurePanGesture={(gestureChain) => {
                                    gestureChain
                                        .activeOffsetX([-10, 10])
                                        .failOffsetY([-15, 15]);
                                }}
                            />
                        </View>
                    </View>
                )}

                {/* New Studios Section */}
                {newVenuesForCards.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>New studios</Text>
                        <View style={styles.carouselContainer}>
                            <Carousel
                                width={CAROUSEL_ITEM_WIDTH + ITEM_GAP}
                                height={CAROUSEL_HEIGHT}
                                data={newVenuesForCards}
                                scrollAnimationDuration={600}
                                style={styles.carousel}
                                loop={false}
                                snapEnabled
                                renderItem={({ item: venue }) => (
                                    <View style={styles.carouselCard}>
                                        <VenueCard
                                            venue={venue}
                                            storageIdToUrl={storageIdToUrl}
                                            onPress={(selectedVenue) => {
                                                navigation.navigate('VenueDetailsScreen', {
                                                    venueId: selectedVenue._id
                                                });
                                            }}
                                        />
                                    </View>
                                )}
                            />
                        </View>
                    </View>
                )}

                {/* Categories Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Categories</Text>
                    <View style={styles.carouselContainer}>
                        <Carousel
                            loop={false}
                            width={CAROUSEL_ITEM_WIDTH + ITEM_GAP}
                            height={CAROUSEL_HEIGHT}
                            data={mockCategories}
                            scrollAnimationDuration={500}
                            style={styles.carousel}
                            snapEnabled
                            renderItem={({ item }) => (
                                <View style={styles.carouselCard}>
                                    <View style={styles.cardImageContainer}>
                                        <View style={[styles.cardImage, styles.placeholderImage]} />
                                        <View style={[styles.badge, styles.categoryBadge]}>
                                            <Text style={styles.badgeText}>Popular</Text>
                                        </View>
                                    </View>
                                    <View style={styles.cardContent}>
                                        <Text style={styles.categoryTitle}>{item.name}</Text>
                                        <Text style={styles.secondaryText}>{item.count}</Text>
                                    </View>
                                </View>
                            )}
                            onConfigurePanGesture={(gestureChain) => {
                                gestureChain
                                    .activeOffsetX([-10, 10])
                                    .failOffsetY([-15, 15]);
                            }}
                        />
                    </View>
                </View>
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
        paddingHorizontal: SECTION_PADDING,
        paddingBottom: 16,
        backgroundColor: theme.colors.zinc[50],
    },
    subtitleText: {
        fontSize: 16,
        color: '#6c757d',
    },

    // Section styles
    section: {
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
        paddingHorizontal: SECTION_PADDING,
    },

    // Unified carousel styles
    carouselContainer: {
        paddingHorizontal: CAROUSEL_PADDING,
    },
    carousel: {
        width: screenWidth,
    },

    // Unified card styles
    carouselCard: {
        width: CAROUSEL_ITEM_WIDTH,
        height: CAROUSEL_HEIGHT,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },

    // width: CAROUSEL_ITEM_WIDTH,
    // height: CAROUSEL_HEIGHT,


    // Image section
    cardImageContainer: {
        width: '100%',
        height: 140,
        overflow: 'hidden',
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        backgroundColor: '#f3f4f6',
    },
    imageGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
        zIndex: 1,
    },
    imageOverlay: {
        position: 'absolute',
        left: 12,
        bottom: 12,
        right: 12,
        zIndex: 2,
    },
    overlayTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        marginBottom: 2,
    },
    overlaySubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },

    // Badge styles
    badge: {
        position: 'absolute',
        top: 10,
        right: 10,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        zIndex: 2,
    },
    timeBadge: {
        backgroundColor: theme.colors.emerald[500],
    },
    offerBadge: {
        backgroundColor: theme.colors.rose[500],
    },
    categoryBadge: {
        backgroundColor: theme.colors.emerald[500],
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: 'white',
    },

    // Card content section
    cardContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    primaryText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    secondaryText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6b7280',
    },
    tertiaryText: {
        fontSize: 11,
        color: '#9ca3af',
    },
    priceText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.emerald[600],
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },

    // Price styles
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    originalPrice: {
        fontSize: 13,
        color: '#9ca3af',
        textDecorationLine: 'line-through',
    },
    discountedPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.emerald[600],
    },
    discountBadge: {
        backgroundColor: theme.colors.emerald[50],
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    discountText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.emerald[700],
    },

    // WhatsNew Banner styles
    whatsNewBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
        paddingVertical: 12,
        paddingHorizontal: SECTION_PADDING,
        borderRadius: 12,
        marginTop: 16,
        marginBottom: 16,
        marginHorizontal: SECTION_PADDING,
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

    // No upcoming classes styles
    noClassesContainer: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: SECTION_PADDING,
        backgroundColor: theme.colors.zinc[50],
        borderRadius: 12,
        marginHorizontal: SECTION_PADDING,
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
});