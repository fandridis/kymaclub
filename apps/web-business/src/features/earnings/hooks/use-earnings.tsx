import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@repo/api/convex/_generated/api";
import { useAuthStore } from "@/components/stores/auth";
import type { Id } from "@repo/api/convex/_generated/dataModel";

interface UseEarningsProps {
    month: string; // Format: "YYYY-MM"
    skip?: boolean;
}

export function useEarnings({ month, skip = false }: UseEarningsProps) {
    const { user } = useAuthStore();
    const businessId = user?.businessId as Id<"businesses"> | undefined;

    const shouldSkip = skip || !businessId || !month;

    console.log("user", { user, skip, businessId, month, shouldSkip });


    const earningsData = useQuery(
        api.queries.earnings.getMonthlyEarnings,
        shouldSkip ? "skip" : { businessId, month }
    );

    return {
        earningsData: earningsData ?? null,
        isLoading: !shouldSkip && earningsData === undefined,
        isSkipped: shouldSkip,
        hasData: !!earningsData,
    };
}

// Hook for getting earnings summary across multiple months
interface UseEarningsSummaryProps {
    months: string[]; // Array of "YYYY-MM" strings
    skip?: boolean;
}

export function useEarningsSummary({ months, skip = false }: UseEarningsSummaryProps) {
    const { user } = useAuthStore();
    const businessId = user?.businessId as Id<"businesses"> | undefined;

    const shouldSkip = skip || !businessId || !months.length;

    const summaryData = useQuery(
        api.queries.earnings.getEarningsSummary,
        shouldSkip ? "skip" : { businessId, months }
    );

    return {
        summaryData: summaryData ?? [],
        isLoading: !shouldSkip && summaryData === undefined,
        isSkipped: shouldSkip,
        hasData: !!summaryData?.length,
    };
}

// Hook for getting yearly earnings
interface UseYearlyEarningsProps {
    year: number;
    skip?: boolean;
}

export function useYearlyEarnings({ year, skip = false }: UseYearlyEarningsProps) {
    const { user } = useAuthStore();
    const businessId = user?.businessId as Id<"businesses"> | undefined;

    const shouldSkip = skip || !businessId || !year;

    const yearlyData = useQuery(
        api.queries.earnings.getYearlyEarnings,
        shouldSkip ? "skip" : { businessId, year }
    );

    return {
        yearlyData: yearlyData ?? null,
        isLoading: !shouldSkip && yearlyData === undefined,
        isSkipped: shouldSkip,
        hasData: !!yearlyData,
    };
}

// Export types for the earnings data
export type EarningsData = NonNullable<ReturnType<typeof useEarnings>['earningsData']>;
export type EarningsSummaryData = NonNullable<ReturnType<typeof useEarningsSummary>['summaryData']>;
export type YearlyEarningsData = NonNullable<ReturnType<typeof useYearlyEarnings>['yearlyData']>;