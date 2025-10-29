import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@repo/api/convex/_generated/api";
import { useAuthStore } from "@/components/stores/auth";
import type { Id } from "@repo/api/convex/_generated/dataModel";
import { useMemo } from "react";

/**
 * Hook for fetching today's class instances for the business
 * 
 * Returns class instances happening today (from now until end of day),
 * ordered by start time (earliest first). Includes booking counts for
 * availability display.
 * 
 * Uses Convex real-time subscriptions for live updates
 */
export function useHappeningTodayClasses() {
    const { user } = useAuthStore();
    const businessId = user?.businessId as Id<"businesses"> | undefined;

    // Calculate today's date range
    const { startDate, endDate } = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        return {
            startDate: Math.max(Date.now(), startOfToday.getTime()), // Use current time if after start of day
            endDate: endOfToday.getTime(),
        };
    }, []);

    const shouldSkip = !businessId;

    const classes = useQuery(
        api.queries.classInstances.getBusinessHappeningTodayClassInstances,
        shouldSkip ? "skip" : {
            businessId,
            startDate,
            endDate,
            limit: 50, // Reasonable limit for carousel
        }
    );

    return {
        classes: classes ?? [],
        isLoading: !shouldSkip && classes === undefined,
        isSkipped: shouldSkip,
        hasData: !!classes && classes.length > 0,
    };
}

/**
 * Hook return type for type safety
 */
export type UseHappeningTodayClassesReturn = ReturnType<typeof useHappeningTodayClasses>;

