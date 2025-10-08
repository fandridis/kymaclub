import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as Location from 'expo-location';
import { TabType } from './ExploreHeader';
import { FilterBar } from '../../../components/FilterBar';
import { AppTabs, AppTabItem } from '../../../components/AppTabs';
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
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation';
import { countActiveFilters, useExploreFiltersStore } from '../../../stores/explore-filters-store';

export function Explore() {
    const { t } = useTypedTranslation();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const user = useAuthenticatedUser();
    const [activeTab, setActiveTab] = useState<TabType>('businesses');
    const tabItems = useMemo<AppTabItem<TabType>[]>(
        () => [
            { key: 'businesses', label: t('explore.businesses') },
            { key: 'classes', label: t('explore.classes') },
        ],
        [t]
    );
    const [isMapView, setIsMapView] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const filters = useExploreFiltersStore((state) => state.filters);

    const locationFilter = useMemo(() => {
        if (!userLocation || !filters.distanceKm || filters.distanceKm <= 0) {
            return undefined;
        }

        return {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
            maxDistanceKm: filters.distanceKm,
        } as const;
    }, [userLocation, filters.distanceKm]);

    const shouldSkipVenuesQuery = filters.distanceKm > 0 && !userLocation;

    const { venues, venuesLoading, storageIdToUrl } = useAllVenues({
        locationFilter: locationFilter,
        skip: shouldSkipVenuesQuery,
    });

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

    const handleOpenFilters = useCallback(() => {
        navigation.navigate('ExploreFiltersModal');
    }, [navigation]);

    const handleCreditsPress = useCallback(() => {
        navigation.navigate('Settings');
    }, [navigation]);

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
        <TouchableOpacity
            accessibilityLabel="Open settings"
            accessibilityRole="button"
            onPress={handleCreditsPress}
            activeOpacity={0.85}
            style={styles.creditsBadge}
        >
            <DiamondIcon size={16} color={theme.colors.zinc[50]} />
            <Text style={styles.creditsBadgeText}>{creditBalance?.balance || 0}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <TabScreenHeader title="Explore" renderRightSide={renderCreditsBadge} />
            <FilterBar
                leading={(
                    <AppTabs
                        items={tabItems}
                        activeKey={activeTab}
                        onChange={handleTabChange}
                        tabsRowStyle={styles.tabsRow}
                    />
                )}
                onPressFilters={handleOpenFilters}
                activeFilterCount={countActiveFilters(filters)}
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
                    />
                ) : (
                    <ClassesSection
                        filters={filters}
                        userLocation={userLocation}
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
    tabsRow: {
        gap: 16,
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
