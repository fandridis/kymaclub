import type { Doc } from "../convex/_generated/dataModel";

/**
 * Flexible Discount System Overview:
 * 
 * The discount system now allows businesses to define custom discount rules:
 * 
 * 1. TEMPLATE DISCOUNT RULES: Flexible array of discount rules with custom time thresholds
 *    - hours_before_min: Discount if booked at least X hours before class starts (early bird)
 *    - hours_before_max: Discount if booked at most X hours before class starts (last minute)
 *    - always: Discount that always applies (general discount)
 *    - Each rule has: id, name, condition, discount, isActive, audit fields
 * 
 * 2. INSTANCE DISCOUNT RULES: Instance-specific rules that override template rules
 *    - Same structure as template rules but can override specific instances
 * 
 * Priority order: Instance rules > Template rules
 */

export type DiscountType = "fixed_amount";

export type DiscountConditionType = "hours_before_min" | "hours_before_max" | "always";

export type DiscountRule = {
  id: string;
  name: string;
  condition: {
    type: DiscountConditionType;
    hours?: number;
  };
  discount: {
    type: DiscountType;
    value: number; // Credits off
  };
  createdAt: number;
  createdBy: string;
  updatedAt?: number;
  updatedBy?: string;
};

export type AppliedDiscount = {
  source: "template_rule" | "instance_rule";
  discountType: DiscountType;
  discountValue: number;
  creditsSaved: number;
  ruleName: string;
  reason?: string;
  appliedBy?: string;
};

export type DiscountCalculationResult = {
  originalPrice: number;
  finalPrice: number;
  appliedDiscount: AppliedDiscount | null;
};

/**
 * Apply a fixed amount discount to a price
 */
function applyDiscountToPrice(
  originalPrice: number,
  discountValue: number
): number {
  // originalPrice - discountValue (e.g., 10 - 2 = 8)
  return Math.max(0, originalPrice - discountValue);
}

/**
 * Check if a discount rule applies based on booking time and class start time
 */
function doesRuleApply(
  rule: DiscountRule,
  hoursUntilClass: number
): boolean {
  switch (rule.condition.type) {
    case "hours_before_min":
      // Early bird: discount if booked at least X hours before class
      return rule.condition.hours !== undefined && hoursUntilClass >= rule.condition.hours;
    case "hours_before_max":
      // Last minute: discount if booked at most X hours before class
      return rule.condition.hours !== undefined && hoursUntilClass <= rule.condition.hours && hoursUntilClass >= 0;
    case "always":
      // Always applies
      return true;
    default:
      return false;
  }
}

/**
 * Find the best applicable discount rule from a list of rules
 */
function findBestDiscountRule(
  rules: DiscountRule[],
  hoursUntilClass: number
): { rule: DiscountRule; ruleName: string } | null {
  let bestRule: DiscountRule | null = null;
  let bestRuleName = "";
  let bestDiscountValue = 0;

  for (const rule of rules) {
    if (doesRuleApply(rule, hoursUntilClass) && rule.discount.value > bestDiscountValue) {
      bestRule = rule;
      bestDiscountValue = rule.discount.value;
      bestRuleName = rule.name;
    }
  }

  return bestRule ? { rule: bestRule, ruleName: bestRuleName } : null;
}

/**
 * Calculate the best available discount for a booking
 * Priority: Instance rules > Template rules
 */
export function calculateBestDiscount(
  classInstance: Doc<"classInstances">,
  template: Doc<"classTemplates">,
  context: {
    bookingTime: number;
  }
): DiscountCalculationResult {
  // Get the original price (instance override or template default)
  const originalPrice = classInstance.baseCredits ?? template.baseCredits;
  const hoursUntilClass = (classInstance.startTime - context.bookingTime) / (1000 * 60 * 60);

  // 1. Check instance-specific discount rules (override template rules)
  if (classInstance.discountRules && classInstance.discountRules.length > 0) {
    const bestInstanceRule = findBestDiscountRule(classInstance.discountRules, hoursUntilClass);

    if (bestInstanceRule) {
      const finalPrice = applyDiscountToPrice(originalPrice, bestInstanceRule.rule.discount.value);
      const creditsSaved = originalPrice - finalPrice;

      return {
        originalPrice,
        finalPrice,
        appliedDiscount: {
          source: "instance_rule",
          discountType: "fixed_amount",
          discountValue: bestInstanceRule.rule.discount.value,
          creditsSaved,
          ruleName: bestInstanceRule.ruleName,
        },
      };
    }
  }

  // 2. Check template discount rules (lowest priority)
  if (template.discountRules && template.discountRules.length > 0) {
    const bestTemplateRule = findBestDiscountRule(template.discountRules, hoursUntilClass);

    if (bestTemplateRule) {
      const finalPrice = applyDiscountToPrice(originalPrice, bestTemplateRule.rule.discount.value);
      const creditsSaved = originalPrice - finalPrice;

      return {
        originalPrice,
        finalPrice,
        appliedDiscount: {
          source: "template_rule",
          discountType: "fixed_amount",
          discountValue: bestTemplateRule.rule.discount.value,
          creditsSaved,
          ruleName: bestTemplateRule.ruleName,
        },
      };
    }
  }

  // No discounts apply
  return {
    originalPrice,
    finalPrice: originalPrice,
    appliedDiscount: null,
  };
}

/**
 * Get all applicable discounts for a class instance (for display purposes)
 */
export function getApplicableDiscounts(
  classInstance: Doc<"classInstances">,
  template: Doc<"classTemplates">,
  context: {
    bookingTime: number;
  }
): Array<{
  type: "instance_rule" | "template_rule";
  discountType: DiscountType;
  value: number;
  ruleName: string;
  reason?: string;
  applies: boolean;
  ruleDetails?: {
    conditionType: DiscountConditionType;
    hours?: number;
  };
}> {
  const discounts: Array<{
    type: "instance_rule" | "template_rule";
    discountType: DiscountType;
    value: number;
    ruleName: string;
    reason?: string;
    applies: boolean;
    ruleDetails?: {
      conditionType: DiscountConditionType;
      hours?: number;
    };
  }> = [];

  const hoursUntilClass = (classInstance.startTime - context.bookingTime) / (1000 * 60 * 60);

  // Instance-specific discount rules
  if (classInstance.discountRules && classInstance.discountRules.length > 0) {
    for (const rule of classInstance.discountRules) {
      const applies = doesRuleApply(rule, hoursUntilClass);
      discounts.push({
        type: "instance_rule",
        discountType: "fixed_amount",
        value: rule.discount.value,
        ruleName: rule.name,
        applies,
        ruleDetails: {
          conditionType: rule.condition.type,
          hours: rule.condition.hours,
        },
      });
    }
  }

  // Template discount rules
  if (template.discountRules && template.discountRules.length > 0) {
    for (const rule of template.discountRules) {
      const applies = doesRuleApply(rule, hoursUntilClass);
      discounts.push({
        type: "template_rule",
        discountType: "fixed_amount",
        value: rule.discount.value,
        ruleName: rule.name,
        applies,
        ruleDetails: {
          conditionType: rule.condition.type,
          hours: rule.condition.hours,
        },
      });
    }
  }

  return discounts;
}