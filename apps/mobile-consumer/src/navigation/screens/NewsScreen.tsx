import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MapPinIcon, StarIcon, UserIcon, DiamondIcon, ClockIcon } from 'lucide-react-native';
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
import { useAllVenues } from '../../features/explore/hooks/useAllVenues';
import type { RootStackParamListWithNestedTabs } from '../index';
import { centsToCredits } from '@repo/utils/credits';
import { NewsClassCard } from '../../components/news/NewsCard';

const { width: screenWidth } = Dimensions.get('window');

// Unified carousel constants
const DEFAULT_CAROUSEL_HEIGHT = 260; // Unified height for all carousels
const SCHEDULE_CAROUSEL_HEIGHT = 160;
const NEW_STUDIOS_CAROUSEL_HEIGHT = 200;

const ITEM_GAP = 0; // Gap between items
const SECTION_PADDING = 12; // Horizontal padding for sections
const CAROUSEL_PADDING = SECTION_PADDING - (ITEM_GAP / 2); // Adjust for item gaps

const CAROUSEL_ITEM_WIDTH = (screenWidth - (SECTION_PADDING * 2)) / 1.40;

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
    const next12Hours = useMemo(() => new Date(now.getTime() + (12 * 60 * 60 * 1000)), [now]);

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
            endDate: next12Hours.getTime(),
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
                <TabScreenHeader
                    title={t('welcome.title')}
                    renderRightSide={() => (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Settings')}
                            style={styles.profileButton}
                        >
                            <UserIcon size={20} color={theme.colors.zinc[700]} />
                        </TouchableOpacity>
                    )}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff4747" />
                    <Text style={styles.loadingText}>Loading news...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TabScreenHeader
                title={t('welcome.title')}
                renderRightSide={() => (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Settings')}
                        style={styles.profileButton}
                    >
                        <UserIcon size={20} color={theme.colors.zinc[700]} />
                    </TouchableOpacity>
                )}
            />
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
                        <Text style={styles.sectionSubtitle}>Here's what you've got coming up.</Text>
                        <View style={styles.carouselContainer}>
                            <Carousel
                                loop={false}
                                width={CAROUSEL_ITEM_WIDTH + ITEM_GAP}
                                height={SCHEDULE_CAROUSEL_HEIGHT}
                                data={upcomingClasses}
                                scrollAnimationDuration={500}
                                style={styles.carousel}
                                snapEnabled
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.scheduleCarouselCard}
                                        onPress={() => {
                                            if (item.classInstanceId) {
                                                navigation.navigate('ClassDetailsModal', {
                                                    classInstanceId: item.classInstanceId
                                                });
                                            }
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.scheduleShadowContainer}>
                                            <View style={styles.scheduleCard}>
                                                <View style={styles.scheduleTopHalf}>
                                                    <Text style={styles.scheduleDate}>{item.date}</Text>
                                                    <Text style={styles.scheduleTime}>{item.time}</Text>
                                                </View>

                                                <View style={styles.scheduleBottomHalf}>
                                                    <Text style={styles.scheduleTitle} numberOfLines={1}>
                                                        {item.title}
                                                    </Text>
                                                    <Text style={styles.scheduleInstructor} numberOfLines={1}>
                                                        with {item.instructor}
                                                    </Text>
                                                    <View style={styles.locationContainer}>
                                                        <MapPinIcon size={12} color="#9ca3af" />
                                                        <Text style={styles.scheduleLocation} numberOfLines={1}>
                                                            {item.venueAddress || item.venue}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
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
                        <Text style={styles.sectionSubtitle}>Here's what you've got coming up.</Text>
                        <NoUpcomingClassesMessage onExplorePress={handleExplorePress} />
                    </View>
                )}

                {/* Last Minute Offers Section */}
                {lastMinuteOffers.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Last minute offers</Text>
                        <Text style={styles.sectionSubtitle}>Who doesn't like a good deal? These classes are starting soon.</Text>
                        <View style={styles.carouselContainer}>
                            <Carousel
                                loop={false}
                                width={CAROUSEL_ITEM_WIDTH + ITEM_GAP}
                                height={DEFAULT_CAROUSEL_HEIGHT}
                                data={lastMinuteOffers}
                                scrollAnimationDuration={500}
                                style={styles.carousel}
                                snapEnabled
                                renderItem={({ item }) => {
                                    const discountBadge = item.discountPercentage ? `-${item.discountPercentage}` : null;

                                    const subtitleText = item.instructor
                                        ? `with ${item.instructor}`
                                        : item.venueName || undefined;

                                    const startTime = new Date(item.startTime).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                    });

                                    let startsInText: string | null = null;
                                    if (item.subtitle) {
                                        const trimmed = item.subtitle.trim();
                                        if (/^in\s/i.test(trimmed)) {
                                            const suffix = trimmed.slice(3).trim().toLowerCase();
                                            startsInText = suffix ? `starts in ${suffix}` : 'starts soon';
                                        } else {
                                            startsInText = trimmed.toLowerCase();
                                        }
                                    }

                                    return (
                                        <NewsClassCard
                                            title={item.title}
                                            subtitle={subtitleText}
                                            imageUrl={item.imageUrl}
                                            renderTopLeft={() => {
                                                if (!startsInText) return null;
                                                return (
                                                    <View style={styles.startsInPill}>
                                                        <Text style={styles.startsInPillText} numberOfLines={1}>
                                                            {startsInText}
                                                        </Text>
                                                    </View>
                                                );
                                            }}
                                            renderTopRight={() => {
                                                if (!discountBadge) {
                                                    return null;
                                                }

                                                return (
                                                    <View style={[styles.lastMinuteBadge, styles.offerBadge]}>
                                                        <Text style={styles.badgeText}>{discountBadge}</Text>
                                                    </View>
                                                );
                                            }}
                                            renderFooter={() => (
                                                <View style={styles.newsClassCardFooterRow}>
                                                    <View style={styles.newsClassCardFooterMetric}>
                                                        <View style={styles.newsClassCardFooterIcon}>
                                                            <DiamondIcon
                                                                size={14}
                                                                color={theme.colors.zinc[700]}
                                                                strokeWidth={2}
                                                            />
                                                        </View>
                                                        <Text
                                                            style={styles.newsClassCardFooterText}
                                                            numberOfLines={1}
                                                        >
                                                            {item.discountedPrice}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.newsClassCardFooterMetric}>
                                                        <View style={styles.newsClassCardFooterIcon}>
                                                            <ClockIcon
                                                                size={14}
                                                                color={theme.colors.zinc[700]}
                                                                strokeWidth={2}
                                                            />
                                                        </View>
                                                        <Text
                                                            style={styles.newsClassCardFooterText}
                                                            numberOfLines={1}
                                                        >
                                                            {startTime}
                                                        </Text>
                                                    </View>
                                                    {item.venueCity ? (
                                                        <View style={styles.newsClassCardFooterMetric}>
                                                            <View style={styles.newsClassCardFooterIcon}>
                                                                <MapPinIcon
                                                                    size={14}
                                                                    color={theme.colors.zinc[600]}
                                                                    strokeWidth={2}
                                                                />
                                                            </View>
                                                            <Text
                                                                style={styles.newsClassCardFooterText}
                                                                numberOfLines={1}
                                                            >
                                                                {item.venueCity}
                                                            </Text>
                                                        </View>
                                                    ) : null}
                                                </View>
                                            )}
                                            onPress={() => {
                                                if (item.classInstanceId) {
                                                    navigation.navigate('ClassDetailsModal', {
                                                        classInstanceId: item.classInstanceId,
                                                    });
                                                }
                                            }}
                                            style={styles.lastMinuteCarouselCard}
                                        />
                                    );
                                }}
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
                        <Text style={styles.sectionSubtitle}>The latest additions to the Kyma network.</Text>
                        <View style={styles.carouselContainer}>
                            <Carousel
                                width={CAROUSEL_ITEM_WIDTH + ITEM_GAP}
                                height={NEW_STUDIOS_CAROUSEL_HEIGHT}
                                data={newVenuesForCards}
                                scrollAnimationDuration={500}
                                style={styles.carousel}
                                loop={false}
                                snapEnabled
                                renderItem={({ item: venue }) => {
                                    const imageUrl = venue.imageStorageIds?.[0]
                                        ? storageIdToUrl.get(venue.imageStorageIds[0])
                                        : null;

                                    return (
                                        <NewsClassCard
                                            title={venue.name}
                                            subtitle={venue.primaryCategory}
                                            imageUrl={imageUrl}
                                            onPress={() => {
                                                navigation.navigate('VenueDetailsScreen', {
                                                    venueId: venue._id,
                                                });
                                            }}
                                            style={styles.newStudiosCarouselCard}
                                            renderTopLeft={() => (
                                                <View style={styles.venueRatingBadgeContent}>
                                                    <StarIcon size={12} color="#fff" fill="#ffd700" />
                                                    <Text style={styles.venueRatingText}>
                                                        {venue.rating?.toFixed(1)} ({venue.reviewCount || 0})
                                                    </Text>
                                                </View>
                                            )}
                                        />
                                    );
                                }}
                            />
                        </View>
                    </View>
                )}
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
    },
    scrollContent: {
        paddingBottom: 60,
    },
    subtitleContainer: {
        paddingHorizontal: SECTION_PADDING,
        paddingBottom: 16,
    },
    subtitleText: {
        fontSize: 16,
        color: '#6c757d',
    },

    // Section styles
    section: {
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
        paddingHorizontal: SECTION_PADDING,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6c757d',
        paddingHorizontal: SECTION_PADDING,
        marginBottom: 12,
    },

    // Unified carousel styles
    carouselContainer: {
        paddingHorizontal: CAROUSEL_PADDING,
    },
    carousel: {
        width: screenWidth,
    },
    scheduleCarouselCard: {
        width: CAROUSEL_ITEM_WIDTH,
        height: SCHEDULE_CAROUSEL_HEIGHT,
        paddingTop: 6,
        paddingBottom: 8,
        paddingRight: 8,
    },
    scheduleShadowContainer: {
        flex: 1,
        borderRadius: 18,
        shadowColor: theme.colors.zinc[500],
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    scheduleCard: {
        flex: 1,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
    },

    lastMinuteCarouselCard: {
        width: CAROUSEL_ITEM_WIDTH,
        height: DEFAULT_CAROUSEL_HEIGHT,
    },

    newStudiosCarouselCard: {
        width: CAROUSEL_ITEM_WIDTH,
        height: NEW_STUDIOS_CAROUSEL_HEIGHT,
    },

    scheduleTopHalf: {
        flex: 1,
        backgroundColor: theme.colors.emerald[500],
        padding: 16,
        justifyContent: 'center',
    },
    scheduleBottomHalf: {
        flex: 2,
        backgroundColor: '#ffffff',
        padding: 16,
        justifyContent: 'space-between',
    },
    scheduleDate: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 4,
    },
    scheduleTime: {
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
    },
    scheduleLocation: {
        fontSize: 12,
        fontWeight: '500',
        color: '#9ca3af',
        flex: 1,
    },
    scheduleTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    scheduleInstructor: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },

    // width: CAROUSEL_ITEM_WIDTH,
    // height: CAROUSEL_HEIGHT,


    // Image section
    cardImageContainer: {
        width: '100%',
        height: 140,
        // overflow: 'hidden',
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
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: 'white',
    },
    lastMinuteBadge: {
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    lastMinuteStartsPill: {
        backgroundColor: 'rgba(17, 24, 39, 0.75)',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    lastMinuteStartsText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    startsInPill: {
        backgroundColor: theme.colors.emerald[600],
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    startsInPillText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.2,
    },

    // Card content section
    cardContent: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    secondaryText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6b7280',
    },
    newsClassCardFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    newsClassCardFooterMetric: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    newsClassCardFooterIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    newsClassCardFooterText: {
        color: theme.colors.zinc[600],
        fontSize: 12,
        fontWeight: '600',
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

    // Profile button styles
    profileButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: theme.colors.zinc[100],
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Venue card styles
    venueRatingBadgeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    venueRatingText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '800',
    },
});
