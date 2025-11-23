import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { Id } from '@repo/api/convex/_generated/dataModel';

export const useConsumerDetail = (userId: string) => {
    const data = useQuery(api.internal.queries.consumers.getConsumerDetails, {
        userId: userId as Id<"users">
    });

    const isLoading = data === undefined;

    return { data, isLoading };
};

