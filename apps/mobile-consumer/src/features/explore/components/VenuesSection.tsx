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
import { calculateDistance } from '../../../utils/location';

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

    const filteredVenues = useMemo(() => {
        let result = venues;

        if (filters.categories.length > 0) {
            result = result.filter((venue) => {
                const primaryCategory = venue.primaryCategory;
                return (
                    typeof primaryCategory === 'string' &&
                    filters.categories.includes(primaryCategory as ExploreCategoryId)
                );
            });
        }

        if (!filters.distanceKm || filters.distanceKm <= 0 || !userLocation) {
            return result;
        }

        return result.filter((venue) => {
            const latitude = typeof venue.address?.latitude === 'number' ? venue.address.latitude : null;
            const longitude = typeof venue.address?.longitude === 'number' ? venue.address.longitude : null;

            if (latitude === null || longitude === null) {
                return true;
            }

            const distanceMeters = calculateDistance(
                userLocation.coords.latitude,
                userLocation.coords.longitude,
                latitude,
                longitude
            );

            return distanceMeters <= filters.distanceKm * 1000;
        });
    }, [filters.categories, filters.distanceKm, userLocation, venues]);

    const renderVenueItem = useCallback(({ item }: { item: Doc<'venues'> }) => {
        return (
            <VenueCard
                venue={item}
                storageIdToUrl={storageIdToUrl}
                onPress={(venue) => navigation.navigate('VenueDetailsScreen', { venueId: venue._id })}
            />
        );
    }, [navigation, storageIdToUrl]);

    if (isMapView) {
        return (
            <ExploreMapView
                venues={filteredVenues}
                storageIdToUrl={storageIdToUrl}
                userLocation={userLocation}
                onCloseSheet={onCloseMapSheet}
            />
        );
    }

    return (
        <FlashList
            data={filteredVenues}
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
