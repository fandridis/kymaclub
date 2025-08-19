import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@repo/api/convex/_generated/api";

interface UseUpcomingClassesWithBookingsProps {
    startDate: number;
    limit?: number;
}

export default function useUpcomingClassesWithBookings({
    startDate,
    limit = 500
}: UseUpcomingClassesWithBookingsProps) {
    const data = useQuery(api.queries.classInstances.getClassInstancesWithBookings, {
        startDate,
        limit,
    });

    return {
        data: data ?? [],
        loading: data === undefined,
    };
}