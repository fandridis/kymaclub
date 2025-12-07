import { useQuery } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import type { Id } from "@repo/api/convex/_generated/dataModel";

interface UseVenueClassOfferingsProps {
    venueId: Id<"venues"> | undefined;
    limit?: number;
}

export function useVenueClassOfferings({
    venueId,
    limit = 10,
}: UseVenueClassOfferingsProps) {
    const offerings = useQuery(
        api.queries.classTemplates.getVenueClassOfferings,
        venueId ? { venueId, limit } : "skip"
    );

    return {
        offerings: offerings ?? [],
        loading: offerings === undefined,
    };
}

export type VenueClassOffering = Awaited<ReturnType<typeof useVenueClassOfferings>>['offerings'][number];

