import { useQuery } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import type { Id } from "@repo/api/convex/_generated/dataModel";

interface UseVenueClassInstancesProps {
    venueId: Id<"venues">;
    startDate: number;
    endDate?: number;
    includeBookingStatus?: boolean;
}

const THIRTY_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 30;

export function useVenueClassInstances({
    venueId,
    startDate,
    endDate,
    includeBookingStatus = false,
}: UseVenueClassInstancesProps) {
    const finalEndDate = endDate ?? startDate + THIRTY_DAYS_IN_MS;

    // Use optimized venue-specific query
    const venueClassInstances = useQuery(
        api.queries.classInstances.getVenueClassInstancesOptimized,
        {
            venueId,
            startDate,
            endDate: finalEndDate,
            includeBookingStatus,
        }
    );

    return {
        classInstances: venueClassInstances ?? [],
        loading: venueClassInstances === undefined,
    };
}

export type VenueClassInstance = Awaited<ReturnType<typeof useVenueClassInstances>>['classInstances'][number];
