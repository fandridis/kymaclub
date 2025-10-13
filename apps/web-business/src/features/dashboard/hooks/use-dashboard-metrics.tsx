import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@repo/api/convex/_generated/api";
import { useAuthStore } from "@/components/stores/auth";
import type { Id } from "@repo/api/convex/_generated/dataModel";

/**
 * Hook for fetching dashboard metrics data
 * 
 * Returns real-time dashboard metrics including:
 * - Check-ins today with yesterday comparison
 * - Monthly visits with previous month comparison  
 * - Monthly revenue with previous month comparison
 * - Attendance rate with historical comparison
 * 
 * Uses Convex real-time subscriptions for live updates
 */
export function useDashboardMetrics() {
    const { user } = useAuthStore();
    const businessId = user?.businessId as Id<"businesses"> | undefined;

    const shouldSkip = !businessId;

    const metricsData = useQuery(
        api.queries.dashboard.getDashboardMetrics,
        shouldSkip ? "skip" : { businessId }
    );

    return {
        metrics: metricsData ?? null,
        isLoading: !shouldSkip && metricsData === undefined,
        isSkipped: shouldSkip,
        hasData: !!metricsData,
    };
}

/**
 * Hook return type for type safety
 */
export type UseDashboardMetricsReturn = ReturnType<typeof useDashboardMetrics>;
export type DashboardMetricsData = NonNullable<UseDashboardMetricsReturn['metrics']>;
