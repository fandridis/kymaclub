import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as Location from 'expo-location';
import { TabType } from './ExploreHeader';
import { FilterBar, FilterOptions } from '../../../components/FilterBar';
import { ClassesSection } from './ClassesSection';
import { useTypedTranslation } from '../../../i18n/typed';
import { useAllVenues } from '../hooks/useAllVenues';
import { VenuesSection } from './VenuesSection';
import { TabScreenHeader } from '../../../components/TabScreenHeader';
import { useAuthenticatedUser } from '../../../stores/auth-store';
import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { DiamondIcon } from 'lucide-react-native';
import { theme } from '../../../theme';

export function Explore() {
    const { t } = useTypedTranslation();
    const user = useAuthenticatedUser();
    const [activeTab, setActiveTab] = useState<TabType>('businesses');
    const [isMapView, setIsMapView] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const [filters, setFilters] = useState<FilterOptions>({ searchQuery: '', categories: [], priceRange: { min: 0, max: 100 }, rating: 0 });
    const [mapSheetOpen, setMapSheetOpen] = useState(false);

    const { venues, venuesLoading, storageIdToUrl } = useAllVenues();

    // Get user credit balance
    const creditBalance = useQuery(api.queries.credits.getUserBalance, { userId: user._id });

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

    const renderCreditsBadge = () => (
        <View style={styles.creditsBadge}>
            <DiamondIcon size={16} color={theme.colors.zinc[50]} />
            <Text style={styles.creditsBadgeText}>{creditBalance?.balance || 0}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <TabScreenHeader title="Explore" renderRightSide={renderCreditsBadge} />
            <View style={styles.tabsContainer}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'businesses' && styles.activeTab]}
                        onPress={() => handleTabChange('businesses')}
                    >
                        <Text style={[styles.tabText, activeTab === 'businesses' && styles.activeTabText]}>
                            {t('explore.businesses')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'classes' && styles.activeTab]}
                        onPress={() => handleTabChange('classes')}
                    >
                        <Text style={[styles.tabText, activeTab === 'classes' && styles.activeTabText]}>
                            {t('explore.classes')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        backgroundColor: '#f9fafb',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
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
    tabsContainer: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#333',
    },
    creditsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.emerald[500],
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    creditsBadgeText: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.zinc[50],
        marginLeft: 4,
    },
}); 