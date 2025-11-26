import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { StarIcon, ShowerHeadIcon, AccessibilityIcon, UserIcon, ClockIcon, CheckCircleIcon, MessageCircleIcon, PhoneIcon, MailIcon, GlobeIcon, MapPinIcon, ChevronLeftIcon } from 'lucide-react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { ClassCard } from '../../components/ClassCard';
import { Divider } from '../../components/Divider';
import { ReviewsSection } from '../../components/ReviewsSection';
import { useVenueClassInstances } from '../../hooks/use-venue-class-instances';
import type { RootStackParamListWithNestedTabs } from '..';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import * as Location from 'expo-location';
import { formatDistance as formatDistanceMeters, calculateDistance } from '../../utils/location';
import { useTypedTranslation } from '../../i18n/typed';
import { theme } from '../../theme';
import i18n from '../../i18n';

const now = Date.now();

type VenueDetailsRoute = RouteProp<RootStackParamListWithNestedTabs, 'VenueDetailsScreen'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Carousel constants
const ITEM_GAP = 8;
const SECTION_PADDING = 0;
const CAROUSEL_PADDING = SECTION_PADDING - (ITEM_GAP / 2);
const CAROUSEL_ITEM_WIDTH = (screenWidth - (SECTION_PADDING * 2)) / 2.4;
const UPCOMING_CAROUSEL_HEIGHT = 140;



// Amenities icons mapping
const amenitiesIconsMap: Record<string, React.ComponentType<any>> = {
    showers: ShowerHeadIcon,
    accessible: AccessibilityIcon,
};

// Amenities Section Component
function AmenitiesSection({ venue }: { venue: any }) {
    const { t } = useTypedTranslation();

    // Helper function to get translated amenity label
    const getAmenityLabel = (amenityKey: string): string => {
        const translationKey = `venues.amenity${amenityKey.charAt(0).toUpperCase() + amenityKey.slice(1)}`;
        // Use type assertion for dynamic translation keys
        const translated = t(translationKey as any);
        // If translation returns the key itself (not translated), fallback to formatted key
        if (translated === translationKey) {
            return amenityKey.charAt(0).toUpperCase() + amenityKey.slice(1);
        }
        return translated;
    };

    const hasAmenities = venue?.amenities && Object.values(venue.amenities).some(enabled => enabled);

    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.amenitiesTitle]}>{t('venues.amenities')}</Text>
            <View style={styles.tagContainer}>
                {hasAmenities ? Object.entries(venue.amenities)
                    .filter(([_, enabled]) => enabled)
                    .map(([amenity]) => {
                        const IconComponent = amenitiesIconsMap[amenity];
                        const amenityLabel = getAmenityLabel(amenity);
                        return (
                            <View key={amenity} style={styles.tag}>
                                {IconComponent && (
                                    <IconComponent size={16} color={theme.colors.zinc[600]} style={styles.tagIcon} />
                                )}
                                <Text style={styles.tagText}>
                                    {amenityLabel}
                                </Text>
                            </View>
                        );
                    }) : (
                    <Text style={styles.descriptionText}>{t('venues.noAmenitiesFound')}</Text>
                )}
            </View>
        </View>
    );
}

