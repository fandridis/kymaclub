import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { ExploreHeader, TabType } from './ExploreHeader';
import { FilterBar, FilterOptions } from '../../../components/FilterBar';
import { ClassesSection } from './ClassesSection';
import { useTypedTranslation } from '../../../i18n/typed';
import { useAllVenues } from '../hooks/useAllVenues';
import { VenuesSection } from './VenuesSection';

export function Explore() {
    const { t } = useTypedTranslation();
    const [activeTab, setActiveTab] = useState<TabType>('businesses');
    const [isMapView, setIsMapView] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const [filters, setFilters] = useState<FilterOptions>({ searchQuery: '', categories: [], priceRange: { min: 0, max: 100 }, rating: 0 });
    const [mapSheetOpen, setMapSheetOpen] = useState(false);

    const { venues, venuesLoading, storageIdToUrl } = useAllVenues();

    console.log('Explore component storageIdToUrl:', storageIdToUrl);
    console.log('Explore component venues:', venues?.length);

    const [loadingLocation, setLoadingLocation] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (!mounted) return;
                if (status !== 'granted') {
                    setError('Location permission denied');
                    setLoadingLocation(false);
                    return;
                }
                const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                if (mounted) {
                    setUserLocation(currentLocation);
                    setLoadingLocation(false);
                }
            } catch (e) {
                if (mounted) {
                    setError('Unable to get location');
                    setLoadingLocation(false);
                }
            }
        })();
        return () => { mounted = false; };
    }, []);

    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
        if (tab === 'classes' && isMapView) {
            setIsMapView(false);
        }
    }, [isMapView]);

    const handleMapToggle = useCallback(() => {
        setIsMapView(prev => !prev);
    }, []);

    const handleFilterChange = useCallback((next: FilterOptions) => {
        setFilters(next);
        // Close map sheet when filters change
        if (mapSheetOpen) {
            setMapSheetOpen(false);
        }
    }, [mapSheetOpen]);

    const handleCloseMapSheet = useCallback(() => {
        setMapSheetOpen(false);
    }, []);

    console.log('loadingLocation', loadingLocation);
    console.log('venuesLoading', venuesLoading);
    const isLoading = loadingLocation || venuesLoading;

    if (isLoading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#ff4747" />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ExploreHeader activeTab={activeTab} onTabChange={handleTabChange} />
            <FilterBar
                onFilterChange={handleFilterChange}
                showCategoryFilters={true}
                showMapToggle={activeTab === 'businesses'}
                isMapView={isMapView}
                onMapToggle={handleMapToggle}
            />

            <View style={styles.content}>
                {activeTab === 'businesses' ? (
                    <VenuesSection
                        venues={venues}
                        storageIdToUrl={storageIdToUrl}
                        userLocation={userLocation}
                        filters={filters}
                        isMapView={isMapView}
                        onCloseMapSheet={handleCloseMapSheet}
                    />
                ) : (
                    <ClassesSection
                        searchFilters={{ searchQuery: filters.searchQuery, categories: filters.categories }}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
}); 