import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@repo/api/convex/_generated/api";

interface UseClassInstancesProps {
    startDate: number;
    endDate?: number;
}

const SEVEN_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 7;

export function useClassInstances({ startDate, endDate }: UseClassInstancesProps) {
    const finalEndDate = endDate ?? startDate + SEVEN_DAYS_IN_MS;

    // Fetch current week's data
    const classInstances = useQuery(api.queries.classInstances.getClassInstances, {
        startDate,
        endDate: finalEndDate,
    });

    // Prefetch next week's data (7 days ahead)
    const nextWeekStart = startDate + SEVEN_DAYS_IN_MS;
    const nextWeekEnd = nextWeekStart + SEVEN_DAYS_IN_MS;

    useQuery(api.queries.classInstances.getClassInstances, {
        startDate: nextWeekStart,
        endDate: nextWeekEnd,
    });

    return {
        classInstances: classInstances ?? [],
        loading: classInstances === undefined,
    };
}

export type ClassInstance = Awaited<ReturnType<typeof useClassInstances>>['classInstances'][number];