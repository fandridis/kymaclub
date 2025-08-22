import { useMemo } from 'react';
import { useVenues } from '../../../hooks/use-venues';
import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';

export function useAllVenues() {
    const { venues, loading: venuesLoading } = useVenues();

    const allImageStorageIds = useMemo(
        () => venues.flatMap(venue => venue.imageStorageIds || []),
        [venues]
    );

    const shouldLoadImageUrls = allImageStorageIds.length > 0;

    const imageUrlsQuery = useQuery(
        api.queries.uploads.getUrls,
        shouldLoadImageUrls ? { storageIds: allImageStorageIds } : 'skip'
    );

    const storageIdToUrl = useMemo(() => {
        const map = new Map<string, string | null>();
        if (imageUrlsQuery) {
            for (const { storageId, url } of imageUrlsQuery) {
                map.set(storageId, url);
            }
        }
        return map;
    }, [imageUrlsQuery]);

    const venuesAreLoading = venuesLoading;
    const imageUrlsAreLoading = shouldLoadImageUrls && imageUrlsQuery === undefined;

    return {
        venues,
        venuesLoading: venuesAreLoading || imageUrlsAreLoading,
        storageIdToUrl
    };
} 