import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@repo/api/convex/_generated/api";

interface UseDailyClassesWithBookingsProps {
    dayStart: number;
    dayEnd: number;
}

export default function useDailyClassesWithBookings({
    dayStart,
    dayEnd
}: UseDailyClassesWithBookingsProps) {
    const data = useQuery(api.queries.classInstances.getClassInstancesWithBookingsForDay, {
        dayStart,
        dayEnd,
    });

    return {
        data: data ?? [],
        loading: data === undefined,
    };
}
