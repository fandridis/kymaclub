import type { Doc } from '../convex/_generated/dataModel';
import { PricingResult } from '../types/pricing';

/**
 * Business logic for dynamic pricing calculations with discount hierarchy
 * 
 * This module implements the core pricing engine for class bookings, applying
 * time-based and capacity-based discounts according to business rules.
 */

/**
 * Calculates final price for a class booking with dynamic discount application
 * 
 * @description Applies discount hierarchy: Early bird (10%) takes precedence over low capacity (5%).
 * Base price selection follows: instance.baseCredits → template.baseCredits → default(10)
 * 
 * @param instance - Class instance containing startTime, bookedCount, capacity, and optional baseCredits
 * @param template - Class template providing fallback values for missing instance fields
 * @returns Promise<PricingResult> with originalPrice, finalPrice, discountPercentage, discountAmount
 * 
 * @example
 * // Early bird discount (>48 hours advance booking)
 * const instance = { 
 *   startTime: Date.now() + (72 * 60 * 60 * 1000), // 72 hours future
 *   baseCredits: 20 
 * };
 * const template = { baseCredits: 15 };
 * const result = await calculateFinalPrice(instance, template);
 * // Returns: { originalPrice: 20, finalPrice: 18, discountPercentage: 0.1, discountAmount: 2 }
 * 
 * @example
 * // Low capacity discount (<50% booked, within 48h)
 * const instance = { 
 *   startTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours future
 *   baseCredits: 20,
 *   bookedCount: 3,
 *   capacity: 10 // 30% utilization
 * };
 * const result = await calculateFinalPrice(instance, template);
 * // Returns: { originalPrice: 20, finalPrice: 19, discountPercentage: 0.05, discountAmount: 1 }
 * 
 * @example
 * // No discount (well-booked class within 48h)
 * const instance = { 
 *   startTime: Date.now() + (24 * 60 * 60 * 1000),
 *   baseCredits: 20,
 *   bookedCount: 8,
 *   capacity: 10 // 80% utilization
 * };
 * const result = await calculateFinalPrice(instance, template);
 * // Returns: { originalPrice: 20, finalPrice: 20, discountPercentage: 0, discountAmount: 0 }
 * 
 * @example
 * // Base price fallback chain
 * const instance = { startTime: Date.now() + (72 * 60 * 60 * 1000) }; // No baseCredits
 * const template = {}; // No baseCredits  
 * const result = await calculateFinalPrice(instance, template);
 * // Returns: { originalPrice: 10, finalPrice: 9, discountPercentage: 0.1, discountAmount: 1 }
 * 
 * @throws Never throws - all edge cases handled gracefully
 * @safety Zero capacity handled via fallback to default (10), prevents division by zero
 * @safety Negative prices impossible - minimum result is 0
 * @safety Past classes can still receive capacity discounts (intentional business rule)
 */
export const calculateFinalPrice = async (
  instance: Doc<"classInstances">,
  template: Doc<"classTemplates">
): Promise<PricingResult> => {
  console.log("💰 PRICING: calculateFinalPrice - Starting price calculation");

  // Get base price (instance overrides template)
  const basePrice = (instance as any).baseCredits || (template as any).baseCredits || 10;
  console.log(`💰 PRICING: Base price: ${basePrice} credits`);

  // Check for discounts
  const discountPercentage = await calculateDiscount(instance, template);
  const discountAmount = basePrice * discountPercentage;
  const finalPrice = basePrice - discountAmount;

  console.log(`💰 PRICING: Discount: ${(discountPercentage * 100).toFixed(1)}% (${discountAmount} credits)`);
  console.log(`💰 PRICING: Final price: ${finalPrice} credits`);

  return {
    originalPrice: basePrice,
    finalPrice,
    discountPercentage,
    discountAmount
  };
};

/**
 * Calculates applicable discount percentage based on timing and capacity utilization
 * 
 * @description Implements discount hierarchy where early bird takes precedence.
 * Business rules: Early bird (>48h) = 10%, Low capacity (<50% full) = 5%, No overlap
 * 
 * @param instance - Class instance with startTime, bookedCount, capacity
 * @param template - Template providing fallback capacity value
 * @returns Promise<number> discount percentage (0, 0.05, or 0.1)
 * 
 * @example
 * // Early bird wins over low capacity
 * const instance = { 
 *   startTime: Date.now() + (72 * 60 * 60 * 1000), // >48h = early bird eligible
 *   bookedCount: 2, capacity: 10 // 20% = low capacity eligible too
 * };
 * const discount = await calculateDiscount(instance, {});
 * // Returns: 0.1 (early bird takes precedence)
 * 
 * @example
 * // Low capacity discount when not early bird
 * const instance = { 
 *   startTime: Date.now() + (24 * 60 * 60 * 1000), // <48h = no early bird
 *   bookedCount: 3, capacity: 10 // 30% = low capacity
 * };
 * const discount = await calculateDiscount(instance, {});
 * // Returns: 0.05 (low capacity discount)
 * 
 * @example
 * // No discount scenarios
 * const instance = { 
 *   startTime: Date.now() + (24 * 60 * 60 * 1000), // <48h
 *   bookedCount: 7, capacity: 10 // 70% utilization
 * };
 * const discount = await calculateDiscount(instance, {});
 * // Returns: 0 (no discounts applicable)
 * 
 * @internal This function is not exported - used only by calculateFinalPrice
 * @business_rule Early bird discount requires >48 hours advance booking
 * @business_rule Low capacity discount requires <50% utilization
 * @business_rule Discounts are mutually exclusive, early bird takes precedence
 */
const calculateDiscount = async (
  instance: Doc<"classInstances">,
  template: Doc<"classTemplates">
): Promise<number> => {
  console.log("🏷️ PRICING: calculateDiscount - Checking for applicable discounts");

  // Mock discount logic
  const currentTime = Date.now();
  const hoursUntilClass = (instance.startTime - currentTime) / (1000 * 60 * 60);

  // Early bird discount (more than 48 hours in advance)
  if (hoursUntilClass > 48) {
    console.log("🏷️ PRICING: Early bird discount applied (10%)");
    return 0.1; // 10% discount
  }

  // Low capacity discount (less than 50% full)
  const bookedCount = (instance as any).bookedCount || 0;
  const capacity = (instance as any).capacity || (template as any).capacity || 10;
  const capacityUtilization = bookedCount / capacity;
  if (capacityUtilization < 0.5) {
    console.log("🏷️ PRICING: Low capacity discount applied (5%)");
    return 0.05; // 5% discount
  }

  console.log("🏷️ PRICING: No discounts applicable");
  return 0; // No discount
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
 */
export const pricingOperations = {
  calculateFinalPrice,
};