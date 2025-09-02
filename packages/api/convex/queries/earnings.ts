import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { ConvexError } from "convex/values";
import type { ComparisonMetric, EarningsComparisonData, MonthlyEarningsWithComparison, EarningsSummary, YearlyEarnings } from "../../types/earnings";

/**
 * Helper function to calculate percentage change between two values
 * Handles edge cases like division by zero
 */
function calculatePercentageChange(current: number, previous: number): ComparisonMetric {
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
 * Helper function to calculate average booking price
 * Handles division by zero
 */
function calculateAveragePrice(totalEarnings: number, totalBookings: number): number {
  return totalBookings > 0 ? Math.round(totalEarnings / totalBookings) : 0;
}

/**
 * Get earnings data for a specific month
 * Used internally by getMonthlyEarnings for both current and previous month
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
  bookings?: any[];
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
      bookings: []
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
      bookings: []
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
    bookings: completedBookings
  };
}

/**
 * Comprehensive earnings query for business dashboard with month-over-month comparison
 * 
 * Business Rules Applied:
 * - CR-003: 20% system cut on all transactions
 * - Only completed bookings count toward earnings
 * - Supports month filtering in YYYY-MM format
 * - Efficient queries using database indexes
 * 
 * Returns earnings data with proper business calculations:
 * - Gross earnings: Sum of all finalPrice for completed bookings (in cents)
 * - Net earnings: Gross * 0.8 (what business actually receives, in cents)
 * - System cut: Gross * 0.2 (platform fee, in cents)
 * - Detailed booking list for CSV export and table display
 * - Month-over-month comparison data for dashboard indicators
 * - All-time earnings total from business creation to selected month
 */
export const getMonthlyEarnings = query({
  args: {
    businessId: v.id("businesses"),
    month: v.string(), // Format: "YYYY-MM" (e.g., "2024-01")
  },
  handler: async (ctx, args) => {
    // Authenticate and validate business access
    const user = await getAuthenticatedUserOrThrow(ctx);
    
    // Validate user belongs to the requested business
    if (user.businessId !== args.businessId) {
      throw new ConvexError({
        message: "Access denied: User does not belong to this business",
        code: "AUTHORIZATION_ERROR"
      });
    }

    // Parse and validate month format
    const monthRegex = /^(\d{4})-(\d{2})$/;
    const monthMatch = args.month.match(monthRegex);
    
    if (!monthMatch) {
      throw new ConvexError({
        message: "Invalid month format. Use YYYY-MM (e.g., '2024-01')",
        code: "VALIDATION_ERROR",
        field: "month"
      });
    }

    const year = parseInt(monthMatch[1]);
    const month = parseInt(monthMatch[2]);
    
    // Validate month range
    if (month < 1 || month > 12) {
      throw new ConvexError({
        message: "Month must be between 01 and 12",
        code: "VALIDATION_ERROR",
        field: "month"
      });
    }

    // Get current month earnings data
    const currentMonthData = await getMonthEarningsData(ctx, args.businessId, args.month);
    
    // Calculate previous month string
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const previousMonthString = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
    
    // Get previous month earnings data for comparison
    const previousMonthData = await getMonthEarningsData(ctx, args.businessId, previousMonthString);
    
    // Get business creation date for all-time earnings calculation
    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new ConvexError({
        message: "Business not found",
        code: "NOT_FOUND"
      });
    }
    
    // Calculate all-time earnings (from business creation to end of selected month)
    const allTimeStart = business.createdAt;
    const selectedMonthEnd = new Date(year, month, 1).getTime(); // Start of next month
    
    const allTimeBookings = await ctx.db
      .query("bookings")
      .withIndex("by_business_created", (q) =>
        q.eq("businessId", args.businessId)
          .gte("createdAt", allTimeStart)
      )
      .filter((q) => q.and(
        q.lt(q.field("createdAt"), selectedMonthEnd),
        q.eq(q.field("status"), "completed"),
        q.neq(q.field("deleted"), true)
      ))
      .collect();
    
    const allTimeGrossEarnings = allTimeBookings.reduce(
      (sum, booking) => sum + booking.finalPrice, 
      0
    );
    const systemCutRate = 0.20;
    const allTimeNetEarnings = allTimeGrossEarnings - Math.round(allTimeGrossEarnings * systemCutRate);
    
    // Calculate comparison metrics
    const currentAvgPrice = calculateAveragePrice(currentMonthData.totalNetEarnings, currentMonthData.totalBookings);
    const previousAvgPrice = calculateAveragePrice(previousMonthData.totalNetEarnings, previousMonthData.totalBookings);
    
    // Calculate percentage changes for comparison indicators
    const bookingsComparison = calculatePercentageChange(currentMonthData.totalBookings, previousMonthData.totalBookings);
    const earningsComparison = calculatePercentageChange(currentMonthData.totalNetEarnings, previousMonthData.totalNetEarnings);
    const avgPriceComparison = calculatePercentageChange(currentAvgPrice, previousAvgPrice);
    
    // For all-time comparison, compare current month's contribution to previous month's contribution
    // Get previous month's all-time total to see the change
    const prevMonthEnd = new Date(prevYear, prevMonth, 1).getTime();
    const prevAllTimeBookings = await ctx.db
      .query("bookings")
      .withIndex("by_business_created", (q) =>
        q.eq("businessId", args.businessId)
          .gte("createdAt", allTimeStart)
      )
      .filter((q) => q.and(
        q.lt(q.field("createdAt"), prevMonthEnd),
        q.eq(q.field("status"), "completed"),
        q.neq(q.field("deleted"), true)
      ))
      .collect();
    
    const prevAllTimeGrossEarnings = prevAllTimeBookings.reduce(
      (sum, booking) => sum + booking.finalPrice, 
      0
    );
    const prevAllTimeNetEarnings = prevAllTimeGrossEarnings - Math.round(prevAllTimeGrossEarnings * systemCutRate);
    
    const allTimeComparison = calculatePercentageChange(allTimeNetEarnings, prevAllTimeNetEarnings);
    
    // Prepare comparison data for frontend
    const comparisonData = {
      bookings: bookingsComparison,
      earnings: earningsComparison,
      avgPrice: avgPriceComparison,
      allTime: allTimeComparison
    };

    // Return structured earnings data with month-over-month comparison
    return {
      // Current month data
      totalGrossEarnings: currentMonthData.totalGrossEarnings,
      totalNetEarnings: currentMonthData.totalNetEarnings,
      totalSystemCut: currentMonthData.totalSystemCut,
      totalBookings: currentMonthData.totalBookings,
      
      // All-time earnings data
      allTimeNetEarnings,
      allTimeGrossEarnings,
      
      // Month-over-month comparison data for dashboard indicators
      comparison: comparisonData,
      
      // Additional context for debugging/analysis
      previousMonth: {
        month: previousMonthString,
        totalBookings: previousMonthData.totalBookings,
        totalNetEarnings: previousMonthData.totalNetEarnings,
        avgPrice: previousAvgPrice
      },
      
      currentMonth: {
        month: args.month,
        avgPrice: currentAvgPrice
      },
      
      // Detailed booking list for CSV export and table display
      bookings: (currentMonthData.bookings || []).map(booking => ({
        _id: booking._id,
        status: booking.status,
        finalPrice: booking.finalPrice,
        userSnapshot: booking.userSnapshot || undefined,
        classInstanceSnapshot: booking.classInstanceSnapshot || undefined,
        createdAt: booking.createdAt,
      }))
    };
  },
});

