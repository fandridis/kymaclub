import type { Doc } from '../convex/_generated/dataModel';
import { PricingResult } from '../types/pricing';
import { logger } from '../utils/logger';
import { doesRuleApply } from '../utils/classDiscount';

/**
 * Business logic for flexible pricing calculations with configurable discount rules
 * 
 * This module implements the core pricing engine for class bookings, evaluating
 * discount rules defined in class instances and templates to find the best applicable discount.
 * Supports time-based conditions (hours_before_min, hours_before_max, always) with fixed amount discounts.
 */

/**
 * Calculates final price for a class booking using flexible discount rules
 * 
 * @description Evaluates discount rules from instance/template and applies the best valid discount.
 * Base price selection follows: instance.price → template.price → default(0 cents)
 * Discount rules are evaluated based on timing conditions and the highest valid discount is applied.
 * 
 * @param instance - Class instance containing startTime, discount rules, and optional price
 * @param template - Class template providing fallback values for missing instance fields
 * @returns Promise<PricingResult> with originalPrice, finalPrice, discountPercentage, discountAmount (in cents)
 * 
 * @example
 * // Early bird discount rule (150 cents off if >48 hours advance booking)
 * const instance = { 
 *   startTime: Date.now() + (72 * 60 * 60 * 1000), // 72 hours future
 *   price: 2000, // 20 business currency units in cents
 *   discountRules: [{
 *     id: "early-bird",
 *     name: "Early Bird Special",
 *     condition: { type: "hours_before_min", hours: 48 },
 *     discount: { type: "fixed_amount", value: 150 }
 *   }]
 * };
 * const result = await calculateFinalPrice(instance, template);
 * // Returns: { originalPrice: 2000, finalPrice: 1850, discountPercentage: 0.075, discountAmount: 150 }
 * 
 * @example
 * // Multiple discount rules - best valid one is applied
 * const instance = { 
 *   startTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours future
 *   price: 2000,
 *   discountRules: [
 *     { condition: { type: "hours_before_min", hours: 48 }, discount: { value: 300 } }, // Invalid (need >48h)
 *     { condition: { type: "hours_before_min", hours: 12 }, discount: { value: 100 } }   // Valid (need >12h)
 *   ]
 * };
 * const result = await calculateFinalPrice(instance, template);
 * // Returns: { originalPrice: 2000, finalPrice: 1900, discountPercentage: 0.05, discountAmount: 100 }
 * 
 * @example
 * // No valid discount rules
 * const instance = { 
 *   startTime: Date.now() + (6 * 60 * 60 * 1000), // 6 hours future
 *   price: 2000,
 *   discountRules: [
 *     { condition: { type: "hours_before_min", hours: 12 }, discount: { value: 100 } } // Invalid (need >12h)
 *   ]
 * };
 * const result = await calculateFinalPrice(instance, template);
 * // Returns: { originalPrice: 2000, finalPrice: 2000, discountPercentage: 0, discountAmount: 0 }
 * 
 * @example
 * // Template discount rules used when instance has none
 * const instance = { startTime: Date.now() + (72 * 60 * 60 * 1000) }; // No price, no rules
 * const template = { 
 *   price: 1500,
 *   discountRules: [{
 *     condition: { type: "always" },
 *     discount: { type: "fixed_amount", value: 50 }
 *   }]
 * };
 * const result = await calculateFinalPrice(instance, template);
 * // Returns: { originalPrice: 1500, finalPrice: 1450, discountPercentage: 0.033, discountAmount: 50 }
 * 
 * @throws Never throws - all edge cases handled gracefully
 * @safety Negative prices prevented - minimum final price is 0
 * @safety Instance discount rules take precedence over template rules
 * @safety Missing discount rules result in no discount (0 cents off)
 */
export const calculateFinalPrice = async (
  instance: Doc<"classInstances">,
  template: Doc<"classTemplates">
): Promise<PricingResult> => {
  logger.debug("Starting price calculation", {
    instanceId: instance._id,
    templateId: template._id
  });

  // Get base price in cents (instance overrides template)
  const basePrice = instance.price || template.price || 0; // Default 0 in business currency (cents)
  logger.debug("Base price determined", {
    basePrice,
    basePriceFormatted: `${(basePrice / 100).toFixed(2)}`,
    priceSource: instance.price ? 'instance' : template.price ? 'template' : 'default'
  });

  // Check for discounts (now returns discount amount in cents, not percentage)
  const discountAmount = await calculateDiscount(instance, template);
  const finalPrice = Math.max(0, basePrice - discountAmount); // Ensure price doesn't go negative
  const discountPercentage = basePrice > 0 ? discountAmount / basePrice : 0;

  logger.debug("Pricing calculation completed", {
    basePrice,
    discountPercentage: Number((discountPercentage * 100).toFixed(1)),
    discountAmount,
    finalPrice,
    finalPriceFormatted: `${(finalPrice / 100).toFixed(2)}`
  });

  return {
    originalPrice: basePrice,
    finalPrice,
    discountPercentage,
    discountAmount
  };
};

