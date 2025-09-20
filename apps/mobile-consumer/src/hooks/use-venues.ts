import { useQuery } from "convex-helpers/react/cache";
import { api } from "@repo/api/convex/_generated/api";

export interface LocationFilter {
    latitude: number;
    longitude: number;
    maxDistanceKm: number;
}
interface UseVenuesOptions {
    locationFilter?: LocationFilter;
    skip?: boolean;
}

export function useVenues(options: UseVenuesOptions = {}) {
    const { locationFilter, skip } = options;

    const venues = useQuery(
        api.queries.venues.getAllVenues,
        skip
            ? "skip"
            : locationFilter
                ? { locationFilter }
                : {}
    );

    return {
        venues: venues ?? [],
        loading: skip ? false : venues === undefined,
    };
}
