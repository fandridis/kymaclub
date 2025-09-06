import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions, ActivityIndicator, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { StarIcon, ArrowLeftIcon, ShowerHeadIcon, AccessibilityIcon, UserIcon } from 'lucide-react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { ClassCard } from '../../components/ClassCard';
import { Divider } from '../../components/Divider';
import type { RootStackParamListWithNestedTabs } from '..';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import type { ClassInstance } from '../../hooks/use-class-instances';
import * as Location from 'expo-location';
import { formatDistance as formatDistanceMeters, calculateDistance } from '../../utils/location';
import { useTypedTranslation } from '../../i18n/typed';
import { theme } from '../../theme';

type VenueDetailsRoute = RouteProp<RootStackParamListWithNestedTabs, 'VenueDetailsScreen'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Date formatting utilities
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

// Group classes by date
const groupClassesByDate = (classes: ClassInstance[]): Record<string, ClassInstance[]> => {
    const grouped: Record<string, ClassInstance[]> = {};

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

type TabType = 'Details' | 'Classes';

// Amenities icons mapping
const amenitiesIconsMap: Record<string, React.ComponentType<any>> = {
    showers: ShowerHeadIcon,
    accessible: AccessibilityIcon,
};

export function VenueDetailsScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamListWithNestedTabs>>();
    const route = useRoute<VenueDetailsRoute>();
    const { venueId } = route.params;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<TabType>('Details');
    const { t } = useTypedTranslation();
    const [distanceLabel, setDistanceLabel] = useState<string | null>(null);
    const [isHeaderWhite, setIsHeaderWhite] = useState(false);
    const [headerOpacity, setHeaderOpacity] = useState(0);

    // Fetch full venue data
    const venue = useQuery(api.queries.venues.getVenueById, {
        venueId: venueId as Id<"venues">
    });

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

    // Fetch upcoming classes for this venue
    const upcomingClasses = useQuery(api.queries.venues.getUpcomingClassesForVenue, {
        venueId: venueId as Id<"venues">,
        daysAhead: 14
    });

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

    // Group classes by date for FlashList
    const classesSections = useMemo(() => {
        if (!upcomingClasses?.length) return [];

        const grouped = groupClassesByDate(upcomingClasses as ClassInstance[]);
        return Object.entries(grouped).map(([dateKey, classes]) => ({
            title: dateKey,
            data: classes,
        }));
    }, [upcomingClasses]);

    // Build flattened list with header indices for FlashList sticky headers
    const { flattenedItems, headerIndices } = useMemo(() => {
        const items: Array<{ type: 'header'; title: string } | { type: 'class'; data: ClassInstance }> = [];
        const headerIdx: number[] = [];
        let i = 0;

        classesSections.forEach(section => {
            items.push({ type: 'header', title: section.title });
            headerIdx.push(i++);
            section.data.forEach(classItem => {
                items.push({ type: 'class', data: classItem });
                i++;
            });
        });

        return { flattenedItems: items, headerIndices: headerIdx };
    }, [classesSections]);

    const renderFlashListItem = useCallback(({ item }: { item: { type: 'header'; title: string } | { type: 'class'; data: ClassInstance } }) => {
        if (item.type === 'header') {
            return (
                <View style={styles.stickyDateHeader}>
                    <Text style={styles.dateHeaderText}>{item.title}</Text>
                </View>
            );
        }
        return (
            <ClassCard
                classInstance={item.data}
                onPress={(classInstance) =>
                    navigation.navigate('ClassDetailsModal', { classInstance })
                }
            />
        );
    }, [navigation]);

    // Venue info
    const venueName = venue?.name ?? 'Venue';
    const venueAddress = venue?.address ?
        `${venue.address.street}, ${venue.address.city}, ${venue.address.zipCode}` : 'Address not available';
    const venueDescription = venue?.description ?? '';
    const venuePhone = venue?.phone;
    const venueWebsite = venue?.website;
    const venueEmail = venue?.email;

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
                        <Text style={styles.placeholderText}>No Images Available</Text>
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
                            <Text style={styles.newBadgeText}>JUST ARRIVED!</Text>
                        </View>
                    </View>

                    {/* Reviews Column - Two Rows */}
                    <View style={styles.statsColumn}>
                        <Text style={styles.reviewsNumber}>{venue?.reviewCount || 0}</Text>
                        <Text style={styles.reviewsLabel}>reviews</Text>
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
        >
            {renderHeaderSection()}

            <Divider />

            {/* About the studio Section */}
            {venueDescription && (
                <>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About the studio</Text>
                        <Text style={styles.descriptionText}>
                            {venueDescription}
                        </Text>
                    </View>

                    {/* Separator */}
                    <Divider />
                </>
            )}

            {/* Who we are Section */}
            <View style={styles.section}>
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

            <Divider />

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
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, styles.amenitiesTitle]}>Amenities</Text>
                <View style={styles.tagContainer}>
                    {venue?.amenities ? Object.entries(venue.amenities)
                        .filter(([_, enabled]) => enabled)
                        .map(([amenity]) => {
                            const IconComponent = amenitiesIconsMap[amenity];
                            return (
                                <View key={amenity} style={styles.tag}>
                                    {IconComponent && (
                                        <IconComponent size={16} color={theme.colors.zinc[600]} style={styles.tagIcon} />
                                    )}
                                    <Text style={styles.tagText}>
                                        {amenity.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </Text>
                                </View>
                            );
                        }) : (
                        <>
                            <View style={styles.tag}><Text style={styles.tagText}>Parking</Text></View>
                            <View style={styles.tag}><Text style={styles.tagText}>Locker Rooms</Text></View>
                            <View style={styles.tag}><Text style={styles.tagText}>WiFi</Text></View>
                            <View style={styles.tag}><Text style={styles.tagText}>Water Station</Text></View>
                        </>
                    )}
                </View>
            </View>

            <Divider />

            {/* Classes Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Classes</Text>
                <View style={styles.classesPlaceholder}>
                    <Text style={styles.placeholderText}>Coming soon - Browse available classes and book your sessions.</Text>
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
                                navigation.navigate('Home', { screen: 'Explore' });
                            }
                        } catch (error) {
                            console.error('Navigation error:', error);
                            navigation.navigate('Home', { screen: 'Explore' });
                        }
                    }}
                >
                    <ArrowLeftIcon
                        size={26}
                    // color={theme.colors.zinc[950]}
                    />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff4747" />
                    <Text style={styles.loadingText}>Loading venue details...</Text>
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
    section: {
        paddingHorizontal: 20,
        paddingBottom: 8,
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
    classesPlaceholder: {
        padding: 24,
        backgroundColor: theme.colors.zinc[100],
        borderRadius: 12,
        alignItems: 'center',
    },
    carouselContainer: {
        marginBottom: 16,
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
        bottom: 12,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    activeDot: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        width: 10,
        height: 10,
        borderRadius: 5,
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
    contactContainer: {
        gap: 12,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
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
    stickyDateHeader: {
        backgroundColor: theme.colors.zinc[50],
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        zIndex: 2,
    },
    dateHeaderText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
    contactLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
        marginTop: 2,
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
});