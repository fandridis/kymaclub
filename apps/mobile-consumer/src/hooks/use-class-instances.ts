import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@repo/api/convex/_generated/api";

interface UseClassInstancesProps {
    startDate: number;
    endDate?: number;
    includeBookingStatus?: boolean;
    limit?: number;
    cityFilter?: string;
}

const THIRTY_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 30;

export function useClassInstances({
    startDate,
    endDate,
    includeBookingStatus = false,
    limit,
    cityFilter,
}: UseClassInstancesProps) {
    const finalEndDate = endDate ?? startDate + THIRTY_DAYS_IN_MS;

    // Use optimized consumer query when booking status is needed
    const classInstancesWithBookings = useQuery(
        api.queries.classInstances.getConsumerClassInstancesWithBookingStatus,
        includeBookingStatus && cityFilter ? {
            startDate,
            endDate: finalEndDate,
            limit,
            cityFilter,
        } : "skip"
    );

    // Use original business-focused query when no booking status needed  
    const classInstancesBasic = useQuery(
        api.queries.classInstances.getClassInstances,
        !includeBookingStatus ? {
            startDate,
            endDate: finalEndDate,
        } : "skip"
    );

    const classInstances = includeBookingStatus ? classInstancesWithBookings : classInstancesBasic;

    return {
        classInstances: classInstances ?? [],
        loading: classInstances === undefined,
    };
}

export type ClassInstance = Awaited<ReturnType<typeof useClassInstances>>['classInstances'][number];
