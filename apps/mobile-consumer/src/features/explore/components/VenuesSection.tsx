import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../navigation';
import * as Location from 'expo-location';
import { VenueCard } from '../../../components/VenueCard';
import { FilterOptions } from '../../../stores/explore-filters-store';
import type { ExploreCategoryId } from '@repo/utils/exploreFilters';
import { ExploreMapView } from '../../../components/ExploreMapView';
import { useTypedTranslation } from '../../../i18n/typed';
import { Doc } from '@repo/api/convex/_generated/dataModel';
import { calculateDistance, sortByDistance } from '../../../utils/location';

interface VenuesSectionProps {
    venues: Doc<'venues'>[];
    storageIdToUrl: Map<string, string | null>;
    userLocation: Location.LocationObject | null;
    filters: FilterOptions;
    isMapView: boolean;
    onCloseMapSheet?: () => void;
}

export const VenuesSection = ({ venues, storageIdToUrl, userLocation, filters, isMapView, onCloseMapSheet }: VenuesSectionProps) => {
    const { t } = useTypedTranslation();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const filteredAndSortedVenues = useMemo(() => {
        // Filter by categories
        let filtered = venues;
        if (filters.categories.length > 0) {
            filtered = filtered.filter((venue) => {
                const primaryCategory = venue.primaryCategory;
                return (
                    typeof primaryCategory === 'string' &&
                    filters.categories.includes(primaryCategory as ExploreCategoryId)
                );
            });
        }

        // Calculate distances and sort if user location is available
        if (userLocation) {
            const withDistances = filtered.map((venue) => {
                const lat = typeof venue.address?.latitude === 'number' ? venue.address.latitude : null;
                const lng = typeof venue.address?.longitude === 'number' ? venue.address.longitude : null;

                if (lat !== null && lng !== null && isFinite(lat) && isFinite(lng)) {
                    const distance = calculateDistance(
                        userLocation.coords.latitude,
                        userLocation.coords.longitude,
                        lat,
                        lng
                    );
                    return { ...venue, distance };
                }
                return { ...venue, distance: Infinity };
            });

            // Sort by distance (closest first)
            return sortByDistance(withDistances);
        }

        return filtered;
    }, [filters.categories, userLocation, venues]);

    const renderVenueItem = useCallback(({ item }: { item: Doc<'venues'> & { distance?: number } }) => {
        return (
            <VenueCard
                venue={item}
                distance={item.distance !== undefined && item.distance !== Infinity ? item.distance : undefined}
                storageIdToUrl={storageIdToUrl}
                onPress={(venue) => navigation.navigate('VenueDetailsScreen', { venueId: venue._id })}
            />
        );
    }, [navigation, storageIdToUrl]);

    if (isMapView) {
        return (
            <ExploreMapView
                venues={filteredAndSortedVenues}
                storageIdToUrl={storageIdToUrl}
                userLocation={userLocation}
                onCloseSheet={onCloseMapSheet}
            />
        );
    }

    return (
        <FlashList
            data={filteredAndSortedVenues}
            renderItem={renderVenueItem}
            keyExtractor={item => item._id}
            getItemType={() => 'venue'}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No venues found</Text>
                </View>
            )}
        />
    );
};

const styles = StyleSheet.create({
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
}); 
