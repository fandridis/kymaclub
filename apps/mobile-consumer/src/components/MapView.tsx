import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StarIcon, MapPinIcon, ClockIcon, X } from 'lucide-react-native';
import { useTypedTranslation } from '../i18n/typed';

const { height: screenHeight } = Dimensions.get('window');

interface Business {
  id: string;
  name: string;
  type: string;
  rating: number;
  reviewCount: number;
  distance: number;
  isOpen: boolean;
  imageUrl?: string;
  address: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

interface MapViewProps {
  businesses: Business[];
  userLocation: Location.LocationObject | null;
  onCloseSheet?: () => void;
}

const ATHENS_FALLBACK = {
  latitude: 37.9838,
  longitude: 23.7275
};

export function ExploreMapView({ businesses, userLocation, onCloseSheet }: MapViewProps) {
  const { t } = useTypedTranslation();
  const navigation = useNavigation();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  // Shared values for animations
  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);
  const gestureTranslateY = useSharedValue(0);

  // Calculate map region to show all businesses
  const mapRegion = useMemo(() => {
    if (businesses.length === 0) {
      return {
        latitude: userLocation?.coords.latitude ?? ATHENS_FALLBACK.latitude,
        longitude: userLocation?.coords.longitude ?? ATHENS_FALLBACK.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    // Calculate bounding box for all businesses
    const latitudes = businesses.map(b => b.coordinate.latitude);
    const longitudes = businesses.map(b => b.coordinate.longitude);

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
  }, [businesses, userLocation]);

  // Handle marker press
  const handleMarkerPress = useCallback((business: Business) => {
    setSelectedBusiness(business);
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
      setSelectedBusiness(null);
      onCloseSheet?.(); // Call external callback if provided
    }, 250);
  }, [translateY, opacity, gestureTranslateY, onCloseSheet]);

  // Auto-close sheet when businesses change (filters applied)
  useEffect(() => {
    if (isSheetVisible && selectedBusiness) {
      // Check if the selected business still exists in the filtered businesses
      const stillExists = businesses.some(b => b.id === selectedBusiness.id);
      if (!stillExists) {
        handleCloseSheet();
      }
    }
  }, [businesses, isSheetVisible, selectedBusiness, handleCloseSheet]);

  // Create pan gesture with new API
  const panGesture = useMemo(() => 
    Gesture.Pan()
      .activeOffsetY(10)
      .failOffsetY(-10)
      .onChange((event) => {
        // Update gesture translation during pan (only allow downward movement)
        gestureTranslateY.value = Math.max(0, event.translationY);
      })
      .onFinalize((event) => {
        // If swiped down significantly or with high velocity, close the sheet
        if (event.translationY > 50 || event.velocityY > 500) {
          runOnJS(handleCloseSheet)();
        } else {
          // Otherwise, spring back to original position
          gestureTranslateY.value = withSpring(0, {
            damping: 15,
            stiffness: 100,
          });
        }
      }),
    [handleCloseSheet]
  );

  // Animated style for the floating sheet
  const animatedSheetStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value + gestureTranslateY.value }],
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
        {businesses.map((business) => {
          // Use vibrant green for selected marker, brand color for others
          const isSelected = selectedBusiness?.id === business.id;
          const pinColor = isSelected 
            ? "#22c55e"  // Vibrant green for active marker
            : "#ff4747"; // Brand orange/red for default markers
          
          return (
            <Marker
              key={business.id}
              coordinate={business.coordinate}
              pinColor={pinColor}
              onPress={() => handleMarkerPress(business)}
              tracksViewChanges={false}
            />
          );
        })}
      </MapView>

      {/* Floating Business Sheet */}
      {isSheetVisible && selectedBusiness && (
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.floatingSheet,
              animatedSheetStyle
            ]}
          >
            {/* Handle indicator */}
            <View style={styles.handleIndicator} />

            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseSheet}>
              <X size={18} color="#666" />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.businessName}>{selectedBusiness.name}</Text>
            </View>

            <Text style={styles.businessType}>{selectedBusiness.type}</Text>

            {/* Rating and reviews */}
            <View style={styles.ratingContainer}>
              <StarIcon size={14} color="#ffd700" fill="#ffd700" />
              <Text style={styles.rating}>
                {selectedBusiness.rating.toFixed(1)}
              </Text>
              <Text style={styles.reviewCount}>
                ({selectedBusiness.reviewCount} {t('explore.reviews', { count: selectedBusiness.reviewCount })})
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Location details */}
            <View style={styles.locationContainer}>
              <MapPinIcon size={14} color="#666" />
              <Text style={styles.address}>{selectedBusiness.address}</Text>
              <Text style={styles.distance}>
                • {t('explore.distance', { distance: formatDistance(selectedBusiness.distance) })}
              </Text>
            </View>

            {/* See Studio Button */}
            <TouchableOpacity 
              style={styles.seeStudioButton} 
              onPress={() => navigation.navigate('VenueDetailsScreen', { venueId: selectedBusiness.id })}
              activeOpacity={0.8}
            >
              <Text style={styles.seeStudioButtonText}>See Studio</Text>
            </TouchableOpacity>
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
    bottom: 64, // 100px from bottom to float above navigation
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 15,
    zIndex: 1000,
    maxHeight: 250,
  },
  handleIndicator: {
    backgroundColor: '#DDDDDD',
    width: 40,
    height: 4,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
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
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  businessType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
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
    marginVertical: 16,
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