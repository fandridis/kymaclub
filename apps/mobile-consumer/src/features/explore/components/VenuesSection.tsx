import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../navigation';
import * as Location from 'expo-location';
import { VenueCard } from '../../../components/VenueCard';
import { FilterOptions } from '../../../components/FilterBar';
import { ExploreMapView } from '../../../components/ExploreMapView';
import { useTypedTranslation } from '../../../i18n/typed';
import { Doc } from '@repo/api/convex/_generated/dataModel';

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

    console.log('VenuesSection received storageIdToUrl:', storageIdToUrl);

    const renderVenueItem = useCallback(({ item }: { item: Doc<'venues'> }) => {
        console.log('FlashList rendering item:', item.name);
        return (
            <VenueCard
                venue={item}
                storageIdToUrl={storageIdToUrl}
                onPress={(venue) => navigation.navigate('VenueDetailsScreen', { venueId: venue._id })}
            />
        );
    }, [navigation]);

    if (isMapView) {
        return (
            <ExploreMapView
                venues={venues}
                storageIdToUrl={storageIdToUrl}
                userLocation={userLocation}
                onCloseSheet={onCloseMapSheet}
            />
        );
    }

    console.log('venues.length: ', venues.length);
    return (
        <FlashList
            data={venues}
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