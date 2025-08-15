import React, { memo, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../navigation';
import * as Location from 'expo-location';
import { BusinessCard } from '../../../components/BusinessCard';
import { FilterOptions } from '../../../components/FilterBar';
import { ExploreMapView } from '../../../components/MapView';
import { useTypedTranslation } from '../../../i18n/typed';
import { calculateDistance } from '../../../utils/location';
import { getVenueCategoryDisplay } from '@repo/utils/constants';

export interface Business {
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

interface BusinessesSectionProps {
    venues: any[];
    storageIdToUrl: Map<string, string | null>;
    userLocation: Location.LocationObject | null;
    filters: FilterOptions;
    isMapView: boolean;
    onCloseMapSheet?: () => void;
}

export const BusinessesSection = memo<BusinessesSectionProps>(({ venues, storageIdToUrl, userLocation, filters, isMapView, onCloseMapSheet }) => {
    const { t } = useTypedTranslation();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const businesses: Business[] = useMemo(() => {
        if (!venues.length || !userLocation) return [];

        return venues.map(venue => {
            const imageUrl = venue.imageStorageIds && venue.imageStorageIds.length > 0
                ? storageIdToUrl.get(venue.imageStorageIds[0]) || undefined
                : undefined;

            let venueCoordinates = { latitude: 37.9838, longitude: 23.7275 };
            if (venue.address && typeof venue.address === 'object' && 'latitude' in venue.address && 'longitude' in venue.address) {
                const lat = venue.address.latitude as number;
                const lng = venue.address.longitude as number;
                if (isFinite(lat) && isFinite(lng) && lat !== 0 && lng !== 0) {
                    venueCoordinates = { latitude: lat, longitude: lng };
                }
            }

            const distance = calculateDistance(
                userLocation?.coords?.latitude || 37.9838,
                userLocation?.coords?.longitude || 23.7275,
                venueCoordinates.latitude,
                venueCoordinates.longitude
            );

            // Use the new primaryCategory field for consistent business type display
            const type = venue.primaryCategory ? getVenueCategoryDisplay(venue.primaryCategory) : 'Fitness Center';

            return {
                id: venue._id,
                name: venue.name,
                type,
                rating: venue.rating ?? 0,
                reviewCount: venue.reviewCount ?? 0,
                distance,
                isOpen: venue.isActive,
                imageUrl,
                address: venue.address && typeof venue.address === 'object' && 'street' in venue.address
                    ? `${venue.address.street || ''}, ${venue.address.city || ''}`.trim().replace(/^,\s*/, '')
                    : 'Address not available',
                coordinate: venueCoordinates,
            } as Business;
        }).sort((a, b) => a.distance - b.distance);
    }, [venues, userLocation, storageIdToUrl]);

    const filteredBusinesses = useMemo(() => {
        const { searchQuery, categories } = filters;
        return businesses.filter(business => {
            const matchesSearch = !searchQuery ||
                business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                business.type.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categories.length === 0 ||
                categories.some((cat: string) => business.type.includes(cat));
            return matchesSearch && matchesCategory;
        });
    }, [businesses, filters]);

    const renderBusinessItem = useCallback(({ item }: { item: Business }) => (
        <BusinessCard
            business={item}
            onPress={(business) => navigation.navigate('VenueDetailsScreen', { venueId: business.id })}
        />
    ), [navigation]);

    if (isMapView) {
        return (
            <ExploreMapView
                businesses={filteredBusinesses}
                userLocation={userLocation}
                onCloseSheet={onCloseMapSheet}
            />
        );
    }

    return (
        <FlashList
            data={filteredBusinesses}
            renderItem={renderBusinessItem}
            keyExtractor={item => item.id}
            getItemType={() => 'business'}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{t('explore.noBusinesses')}</Text>
                </View>
            )}
        />
    );
});

BusinessesSection.displayName = 'BusinessesSection';

const styles = StyleSheet.create({
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 100,
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