/**
 * Dashboard metrics types for business analytics
 * 
 * These types define the structure of dashboard metrics returned by
 * the getDashboardMetrics query, including comparison data for
 * trend indicators.
 */

export interface DashboardMetrics {
    checkInsToday: MetricWithComparison;
    monthlyVisits: MetricWithComparison;
    monthlyRevenue: RevenueMetric;
    attendanceRate: AttendanceMetric;
}

export interface MetricWithComparison {
    count: number;
    change: number;
    isPositive: boolean;
}

export interface RevenueMetric {
    gross: number;
    net: number;
    change: number;
    isPositive: boolean;
}

export interface AttendanceMetric {
    percentage: number;
    attended: number;
    capacity: number;
    change: number;
    isPositive: boolean;
}

/**
 * Helper type for dashboard metric cards in the UI
 */
export interface DashboardMetricCard {
    title: string;
    value: string;
    change: string;
    changeTone: "positive" | "negative";
    helper: string;
    icon: React.ReactElement;
}
