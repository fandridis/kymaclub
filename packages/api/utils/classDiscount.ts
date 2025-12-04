import type { Doc, Id } from "../convex/_generated/dataModel";
import { ClassDiscountRule } from "../types/classDiscount";
import { centsToCredits } from "@repo/utils/credits";

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

export type AppliedDiscount = {
  source: "template_rule" | "instance_rule";
  discountType: DiscountType;
  creditsSaved: number; // Credits saved (consumer-facing) - the actual benefit to the user
  ruleName: string;
  reason?: string;
  appliedBy?: Id<"users">;
};

export type DiscountCalculationResult = {
  originalPrice: number; // Price in cents (for storage in database)
  finalPrice: number;    // Price in cents (for storage in database)
  appliedDiscount: AppliedDiscount | null;
};

/**
 * Check if a discount rule applies based on booking time and class start time
 * 
 * @param rule - The discount rule to evaluate
 * @param hoursUntilClass - Hours until class starts (can be negative for past classes)
 * @returns boolean indicating if the rule's condition is satisfied
 * 
 * @example
 * // hours_before_min: must book at least X hours in advance
 * doesRuleApply({ condition: { type: "hours_before_min", hours: 48 }}, 72); // true (72 >= 48)
 * doesRuleApply({ condition: { type: "hours_before_min", hours: 48 }}, 24); // false (24 < 48)
 * 
 * @example  
 * // hours_before_max: must book within X hours of class (and not past)
 * doesRuleApply({ condition: { type: "hours_before_max", hours: 24 }}, 12); // true (12 <= 24 && >= 0)
 * doesRuleApply({ condition: { type: "hours_before_max", hours: 24 }}, 48); // false (48 > 24)
 * 
 * @example
 * // always: condition is always met
 * doesRuleApply({ condition: { type: "always" }}, -10); // true (even for past classes)
 */
export function doesRuleApply(
  rule: ClassDiscountRule,
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
  rules: ClassDiscountRule[],
  hoursUntilClass: number
): { rule: ClassDiscountRule; ruleName: string } | null {
  let bestRule: ClassDiscountRule | null = null;
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
 * 
 * IMPORTANT: Returns prices in cents for database storage consistency.
 * Credit calculations are done internally but final result is in cents.
 */
export function calculateBestDiscount(
  classInstance: Doc<"classInstances">,
  template: Doc<"classTemplates">,
  context: {
    bookingTime: number;
  }
): DiscountCalculationResult {
  // Get the original price in cents (instance override or template default)
  const originalPriceInCents = classInstance.price ?? template.price ?? 1000; // Default 10.00 in business currency (cents)
  const hoursUntilClass = (classInstance.startTime - context.bookingTime) / (1000 * 60 * 60);

  // 1. Check instance-specific discount rules (override template rules)
  if (classInstance.discountRules && classInstance.discountRules.length > 0) {
    const bestInstanceRule = findBestDiscountRule(classInstance.discountRules, hoursUntilClass);

    if (bestInstanceRule) {
      // Apply discount directly in cents
      const discountAmountInCents = bestInstanceRule.rule.discount.value;
      const finalPriceInCents = Math.max(0, originalPriceInCents - discountAmountInCents);
      const centsSaved = originalPriceInCents - finalPriceInCents;

      // Convert saved amount to credits for user-facing display using utility function
      const creditsSaved = centsToCredits(centsSaved);

      return {
        originalPrice: originalPriceInCents, // Return cents for storage
        finalPrice: finalPriceInCents,       // Return cents for storage
        appliedDiscount: {
          source: "instance_rule",
          discountType: "fixed_amount",
          creditsSaved, // Credits saved for user-facing display
          ruleName: bestInstanceRule.ruleName,
        },
      };
    }
  }

  // 2. Check template discount rules (lowest priority)
  if (template.discountRules && template.discountRules.length > 0) {
    const bestTemplateRule = findBestDiscountRule(template.discountRules, hoursUntilClass);

    if (bestTemplateRule) {
      // Apply discount directly in cents
      const discountAmountInCents = bestTemplateRule.rule.discount.value;
      const finalPriceInCents = Math.max(0, originalPriceInCents - discountAmountInCents);
      const centsSaved = originalPriceInCents - finalPriceInCents;

      // Convert saved amount to credits for user-facing display using utility function
      const creditsSaved = centsToCredits(centsSaved);

      return {
        originalPrice: originalPriceInCents, // Return cents for storage
        finalPrice: finalPriceInCents,       // Return cents for storage
        appliedDiscount: {
          source: "template_rule",
          discountType: "fixed_amount",
          creditsSaved, // Credits saved for user-facing display
          ruleName: bestTemplateRule.ruleName,
        },
      };
    }
  }

  // No discounts apply - return prices in cents
  return {
    originalPrice: originalPriceInCents, // Return cents for storage
    finalPrice: originalPriceInCents,    // Return cents for storage
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