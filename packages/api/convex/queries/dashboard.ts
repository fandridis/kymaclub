import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";

/**
 * Helper function to calculate earnings for a specific month
 * Replicates the logic from earnings.ts for dashboard metrics
 */
async function getMonthEarningsData(
    ctx: any,
    businessId: string,
    month: string
): Promise<{
    totalGrossEarnings: number;
    totalNetEarnings: number;
    totalSystemCut: number;
    totalBookings: number;
}> {
    // Parse month format
    const monthRegex = /^(\d{4})-(\d{2})$/;
    const monthMatch = month.match(monthRegex);

    if (!monthMatch) {
        return {
            totalGrossEarnings: 0,
            totalNetEarnings: 0,
            totalSystemCut: 0,
            totalBookings: 0,
        };
    }

    const year = parseInt(monthMatch[1]);
    const monthNum = parseInt(monthMatch[2]);

    if (monthNum < 1 || monthNum > 12) {
        return {
            totalGrossEarnings: 0,
            totalNetEarnings: 0,
            totalSystemCut: 0,
            totalBookings: 0,
        };
    }

    // Calculate month start and end timestamps (UTC)
    const monthStart = new Date(year, monthNum - 1, 1).getTime();
    const monthEnd = new Date(year, monthNum, 1).getTime();

    // Query completed bookings for the business within the month
    const completedBookings = await ctx.db
        .query("bookings")
        .withIndex("by_business_created", (q: any) =>
            q.eq("businessId", businessId)
                .gte("createdAt", monthStart)
        )
        .filter((q: any) => q.and(
            q.lt(q.field("createdAt"), monthEnd),
            q.eq(q.field("status"), "completed"),
            q.neq(q.field("deleted"), true)
        ))
        .order("desc")
        .collect();

    // Calculate earnings with proper business logic
    const totalGrossEarnings = completedBookings.reduce(
        (sum: number, booking: any) => sum + booking.finalPrice,
        0
    );

    // Apply 20% system cut
    const systemCutRate = 0.20;
    const totalSystemCut = Math.round(totalGrossEarnings * systemCutRate);
    const totalNetEarnings = totalGrossEarnings - totalSystemCut;
    const totalBookings = completedBookings.length;

    return {
        totalGrossEarnings,
        totalNetEarnings,
        totalSystemCut,
        totalBookings,
    };
}

/**
 * Helper function to calculate percentage change between two values
 * Handles edge cases like division by zero
 */
function calculatePercentageChange(current: number, previous: number): { change: number; isPositive: boolean } {
    // Handle edge cases
    if (previous === 0) {
        if (current === 0) {
            return { change: 0, isPositive: true };
        }
        // If previous is 0 but current has value, it's a 100% increase
        return { change: 100, isPositive: true };
    }

    const percentageChange = ((current - previous) / previous) * 100;
    return {
        change: Math.round(percentageChange * 10) / 10, // Round to 1 decimal place
        isPositive: percentageChange >= 0
    };
}

/**
 * Get comprehensive dashboard metrics for business dashboard
 * 
 * Business Rules Applied:
 * - Check-ins today: Completed bookings with completedAt in today's range
 * - Monthly visits: Completed bookings from current month
 * - Monthly revenue: Reuses existing earnings calculation with 20% system cut
 * - Attendance rate: Latest 100 completed class instances (bookedCount/capacity)
 * 
 * Returns real-time metrics with comparison data for dashboard indicators
 */
