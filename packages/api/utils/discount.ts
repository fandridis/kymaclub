import type { Doc, Id } from "../convex/_generated/dataModel";
import { nanoid } from "nanoid";

export type DiscountType = "fixed_amount" | "percentage" | "fixed_price";

/**
 * Smart discount calculation utilities
 * Always gives customers the best available price (no discount stacking)
 */

export type DiscountRule = {
  id: string;
  name: string;
  condition: {
    type: "hours_before_min" | "hours_before_max" | "always";
    hours?: number;
  };
  discount: {
    type: DiscountType;
    value: number;
  };
  isActive: boolean;
  createdAt: number;
  createdBy: Id<"users">;
};

export type ManualDiscount = {
  type: DiscountType;
  value: number;
  reason?: string;
  appliedBy: Id<"users">;
  appliedAt: number;
  isActive: boolean;
};

export type AppliedDiscount = {
  source: "template_rule" | "manual_override";
  type: DiscountType;
  value: number;
  creditsSaved: number;
  ruleId?: string;
  ruleName?: string;
  reason?: string;
  appliedBy?: Id<"users">;
};

export type DiscountCalculationResult = {
  originalPrice: number;
  finalPrice: number;
  appliedDiscount: AppliedDiscount | null;
};

/**
 * Check if a discount rule's condition is met
 */
function matchesCondition(
  rule: DiscountRule,
  classStartTime: number,
  bookingTime: number
): boolean {
  const hoursUntilClass = (classStartTime - bookingTime) / (1000 * 60 * 60);

  switch (rule.condition.type) {
    case "hours_before_min":
      // Early bird: must book at least X hours before
      return hoursUntilClass >= (rule.condition.hours ?? 0);
    case "hours_before_max":
      // Last minute: must book within X hours before
      return hoursUntilClass <= (rule.condition.hours ?? 0);
    case "always":
      // Always applies
      return true;
    default:
      return false;
  }
}

/**
 * Apply a discount to a price
 */
function applyDiscountToPrice(
  originalPrice: number,
  discount: { type: DiscountType; value: number }
): number {
  switch (discount.type) {
    case "fixed_amount":
      // originalPrice - discount.value (e.g., 10 - 2 = 8)
      return Math.max(0, originalPrice - discount.value);
    case "percentage":
      // originalPrice * (1 - discount.value) (e.g., 10 * (1 - 0.40) = 6)
      return Math.max(0, originalPrice * (1 - discount.value));
    case "fixed_price":
      // Set final price to discount.value (e.g., 10 → 2 = 2)
      return Math.max(0, discount.value);
    default:
      return originalPrice;
  }
}

/**
 * Calculate the best available discount for a booking
 * Always gives the customer the lowest possible price
 */
export function calculateBestDiscount(
  classInstance: Doc<"classInstances">,
  template: Doc<"classTemplates">,
  bookingTime: number
): DiscountCalculationResult {
  // Get the original price (instance override or template default)
  const originalPrice = classInstance.baseCredits ?? template.baseCredits;

  // 1. Manual instance override always wins (business decision)
  if (classInstance.manualDiscount?.isActive) {
    const finalPrice = applyDiscountToPrice(originalPrice, classInstance.manualDiscount);
    const creditsSaved = originalPrice - finalPrice;

    return {
      originalPrice,
      finalPrice,
      appliedDiscount: {
        source: "manual_override",
        type: classInstance.manualDiscount.type,
        value: classInstance.manualDiscount.value,
        creditsSaved,
        reason: classInstance.manualDiscount.reason,
        appliedBy: classInstance.manualDiscount.appliedBy,
      },
    };
  }

  // 2. Find ALL applicable template rules
  const applicableRules =
    template.discountRules?.filter(
      (rule) => rule.isActive && matchesCondition(rule, classInstance.startTime, bookingTime)
    ) || [];

  if (applicableRules.length === 0) {
    // No discounts apply
    return {
      originalPrice,
      finalPrice: originalPrice,
      appliedDiscount: null,
    };
  }

  // 3. Calculate final price for each rule and pick the LOWEST
  const discountOptions = applicableRules.map((rule) => ({
    finalPrice: applyDiscountToPrice(originalPrice, rule.discount),
    rule: rule,
  }));

  // 4. Return the option with the lowest final price (best for customer)
  const bestOption = discountOptions.reduce((best, current) =>
    current.finalPrice < best.finalPrice ? current : best
  );

  const creditsSaved = originalPrice - bestOption.finalPrice;

  return {
    originalPrice,
    finalPrice: bestOption.finalPrice,
    appliedDiscount: {
      source: "template_rule",
      type: bestOption.rule.discount.type,
      value: bestOption.rule.discount.value,
      creditsSaved,
      ruleId: bestOption.rule.id,
      ruleName: bestOption.rule.name,
    },
  };
}

/**
 * Utility to create a discount rule ID
 */
export function generateDiscountRuleId(type: string): string {
  return `${type}_${Date.now()}_${nanoid(8)}`;
}

/**
 * Utility to validate discount rule values
 */
export function validateDiscountRule(rule: Partial<DiscountRule>): string[] {
  const errors: string[] = [];

  if (!rule.name?.trim()) {
    errors.push("Discount name is required");
  }

  if (!rule.condition?.type) {
    errors.push("Discount condition type is required");
  }

  if (rule.condition?.type !== "always" && typeof rule.condition?.hours !== "number") {
    errors.push("Hours value is required for time-based conditions");
  }

  if (rule.condition?.hours !== undefined && rule.condition.hours < 0) {
    errors.push("Hours value must be non-negative");
  }

  if (!rule.discount?.type) {
    errors.push("Discount type is required");
  }

  if (typeof rule.discount?.value !== "number") {
    errors.push("Discount value is required");
  }

  if (rule.discount?.value !== undefined) {
    switch (rule.discount.type) {
      case "percentage":
        if (rule.discount.value < 0 || rule.discount.value > 1) {
          errors.push("Percentage discount must be between 0 and 1 (e.g., 0.20 for 20%)");
        }
        break;
      case "fixed_amount":
      case "fixed_price":
        if (rule.discount.value < 0) {
          errors.push("Discount value must be non-negative");
        }
        break;
    }
  }

  return errors;
}

/**
 * Utility to validate manual discount values
 */
export function validateManualDiscount(discount: Partial<ManualDiscount>): string[] {
  const errors: string[] = [];

  if (!discount.type) {
    errors.push("Discount type is required");
  }

  if (typeof discount.value !== "number") {
    errors.push("Discount value is required");
  }

  if (discount.value !== undefined) {
    switch (discount.type) {
      case "percentage":
        if (discount.value < 0 || discount.value > 1) {
          errors.push("Percentage discount must be between 0 and 1 (e.g., 0.50 for 50%)");
        }
        break;
      case "fixed_amount":
      case "fixed_price":
        if (discount.value < 0) {
          errors.push("Discount value must be non-negative");
        }
        break;
    }
  }

  return errors;
}