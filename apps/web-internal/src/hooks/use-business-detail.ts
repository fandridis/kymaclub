import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { Id } from '@repo/api/convex/_generated/dataModel';

export const useBusinessDetail = (businessId: string) => {
    const data = useQuery(api.internal.queries.businesses.getBusinessDetails, {
        businessId: businessId as Id<"businesses">
    });

    const isLoading = data === undefined;

    return { data, isLoading };
};

