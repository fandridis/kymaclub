import React, { useState, useMemo, useCallback, useEffect } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StarIcon, X } from 'lucide-react-native';
import { useTypedTranslation } from '../i18n/typed';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Doc } from '@repo/api/convex/_generated/dataModel';
import { calculateDistance } from '../utils/location';
import { getVenueCategoryDisplay } from '@repo/utils/constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MapViewProps {
  venues: Doc<'venues'>[];
  storageIdToUrl: Map<string, string | null>;
  userLocation: Location.LocationObject | null;
  onCloseSheet?: () => void;
}

interface VenueWithCoordinate extends Doc<'venues'> {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  type: string;
  imageUrls: string[];
}

const ATHENS_FALLBACK = {
  latitude: 37.9838,
  longitude: 23.7275
};

export function ExploreMapView({ venues, storageIdToUrl, userLocation, onCloseSheet }: MapViewProps) {
  const { t } = useTypedTranslation();
  const navigation = useNavigation();
  const [selectedVenue, setSelectedVenue] = useState<VenueWithCoordinate | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  // Early return if required props are missing
  if (!storageIdToUrl || !venues) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff4747" />
      </View>
    );
  }

  // Shared values for animations
  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);
  const gestureTranslateY = useSharedValue(0);

  // Transform venues to include coordinates and other needed properties
  const venuesWithCoordinates = useMemo((): VenueWithCoordinate[] => {
    return venues.map(venue => {
      // Extract coordinates from venue.address
      let coordinate = ATHENS_FALLBACK;
      if (venue.address && typeof venue.address === 'object' && 'latitude' in venue.address && 'longitude' in venue.address) {
        const lat = venue.address.latitude as number;
        const lng = venue.address.longitude as number;
        if (isFinite(lat) && isFinite(lng) && lat !== 0 && lng !== 0) {
          coordinate = { latitude: lat, longitude: lng };
        }
      }

      // Calculate distance if user location is available
      let distance;
      if (userLocation) {
        distance = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          coordinate.latitude,
          coordinate.longitude
        );
      }

      // Get venue type from primaryCategory
      const type = venue.primaryCategory ? getVenueCategoryDisplay(venue.primaryCategory) : 'Fitness Center';

      // Get image URLs from storage IDs
      const imageUrls = venue.imageStorageIds?.map(id => storageIdToUrl?.get(id)).filter(Boolean) as string[] || [];

      return {
        ...venue,
        coordinate,
        distance,
        type,
        imageUrls,
      };
    });
  }, [venues, userLocation, storageIdToUrl]);

  // Calculate map region to show all venues
  const mapRegion = useMemo(() => {
    if (venuesWithCoordinates.length === 0) {
      return {
        latitude: userLocation?.coords.latitude ?? ATHENS_FALLBACK.latitude,
        longitude: userLocation?.coords.longitude ?? ATHENS_FALLBACK.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    // Calculate bounding box for all venues
    const latitudes = venuesWithCoordinates.map(v => v.coordinate.latitude);
    const longitudes = venuesWithCoordinates.map(v => v.coordinate.longitude);

    // Add user location if available
    if (userLocation) {
      latitudes.push(userLocation.coords.latitude);
      longitudes.push(userLocation.coords.longitude);
    }

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const latDelta = Math.max(0.02, (maxLat - minLat) * 1.3);
    const lngDelta = Math.max(0.02, (maxLng - minLng) * 1.3);

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [venuesWithCoordinates, userLocation]);

  // Handle marker press
  const handleMarkerPress = useCallback((venue: VenueWithCoordinate) => {
    setSelectedVenue(venue);
    if (!isSheetVisible) {
      setIsSheetVisible(true);
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [isSheetVisible, translateY, opacity]);

  // Handle sheet close
  const handleCloseSheet = useCallback(() => {
    translateY.value = withTiming(300, { duration: 250 });
    opacity.value = withTiming(0, { duration: 250 });
    gestureTranslateY.value = withTiming(0, { duration: 250 });

    // Use setTimeout to hide after animation completes
    setTimeout(() => {
      setIsSheetVisible(false);
      setSelectedVenue(null);
      onCloseSheet?.(); // Call external callback if provided
    }, 250);
  }, [translateY, opacity, gestureTranslateY, onCloseSheet]);

  // Auto-close sheet when venues change (filters applied)
  useEffect(() => {
    if (isSheetVisible && selectedVenue) {
      // Check if the selected venue still exists in the filtered venues
      const stillExists = venues.some(v => v._id === selectedVenue._id);
      if (!stillExists) {
        handleCloseSheet();
      }
    }
  }, [venues, isSheetVisible, selectedVenue, handleCloseSheet]);

  // Create pan gesture with new API - disabled swipe to close
  const panGesture = useMemo(() =>
    Gesture.Pan()
      .activeOffsetY(10)
      .failOffsetY(-10)
      .onChange((event) => {
        // Disable gesture translation - no movement allowed
        gestureTranslateY.value = 0;
      })
      .onFinalize(() => {
        // No action on gesture end - sheet stays in place
        gestureTranslateY.value = 0;
      }),
    []
  );

  // Animated style for the floating sheet
  const animatedSheetStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={false}
        mapPadding={{ top: 0, right: 10, bottom: 60, left: 0 }}
      >
        {venuesWithCoordinates.map((venue) => {
          // Use vibrant green for selected marker, brand color for others
          const isSelected = selectedVenue?._id === venue._id;
          const pinColor = isSelected
            ? "#22c55e"  // Vibrant green for active marker
            : "#ff4747"; // Brand orange/red for default markers

          return (
            <Marker
              key={venue._id}
              coordinate={venue.coordinate}
              pinColor={pinColor}
              onPress={() => handleMarkerPress(venue)}
              tracksViewChanges={false}
            />
          );
        })}
      </MapView>

      {/* Floating Venue Sheet */}
      {isSheetVisible && selectedVenue && (
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.floatingSheet,
              animatedSheetStyle
            ]}
          >
            <BlurView
              intensity={30}
              tint='light'
              style={styles.blurContainer}
            >
              {/* Close button */}
              <TouchableOpacity style={styles.closeButton} onPress={handleCloseSheet}>
                <X size={18} color="#666" />
              </TouchableOpacity>

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.venueName}>{selectedVenue.name}</Text>
              </View>

              <Text style={styles.businessType}>{selectedVenue.type}</Text>

              {selectedVenue.rating && (
                <View style={styles.ratingContainer}>
                  <StarIcon size={14} color="#ffd700" fill="#ffd700" />
                  <Text style={styles.rating}>
                    {selectedVenue.rating.toFixed(1)}
                  </Text>
                  <Text style={styles.reviewCount}>
                    ({selectedVenue.reviewCount || 0} reviews)
                  </Text>
                </View>
              )}

              {/* Image Gallery */}
              {selectedVenue.imageUrls && selectedVenue.imageUrls.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageScrollView}
                  contentContainerStyle={styles.imageScrollContent}
                >
                  {selectedVenue.imageUrls.slice(0, 4).map((imageUrl, index) => (
                    <Image
                      key={index}
                      source={{ uri: imageUrl }}
                      style={[
                        styles.galleryImage,
                        index === selectedVenue.imageUrls.length - 1 ? {} : styles.galleryImageSpacing
                      ]}
                      contentFit="cover"
                      transition={300}
                      cachePolicy="memory-disk"
                    />
                  ))}
                </ScrollView>
              )}

              <View style={styles.divider} />

              {/* Location details */}
              {/* <View style={styles.locationContainer}>
                <MapPinIcon size={14} color="#666" />
                <Text style={styles.address}>{selectedVenue.address}</Text>
                <Text style={styles.distance}>
                  • {t('explore.distance', { distance: formatDistance(selectedVenue.distance) })}
                </Text>
              </View> */}

              {/* See Studio Button */}
              <TouchableOpacity
                style={styles.seeStudioButton}
                onPress={() => navigation.navigate('VenueDetailsScreen', { venueId: selectedVenue._id })}
                activeOpacity={0.8}
              >
                <Text style={styles.seeStudioButtonText}>See Studio</Text>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  floatingSheet: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 15,
    zIndex: 1000,
    maxHeight: 500,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 20,
    opacity: 0.99,
    // backgroundColor: 'white',
  },

  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    zIndex: 1,
  },
  header: {
    marginBottom: 4,
  },
  venueName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  businessType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  imageScrollView: {
    marginBottom: 16,
    height: 120,
  },
  imageScrollContent: {
    paddingHorizontal: 0,
  },
  galleryImage: {
    width: (screenWidth - 80 - 24) / 2.5, // Container width minus padding, divided by 2.5 to show 2.5 images
    height: 120,
    borderRadius: 12,
  },
  galleryImageSpacing: {
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    //  marginVertical: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  address: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  distance: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  seeStudioButton: {
    backgroundColor: '#ff4747',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeStudioButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});