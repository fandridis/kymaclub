import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE, PROVIDER_DEFAULT, Marker } from 'react-native-maps';
import { Platform } from 'react-native';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StarIcon, X } from 'lucide-react-native';
import { useTypedTranslation } from '../i18n/typed';
import { Image } from 'expo-image';
import { Doc } from '@repo/api/convex/_generated/dataModel';
import { calculateDistance } from '../utils/location';
import { getVenueCategoryTranslationKey } from '@repo/utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Constants from 'expo-constants';

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
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const sheetSnapPoints = useMemo(() => ['45%', '85%'], []);
  const insets = useSafeAreaInsets();

  console.log('Google Maps key present:', !!Constants.expoConfig?.android?.config?.googleMaps?.apiKey);

  // Transform venues to include coordinates and other needed properties
  // NOTE: All hooks must be called before any conditional returns
  const venuesWithCoordinates = useMemo((): VenueWithCoordinate[] => {
    if (!venues || !storageIdToUrl) return [];
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

      // Get venue type from primaryCategory (translated)
      const type = venue.primaryCategory
        ? t(getVenueCategoryTranslationKey(venue.primaryCategory) as keyof typeof t)
        : t('venueCategories.fitness_center');

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
  }, [venues, userLocation, storageIdToUrl, t]);

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
    bottomSheetRef.current?.present();
  }, []);

  // Handle sheet close
  const handleCloseSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  const handleSheetDismiss = useCallback(() => {
    setSelectedVenue(null);
    onCloseSheet?.();
  }, [onCloseSheet]);

  // Auto-close sheet when venues change (filters applied)
  useEffect(() => {
    if (selectedVenue) {
      // Check if the selected venue still exists in the filtered venues
      const stillExists = venues.some(v => v._id === selectedVenue._id);
      if (!stillExists) {
        handleCloseSheet();
      }
    }
  }, [venues, selectedVenue, handleCloseSheet]);

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  // Early return if required props are missing (after all hooks)
  if (!storageIdToUrl || !venues) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ff4747" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={{
          position: 'absolute',
          top: 100,
          left: 10,
          backgroundColor: 'yellow',
          padding: 10,
          zIndex: 9999
        }}>
          API Key: {Constants.expoConfig?.android?.config?.googleMaps?.apiKey ? 'PRESENT' : 'MISSING'}
        </Text>
        <MapView
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
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
        <BottomSheetModal
          ref={bottomSheetRef}
          index={0}
          snapPoints={sheetSnapPoints}
          onDismiss={handleSheetDismiss}
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.sheetHandle}
          enablePanDownToClose
        >
          <BottomSheetView style={[styles.sheetContent, { paddingBottom: 24 + insets.bottom }]}>
            {selectedVenue && (
              <>
                {/* Close button */}
                <TouchableOpacity style={styles.closeButton} onPress={handleCloseSheet}>
                  <X size={18} color="#666" />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.venueName}>{selectedVenue.name}</Text>
                  {selectedVenue.shortDescription && (
                    <Text style={styles.venueShortDescription}>{selectedVenue.shortDescription}</Text>
                  )}
                </View>

                <Text style={styles.businessType}>{selectedVenue.type}</Text>

                {typeof selectedVenue.distance === 'number' && (
                  <Text style={styles.distanceText}>{formatDistance(selectedVenue.distance)}</Text>
                )}

                {selectedVenue.rating && (
                  <View style={styles.ratingContainer}>
                    <StarIcon size={14} color="#ffd700" fill="#ffd700" />
                    <Text style={styles.rating}>
                      {selectedVenue.rating.toFixed(1)}
                    </Text>
                    <Text style={styles.reviewCount}>
                      ({selectedVenue.reviewCount || 0} {t('reviews.reviews')})
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
                    nestedScrollEnabled
                  >
                    {selectedVenue.imageUrls.slice(0, 4).map((imageUrl, index, array) => (
                      <Image
                        key={index}
                        source={{ uri: imageUrl }}
                        style={[
                          styles.galleryImage,
                          index === array.length - 1 ? {} : styles.galleryImageSpacing
                        ]}
                        contentFit="cover"
                        transition={300}
                        cachePolicy="memory-disk"
                      />
                    ))}
                  </ScrollView>
                )}

                <View style={styles.divider} />

                {/* See Studio Button */}
                <TouchableOpacity
                  style={styles.seeStudioButton}
                  onPress={() => {
                    handleCloseSheet();
                    navigation.navigate('VenueDetailsScreen', { venueId: selectedVenue._id });
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.seeStudioButtonText}>{t('venues.seeStudio')}</Text>
                </TouchableOpacity>
              </>
            )}
          </BottomSheetView>
        </BottomSheetModal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  sheetBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
  },
  sheetHandle: {
    backgroundColor: '#d4d4d8',
    width: 60,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 24,
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
  venueShortDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 20,
  },
  businessType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 13,
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
