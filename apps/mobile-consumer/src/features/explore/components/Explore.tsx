import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TextInput } from 'react-native';
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
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { theme } from '../../../theme';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation';
import { countActiveFilters, useExploreFiltersStore } from '../../../stores/explore-filters-store';
import { CreditsBadge } from '../../../components/CreditsBadge';
import { ChevronLeftIcon, SearchIcon } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

export function Explore() {
    const { t } = useTypedTranslation();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { user, isLoading: userLoading } = useCurrentUser();
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
    const [searchQuery, setSearchQuery] = useState<string>('');
    const filters = useExploreFiltersStore((state) => state.filters);
    const userCity = user?.activeCitySlug;


    const { venues, venuesLoading, storageIdToUrl } = useAllVenues({
        cityFilter: userCity,
        skip: !userCity || userLoading,
    });

    // Get user credit balance
    const creditBalance = useQuery(
        api.queries.credits.getUserBalance,
        user?._id ? { userId: user._id } : 'skip'
    );

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

    const isLoading = loadingLocation || venuesLoading || userLoading;

    if (isLoading) {
        return (
            <SafeAreaView style={styles.centerContainer} edges={['top', 'left', 'right']}>
                <ActivityIndicator size="large" color="#ff4747" />
                <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.centerContainer} edges={['top', 'left', 'right']}>
                <Text style={styles.errorText}>{error}</Text>
            </SafeAreaView>
        );
    }

    const handleBackPress = () => {
        navigation.goBack();
    };

    // Show empty state if no city selected
    if (!userCity && !userLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <TabScreenHeader
                    renderLeftSide={() => (
                        <TouchableOpacity
                            onPress={handleBackPress}
                            style={styles.backButton}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            accessibilityLabel={t('common.back')}
                            accessibilityRole="button"
                        >
                            <ChevronLeftIcon size={30} color="#111827" />
                        </TouchableOpacity>
                    )}
                    renderMiddle={() => (
                        <View style={styles.searchInputContainer}>
                            <SearchIcon size={18} color={theme.colors.zinc[500]} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('explore.searchPlaceholder') || 'Search studios and classes...'}
                                placeholderTextColor={theme.colors.zinc[500]}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                editable={false}
                            />
                        </View>
                    )}
                    renderRightSide={() => (
                        <>
                            {creditBalance !== undefined && (
                                <CreditsBadge creditBalance={creditBalance.balance} />
                            )}
                        </>
                    )}
                />
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateTitle}>Select Your City</Text>
                    <Text style={styles.emptyStateText}>
                        Please select a city in settings to explore classes and venues.
                    </Text>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('Settings' as never)}
                    >
                        <Text style={styles.settingsButtonText}>Go to Settings</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <TabScreenHeader
                renderLeftSide={() => (
                    <TouchableOpacity
                        onPress={handleBackPress}
                        style={styles.backButton}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityLabel={t('common.back')}
                        accessibilityRole="button"
                    >
                        <ChevronLeftIcon size={30} color="#111827" />
                    </TouchableOpacity>
                )}
                renderMiddle={() => (
                    <View style={styles.searchInputContainer}>
                        <SearchIcon size={18} color={theme.colors.zinc[500]} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('explore.searchPlaceholder') || 'Search studios and classes...'}
                            placeholderTextColor={theme.colors.zinc[500]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            editable={false}
                        />
                    </View>
                )}
                renderRightSide={() => (
                    <>
                        {creditBalance !== undefined && (
                            <CreditsBadge creditBalance={creditBalance.balance} />
                        )}
                    </>
                )}
            />
            <View style={styles.filterBarContainer}>
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
            </View>

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
        gap: 8,
    },
    filterBarContainer: {
        marginTop: -8,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 20,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.zinc[900],
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        color: theme.colors.zinc[600],
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    settingsButton: {
        backgroundColor: theme.colors.emerald[600],
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    settingsButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.zinc[100],
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.zinc[900],
        padding: 0,
    },
});
