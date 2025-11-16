import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MapPinIcon, StarIcon, UserIcon, DiamondIcon, ClockIcon } from 'lucide-react-native';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { api } from '@repo/api/convex/_generated/api';
import { useTypedTranslation } from '../../i18n/typed';
import { theme } from '../../theme';
import { TabScreenHeader } from '../../components/TabScreenHeader';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import { useAllVenues } from '../../features/explore/hooks/useAllVenues';
import { useUserCity } from '../../hooks/use-user-city';
import type { RootStackParamListWithNestedTabs } from '../index';
import { centsToCredits } from '@repo/utils/credits';
import { NewsClassCard } from '../../components/news/NewsCard';
import { XIcon } from 'lucide-react-native';
import { CreditsBadge } from '../../components/CreditsBadge';
import { ProfileIconButton } from '../../components/ProfileIconButton';
import { MessagesIconButton } from '../../components/MessagesIconButton';
import { FloatingNavButtons } from '../../components/FloatingNavButtons';

const now = new Date();

const { width: screenWidth } = Dimensions.get('window');

// Unified carousel constants
const DEFAULT_CAROUSEL_HEIGHT = 260; // Unified height for all carousels
const SCHEDULE_CAROUSEL_HEIGHT = 160;
const NEW_STUDIOS_CAROUSEL_HEIGHT = 200;

const SECTION_PADDING = 12; // Horizontal padding for sections

const CAROUSEL_ITEM_WIDTH = (screenWidth - (SECTION_PADDING * 2)) / 1.40;

const WelcomeBanner = ({
    onDismiss,
    onExplore,
    titleText,
    subtitleText,
    exploreButtonText
}: {
    onDismiss: () => void;
    onExplore: () => void;
    titleText: string;
    subtitleText: string;
    exploreButtonText: string;
}) => (
    <View style={styles.welcomeBanner}>
        <TouchableOpacity
            onPress={onDismiss}
            style={styles.bannerDismissButton}
            activeOpacity={0.7}
        >
            <XIcon size={20} color={theme.colors.zinc[600]} />
        </TouchableOpacity>

        <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>{titleText}</Text>
            <Text style={styles.bannerSubtitle}>
                {subtitleText}
            </Text>
        </View>

        <TouchableOpacity
            onPress={onExplore}
            style={styles.bannerAction}
            activeOpacity={0.8}
        >
            <Text style={styles.bannerActionText}>{exploreButtonText}</Text>
        </TouchableOpacity>
    </View>
);

const NoUpcomingClassesMessage = ({
    onExplorePress,
    titleText,
    exploreButtonText
}: {
    onExplorePress: () => void;
    titleText: string;
    exploreButtonText: string;
}) => (
    <View style={styles.noClassesContainer}>
        <View style={styles.noClassesIcon}>
            <Text style={styles.noClassesIconText}>📅</Text>
        </View>
        <Text style={styles.noClassesTitle}>{titleText}</Text>
        <TouchableOpacity onPress={onExplorePress} style={styles.exploreButton}>
            <Text style={styles.exploreButtonText}>{exploreButtonText}</Text>
        </TouchableOpacity>
    </View>
);

