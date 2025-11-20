/**
 * TypeScript types for earnings system
 * 
 * Supports month-over-month comparison data for business dashboard
 * All earnings values are in cents for consistency with pricing system
 * 
 * Earnings calculation is revenue-based:
 * - Includes all bookings with netRevenue > 0 (finalPrice - refundAmount)
 * - Platform fee rate per booking (from business settings, default 0.20)
 * - Business earnings = netRevenue * (1 - platformFeeRate)
 * - System cut = netRevenue * platformFeeRate
 */

/**
 * Percentage change data for comparison indicators
 */
export interface ComparisonMetric {
  /** Percentage change (positive or negative) */
  change: number;
  /** Whether the change is positive (true) or negative (false) */
  isPositive: boolean;
}

/**
 * Month-over-month comparison data for dashboard indicators
 * Maps to frontend expectation: { bookings, earnings, avgPrice, allTime }
 */
export interface EarningsComparisonData {
  /** Monthly bookings count comparison */
  bookings: ComparisonMetric;
  /** Monthly net earnings comparison (in cents) */
  earnings: ComparisonMetric;
  /** Average booking price comparison (in cents) */
  avgPrice: ComparisonMetric;
  /** All-time earnings comparison (in cents) */
  allTime: ComparisonMetric;
}

/**
 * Monthly context data for analysis
 */
export interface MonthlyContext {
  /** Month in YYYY-MM format */
  month: string;
  /** Total bookings for the month */
  totalBookings: number;
  /** Net earnings for the month (in cents) */
  totalNetEarnings: number;
  /** Average price per booking (in cents) */
  avgPrice: number;
}

/**
 * Simplified booking data for earnings display
 */
export interface EarningsBooking {
  _id: string;
  status: string;
  /** Final price paid for the booking (in cents) */
  finalPrice: number;
  /** Refund amount (in cents, 0 if no refund) */
  refundAmount?: number;
  /** Platform fee rate (0.0 to 1.0, e.g., 0.20 = 20%) */
  platformFeeRate: number;
  userSnapshot?: any;
  classInstanceSnapshot?: any;
  createdAt: number;
}

/**
 * Complete earnings data with month-over-month comparison
 * Returned by getMonthlyEarnings query
 */
export interface MonthlyEarningsWithComparison {
  // Current month earnings data
  /** Total gross earnings (netRevenue) before platform fee (in cents) */
  totalGrossEarnings: number;
  /** Net earnings after platform fee (in cents) - what business receives */
  totalNetEarnings: number;
  /** Platform fee amount (in cents) */
  totalSystemCut: number;
  /** Total number of bookings with revenue (netRevenue > 0) */
  totalBookings: number;

  // All-time earnings data
  /** All-time net earnings from business creation to selected month (in cents) */
  allTimeNetEarnings: number;
  /** All-time gross earnings from business creation to selected month (in cents) */
  allTimeGrossEarnings: number;

  // Month-over-month comparison data
  /** Comparison metrics for dashboard indicators */
  comparison: EarningsComparisonData;

  // Context data for analysis
  /** Previous month context */
  previousMonth: MonthlyContext;
  /** Current month context */
  currentMonth: {
    month: string;
    avgPrice: number;
  };

  // Detailed booking data
  /** List of bookings for CSV export and table display */
  bookings: EarningsBooking[];
}

/**
 * Simplified earnings summary for multiple months
 * Used by getEarningsSummary query
 */
export interface EarningsSummary {
  month: string;
  totalGrossEarnings: number;
  totalNetEarnings: number;
  totalSystemCut: number;
  totalBookings: number;
  bookings: undefined; // Not included in summary to reduce payload
}

/**
 * Yearly earnings total for business reporting
 * Used by getYearlyEarnings query
 */
export interface YearlyEarnings {
  year: number;
  totalGrossEarnings: number;
  totalNetEarnings: number;
  totalSystemCut: number;
  totalBookings: number;
}