/**
 * Get earnings summary for multiple months
 * Used for dashboard overview and trend analysis
 */
export const getEarningsSummary = query({
  args: {
    businessId: v.id("businesses"),
    months: v.array(v.string()), // Array of "YYYY-MM" strings
  },
  handler: async (ctx, args) => {
    // Authenticate and validate business access
    const user = await getAuthenticatedUserOrThrow(ctx);
    
    if (user.businessId !== args.businessId) {
      throw new ConvexError({
        message: "Access denied: User does not belong to this business",
        code: "AUTHORIZATION_ERROR"
      });
    }

    // Validate month limit to prevent excessive queries
    if (args.months.length > 12) {
      throw new ConvexError({
        message: "Cannot request more than 12 months at once",
        code: "VALIDATION_ERROR",
        field: "months"
      });
    }

    // Get earnings for each month by implementing the logic directly
    const monthlyEarnings = [];
    
    for (const month of args.months) {
      try {
        // Parse month format - reuse validation logic
        const monthRegex = /^(\d{4})-(\d{2})$/;
        const monthMatch = month.match(monthRegex);
        
        if (!monthMatch) {
          console.warn(`Skipping invalid month format: ${month}`);
          continue;
        }

        const year = parseInt(monthMatch[1]);
        const monthNum = parseInt(monthMatch[2]);
        
        if (monthNum < 1 || monthNum > 12) {
          console.warn(`Skipping invalid month number: ${monthNum}`);
          continue;
        }

        // Calculate month timestamps
        const monthStart = new Date(year, monthNum - 1, 1).getTime();
        const monthEnd = new Date(year, monthNum, 1).getTime();
        
        // Query bookings for this month
        const monthBookings = await ctx.db
          .query("bookings")
          .withIndex("by_business_created", (q) =>
            q.eq("businessId", args.businessId)
              .gte("createdAt", monthStart)
          )
          .filter((q) => q.and(
            q.lt(q.field("createdAt"), monthEnd),
            q.eq(q.field("status"), "completed"),
            q.neq(q.field("deleted"), true)
          ))
          .collect();

        // Calculate earnings (finalPrice now in cents)
        const totalGrossEarnings = monthBookings.reduce(
          (sum, booking) => sum + booking.finalPrice, 
          0
        );

        const systemCutRate = 0.20;
        const totalSystemCut = Math.round(totalGrossEarnings * systemCutRate);
        const totalNetEarnings = totalGrossEarnings - totalSystemCut;
        const totalBookings = monthBookings.length;

        monthlyEarnings.push({
          month,
          totalGrossEarnings,
          totalNetEarnings,
          totalSystemCut,
          totalBookings,
          // Don't include individual bookings in summary to reduce payload
          bookings: undefined
        });
      } catch (error) {
        // Skip invalid months, don't fail entire request
        console.warn(`Skipping month ${month} due to error:`, error);
        continue;
      }
    }

    return monthlyEarnings;
  },
});