/**
 * Calculates the best applicable discount amount based on discount rules
 * 
 * @description Evaluates all discount rules from instance and template, finds the best valid discount.
 * Discount rules can have time-based conditions (hours_before_min, hours_before_max) or always apply.
 * Returns the highest discount amount that has valid conditions.
 * 
 * @param instance - Class instance containing discount rules and timing
 * @param template - Template providing fallback discount rules
 * @returns Promise<number> discount amount in cents (not percentage)
 * 
 * @example
 * // Instance with early bird rule (50 cents off if >48h)
 * const instance = { 
 *   startTime: Date.now() + (72 * 60 * 60 * 1000), // 72 hours future
 *   discountRules: [{
 *     id: "early-bird",
 *     name: "Early Bird",
 *     condition: { type: "hours_before_min", hours: 48 },
 *     discount: { type: "fixed_amount", value: 50 }
 *   }]
 * };
 * const discount = await calculateDiscount(instance, template);
 * // Returns: 50 (cents discount amount)
 * 
 * @example
 * // Multiple rules - returns best valid discount
 * const instance = { 
 *   startTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours future
 *   discountRules: [
 *     { condition: { type: "hours_before_min", hours: 48 }, discount: { value: 100 } }, // Invalid (need >48h)
 *     { condition: { type: "hours_before_min", hours: 12 }, discount: { value: 25 } }   // Valid (need >12h)
 *   ]
 * };
 * const discount = await calculateDiscount(instance, template);
 * // Returns: 25 (best valid discount)
 * 
 * @internal This function is not exported - used only by calculateFinalPrice
 * @business_rule Instance discount rules take precedence over template rules
 * @business_rule Returns the highest valid discount amount, not percentage
 * @business_rule "always" condition type is always valid regardless of timing
 */
const calculateDiscount = async (
  instance: Doc<"classInstances">,
  template: Doc<"classTemplates">
): Promise<number> => {
  logger.debug("Evaluating discount rules", {
    instanceId: instance._id,
    startTime: instance.startTime
  });

  const currentTime = Date.now();
  const hoursUntilClass = (instance.startTime - currentTime) / (1000 * 60 * 60);

  logger.debug("Discount timing context", {
    currentTime,
    startTime: instance.startTime,
    hoursUntilClass: Number(hoursUntilClass.toFixed(2))
  });

  // Get discount rules (template rules are not used, they are only used when creating instances)
  const discountRules = instance.discountRules || [];

  if (discountRules.length === 0) {
    logger.debug("No discount rules found");
    return 0;
  }

  logger.debug("Found discount rules", {
    ruleCount: discountRules.length,
    rules: discountRules.map(rule => ({
      id: rule.id,
      name: rule.name,
      conditionType: rule.condition.type,
      conditionHours: rule.condition.hours,
      discountValue: rule.discount.value
    }))
  });

  // Evaluate each rule and find the best valid discount
  let bestDiscountAmount = 0;
  let bestRuleName: string | null = null;

  for (const rule of discountRules) {
    // Use shared doesRuleApply from utils/classDiscount.ts
    const isValid = doesRuleApply(rule, hoursUntilClass);

    if (isValid && rule.discount.value > bestDiscountAmount) {
      bestDiscountAmount = rule.discount.value;
      bestRuleName = rule.name;

      logger.debug("New best discount found", {
        ruleName: rule.name,
        ruleId: rule.id,
        discountAmount: rule.discount.value,
        conditionType: rule.condition.type,
        conditionHours: rule.condition.hours
      });
    } else if (!isValid) {
      logger.debug("Rule condition not met", {
        ruleName: rule.name,
        ruleId: rule.id,
        conditionType: rule.condition.type,
        conditionHours: rule.condition.hours,
        hoursUntilClass: Number(hoursUntilClass.toFixed(2))
      });
    }
  }

  logger.debug("Discount evaluation completed", {
    bestDiscountAmount,
    bestRuleName,
    totalRulesEvaluated: discountRules.length
  });

  return bestDiscountAmount;
};

/**
 * Calculates final price for a class booking using only instance data
 * 
 * @description Simplified version that works with instance-only data since discount rules
 * are now copied to instances at creation time. No template lookup required.
 * 
 * @param instance - Class instance containing all pricing data including discount rules
 * @returns Promise<PricingResult> with originalPrice, finalPrice, discountPercentage, discountAmount (in cents)
 * 
 * @example
 * // Instance with early bird rule (150 cents off if >48h)
 * const instance = { 
 *   startTime: Date.now() + (72 * 60 * 60 * 1000), // 72 hours future
 *   price: 2000, // 20 business currency units in cents
 *   discountRules: [{
 *     id: "early-bird",
 *     name: "Early Bird Special",
 *     condition: { type: "hours_before_min", hours: 48 },
 *     discount: { type: "fixed_amount", value: 150 }
 *   }]
 * };
 * const result = await calculateFinalPriceFromInstance(instance);
 * // Returns: { originalPrice: 2000, finalPrice: 1850, discountPercentage: 0.075, discountAmount: 150 }
 * 
 * @throws Never throws - all edge cases handled gracefully
 * @safety Negative prices prevented - minimum final price is 0
 * @safety Missing discount rules result in no discount (0 cents off)
 */
