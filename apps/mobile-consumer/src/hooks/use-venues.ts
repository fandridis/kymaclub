import { useQuery } from "convex-helpers/react/cache";
import { api } from "@repo/api/convex/_generated/api";

export function useVenues() {
    const venues = useQuery(api.queries.venues.getAllVenues);

    return {
        venues: venues ?? [],
        loading: venues === undefined,
    };
}