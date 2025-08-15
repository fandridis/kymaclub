import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { checkServiceAreaAccess, formatDistance } from '../../../utils/location';

interface LocationGateProps {
  onLocationVerified: () => void;
  onLocationDenied: (location: Location.LocationObject, serviceAreaCheck: any) => void;
  onBack: () => void;
}

type LocationState =
  | 'initial'
  | 'requesting-permissions'
  | 'getting-location'
  | 'checking-service-area'
  | 'permission-denied'
  | 'location-disabled'
  | 'location-timeout'
  | 'location-error';

const { width } = Dimensions.get('window');

export function LocationGate({ onLocationVerified, onLocationDenied, onBack }: LocationGateProps) {
  const [locationState, setLocationState] = useState<LocationState>('initial');
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Automatically request location permission on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLocationState('requesting-permissions');
      setErrorMessage('');

      // Check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        setLocationState('location-disabled');
        return;
      }

      // Request foreground permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationState('permission-denied');
        return;
      }

      await getCurrentLocation();
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationState('location-error');
      setErrorMessage('Failed to request location permissions');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationState('getting-location');

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // 30 seconds timeout
      });

      await checkLocationAccess(location);
    } catch (error: any) {
      console.error('Error getting location:', error);

      if (error.code === 'E_LOCATION_TIMEOUT') {
        setLocationState('location-timeout');
      } else {
        setLocationState('location-error');
        setErrorMessage('Failed to get your location');
      }
    }
  };

  const checkLocationAccess = async (location: Location.LocationObject) => {
    try {
      setLocationState('checking-service-area');

      const { latitude, longitude } = location.coords;
      const serviceAreaCheck = checkServiceAreaAccess(latitude, longitude);

      console.log('[LocationGate] Service area check:', serviceAreaCheck);

      if (serviceAreaCheck.isWithinServiceArea) {
        console.log('[LocationGate] User is within service area');
        onLocationVerified();
      } else {
        console.log('[LocationGate] User is outside service area');
        onLocationDenied(location, serviceAreaCheck);
      }
    } catch (error) {
      console.error('Error checking service area:', error);
      setLocationState('location-error');
      setErrorMessage('Failed to verify your location');
    }
  };

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      requestLocationPermission();
    } else {
      Alert.alert(
        'Too Many Attempts',
        'Please check your location settings and try again later.',
        [{ text: 'OK', onPress: onBack }]
      );
    }
  };

  const handleManualEntry = () => {
    Alert.alert(
      'Manual Location Entry',
      'Would you like to enter your city manually for the waitlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            // Create a mock location for manual entry
            const mockLocation: Location.LocationObject = {
              coords: {
                latitude: 0,
                longitude: 0,
                altitude: null,
                accuracy: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
              },
              timestamp: Date.now(),
              mocked: true,
            };
            const mockServiceCheck = {
              isWithinServiceArea: false,
              nearestArea: {
                area: 'athens',
                areaName: 'Athens',
                distance: 0,
                distanceFormatted: 'Unknown',
                distanceInKm: 0,
              }
            };
            onLocationDenied(mockLocation, mockServiceCheck);
          }
        }
      ]
    );
  };

  const renderContent = () => {
    switch (locationState) {
      case 'initial':
      case 'requesting-permissions':
      case 'getting-location':
      case 'checking-service-area':
        return (
          <View style={styles.contentContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.title}>
              {locationState === 'initial' && 'Initializing...'}
              {locationState === 'requesting-permissions' && 'Requesting Permissions...'}
              {locationState === 'getting-location' && 'Getting Your Location...'}
              {locationState === 'checking-service-area' && 'Verifying Service Area...'}
            </Text>
            <Text style={styles.description}>
              This may take a few moments
            </Text>
            {locationState === 'checking-service-area' && (
              <View style={styles.serviceAreaInfo}>
                <Text style={styles.serviceAreaText}>
                  🌍 Service Area: Athens and surrounding areas (50km radius)
                </Text>
              </View>
            )}
          </View>
        );

      case 'permission-denied':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>Location Permission Required</Text>
            <Text style={styles.description}>
              We need location access to verify you're in our service area.
              Please grant location permission and try again.
            </Text>
            <Text style={styles.instructionText}>
              Go to Settings → Privacy & Security → Location Services and enable location for KymaClub
            </Text>
          </View>
        );

      case 'location-disabled':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.icon}>📍</Text>
            <Text style={styles.title}>Location Services Disabled</Text>
            <Text style={styles.description}>
              Location services are turned off on your device.
              Please enable them in Settings and try again.
            </Text>
            <Text style={styles.instructionText}>
              Go to Settings → Privacy & Security → Location Services and turn it on
            </Text>
          </View>
        );

      case 'location-timeout':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.icon}>⏱️</Text>
            <Text style={styles.title}>Location Timeout</Text>
            <Text style={styles.description}>
              We couldn't get your location within the time limit.
              This might be due to poor GPS signal.
            </Text>
            <Text style={styles.instructionText}>
              Try moving to a location with better signal, or enter your city manually for the waitlist
            </Text>
          </View>
        );

      case 'location-error':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.icon}>❌</Text>
            <Text style={styles.title}>Location Error</Text>
            <Text style={styles.description}>
              {errorMessage || 'An error occurred while getting your location.'}
            </Text>
            <Text style={styles.instructionText}>
              Please try again or enter your city manually for the waitlist
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const renderButtons = () => {
    // Show only cancel button during location check process
    if (['initial', 'requesting-permissions', 'getting-location', 'checking-service-area'].includes(locationState)) {
      return (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.outlineButton]}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Show retry and manual entry options on error
    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleRetry}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.outlineButton]}
          onPress={handleManualEntry}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineButtonText}>Enter City Manually</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.outlineButton]}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent />

      <View style={styles.content}>
        {renderContent()}
        {renderButtons()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 350,
    alignSelf: 'center',
    width: '100%',
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  serviceAreaInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  serviceAreaText: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    fontWeight: '500',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 12,
    paddingBottom: 40,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#000',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
});