/**
 * Get yearly earnings total for business reporting
 */
export const getYearlyEarnings = query({
  args: {
    businessId: v.id("businesses"),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    // Authenticate and validate business access
    const user = await getAuthenticatedUserOrThrow(ctx);
    
    if (user.businessId !== args.businessId) {
      throw new ConvexError({
        message: "Access denied: User does not belong to this business",
        code: "AUTHORIZATION_ERROR"
      });
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (args.year < 2020 || args.year > currentYear + 1) {
      throw new ConvexError({
        message: `Year must be between 2020 and ${currentYear + 1}`,
        code: "VALIDATION_ERROR",
        field: "year"
      });
    }

    // Calculate year start and end timestamps
    const yearStart = new Date(args.year, 0, 1).getTime(); // January 1st
    const yearEnd = new Date(args.year + 1, 0, 1).getTime(); // Next January 1st

    // Query all completed bookings for the year
    const yearlyBookings = await ctx.db
      .query("bookings")
      .withIndex("by_business_created", (q) =>
        q.eq("businessId", args.businessId)
          .gte("createdAt", yearStart)
      )
      .filter((q) => q.and(
        q.lt(q.field("createdAt"), yearEnd),
        q.eq(q.field("status"), "completed"),
        q.neq(q.field("deleted"), true)
      ))
      .collect();

    // Calculate yearly totals (finalPrice now in cents)
    const totalGrossEarnings = yearlyBookings.reduce(
      (sum, booking) => sum + booking.finalPrice, 
      0
    );

    const systemCutRate = 0.20;
    const totalSystemCut = Math.round(totalGrossEarnings * systemCutRate);
    const totalNetEarnings = totalGrossEarnings - totalSystemCut;
    const totalBookings = yearlyBookings.length;

    return {
      year: args.year,
      totalGrossEarnings,
      totalNetEarnings,
      totalSystemCut,
      totalBookings,
    };
  },
});