export function VenueDetailsScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamListWithNestedTabs>>();
    const route = useRoute<VenueDetailsRoute>();
    const { venueId } = route.params;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { t } = useTypedTranslation();
    const [distanceLabel, setDistanceLabel] = useState<string | null>(null);
    const [isHeaderWhite, setIsHeaderWhite] = useState(false);
    const [headerOpacity, setHeaderOpacity] = useState(0);
    const { bottom: bottomInset } = useSafeAreaInsets();
    const contentBottomPadding = bottomInset + 24;

    // Fetch full venue data
    const venue = useQuery(api.queries.venues.getVenueById, {
        venueId: venueId as Id<"venues">
    });

    // Chat mutations
    const getOrCreateThread = useMutation(api.mutations.chat.getOrCreateThread);

    // Compute distance from user to venue when coords are available
    useEffect(() => {
        const computeDistance = async () => {
            const lat = venue?.address?.latitude;
            const lng = venue?.address?.longitude;
            if (lat == null || lng == null) return;
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;
                const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                const meters = calculateDistance(
                    current.coords.latitude,
                    current.coords.longitude,
                    lat,
                    lng
                );
                const formatted = formatDistanceMeters(meters);
                setDistanceLabel(t('explore.distance', { distance: formatted }));
            } catch (_) {
                // ignore distance errors
            }
        };
        computeDistance();
    }, [venue?.address?.latitude, venue?.address?.longitude, t]);


    // Fetch next 7 days of class instances for upcoming cards
    const sevenDaysFromNow = useMemo(() => {
        const now = new Date();
        const sevenDays = new Date(now);
        sevenDays.setDate(now.getDate() + 7);
        sevenDays.setHours(23, 59, 59, 999); // End of 7th day
        return sevenDays.getTime();
    }, []);

    // 🚀 OPTIMIZED: Use venue-specific hook instead of filtering all classes
    const { classInstances: venueClasses } = useVenueClassInstances({
        venueId: venueId as Id<"venues">,
        startDate: now,
        endDate: sevenDaysFromNow,
        includeBookingStatus: true,
    });

    // Process venue classes for upcoming cards
    const upcomingVenueClasses = useMemo(() => {
        if (!venueClasses?.length) return [];

        return venueClasses
            .slice(0, 10) // Limit to 10 cards max for 7 days
            .map((classInstance: any) => {
                const startTime = new Date(classInstance.startTime);
                const endTime = new Date(classInstance.endTime);
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                const dayAfterTomorrow = new Date(today);
                dayAfterTomorrow.setDate(today.getDate() + 2);

                // Format date display
                let dateDisplay = '';
                const classDate = startTime.toDateString();
                const currentLanguage = i18n.language || 'en';
                const locale = currentLanguage === 'el' ? 'el-GR' : 'en-US';

                if (classDate === today.toDateString()) {
                    dateDisplay = t('news.today') + ', ' + startTime.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
                } else if (classDate === tomorrow.toDateString()) {
                    dateDisplay = t('news.tomorrow') + ', ' + startTime.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
                } else {
                    dateDisplay = startTime.toLocaleDateString(locale, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                    });
                }

                // Format time range
                const timeRange = `${startTime.toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })}-${endTime.toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })}`;

                // Calculate spots available
                const spotsLeft = Math.max(0, (classInstance.capacity ?? 0) - (classInstance.bookedCount ?? 0));

                // Check if user has booked this class
                const isBookedByUser = 'isBookedByUser' in classInstance ? Boolean(classInstance.isBookedByUser) : false;

                return {
                    id: classInstance._id,
                    date: dateDisplay,
                    timeRange,
                    name: classInstance.name,
                    spotsLeft,
                    isBookedByUser,
                    classInstance
                };
            });

        return venueClasses;
    }, [venueClasses, venueId, t]);

    // Get image storage IDs
    const imageStorageIds = venue?.imageStorageIds ?? [];

    // Fetch image URLs if there are images
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

    // Get image URLs for carousel
    const imageUrls = useMemo(() => {
        const urls: string[] = [];
        imageStorageIds.forEach(id => {
            const url = storageIdToUrl.get(id);
            if (url) urls.push(url);
        });
        return urls;
    }, [imageStorageIds, storageIdToUrl]);

    // Loading state
    const isLoading = !venue || (imageStorageIds.length > 0 && !imageUrlsQuery);


    // Venue info
    const venueName = venue?.name ?? t('venues.venue');
    const venueAddress = venue?.address ?
        `${venue.address.street}, ${venue.address.city}, ${venue.address.zipCode}` : t('venues.addressNotAvailable');
    const venueDescription = venue?.description ?? '';
    const venuePhone = venue?.phone;
    const venueWebsite = venue?.website;
    const venueEmail = venue?.email;
    const showPhone = Boolean(venuePhone);
    const showEmail = Boolean(venueEmail);
    const showWebsite = Boolean(venueWebsite);

    const handlePhonePress = () => {
        if (venuePhone) {
            Linking.openURL(`tel:${venuePhone}`);
        }
    };

    const handleWebsitePress = () => {
        if (venueWebsite) {
            const url = venueWebsite.startsWith('http') ? venueWebsite : `https://${venueWebsite}`;
            Linking.openURL(url);
        }
    };

    const handleEmailPress = () => {
        if (venueEmail) {
            Linking.openURL(`mailto:${venueEmail}`);
        }
    };

    const handleMessageVenue = async () => {
        try {
            // Create or get existing thread
            const result = await getOrCreateThread({
                venueId: venueId as Id<"venues">
            });

            // Navigate to conversation screen
            navigation.navigate('Conversation', {
                threadId: result.threadId,
                venueName: venue?.name || t('venues.venue'),
                venueImage: imageUrls[0], // Use first venue image if available
            });
        } catch (error) {
            console.error('Failed to open conversation:', error);
            // TODO: Show error toast to user
        }
    };

    const handleScroll = (event: any) => {
        const scrollY = event.nativeEvent.contentOffset.y;

        // Calculate opacity based on scroll position
        // 0-100px: opacity 0 (transparent)
        // 100-250px: opacity 0-1 (gradual transition)
        // 250px+: opacity 1 (fully white)
        let opacity = 0;
        if (scrollY > 100) {
            if (scrollY >= 250) {
                opacity = 1;
            } else {
                // Gradual transition from 100px to 250px
                opacity = (scrollY - 100) / 150;
            }
        }

        setHeaderOpacity(opacity);

        // Update the boolean state for other styling
        const shouldBeWhite = scrollY > 100;
        if (shouldBeWhite !== isHeaderWhite) {
            setIsHeaderWhite(shouldBeWhite);
        }
    };

    const renderImageItem = ({ item: imageUrl }: { item: string }) => (
        <View style={styles.imageContainer}>
            <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                contentFit="cover"
                transition={300}
                cachePolicy="memory-disk"
            />
        </View>
    );

    // Render venue image and header info
    const renderHeaderSection = () => (
        <>
            {/* Full-width Image Carousel with Overlay */}
            {imageUrls.length > 0 ? (
                <View style={styles.fullWidthCarouselContainer}>
                    <Carousel
                        width={screenWidth}
                        height={360}
                        data={imageUrls}
                        renderItem={({ item: imageUrl }) => (
                            <Image
                                source={{ uri: imageUrl }}
                                style={styles.fullWidthImage}
                                contentFit="cover"
                                transition={300}
                                cachePolicy="memory-disk"
                            />
                        )}
                        loop={imageUrls.length > 1}
                        pagingEnabled
                        snapEnabled
                        autoPlay={false}
                        onSnapToItem={(index) => setCurrentImageIndex(index)}
                    />


                    {imageUrls.length > 1 && (
                        <View style={styles.carouselDots}>
                            {imageUrls.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        index === currentImageIndex && styles.activeDot
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.fullWidthPlaceholderContainer}>
                    <View style={styles.fullWidthPlaceholderImage}>
                        <Text style={styles.placeholderText}>{t('venues.noImagesAvailable')}</Text>
                    </View>
                </View>
            )}

            {/* Venue Info Section */}
            <View style={styles.venueInfoSection}>
                {/* Venue Name - Centered */}
                <Text style={styles.venueName}>{venueName}</Text>

                {/* Venue Address - Centered, Two Lines */}
                <Text style={styles.venueDescription} numberOfLines={2}>
                    {distanceLabel ? `${venueAddress} • ${distanceLabel}` : venueAddress}
                </Text>


                {/* 3-Column Row */}
                <View style={styles.venueStatsRow}>
                    {/* Ratings Column - Two Rows */}
                    <View style={styles.statsColumn}>
                        <Text style={styles.ratingNumber}>{venue?.rating?.toFixed(2) || '0.00'}</Text>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <StarIcon
                                    key={star}
                                    size={14}
                                    color="#ffd700"
                                    fill={star <= Math.floor(venue?.rating || 0) ? "#ffd700" : "transparent"}
                                />
                            ))}
                        </View>
                    </View>

                    {/* JUST ARRIVED! Badge Column */}
                    <View style={styles.statsColumn}>
                        <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>{t('venues.justArrived')}</Text>
                        </View>
                    </View>

                    {/* Reviews Column - Two Rows */}
                    <View style={styles.statsColumn}>
                        <Text style={styles.reviewsNumber}>{venue?.reviewCount || 0}</Text>
                        <Text style={styles.reviewsLabel}>{t('reviews.reviews')}</Text>
                    </View>
                </View>
            </View>

        </>
    );

    // Render main content sections
    const renderContent = () => (
        <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={[styles.contentContainer, { paddingBottom: contentBottomPadding }]}
        >
            {renderHeaderSection()}

            <Divider />

            {/* About the studio Section */}
            {venueDescription && (
                <>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('venues.aboutTheStudio')}</Text>
                        <Text style={styles.descriptionText}>
                            {venueDescription}
                        </Text>
                    </View>

                    {/* Separator */}
                    <Divider />
                </>
            )}

            {/* Who we are Section */}
            {/* <View style={styles.section}>
                <Text style={styles.sectionTitle}>Who we are</Text>
                <View style={styles.teamMember}>
                    <View style={styles.avatarContainer}>
                        <UserIcon size={40} color={theme.colors.zinc[600]} />
                    </View>
                    <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>Sarah Johnson</Text>
                        <Text style={styles.memberDescription}>Certified yoga instructor with 8+ years experience. Passionate about helping people find balance through mindful movement.</Text>
                    </View>
                </View>
                <View style={styles.teamMember}>
                    <View style={styles.avatarContainer}>
                        <UserIcon size={40} color={theme.colors.zinc[600]} />
                    </View>
                    <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>Mike Thompson</Text>
                        <Text style={styles.memberDescription}>Personal trainer and nutrition specialist. Dedicated to creating personalized fitness programs for every goal.</Text>
                    </View>
                </View>
            </View>

            <Divider /> */}

            {/* Services Section */}
            {/* <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services</Text>
                <View style={styles.tagContainer}>
                    {venue?.services ? Object.entries(venue.services)
                        .filter(([_, enabled]) => enabled)
                        .map(([service]) => (
                            <View key={service} style={styles.tag}>
                                <Text style={styles.tagText}>
                                    {service.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </Text>
                            </View>
                        )) : (
                        <>
                            <View style={styles.tag}><Text style={styles.tagText}>Gym</Text></View>
                            <View style={styles.tag}><Text style={styles.tagText}>Yoga</Text></View>
                            <View style={styles.tag}><Text style={styles.tagText}>Personal Training</Text></View>
                            <View style={styles.tag}><Text style={styles.tagText}>Group Classes</Text></View>
                        </>
                    )}
                </View>
            </View> */}

            {/* Amenities Section */}
            <AmenitiesSection venue={venue} />

            <Divider />

            {/* Upcoming Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('venues.upcomingClasses')}</Text>
                    {upcomingVenueClasses && upcomingVenueClasses.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                navigation.navigate('VenueClassInstancesModal', {
                                    venueId,
                                    venueName: venue?.name || t('venues.venue')
                                });
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.seeAllButton}>{t('venues.seeAll')}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {upcomingVenueClasses && upcomingVenueClasses.length > 0 ? (
                    <View style={styles.carouselContainer}>
                        <Carousel
                            loop={false}
                            width={CAROUSEL_ITEM_WIDTH + ITEM_GAP}
                            height={UPCOMING_CAROUSEL_HEIGHT}
                            data={[...(upcomingVenueClasses || []), { type: 'seeMore' }]}
                            scrollAnimationDuration={500}
                            style={styles.carousel}
                            snapEnabled
                            renderItem={({ item }) => {
                                if ('type' in item && item.type === 'seeMore') {
                                    return (
                                        <TouchableOpacity
                                            style={[styles.baseCarouselCard, styles.upcomingCarouselCard, styles.seeMoreCard]}
                                            onPress={() => {
                                                navigation.navigate('VenueClassInstancesModal', {
                                                    venueId,
                                                    venueName: venue?.name || t('venues.venue')
                                                });
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.seeMoreCardContent}>
                                                <Text style={styles.seeMoreText}>{t('venues.seeMore')}</Text>
                                                <Text style={styles.seeMoreSubtext}>{t('venues.viewAllClasses')}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }

                                // Type assertion: item is a class instance at this point
                                const classItem = item as any;

                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.baseCarouselCard,
                                            styles.upcomingCarouselCard,
                                            classItem.isBookedByUser && styles.bookedCarouselCard
                                        ]}
                                        onPress={() => {
                                            navigation.navigate('ClassDetailsModal', {
                                                classInstance: classItem.classInstance
                                            });
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.upcomingCardContent}>
                                            <Text style={styles.upcomingDate} numberOfLines={1}>
                                                {classItem.date}
                                            </Text>
                                            <Text style={styles.upcomingTime}>
                                                {classItem.timeRange}
                                            </Text>
                                            <Text style={styles.upcomingClassName} numberOfLines={2}>
                                                {classItem.name}
                                            </Text>
                                            <View style={styles.upcomingSpotsContainer}>
                                                {classItem.isBookedByUser ? (
                                                    <View style={styles.bookedBadge}>
                                                        <CheckCircleIcon size={12} color={theme.colors.emerald[950]} strokeWidth={2} />
                                                        <Text style={styles.bookedText}>{t('venues.alreadyBooked')}</Text>
                                                    </View>
                                                ) : (
                                                    <Text style={styles.upcomingSpotsText}>
                                                        {t('venues.spotsAvailable', { count: classItem.spotsLeft })}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            onConfigurePanGesture={(gestureChain) => {
                                gestureChain
                                    .activeOffsetX([-10, 10])
                                    .failOffsetY([-15, 15]);
                            }}
                        />
                    </View>
                ) : (
                    <Text style={styles.descriptionText}>{t('venues.noUpcomingClassesFound')}</Text>
                )}
            </View>
            <Divider />

            {/* Reviews Section */}
            <ReviewsSection
                venueId={venueId as Id<"venues">}
                venueName={venue?.name || t('venues.venue')}
            />

            <Divider />

            {/* Contact Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('venues.contact')}</Text>

                <View style={styles.contactContainer}>
                    {/* Address */}
                    <View style={styles.contactItemRow}>
                        <View style={styles.contactIconContainer}>
                            <MapPinIcon size={18} color={theme.colors.emerald[600]} />
                        </View>
                        <View style={styles.contactContent}>
                            <Text style={styles.contactLabel}>{t('venues.address')}</Text>
                            <Text style={styles.contactText}>{venueAddress}</Text>
                        </View>
                    </View>

                    {/* Phone */}
                    {showPhone && (
                        <TouchableOpacity
                            style={styles.contactItemRow}
                            onPress={handlePhonePress}
                            activeOpacity={0.7}
                        >
                            <View style={styles.contactIconContainer}>
                                <PhoneIcon size={18} color={theme.colors.emerald[600]} />
                            </View>
                            <View style={styles.contactContent}>
                                <Text style={styles.contactLabel}>{t('venues.phone')}</Text>
                                <Text style={styles.contactText}>{venuePhone}</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Email */}
                    {showEmail && (
                        <TouchableOpacity
                            style={styles.contactItemRow}
                            onPress={handleEmailPress}
                            activeOpacity={0.7}
                        >
                            <View style={styles.contactIconContainer}>
                                <MailIcon size={18} color={theme.colors.emerald[600]} />
                            </View>
                            <View style={styles.contactContent}>
                                <Text style={styles.contactLabel}>{t('venues.email')}</Text>
                                <Text style={styles.contactText}>{venueEmail}</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Website */}
                    {showWebsite && (
                        <TouchableOpacity
                            style={styles.contactItemRow}
                            onPress={handleWebsitePress}
                            activeOpacity={0.7}
                        >
                            <View style={styles.contactIconContainer}>
                                <GlobeIcon size={18} color={theme.colors.emerald[600]} />
                            </View>
                            <View style={styles.contactContent}>
                                <Text style={styles.contactLabel}>{t('venues.website')}</Text>
                                <Text style={[styles.contactText, styles.contactLink]}>{venueWebsite}</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Message venue - less prominent, inside contact card */}
                    {/* Message venue */}
                    <TouchableOpacity
                        style={[styles.contactItemRow, { borderBottomWidth: 0 }]}
                        onPress={handleMessageVenue}
                        activeOpacity={0.7}
                    >
                        <View style={styles.contactIconContainer}>
                            <MessageCircleIcon size={18} color={theme.colors.emerald[600]} />
                        </View>
                        <View style={styles.contactContent}>
                            <Text style={styles.contactLabel}>{t('venues.message')}</Text>
                            <Text style={[styles.contactText, styles.contactLink]}>{t('venues.chatWithVenue')}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

        </ScrollView>
    );

    return (
        <View style={styles.container}>
            {/* Fixed Header Row */}
            <View style={[
                styles.fixedHeader,
                {
                    backgroundColor: `rgba(255, 255, 255, ${headerOpacity})`,
                    borderBottomWidth: headerOpacity > 0 ? 1 : 0,
                    borderBottomColor: `rgba(229, 231, 235, ${headerOpacity})`,
                }
            ]}>
                <TouchableOpacity
                    style={[
                        styles.headerBackButton,
                        {
                            backgroundColor: `rgba(255, 255, 255, ${0.5 - (headerOpacity * 0.5)})`,
                        }
                    ]}
                    onPress={() => {
                        try {
                            if (navigation.canGoBack()) {
                                navigation.goBack();
                            } else {
                                navigation.navigate('Explore');
                            }
                        } catch (error) {
                            console.error('Navigation error:', error);
                            navigation.navigate('Explore');
                        }
                    }}
                >
                    <ChevronLeftIcon
                        size={30}
                    // color={theme.colors.zinc[950]}
                    />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff4747" />
                    <Text style={styles.loadingText}>{t('venues.loadingVenueDetails')}</Text>
                </View>
            ) : (
                renderContent()
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.zinc[50],
    },
    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100, // Height to accommodate status bar + header
        paddingTop: 48, // Status bar height
        paddingHorizontal: 20,
        zIndex: 1000,
        backgroundColor: 'transparent',
    },
    headerBackButton: {
        width: 36,
        height: 36,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    content: {
        flex: 1,
        backgroundColor: theme.colors.zinc[50],
    },
    contentContainer: {
        paddingBottom: 24,
    },
    section: {
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    seeAllButton: {
        marginBottom: 10,
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.emerald[600],
        paddingVertical: 8,
        paddingHorizontal: 12
    },
    teamMember: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.zinc[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    memberDescription: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
    },
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    amenityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        width: '48%',
    },
    amenityIcon: {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    amenityIconText: {
        fontSize: 16,
        color: theme.colors.zinc[600],
    },
    amenityText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },

    // Upcoming carousel styles
    carouselContainer: {
        paddingHorizontal: CAROUSEL_PADDING,
    },
    carousel: {
        width: screenWidth,
    },
    baseCarouselCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.zinc[100],
    },
    upcomingCarouselCard: {
        width: CAROUSEL_ITEM_WIDTH,
        height: UPCOMING_CAROUSEL_HEIGHT,
    },
    bookedCarouselCard: {
        backgroundColor: theme.colors.emerald[50],
        borderColor: theme.colors.emerald[200],
    },
    upcomingCardContent: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    upcomingDate: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.zinc[600],
        marginBottom: 4,
    },
    upcomingTime: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.zinc[950],
        marginBottom: 8,
    },
    upcomingClassName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.zinc[800],
        flex: 1,
        marginBottom: 8,
    },
    upcomingSpotsContainer: {
        alignSelf: 'flex-start',
    },
    upcomingSpotsText: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.emerald[600],
    },
    seeMoreCard: {
        backgroundColor: theme.colors.zinc[100],
        borderColor: theme.colors.zinc[200],
    },
    seeMoreCardContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    seeMoreText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.zinc[800],
        marginBottom: 4,
    },
    seeMoreSubtext: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.zinc[600],
    },
    imageContainer: {
        width: screenWidth,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: screenWidth - 32,
        height: 200,
        borderRadius: 12,
    },
    carouselDots: {
        position: 'absolute',
        bottom: 18,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        zIndex: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    activeDot: {
        backgroundColor: '#ffffff',
        width: 20,
        height: 6,
        borderRadius: 3,
    },
    placeholderContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    placeholderImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    sectionRow: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sectionHalf: {
        flex: 1,
        gap: 4,
    },
    label: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    value: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    locationText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
        flex: 1,
        lineHeight: 20,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    tag: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
    },
    tagIcon: {
        marginRight: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },

    // New full-width image styles (aligned with ClassDetailsModal)
    fullWidthCarouselContainer: {
        marginBottom: 0,
        position: 'relative',
        borderWidth: 1,
    },
    fullWidthImage: {
        width: screenWidth,
        height: 360,
    },
    fullWidthPlaceholderContainer: {
        marginBottom: 0,
    },
    fullWidthPlaceholderImage: {
        width: screenWidth,
        height: 360,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },

    bottomGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '40%',
        zIndex: 1,
    },
    imageOverlayContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 20,
        zIndex: 2,
        gap: 4,
    },
    imageOverlayTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
    imageOverlaySubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.92)',
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },

    // Contact info row (like Price/Spots)
    contactInfoSection: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    contactInfoItem: {
        flex: 1,
    },
    contactInfoRight: {
        alignItems: 'flex-end',
    },
    contactValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    contactValueDisabled: {
        color: '#9ca3af',
        fontWeight: '600',
    },

    // Description and amenities (reuse from ClassDetailsModal styles)
    descriptionContainer: {
        paddingTop: 12,
        paddingHorizontal: 20,
        paddingBottom: 24,
        backgroundColor: '#fafafa', // theme.zinc[50]
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    amenitiesTitle: {
        marginTop: 8,
    },
    descriptionText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#374151',
        fontWeight: '400',
    },
    amenitiesContainer: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        backgroundColor: '#fafafa', // theme.zinc[50]
    },

    // New contact details list styled like ClassDetailsModal
    detailsList: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 6,
    },
    phoneIcon: {
        marginRight: 6,
        color: '#444444',
    },
    mailIcon: {
        marginRight: 6,
        color: '#444444',
    },
    iconDisabled: {
        color: '#9ca3af',
    },
    detailText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '400',
        flex: 1,
    },
    detailTextDisabled: {
        color: '#9ca3af',
    },


    // New venue info section
    venueInfoSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: theme.colors.zinc[50],
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24, // Overlap the image slightly for overlay effect
        position: 'relative',
        zIndex: 1,
    },
    venueName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    venueDescription: {
        fontSize: 14,
        fontWeight: '400',
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    contactContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.colors.zinc[200],
        overflow: 'hidden',
    },
    contactItemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.zinc[100],
    },
    contactIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.zinc[100],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    contactContent: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.zinc[500],
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    contactText: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.zinc[900],
        lineHeight: 22,
    },
    contactLink: {
        color: theme.colors.emerald[600],
        fontWeight: '600',
    },

    venueStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    statsColumn: {
        flex: 1,
        alignItems: 'center',
    },
    ratingNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    starsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    newBadge: {
        backgroundColor: theme.colors.zinc[50],
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.zinc[200],
    },
    newBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.zinc[950],
        letterSpacing: 0.5,
    },
    reviewsNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    reviewsLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6b7280',
    },
    bookedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.emerald[100],
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    bookedText: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.emerald[950],
    },
});