export function NewsScreen() {
    const { t } = useTypedTranslation();
    const navigation = useNavigation<NavigationProp<RootStackParamListWithNestedTabs>>();
    const { isAuthenticated } = useConvexAuth();
    const data = useQuery(api.queries.core.getCurrentUserQuery, isAuthenticated ? {} : 'skip');
    const user = data?.user;
    const { city: userCity } = useUserCity();

    const next4Hours = useMemo(() => new Date(now.getTime() + (4 * 60 * 60 * 1000)), [now]);
    const next24Hours = useMemo(() => new Date(now.getTime() + (24 * 60 * 60 * 1000)), [now]);
    const endOfToday = useMemo(() => {
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return end;
    }, [now]);

    // Query for user settings to check if welcome banner was dismissed
    // TODO: Update to use api.queries.settings.getUserSettings once API is regenerated
    const userSettings = useQuery(
        api.queries.settings.getUserSettings,
        user ? {} : "skip"
    );
    const isUserSettingsLoading = user ? userSettings === undefined : false;

    // Mutation to dismiss the welcome banner
    // TODO: Update to use api.mutations.settings.updateUserBannerSettings once API is regenerated
    const dismissWelcomeBanner = useMutation(api.mutations.settings.upsertUserSettings);

    // Query for user's upcoming bookings
    const userBookings = useQuery(
        api.queries.bookings.getCurrentUserUpcomingBookings,
        user ? { daysAhead: 7 } : "skip"
    );

    // Get user credit balance
    const creditBalance = useQuery(api.queries.credits.getUserBalance, { userId: user?._id! });

    // Query for happening today classes (until midnight)
    const happeningTodayInstances = useQuery(
        api.queries.classInstances.getHappeningTodayClassInstances,
        userCity ? {
            startDate: now.getTime(),
            endDate: endOfToday.getTime(),
            cityFilter: userCity,
        } : "skip"
    );

    // Query for best offers (next 24 hours)
    const bestOffersInstances = useQuery(
        api.queries.classInstances.getBestOffersClassInstances,
        userCity ? {
            startDate: now.getTime(),
            endDate: next24Hours.getTime(),
            cityFilter: userCity,
        } : "skip"
    );

    // Get venues with image URLs using custom hook
    const { venues: allVenues, venuesLoading, storageIdToUrl } = useAllVenues({
        cityFilter: userCity,
        skip: !userCity,
    });

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
        api.queries.classInstances.getConsumerClassInstancesWithBookingStatus,
        upcomingClassInstanceIds.length > 0 && userCity ? {
            startDate: now.getTime() - (24 * 60 * 60 * 1000),
            endDate: now.getTime() + (30 * 24 * 60 * 60 * 1000),
            // Pull a generous slice so booked classes are always included
            limit: Math.max(upcomingClassInstanceIds.length * 2, 50),
            cityFilter: userCity,
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

        happeningTodayInstances?.forEach(instance => {
            if (instance.templateImageId) {
                ids.push(instance.templateImageId);
            }
            if (instance.venueImageId) {
                ids.push(instance.venueImageId);
            }
        });

        bestOffersInstances?.forEach(instance => {
            if (instance.templateSnapshot?.imageStorageIds) {
                ids.push(...instance.templateSnapshot.imageStorageIds);
            }
            if (instance.venueSnapshot?.imageStorageIds) {
                ids.push(...instance.venueSnapshot.imageStorageIds);
            }
        });

        return [...new Set(ids)];
    }, [upcomingClassInstances, happeningTodayInstances, bestOffersInstances]);

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
                        dateDisplay = t('common.today');
                    } else if (isTomorrow) {
                        dateDisplay = t('news.tomorrow');
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
                    title: booking.classInstanceSnapshot?.name || t('news.class'),
                    disableBookings: classInstance?.disableBookings,
                    time: timeDisplay,
                    date: dateDisplay,
                    instructor: booking.classInstanceSnapshot?.instructor || t('news.instructor'),
                    venue: booking.venueSnapshot?.name || t('news.venue'),
                    venueAddress: addressText,
                    price: booking.finalPrice ? `${centsToCredits(booking.finalPrice)} credits` : t('news.free'),
                    imageUrl,
                    startTime: booking.classInstanceSnapshot?.startTime,
                    classInstanceId: booking.classInstanceId
                };
            })
            .sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    }, [userBookings, upcomingClassInstances, combinedStorageIdToUrl, now, t]);

    // Process happening today classes
    const happeningTodayClasses = useMemo(() => {
        const instancesData = happeningTodayInstances || [];
        if (!instancesData.length) return [];

        return instancesData
            .slice(0, 10)
            .map(instance => {
                const timeUntilStartMs = instance.startTime - now.getTime();
                const timeUntilStartHours = Math.floor(timeUntilStartMs / (1000 * 60 * 60));
                const timeUntilStartMinutes = Math.floor((timeUntilStartMs % (1000 * 60 * 60)) / (1000 * 60));

                // Simplified image URL logic
                const imageUrl = instance.templateImageId
                    ? combinedStorageIdToUrl.get(instance.templateImageId)
                    : instance.venueImageId
                        ? combinedStorageIdToUrl.get(instance.venueImageId)
                        : null;

                let timeDisplay = '';
                let timeUntilStartHoursRaw: number | null = null;
                let timeUntilStartMinutesRaw: number | null = null;
                let isStartingSoon = false;

                if (timeUntilStartHours > 0) {
                    timeDisplay = t('news.inHours', { hours: timeUntilStartHours, minutes: timeUntilStartMinutes });
                    timeUntilStartHoursRaw = timeUntilStartHours;
                    timeUntilStartMinutesRaw = timeUntilStartMinutes;
                } else if (timeUntilStartMinutes > 0) {
                    timeDisplay = t('news.inMinutes', { minutes: timeUntilStartMinutes });
                    timeUntilStartMinutesRaw = timeUntilStartMinutes;
                } else {
                    timeDisplay = t('news.startingSoon');
                    isStartingSoon = true;
                }

                return {
                    id: instance._id,
                    title: instance.name || t('news.class'),
                    subtitle: timeDisplay,
                    timeUntilStartHours: timeUntilStartHoursRaw,
                    timeUntilStartMinutes: timeUntilStartMinutesRaw,
                    isStartingSoon,
                    originalPrice: `${centsToCredits(instance.pricing.originalPrice)}`,
                    discountedPrice: `${centsToCredits(instance.pricing.finalPrice)}`,
                    discountPercentage: instance.pricing.discountPercentage > 0 ? `${Math.round(instance.pricing.discountPercentage * 100)}%` : null,
                    venueName: instance.venueName,
                    venueCity: instance.venueCity,
                    instructor: instance.instructor,
                    imageUrl,
                    startTime: instance.startTime,
                    classInstanceId: instance._id,
                };
            });
    }, [happeningTodayInstances, now, combinedStorageIdToUrl, t]);

    // Process best offers
    const bestOffersClasses = useMemo(() => {
        const instancesData = bestOffersInstances || [];
        if (!instancesData.length) return [];

        return instancesData
            .slice(0, 10)
            .map(instance => {
                const templateImageId = instance.templateSnapshot?.imageStorageIds?.[0];
                const venueImageId = instance.venueSnapshot?.imageStorageIds?.[0];
                const imageUrl = templateImageId ? combinedStorageIdToUrl.get(templateImageId) :
                    venueImageId ? combinedStorageIdToUrl.get(venueImageId) : null;

                return {
                    id: instance._id,
                    title: instance.name || t('news.class'),
                    originalPrice: `${centsToCredits(instance.pricing.originalPrice)}`,
                    discountedPrice: `${centsToCredits(instance.pricing.finalPrice)}`,
                    discountPercentage: `${instance.discountPercentage}%`,
                    venueName: instance.venueSnapshot?.name,
                    venueCity: instance.venueSnapshot?.address?.city,
                    instructor: instance.templateSnapshot?.instructor,
                    imageUrl,
                    startTime: instance.startTime,
                    classInstanceId: instance._id,
                };
            });
    }, [bestOffersInstances, now, combinedStorageIdToUrl, t]);

    // Get new venues for VenueCard
    const newVenuesForCards = useMemo(() => {
        const venuesData = allVenues || [];
        if (!venuesData.length) return [];

        return venuesData
            .filter(venue => {
                const venueAge = now.getTime() - venue.createdAt;
                const venueAgeInDays = venueAge / (24 * 60 * 60 * 1000);
                const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
                return venueAge <= thirtyDaysInMs;
            })
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 6);
    }, [allVenues, now]);

    // Handle navigation
    const handleExplorePress = () => {
        navigation.navigate('Explore');
    };

    // Handle banner dismissal
    const handleDismissBanner = async () => {
        if (user) {
            try {
                // TODO: Update to use new banner settings API once available
                await dismissWelcomeBanner({
                    banners: {
                        welcomeBannerDismissed: true
                    }
                });
            } catch (error) {
                console.error('Error dismissing welcome banner:', error);
            }
        }
    };

    // Handle explore press (also dismisses banner)
    const handleExplorePressWithDismiss = async () => {
        await handleDismissBanner();
        handleExplorePress();
    };

    // Check if welcome banner should be shown (hide while loading settings)
    const shouldShowWelcomeBanner = Boolean(
        user &&
        !isUserSettingsLoading &&
        !userSettings?.banners?.welcomeBannerDismissed
    );

    // Loading state
    const isInitialLoading = user && (
        userBookings === undefined &&
        happeningTodayInstances === undefined &&
        bestOffersInstances === undefined &&
        (allVenues === undefined || venuesLoading)
    );

    if (isInitialLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <TabScreenHeader
                    title="KymaClub"
                    //subtitle="Discover amazing fitness classes"
                    renderRightSide={() => (
                        <>
                            {creditBalance !== undefined && (
                                <CreditsBadge creditBalance={creditBalance.balance} />
                            )}
                            <ProfileIconButton />
                        </>
                    )}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff4747" />
                    <Text style={styles.loadingText}>{t('news.loading')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TabScreenHeader
                title="KymaClub"
                // subtitle="Discover amazing fitness classes"
                renderRightSide={() => (
                    <>
                        {creditBalance !== undefined && (
                            <CreditsBadge creditBalance={creditBalance.balance} />
                        )}
                        <MessagesIconButton />
                        <ProfileIconButton />
                    </>
                )}
            />
            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Welcome Banner - only show for new users */}
                {shouldShowWelcomeBanner && (
                    <WelcomeBanner
                        onDismiss={handleDismissBanner}
                        onExplore={handleExplorePressWithDismiss}
                        titleText={t('news.welcomeBanner.title')}
                        subtitleText={t('news.welcomeBanner.subtitle')}
                        exploreButtonText={t('news.welcomeBanner.exploreButton')}
                    />
                )}

                {/* Your Schedule Section */}
                {upcomingClasses.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('news.yourSchedule')}</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.carouselScrollContent}
                        >
                            {upcomingClasses.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
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
                                                    {t('news.withInstructor', { instructor: item.instructor })}
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
                            ))}
                        </ScrollView>
                    </View>
                ) : (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('news.yourSchedule')}</Text>
                        <NoUpcomingClassesMessage
                            onExplorePress={handleExplorePress}
                            titleText={t('news.noUpcomingClasses.title')}
                            exploreButtonText={t('news.noUpcomingClasses.exploreButton')}
                        />
                    </View>
                )}

                {/* Happening Today Section */}
                {happeningTodayClasses.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('news.happeningToday')}</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.carouselScrollContent}
                        >
                            {happeningTodayClasses.map((item) => {
                                const discountBadge = item.discountPercentage ? `-${item.discountPercentage}` : null;

                                const subtitleText = item.instructor
                                    ? t('news.withInstructor', { instructor: item.instructor })
                                    : item.venueName || undefined;

                                const startTime = new Date(item.startTime).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                });

                                let startsInText: string | null = null;
                                if (item.timeUntilStartHours !== null && item.timeUntilStartHours !== undefined) {
                                    const timeStr = t('news.inHours', { hours: item.timeUntilStartHours, minutes: item.timeUntilStartMinutes || 0 });
                                    startsInText = t('news.startsIn', { time: timeStr });
                                } else if (item.timeUntilStartMinutes !== null && item.timeUntilStartMinutes !== undefined) {
                                    const timeStr = t('news.inMinutes', { minutes: item.timeUntilStartMinutes });
                                    startsInText = t('news.startsIn', { time: timeStr });
                                } else if (item.isStartingSoon) {
                                    startsInText = t('news.startsSoon');
                                }

                                return (
                                    <NewsClassCard
                                        key={item.id}
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
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* Best Offers Section */}
                {bestOffersClasses.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('news.bestOffers')}</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.carouselScrollContent}
                        >
                            {bestOffersClasses.map((item) => {
                                const discountBadge = item.discountPercentage ? `-${item.discountPercentage}` : null;

                                const subtitleText = item.instructor
                                    ? t('news.withInstructor', { instructor: item.instructor })
                                    : item.venueName || undefined;

                                const startTime = new Date(item.startTime).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                });

                                return (
                                    <NewsClassCard
                                        key={item.id}
                                        title={item.title}
                                        subtitle={subtitleText}
                                        imageUrl={item.imageUrl}
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
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* New Studios Section */}
                {newVenuesForCards.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('news.newStudios')}</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.carouselScrollContent}
                        >
                            {newVenuesForCards.map((venue) => {
                                const imageUrl = venue.imageStorageIds?.[0]
                                    ? storageIdToUrl.get(venue.imageStorageIds[0])
                                    : null;

                                return (
                                    <NewsClassCard
                                        key={venue._id}
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
                            })}
                        </ScrollView>
                    </View>
                )}
            </ScrollView>
            <FloatingNavButtons />
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
        paddingBottom: 100, // Extra padding for floating buttons
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
    carouselScrollContent: {
        paddingHorizontal: SECTION_PADDING,
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
        gap: 2,
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
    // Welcome Banner styles
    welcomeBanner: {
        backgroundColor: '#f0f9ff',
        borderRadius: 16,
        marginTop: 16,
        marginBottom: 16,
        marginHorizontal: SECTION_PADDING,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e0f2fe',
        position: 'relative',
    },
    bannerDismissButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    bannerContent: {
        paddingRight: 40, // Space for dismiss button
        marginBottom: 12,
    },
    bannerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 8,
    },
    bannerSubtitle: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
    },
    bannerAction: {
        alignSelf: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: theme.colors.sky[600],
        borderRadius: 8,
        shadowColor: theme.colors.sky[600],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    bannerActionText: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: '600',
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
        paddingVertical: 10,
        paddingHorizontal: 10,
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
