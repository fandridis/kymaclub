import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import type { Id } from '@repo/api/convex/_generated/dataModel';

export const useBusinessReviews = (businessId: Id<"businesses"> | null, limit: number = 10) => {
    const reviews = useQuery(
        api.queries.reviews.getBusinessReviews,
        businessId ? { businessId, limit } : "skip"
    );

    return {
        reviews: reviews || [],
        isLoading: reviews === undefined,
    };
};
