import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@repo/api/convex/_generated/api";

interface UseClassInstancesProps {
    startDate: number;
    endDate?: number;
}

const THIRTY_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 30;

export function useClassInstances({ startDate, endDate }: UseClassInstancesProps) {
    const finalEndDate = endDate ?? startDate + THIRTY_DAYS_IN_MS;
    const classInstances = useQuery(api.queries.classInstances.getClassInstances, {
        startDate,
        endDate: finalEndDate,
    });

    return {
        classInstances: classInstances ?? [],
        loading: classInstances === undefined,
    };
}

export type ClassInstance = Awaited<ReturnType<typeof useClassInstances>>['classInstances'][number];