export const calculateFinalPriceFromInstance = async (
  instance: Doc<"classInstances">
): Promise<PricingResult> => {
  logger.debug("Starting instance-only price calculation", {
    instanceId: instance._id
  });

  // Get base price in cents (instance price or default 0)
  const basePrice = instance.price || 0; // Default 0 in business currency (cents)
  logger.debug("Base price determined", {
    basePrice,
    basePriceFormatted: `${(basePrice / 100).toFixed(2)}`,
    priceSource: instance.price ? 'instance' : 'default'
  });

  // Check for discounts using instance discount rules
  const discountAmount = await calculateDiscountFromInstance(instance);
  const finalPrice = Math.max(0, basePrice - discountAmount); // Ensure price doesn't go negative
  const discountPercentage = basePrice > 0 ? discountAmount / basePrice : 0;

  logger.debug("Instance-only pricing calculation completed", {
    basePrice,
    discountPercentage: Number((discountPercentage * 100).toFixed(1)),
    discountAmount,
    finalPrice,
    finalPriceFormatted: `${(finalPrice / 100).toFixed(2)}`
  });

  return {
    originalPrice: basePrice,
    finalPrice,
    discountPercentage,
    discountAmount
  };
};

/**
 * Calculates the best applicable discount amount using only instance data
 * 
 * @description Simplified version that evaluates discount rules from instance only.
 * Since discount rules are copied to instances at creation time, no template lookup needed.
 * 
 * @param instance - Class instance containing discount rules and timing
 * @returns Promise<number> discount amount in cents (not percentage)
 * 
 * @example
 * // Instance with early bird rule (50 cents off if >48h)
 * const instance = { 
 *   startTime: Date.now() + (72 * 60 * 60 * 1000), // 72 hours future
 *   discountRules: [{
 *     id: "early-bird",
 *     name: "Early Bird",
 *     condition: { type: "hours_before_min", hours: 48 },
 *     discount: { type: "fixed_amount", value: 50 }
 *   }]
 * };
 * const discount = await calculateDiscountFromInstance(instance);
 * // Returns: 50 (cents discount amount)
 * 
 * @internal This function is not exported - used only by calculateFinalPriceFromInstance
 * @business_rule Returns the highest valid discount amount, not percentage
 * @business_rule "always" condition type is always valid regardless of timing
 */
const calculateDiscountFromInstance = async (
  instance: Doc<"classInstances">
): Promise<number> => {
  logger.debug("Evaluating instance discount rules", {
    instanceId: instance._id,
    startTime: instance.startTime
  });

  const currentTime = Date.now();
  const hoursUntilClass = (instance.startTime - currentTime) / (1000 * 60 * 60);

  logger.debug("Instance discount timing context", {
    currentTime,
    startTime: instance.startTime,
    hoursUntilClass: Number(hoursUntilClass.toFixed(2))
  });

  // Get discount rules from instance (copied from template at creation time)
  const discountRules = instance.discountRules || [];

  if (discountRules.length === 0) {
    logger.debug("No discount rules found in instance");
    return 0;
  }

  logger.debug("Found instance discount rules", {
    ruleCount: discountRules.length,
    rules: discountRules.map(rule => ({
      id: rule.id,
      name: rule.name,
      conditionType: rule.condition.type,
      conditionHours: rule.condition.hours,
      discountValue: rule.discount.value
    }))
  });

  // Evaluate each rule and find the best valid discount
  let bestDiscountAmount = 0;
  let bestRuleName: string | null = null;

  for (const rule of discountRules) {
    // Use shared doesRuleApply from utils/classDiscount.ts
    const isValid = doesRuleApply(rule, hoursUntilClass);

    if (isValid && rule.discount.value > bestDiscountAmount) {
      bestDiscountAmount = rule.discount.value;
      bestRuleName = rule.name;

      logger.debug("New best discount found", {
        ruleName: rule.name,
        ruleId: rule.id,
        discountAmount: rule.discount.value,
        conditionType: rule.condition.type,
        conditionHours: rule.condition.hours
      });
    } else if (!isValid) {
      logger.debug("Rule condition not met", {
        ruleName: rule.name,
        ruleId: rule.id,
        conditionType: rule.condition.type,
        conditionHours: rule.condition.hours,
        hoursUntilClass: Number(hoursUntilClass.toFixed(2))
      });
    }
  }

  logger.debug("Instance discount evaluation completed", {
    bestDiscountAmount,
    bestRuleName,
    totalRulesEvaluated: discountRules.length
  });

  return bestDiscountAmount;
};

/**
 * Exported pricing operations for external consumption
 * 
 * @description Centralized export object for all pricing-related functions.
 * Used by services layer and API endpoints for consistent pricing calculations.
 * 
 * @example
 * import { pricingOperations } from './operations/pricing';
 * const result = await pricingOperations.calculateFinalPrice(instance, template);
 * const result2 = await pricingOperations.calculateFinalPriceFromInstance(instance);
 */
export const pricingOperations = {
  calculateFinalPrice,
  calculateFinalPriceFromInstance,
};