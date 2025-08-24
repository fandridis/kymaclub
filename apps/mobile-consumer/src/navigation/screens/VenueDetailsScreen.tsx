import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions, ActivityIndicator, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { CalendarIcon, ChevronLeftIcon, StarIcon } from 'lucide-react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { ClassCard } from '../../components/ClassCard';
import { FlashList } from '@shopify/flash-list';
import type { RootStackParamListWithNestedTabs } from '..';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import type { ClassInstance } from '../../hooks/use-class-instances';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { formatDistance as formatDistanceMeters, calculateDistance } from '../../utils/location';
import { useTypedTranslation } from '../../i18n/typed';
import { getVenueCategoryDisplay } from '@repo/utils/constants';

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

export function VenueDetailsScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamListWithNestedTabs>>();
    const route = useRoute<VenueDetailsRoute>();
    const { venueId } = route.params;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<TabType>('Details');
    const { t } = useTypedTranslation();
    const [distanceLabel, setDistanceLabel] = useState<string | null>(null);

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

    // Render venue details tab content
    const renderDetailsTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Full-width Image Carousel with Overlay */}
            {imageUrls.length > 0 ? (
                <View style={styles.fullWidthCarouselContainer}>
                    <Carousel
                        width={screenWidth}
                        height={280}
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
                        style={styles.bottomGradient}
                    />
                    <View pointerEvents="none" style={styles.imageOverlayContainer}>
                        <Text style={styles.imageOverlayTitle} numberOfLines={2}>
                            {venueName}
                        </Text>
                        <View style={styles.ratingContainer}>
                            <StarIcon size={14} color="#fff" fill="#ffd700" />
                            <Text style={styles.ratingText}>{venue?.rating?.toFixed(1)} ({venue?.reviewCount}) - {getVenueCategoryDisplay(venue?.primaryCategory ?? 'wellness_center')}</Text>
                        </View>
                        <Text style={styles.imageOverlaySubtitle} numberOfLines={2}>
                            {venueAddress}
                        </Text>
                    </View>
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

            {/* Description */}
            {venueDescription && (
                <View style={styles.descriptionContainer}>
                    <Text style={styles.sectionTitle}>About this venue</Text>
                    <Text style={styles.descriptionText}>{venueDescription}</Text>
                </View>
            )}

            {/* Services */}
            {venue?.services && Object.entries(venue.services).some(([_, enabled]) => enabled) && (
                <View style={styles.amenitiesContainer}>
                    <Text style={styles.sectionTitle}>Services</Text>
                    <View style={styles.tagContainer}>
                        {Object.entries(venue.services)
                            .filter(([_, enabled]) => enabled)
                            .map(([service]) => (
                                <View key={service} style={styles.tag}>
                                    <Text style={styles.tagText}>
                                        {service.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </Text>
                                </View>
                            ))}
                    </View>
                </View>
            )}
            {/* Amenities */}
            {venue?.amenities && Object.entries(venue.amenities).some(([_, enabled]) => enabled) && (
                <View style={styles.amenitiesContainer}>
                    <Text style={styles.sectionTitle}>Amenities</Text>
                    <View style={styles.tagContainer}>
                        {Object.entries(venue.amenities)
                            .filter(([_, enabled]) => enabled)
                            .map(([amenity]) => (
                                <View key={amenity} style={styles.tag}>
                                    <Text style={styles.tagText}>
                                        {amenity.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </Text>
                                </View>
                            ))}
                    </View>
                </View>
            )}
        </ScrollView>
    );

    // Render classes tab content with FlashList and sticky headers
    const renderClassesTab = () => {
        if (!upcomingClasses || upcomingClasses.length === 0) {
            return (
                <View style={styles.emptyClassesContainer}>
                    <CalendarIcon size={48} color="#9ca3af" />
                    <Text style={styles.emptyClassesText}>No upcoming classes</Text>
                    <Text style={styles.emptyClassesSubtext}>Check back later for new classes</Text>
                </View>
            );
        }

        return (
            <FlashList
                data={flattenedItems}
                renderItem={renderFlashListItem}
                keyExtractor={(item) => item.type === 'header' ? `header-${item.title}` : `class-${item.data._id}`}
                getItemType={(item) => item.type}
                stickyHeaderIndices={headerIndices}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sectionListContent}
            />
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity

                    onPress={() => {
                        console.log('Back button pressed - attempting navigation');
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
                    style={styles.backButton}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <ChevronLeftIcon size={24} color="#111827" />
                    <Text style={styles.backButtonText} pointerEvents="none">Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {venueName}
                </Text>
                <View style={styles.headerRightSpacer} />
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'Details' && styles.activeTabButton]}
                    onPress={() => setActiveTab('Details')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'Details' && styles.activeTabButtonText]}>
                        Details
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'Classes' && styles.activeTabButton]}
                    onPress={() => setActiveTab('Classes')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'Classes' && styles.activeTabButtonText]}>
                        Classes
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff4747" />
                    <Text style={styles.loadingText}>Loading venue details...</Text>
                </View>
            ) : (
                <View style={styles.contentContainer}>
                    {activeTab === 'Details' ? renderDetailsTab() : renderClassesTab()}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 12,
        marginLeft: -4,
        borderRadius: 20,
    },
    backButtonText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginLeft: -32, // Compensate for back button
    },
    headerRightSpacer: {
        width: 32,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderRadius: 8,
    },
    activeTabButton: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    activeTabButtonText: {
        color: '#111827',
        fontWeight: '600',
    },
    contentContainer: {
        flex: 1,
    },
    tabContent: {
        flex: 1,
    },
    sectionListContent: {
        paddingBottom: 20,
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
    section: {
        gap: 4,
        paddingHorizontal: 16,
        marginBottom: 16,
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
    },
    tagText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
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
    emptyClassesContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyClassesText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 16,
        fontWeight: '600',
    },
    emptyClassesSubtext: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 8,
    },

    // New full-width image styles (aligned with ClassDetailsModal)
    fullWidthCarouselContainer: {
        marginBottom: 0,
    },
    fullWidthImage: {
        width: screenWidth,
        height: 280,
    },
    fullWidthPlaceholderContainer: {
        marginBottom: 0,
    },
    fullWidthPlaceholderImage: {
        width: screenWidth,
        height: 280,
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
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 10,
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
});