import { useQuery } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";

interface UseVenuesOptions {
    cityFilter?: string;
    skip?: boolean;
}

export function useVenues(options: UseVenuesOptions = {}) {
    const { cityFilter, skip } = options;

    const venues = useQuery(
        api.queries.venues.getAllVenues,
        skip || !cityFilter
            ? "skip"
            : { cityFilter }
    );

    return {
        venues: venues ?? [],
        loading: skip ? false : venues === undefined,
    };
}
