import type { Doc } from '../convex/_generated/dataModel';
import type { PricingResult } from '../utils/pricing';

/**
 * Business logic for pricing calculations
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

export const pricingOperations = {
    calculateFinalPrice,
};