export const getDashboardMetrics = query({
    args: { businessId: v.id("businesses") },
    returns: v.object({
        checkInsToday: v.object({
            count: v.number(),
            change: v.number(),
            isPositive: v.boolean(),
        }),
        monthlyVisits: v.object({
            count: v.number(),
            change: v.number(),
            isPositive: v.boolean(),
        }),
        monthlyRevenue: v.object({
            gross: v.number(),
            net: v.number(),
            change: v.number(),
            isPositive: v.boolean(),
        }),
        attendanceRate: v.object({
            percentage: v.number(),
            attended: v.number(),
            capacity: v.number(),
            change: v.number(),
            isPositive: v.boolean(),
        }),
    }),
    handler: async (ctx, args) => {
        // Authenticate and validate business access
        const user = await getAuthenticatedUserOrThrow(ctx);

        // Validate business access
        const business = await ctx.db.get(args.businessId);
        if (!business || business.createdBy !== user._id) {
            throw new Error("Business not found or access denied");
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfToday = today.getTime();
        const endOfToday = startOfToday + (24 * 60 * 60 * 1000);

        const startOfYesterday = startOfToday - (24 * 60 * 60 * 1000);
        const endOfYesterday = startOfToday;

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

        const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        // Parallel queries for all metrics
        const [
            checkInsToday,
            checkInsYesterday,
            monthlyBookings,
            previousMonthBookings,
            currentMonthEarnings,
            previousMonthEarnings,
            latestCompletedInstances,
            previousCompletedInstances
        ] = await Promise.all([
            // Check-ins today
            ctx.db
                .query("bookings")
                .withIndex("by_business_created", (q) =>
                    q.eq("businessId", args.businessId)
                        .gte("createdAt", startOfToday)
                )
                .filter((q) => q.and(
                    q.lt(q.field("createdAt"), endOfToday),
                    q.eq(q.field("status"), "completed"),
                    q.neq(q.field("deleted"), true)
                ))
                .collect(),

            // Check-ins yesterday (for comparison)
            ctx.db
                .query("bookings")
                .withIndex("by_business_created", (q) =>
                    q.eq("businessId", args.businessId)
                        .gte("createdAt", startOfYesterday)
                )
                .filter((q) => q.and(
                    q.lt(q.field("createdAt"), endOfYesterday),
                    q.eq(q.field("status"), "completed"),
                    q.neq(q.field("deleted"), true)
                ))
                .collect(),

            // Monthly visits (current month)
            ctx.db
                .query("bookings")
                .withIndex("by_business_created", (q) =>
                    q.eq("businessId", args.businessId)
                        .gte("createdAt", startOfMonth)
                )
                .filter((q) => q.and(
                    q.lt(q.field("createdAt"), startOfNextMonth),
                    q.eq(q.field("status"), "completed"),
                    q.neq(q.field("deleted"), true)
                ))
                .collect(),

            // Previous month visits (for comparison)
            ctx.db
                .query("bookings")
                .withIndex("by_business_created", (q) =>
                    q.eq("businessId", args.businessId)
                        .gte("createdAt", startOfPreviousMonth)
                )
                .filter((q) => q.and(
                    q.lt(q.field("createdAt"), endOfPreviousMonth),
                    q.eq(q.field("status"), "completed"),
                    q.neq(q.field("deleted"), true)
                ))
                .collect(),

            // Current month earnings
            getMonthEarningsData(ctx, args.businessId,
                `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`),

            // Previous month earnings
            getMonthEarningsData(ctx, args.businessId,
                `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`),

            // Latest 100 completed class instances for attendance rate
            ctx.db
                .query("classInstances")
                .withIndex("by_business_status_start_time", (q) =>
                    q.eq("businessId", args.businessId)
                        .eq("status", "completed")
                )
                .filter((q) => q.neq(q.field("deleted"), true))
                .order("desc")
                .take(100),

            // Previous 100 completed instances (for comparison)
            ctx.db
                .query("classInstances")
                .withIndex("by_business_status_start_time", (q) =>
                    q.eq("businessId", args.businessId)
                        .eq("status", "completed")
                )
                .filter((q) => q.neq(q.field("deleted"), true))
                .order("desc")
                .take(200)
                .then(instances => instances.slice(100, 200)) // Get instances 101-200
        ]);

        // Calculate check-ins today metrics
        const checkInsTodayCount = checkInsToday.length;
        const checkInsYesterdayCount = checkInsYesterday.length;
        const checkInsChange = calculatePercentageChange(checkInsTodayCount, checkInsYesterdayCount);

        // Calculate monthly visits metrics
        const monthlyVisitsCount = monthlyBookings.length;
        const previousMonthVisitsCount = previousMonthBookings.length;
        const monthlyVisitsChange = calculatePercentageChange(monthlyVisitsCount, previousMonthVisitsCount);

        // Calculate monthly revenue metrics
        const monthlyRevenueChange = calculatePercentageChange(
            currentMonthEarnings.totalNetEarnings,
            previousMonthEarnings.totalNetEarnings
        );

        // Calculate attendance rate metrics
        const latestAttendanceData = latestCompletedInstances.reduce(
            (acc, instance) => ({
                attended: acc.attended + instance.bookedCount,
                capacity: acc.capacity + (instance.capacity || 10) // Fallback to 10 if no capacity set
            }),
            { attended: 0, capacity: 0 }
        );

        const previousAttendanceData = previousCompletedInstances.reduce(
            (acc, instance) => ({
                attended: acc.attended + instance.bookedCount,
                capacity: acc.capacity + (instance.capacity || 10) // Fallback to 10 if no capacity set
            }),
            { attended: 0, capacity: 0 }
        );

        const latestAttendanceRate = latestAttendanceData.capacity > 0
            ? Math.round((latestAttendanceData.attended / latestAttendanceData.capacity) * 100)
            : 0;

        const previousAttendanceRate = previousAttendanceData.capacity > 0
            ? Math.round((previousAttendanceData.attended / previousAttendanceData.capacity) * 100)
            : 0;

        const attendanceChange = calculatePercentageChange(latestAttendanceRate, previousAttendanceRate);

        return {
            checkInsToday: {
                count: checkInsTodayCount,
                change: checkInsChange.change,
                isPositive: checkInsChange.isPositive,
            },
            monthlyVisits: {
                count: monthlyVisitsCount,
                change: monthlyVisitsChange.change,
                isPositive: monthlyVisitsChange.isPositive,
            },
            monthlyRevenue: {
                gross: currentMonthEarnings.totalGrossEarnings,
                net: currentMonthEarnings.totalNetEarnings,
                change: monthlyRevenueChange.change,
                isPositive: monthlyRevenueChange.isPositive,
            },
            attendanceRate: {
                percentage: latestAttendanceRate,
                attended: latestAttendanceData.attended,
                capacity: latestAttendanceData.capacity,
                change: attendanceChange.change,
                isPositive: attendanceChange.isPositive,
            },
        };
    },
});
