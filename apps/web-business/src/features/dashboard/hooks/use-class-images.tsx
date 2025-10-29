import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@repo/api/convex/_generated/api";
import type { Id } from "@repo/api/convex/_generated/dataModel";
import { useMemo } from "react";

/**
 * Type for class instance with image storage IDs
 */
type ClassInstanceWithImages = {
    templateImageId?: Id<"_storage">;
    venueImageId?: Id<"_storage">;
};

/**
 * Hook for fetching image URLs for class instances
 * 
 * Takes an array of class instances (or objects with imageStorageIds)
 * and returns a map of storageId -> url for efficient lookup.
 * 
 * Handles deduplication of storage IDs and batch fetching.
 */
export function useClassImages<T extends ClassInstanceWithImages>(
    classInstances: T[] | undefined
) {
    // Extract all unique image storage IDs
    const imageStorageIds = useMemo(() => {
        if (!classInstances || classInstances.length === 0) {
            return [];
        }

        const ids = new Set<Id<"_storage">>();

        classInstances.forEach((instance) => {
            if (instance.templateImageId) {
                ids.add(instance.templateImageId);
            }
            if (instance.venueImageId) {
                ids.add(instance.venueImageId);
            }
        });

        return Array.from(ids);
    }, [classInstances]);

    const shouldSkip = imageStorageIds.length === 0;

    const imageUrls = useQuery(
        api.queries.uploads.getUrls,
        shouldSkip ? "skip" : { storageIds: imageStorageIds }
    );

    // Create map for efficient lookup
    const imageUrlMap = useMemo(() => {
        const map = new Map<Id<"_storage">, string | null>();

        if (imageUrls) {
            imageUrls.forEach(({ storageId, url }) => {
                map.set(storageId, url);
            });
        }

        return map;
    }, [imageUrls]);

    return {
        imageUrlMap,
        isLoading: !shouldSkip && imageUrls === undefined,
        isSkipped: shouldSkip,
    };
}

/**
 * Helper function to get image URL for a class instance
 * Prioritizes template image over venue image
 */
export function getClassImageUrl<T extends ClassInstanceWithImages>(
    instance: T,
    imageUrlMap: Map<Id<"_storage">, string | null>
): string | null {
    if (instance.templateImageId) {
        const url = imageUrlMap.get(instance.templateImageId);
        if (url) return url;
    }

    if (instance.venueImageId) {
        const url = imageUrlMap.get(instance.venueImageId);
        if (url) return url;
    }

    return null;
}

