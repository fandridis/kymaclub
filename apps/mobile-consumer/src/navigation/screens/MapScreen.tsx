import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { StyleSheet, View, Text, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import * as Location from 'expo-location';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../index';

const ATHENS_FALLBACK = {
    latitude: 37.9838,
    longitude: 23.7275
};

// Define monument type
interface Monument {
    id: string;
    title: string;
    description: string;
    coordinate: {
        latitude: number;
        longitude: number;
    };
    details?: string;
    openingHours?: string;
    ticketPrice?: string;
}

// Famous monuments in Athens with additional details
const ATHENS_MONUMENTS: Monument[] = [
    {
        id: '1',
        title: 'Acropolis of Athens',
        description: 'Ancient citadel with the Parthenon',
        coordinate: {
            latitude: 37.9715,
            longitude: 23.7257
        },
        details: 'The Acropolis of Athens is an ancient citadel located on a rocky outcrop above the city. It contains the remains of several ancient buildings of great architectural and historic significance, the most famous being the Parthenon.',
        openingHours: '8:00 AM - 8:00 PM (Summer), 8:00 AM - 5:00 PM (Winter)',
        ticketPrice: '€20 (Full), €10 (Reduced)'
    },
    {
        id: '2',
        title: 'Ancient Agora',
        description: 'Historical marketplace and civic center',
        coordinate: {
            latitude: 37.9747,
            longitude: 23.7222
        },
        details: 'The Ancient Agora was the heart of ancient Athens, the focus of political, commercial, administrative and social activity, the religious and cultural centre, and the seat of justice.',
        openingHours: '8:00 AM - 8:00 PM (Summer), 8:00 AM - 5:00 PM (Winter)',
        ticketPrice: '€10 (Full), €5 (Reduced)'
    },
    {
        id: '3',
        title: 'Temple of Olympian Zeus',
        description: 'Ruins of ancient temple dedicated to Zeus',
        coordinate: {
            latitude: 37.9693,
            longitude: 23.7331
        },
        details: 'The Temple of Olympian Zeus is a former colossal temple dedicated to Zeus, king of the Olympian gods. Construction began in the 6th century BC but was not completed until the reign of the Roman Emperor Hadrian in the 2nd century AD.',
        openingHours: '8:00 AM - 7:00 PM (Summer), 8:00 AM - 5:00 PM (Winter)',
        ticketPrice: '€8 (Full), €4 (Reduced)'
    },
    {
        id: '4',
        title: 'Panathenaic Stadium',
        description: 'Historic stadium, hosted first modern Olympics',
        coordinate: {
            latitude: 37.9681,
            longitude: 23.7410
        },
        details: 'The Panathenaic Stadium is a multi-purpose stadium in Athens. It is the only stadium in the world built entirely of marble and hosted the first modern Olympic Games in 1896.',
        openingHours: '8:00 AM - 7:00 PM (March - October), 8:00 AM - 5:00 PM (November - February)',
        ticketPrice: '€5 (Full), €2.50 (Reduced)'
    },
    {
        id: '5',
        title: 'National Archaeological Museum',
        description: 'Greece\'s largest archaeological museum',
        coordinate: {
            latitude: 37.9891,
            longitude: 23.7322
        },
        details: 'The National Archaeological Museum houses some of the most important artifacts from a variety of archaeological locations around Greece from prehistory to late antiquity.',
        openingHours: 'Tuesday-Sunday: 8:00 AM - 8:00 PM, Monday: 1:00 PM - 8:00 PM',
        ticketPrice: '€12 (Full), €6 (Reduced)'
    }
];

export function MapScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonument, setSelectedMonument] = useState<Monument | null>(null);
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    // Bottom sheet ref
    const bottomSheetRef = useRef<BottomSheet>(null);

    // Bottom sheet snap points
    const snapPoints = useMemo(() => ['25%', '50%', '75%'], []);

    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();

                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    setLoading(false);
                    return;
                }

                let currentLocation = await Location.getCurrentPositionAsync({});
                setLocation(currentLocation);
                setLoading(false);
            } catch (error) {
                setErrorMsg('Error getting location');
                setLoading(false);
                Alert.alert('Error', 'Unable to get your location. Please check your settings.');
            }
        })();
    }, []);

    // Handle marker press
    const handleMarkerPress = useCallback((monument: Monument) => {
        setSelectedMonument(monument);
        bottomSheetRef.current?.expand();
    }, []);

    // Handle sheet changes
    const handleSheetChanges = useCallback((index: number) => {
        if (index === -1) {
            // Sheet is closed
            setSelectedMonument(null);
        }
    }, []);

    // Handle navigation to business/venue
    const handleNavigateToBusiness = useCallback(() => {
        // Close the sheet first
        bottomSheetRef.current?.close();
        setSelectedMonument(null);

        // Note: Since monuments don't have venueIds, this is a placeholder
        // In a real implementation, you would navigate to VenueDetailsScreen with the venueId
        // navigation.navigate('VenueDetailsScreen', { venueId: selectedMonument?.venueId });
    }, []);

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
        );
    }

    if (errorMsg) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <MapView
                    style={styles.map}
                    // customMapStyle={mapStyleMinimal}
                    provider={Platform.OS === 'ios' ? PROVIDER_GOOGLE : undefined}
                    initialRegion={{
                        latitude: ATHENS_FALLBACK.latitude, // location?.coords.latitude ?? ATHENS_FALLBACK.latitude,
                        longitude: ATHENS_FALLBACK.longitude, // location?.coords.longitude ?? ATHENS_FALLBACK.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                    followsUserLocation={true}
                    mapPadding={{ top: 0, right: 10, bottom: 60, left: 0 }}
                >
                    {ATHENS_MONUMENTS.map((monument) => (
                        <Marker
                            key={monument.id}
                            coordinate={monument.coordinate}
                            title={monument.title}
                            description={monument.description}
                            pinColor="#FF6B6B"
                            onPress={() => handleMarkerPress(monument)}
                        />
                    ))}
                </MapView>

                <BottomSheet
                    ref={bottomSheetRef}
                    index={-1}
                    snapPoints={snapPoints}
                    onChange={handleSheetChanges}
                    enablePanDownToClose={true}
                    backgroundStyle={styles.bottomSheetBackground}
                    handleIndicatorStyle={styles.bottomSheetIndicator}
                >
                    <BottomSheetView style={styles.contentContainer}>
                        {selectedMonument && (
                            <>
                                <Text style={styles.monumentTitle}>{selectedMonument.title}</Text>
                                <Text style={styles.monumentDescription}>{selectedMonument.description}</Text>

                                <View style={styles.divider} />

                                <Text style={styles.sectionTitle}>About</Text>
                                <Text style={styles.detailText}>{selectedMonument.details}</Text>

                                {selectedMonument.openingHours && (
                                    <>
                                        <Text style={styles.sectionTitle}>Opening Hours</Text>
                                        <Text style={styles.detailText}>{selectedMonument.openingHours}</Text>
                                    </>
                                )}

                                {selectedMonument.ticketPrice && (
                                    <>
                                        <Text style={styles.sectionTitle}>Ticket Price</Text>
                                        <Text style={styles.detailText}>{selectedMonument.ticketPrice}</Text>
                                    </>
                                )}

                                <TouchableOpacity
                                    style={styles.viewDetailsButton}
                                    onPress={handleNavigateToBusiness}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.viewDetailsButtonText}>View Details</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </BottomSheetView>
                </BottomSheet>
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#ff0000',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    bottomSheetBackground: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    bottomSheetIndicator: {
        backgroundColor: '#DDDDDD',
        width: 40,
        height: 5,
        borderRadius: 3,
        marginTop: 8,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    monumentTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    monumentDescription: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    viewDetailsButton: {
        backgroundColor: '#FF6B6B',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginTop: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewDetailsButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});


const mapStyleMinimal = [
    {
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#616161"
            }
        ]
    },
    {
        "featureType": "administrative.land_parcel",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "administrative.neighborhood",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit.line",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit.station",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    }
];