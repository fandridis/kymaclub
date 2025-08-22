import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Calendar1Icon, ClockIcon, CalendarOffIcon, DiamondIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import type { RootStackParamList } from '..';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useAuthenticatedUser } from '../../stores/auth-store';

type ClassDetailsRoute = RouteProp<RootStackParamList, 'ClassDetailsModal'>;

const { width: screenWidth } = Dimensions.get('window');

export function ClassDetailsModalScreen() {
    const navigation = useNavigation();
    const route = useRoute<ClassDetailsRoute>();
    const { classInstance } = route.params;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { showActionSheetWithOptions } = useActionSheet();

    const user = useAuthenticatedUser();
    const bookClass = useMutation(api.mutations.bookings.bookClass);
    const [isBooking, setIsBooking] = useState(false);

    // Check if user already has a booking for this class
    const existingBooking = useQuery(api.queries.bookings.getUserBookings, {
        classInstanceId: classInstance._id
    });

    // Fetch full template data
    const template = useQuery(api.queries.classTemplates.getClassTemplateById, {
        templateId: classInstance.templateId
    });

    // Fetch full venue data  
    const venue = useQuery(api.queries.venues.getVenueById, {
        venueId: classInstance.venueId
    });

    // Get all image storage IDs from both template and venue
    const templateImageIds = template?.imageStorageIds ?? [];
    const venueImageIds = venue?.imageStorageIds ?? [];
    const allImageIds = [...templateImageIds, ...venueImageIds];

    // Fetch image URLs if there are images
    const imageUrlsQuery = useQuery(
        api.queries.uploads.getUrls,
        allImageIds.length > 0 ? { storageIds: allImageIds } : "skip"
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

    const onPress = () => {
        const options = [`Spend ${price} credits`, 'Cancel'];
        const cancelButtonIndex = 1;

        showActionSheetWithOptions({
            options,
            cancelButtonIndex,
        }, async (selectedIndex?: number) => {
            if (selectedIndex === undefined) return;

            switch (selectedIndex) {
                case 0: {
                    // Book
                    try {
                        setIsBooking(true);
                        await bookClass({
                            classInstanceId: classInstance._id,
                            description: `Booking for ${className}`,
                        });
                        Alert.alert('Booked', 'Your class has been booked successfully.');
                    } catch (err: any) {
                        const message =
                            (err?.data && (err.data.message || err.data.code)) ||
                            err?.message ||
                            'Failed to book class. Please try again.';
                        Alert.alert('Booking failed', String(message));
                    } finally {
                        setIsBooking(false);
                    }
                    break;
                }

                case cancelButtonIndex:
                    // Canceled
                    console.log('Canceled');
                    break;
            }
        });
    };

    // Get image URLs for carousel (prioritize template images)
    const imageUrls = useMemo(() => {
        const urls: string[] = [];

        // Add template images first
        templateImageIds.forEach(id => {
            const url = storageIdToUrl.get(id);
            if (url) urls.push(url);
        });

        // Add venue images after
        venueImageIds.forEach(id => {
            const url = storageIdToUrl.get(id);
            if (url) urls.push(url);
        });

        return urls;
    }, [templateImageIds, venueImageIds, storageIdToUrl]);

    // Navigate to bookings screen - reset stack to avoid modal cycles
    const handleGoToBookings = () => {
        // Reset the navigation stack to HomeTabs with Bookings active
        // This completely clears the modal stack and goes directly to the main tab
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [
                    {
                        name: 'Home',
                        params: { screen: 'Bookings' }
                    }
                ],
            })
        );
    };

    // Loading state
    const isLoading = !template || !venue || (allImageIds.length > 0 && !imageUrlsQuery) || existingBooking === undefined;

    // Use template data (with instance overrides)
    const className = classInstance.name ?? template?.name ?? 'Class';
    const description = classInstance.description ?? template?.description ?? '';
    const instructor = classInstance.instructor ?? template?.instructor ?? 'TBD';
    const capacity = classInstance.capacity ?? template?.capacity ?? 0;
    const baseCredits = classInstance.baseCredits ?? template?.baseCredits ?? 0;

    // Venue info
    const businessName = venue?.name ?? 'Unknown Venue';

    // Time and pricing calculations  
    const startTime = new Date(classInstance.startTime);

    // Formatted "When" string like "Friday, 14 August, 13:00" in Europe/Athens timezone
    const whenStr = format(startTime, 'eeee, dd MMMM, HH:mm', {
        in: tz('Europe/Athens')
    });

    // Formatted "Cancel until" string based on template.cancellationWindowHours
    const cancelUntilStr = template?.cancellationWindowHours
        ? (() => {
            const cancelUntilDate = new Date(
                classInstance.startTime - template.cancellationWindowHours * 60 * 60 * 1000,
            );
            // Format in Europe/Athens timezone
            return format(cancelUntilDate, 'eeee, dd MMMM, HH:mm', {
                in: tz('Europe/Athens')
            });
        })()
        : null;

    const duration = Math.round((classInstance.endTime - classInstance.startTime) / (1000 * 60));
    const price = baseCredits; // Show in credits instead of euros
    const spotsLeft = Math.max(0, capacity - (classInstance.bookedCount ?? 0));
    // const typeLabel = classInstance.tags?.[0] ?? (className ? className.split(' ')[0] : 'Class');

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

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {className}
                </Text>
                <View style={styles.headerRightSpacer} />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff4747" />
                    <Text style={styles.loadingText}>Loading class details...</Text>
                </View>
            ) : (
                <>
                    <ScrollView
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Image Carousel - Full Width */}
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
                                        {className}
                                    </Text>
                                    <Text style={styles.imageOverlaySubtitle} numberOfLines={1}>
                                        {`with ${instructor} - ${businessName}`}
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

                        {/* Price and Available Spots - Moved up */}
                        <View style={styles.priceInfoSection}>
                            <View style={styles.priceContainer}>
                                <Text style={styles.priceLabel}>Price</Text>
                                <Text style={styles.priceValue}>{price} credits</Text>

                            </View>
                            <View style={styles.spotsContainer}>
                                <Text style={styles.spotsLabel}>Available spots</Text>
                                <Text style={[styles.spotsValue, spotsLeft < 5 && styles.spotsLow]}>
                                    {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
                                </Text>

                            </View>
                        </View>

                        {/* Key details */}
                        <View style={styles.detailsList}>
                            <View style={styles.detailItem}>
                                <Calendar1Icon style={styles.calendarIcon} size={16} />
                                <Text style={styles.detailText}>Date: {whenStr}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <ClockIcon style={styles.clockIcon} size={16} />
                                <Text style={styles.detailText}>Duration: {duration} minutes</Text>
                            </View>

                            {cancelUntilStr && (
                                <View style={styles.detailItem}>
                                    <CalendarOffIcon style={styles.calendarOffIcon} size={16} />
                                    <Text style={styles.detailText}>Cancel until: {cancelUntilStr}</Text>
                                </View>
                            )}
                        </View>

                        {/* Description and Amenities Section */}
                        <View style={styles.detailsSection}>
                            {description && (
                                <View style={styles.descriptionContainer}>
                                    <Text style={styles.sectionTitle}>About this class</Text>
                                    <Text style={styles.descriptionText}>{description}</Text>
                                </View>
                            )}

                            {/* Amenities */}
                            {venue?.amenities && Object.entries(venue.amenities).some(([_, enabled]) => enabled) && (
                                <View style={styles.amenitiesContainer}>
                                    <Text style={styles.sectionTitle}>Amenities</Text>
                                    <View style={styles.tagContainer}>
                                        {Object.entries(venue.amenities)
                                            .filter(([_, enabled]) => enabled)
                                            .map(([amenity, _]) => (
                                                <View key={amenity} style={styles.tag}>
                                                    <Text style={styles.tagText}>
                                                        {amenity.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                    </Text>
                                                </View>
                                            ))}
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Bottom padding to account for sticky button */}
                        <View style={styles.bottomPadding} />
                    </ScrollView>

                    {/* Sticky Button - Book or Already Attending */}
                    <View style={styles.stickyButtonContainer}>
                        {existingBooking ? (
                            existingBooking.status === "pending" ? (
                                /* Already Attending Container */
                                <TouchableOpacity
                                    style={styles.alreadyAttendingContainer}
                                    onPress={handleGoToBookings}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.alreadyAttendingTitle}>✓ You're Attending</Text>
                                    <Text style={styles.alreadyAttendingSubtext}>Tap to view your bookings</Text>
                                </TouchableOpacity>
                            ) : (
                                /* Status Display Container - Not clickable */
                                <View style={styles.statusContainer}>
                                    <Text style={styles.statusTitle}>
                                        {existingBooking.status === "completed" && "✓ Completed"}
                                        {existingBooking.status === "cancelled_by_consumer" && "✗ You cancelled"}
                                        {existingBooking.status === "cancelled_by_business" && "✗ Cancelled by studio"}
                                        {existingBooking.status === "no_show" && "⚠ No show"}
                                    </Text>
                                    <Text style={styles.statusSubtext}>You cannot book this class again</Text>
                                </View>
                            )
                        ) : (
                            /* Book Class Button */
                            <TouchableOpacity
                                style={[styles.bookButton, spotsLeft === 0 && styles.bookButtonDisabled]}
                                disabled={spotsLeft === 0 || isBooking}
                                onPress={onPress}
                            >
                                <View style={styles.bookButtonLeft}>
                                    <Text style={[styles.bookButtonText, spotsLeft === 0 && styles.bookButtonTextDisabled]}>
                                        {spotsLeft === 0 ? 'Fully Booked' : isBooking ? 'Booking…' : 'Book Class'}
                                    </Text>
                                </View>
                                {spotsLeft > 0 && (
                                    <View style={styles.bookButtonPriceContainer}>
                                        <DiamondIcon size={18} color="rgba(255, 255, 255, 0.9)" />
                                        <Text style={styles.bookButtonSubtext}>{price}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </>
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
    closeButton: {
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    closeText: {
        fontSize: 16,
        color: '#111827',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    headerRightSpacer: {
        width: 48,
    },
    contentContainer: {
        paddingBottom: 100, // Extra padding for sticky button
    },
    // Full width image styles
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
    // Legacy styles (keep for compatibility)
    carouselContainer: {
        marginBottom: 16,
    },
    imageContainer: {
        width: screenWidth,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: screenWidth - 32,
        height: 250,
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
        zIndex: 3,
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
        height: 250,
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
    },
    sectionRow: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 16,
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
    subValue: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
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
    // New styles for improved UI
    priceInfoSection: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    className: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
    },
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
    calendarIcon: {
        marginRight: 6,
        color: '#444444'
    },
    clockIcon: {
        marginRight: 6,
        color: '#444444'
    },
    calendarOffIcon: {
        marginRight: 6,
        color: '#444444'
    },
    detailText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '400',
        flex: 1,
    },
    // Legacy styles (updated)
    instructorName: {
        fontSize: 18,
        color: '#6b7280',
        fontWeight: '500',
    },
    businessSection: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    businessName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    locationText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '400',
    },
    timeSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dateTime: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    duration: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
    },
    keyInfoSection: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    priceContainer: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
        marginTop: 2,
    },
    priceValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#222',
    },
    spotsContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    spotsLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
        marginTop: 2,
    },
    spotsValue: {
        fontSize: 16,
        fontWeight: '600',
        color: "#222",
    },
    spotsLow: {
        color: '#16a34a',
    },
    detailsSection: {
        paddingTop: 8,
    },
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
    rulesContainer: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    ruleText: {
        fontSize: 15,
        color: '#6b7280',
        fontWeight: '400',
        marginBottom: 4,
    },
    bottomPadding: {
        height: 20,
    },
    stickyButtonContainer: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        paddingHorizontal: 0,
        paddingBottom: 0,
        backgroundColor: 'transparent',
        shadowColor: 'transparent',
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    bookButton: {
        backgroundColor: '#222',
        borderRadius: 40,
        height: 56,
        paddingHorizontal: 28,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    bookButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bookButtonPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    bookButtonDisabled: {
        backgroundColor: '#d1d5db',
        shadowOpacity: 0,
        elevation: 0,
    },
    bookButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
    },
    bookButtonTextDisabled: {
        color: '#9ca3af',
    },
    bookButtonSubtext: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    alreadyAttendingContainer: {
        backgroundColor: '#16a34a', // Emerald green
        borderRadius: 40,
        height: 56,
        paddingHorizontal: 28,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    alreadyAttendingTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        textAlign: 'center',
    },
    alreadyAttendingSubtext: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginTop: 2,
    },
    statusContainer: {
        backgroundColor: '#fbbf24', // Yellow background
        borderRadius: 40,
        height: 56,
        paddingHorizontal: 28,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#7c2d12', // Dark brown text for contrast on yellow
        textAlign: 'center',
    },
    statusSubtext: {
        fontSize: 13,
        fontWeight: '500',
        color: '#92400e', // Medium brown text
        textAlign: 'center',
        marginTop: 2,
    },
    imageOverlayContainer: {
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 28,
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
    imageOverlaySubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.92)',
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    bottomGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '40%',
        zIndex: 1,
    },
}); 