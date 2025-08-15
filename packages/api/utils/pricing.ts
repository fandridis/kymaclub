/**
 * Pricing utility types and interfaces
 */

export interface PricingResult {
  originalPrice: number;
  finalPrice: number;
  discountPercentage: number;
  discountAmount: number;
}

export interface PricingContext {
  hoursUntilClass: number;
  capacityUtilization: number;
  userTier: "standard" | "premium" | "vip";
  isRecurringCustomer: boolean;
  bookingCount: number;
}

export interface DynamicPricingRule {
  id: string;
  name: string;
  priceMultiplier: number;
  conditions: Array<{
    field: keyof PricingContext;
    operator: "gt" | "lt" | "eq" | "gte" | "lte";
    value: number | string;
  }>;
}

export interface DiscountRule {
  id: string;
  name: string;
  percentage: number;
  conditions: DiscountCondition[];
}

export interface DiscountCondition {
  type: "time_advance" | "capacity_utilization" | "user_tier" | "bulk_booking";
  operator: "gt" | "lt" | "eq" | "gte" | "lte";
  value: number;
}