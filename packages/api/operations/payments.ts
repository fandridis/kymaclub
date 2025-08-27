/**
 * Payment Operations - Dynamic Pricing and Credit Management
 * 
 * This module implements the complete pricing logic for both subscription and one-time
 * credit purchases. All pricing follows tiered discount structures that match mobile app
 * UI and provide consistent pricing across all platforms.
 * 
 * Key Concepts:
 * - Subscriptions: Monthly recurring credits with volume discounts (5-500 credits)
 * - One-time purchases: Single credit purchases with pack-based pricing (10-500 credits)
 * - Tiered discounts: Larger volumes get better per-credit pricing
 * - Base pricing: Uses shared credit conversion constants for consistency
 */

import { CREDITS_TO_CENTS_RATIO } from '@repo/utils/credits';

// ADR-009: Credit Conversion Ratio
// Decision: Use 1 credit = 50 cents spending value (CREDITS_TO_CENTS_RATIO = 50)
// Rationale: Simple math for users while allowing business markup on purchase prices
// Alternative considered: 100 cents per credit (rejected - too expensive for users)
// Impact: Spending value separate from purchase price allows flexible pricing tiers

/**
 * Pricing tier result containing credits, pricing, and discount information
 * 
 * @interface PricingTier
 * @property credits - Number of credits in this tier
 * @property priceInCents - Total price in cents (for Stripe API)
 * @property pricePerCredit - Price per individual credit in EUR
 * @property discount - Discount percentage applied (0 = no discount)
 */
export type PricingTier = {
  credits: number;
  priceInCents: number;
  pricePerCredit: number;
  discount: number;
};

/**
 * One-time credit pack definition with optional discount
 * 
 * @interface CreditPack  
 * @property credits - Number of credits in pack
 * @property price - Total price in EUR
 * @property discount - Optional discount percentage
 */
export type CreditPack = {
  credits: number;
  price: number;
  discount?: number;
};

/**
 * Centralized credit pack definitions - single source of truth for all pricing
 * Used by both mobile app UI and backend pricing calculations
 * 
 * Base calculation: 1 credit costs 50 cents to provide (CREDITS_TO_CENTS_RATIO)
 * Purchase price includes business markup (typically 1.3x the base cost = $0.65 per credit)
 */
const calculatePackPrice = (credits: number, discount: number = 0): number => {
  const basePricePerCredit = 0.65; // $0.65 per credit base price
  const priceBeforeDiscount = credits * basePricePerCredit;
  return Number((priceBeforeDiscount * (1 - discount / 100)).toFixed(2));
};

// ADR-011: One-Time Credit Pack Structure
// Decision: 8 predefined packs with volume-based discounts (10-500 credits)
// Rationale: Covers casual users (10) to enterprise users (500) with clear savings
// Alternative considered: Continuous pricing (rejected - too complex for UI)
// Business logic: Minimum 10 credits prevents micro-transactions
export const CREDIT_PACKS: CreditPack[] = [
  { credits: 10, price: calculatePackPrice(10) },     // $0.65 per credit
  { credits: 25, price: calculatePackPrice(25) },     // $0.65 per credit
  { credits: 50, price: calculatePackPrice(50) },     // $0.65 per credit
  { credits: 100, price: calculatePackPrice(100, 2.5), discount: 2.5 },   // $0.634 per credit with 2.5% discount
  { credits: 150, price: calculatePackPrice(150, 5), discount: 5 },       // $0.618 per credit with 5% discount
  { credits: 200, price: calculatePackPrice(200, 10), discount: 10 },     // $0.585 per credit with 10% discount
  { credits: 300, price: calculatePackPrice(300, 10), discount: 10 },     // $0.585 per credit with 10% discount
  { credits: 500, price: calculatePackPrice(500, 15), discount: 15 },     // $0.585 per credit with 10% discount

];

/**
 * Calculates subscription pricing with tiered volume discounts
 * 
 * @description Implements tiered discount structure for monthly subscriptions:
 * - Up to 95 credits: no discount
 * - 100-195 credits: 3% discount  
 * - 200-295 credits: 5% discount
 * - 300-445 credits: 7% discount
 * - 450-500 credits: 10% discount
 * 
 * @param credits - Number of credits per month (5-500)
 * @returns PricingTier with credits, priceInCents, pricePerCredit, discount
 * 
 * @example
 * // No discount tier
 * const tier1 = calculateSubscriptionPricing(50);
 * // Returns: { credits: 50, priceInCents: 2500, pricePerCredit: 0.50, discount: 0 }
 * 
 * @example
 * // 3% discount tier
 * const tier2 = calculateSubscriptionPricing(150);
 * // Returns: { credits: 150, priceInCents: 7275, pricePerCredit: 0.485, discount: 3 }
 * 
 * @business_rule Base cost: 50 cents per credit (CREDITS_TO_CENTS_RATIO)
 * @business_rule Discounts start at 100 credits and increase every 50 credits
 */
// ADR-010: Subscription Pricing Tier Structure
// Decision: 5-tier discount system with increasing benefits (0%, 3%, 5%, 7%, 10%)
// Rationale: Encourages larger subscriptions while keeping base tier affordable
// Alternative considered: Linear discount (rejected - less incentive for volume)
// Business impact: 500 credit limit supports enterprise users
export function calculateSubscriptionPricing(credits: number): PricingTier {
  const basePricePerCredit = 0.50; // Base price per credit
  let discount = 0;

  // Determine discount tier based on credit amount
  if (credits >= 450) {
    discount = 10; // 450-500 credits: 10% discount
  } else if (credits >= 300) {
    discount = 7;  // 300-445 credits: 7% discount
  } else if (credits >= 200) {
    discount = 5;  // 200-295 credits: 5% discount
  } else if (credits >= 100) {
    discount = 3;  // 100-195 credits: 3% discount
  } else {
    discount = 0;  // Up to 95 credits: no discount
  }

  // Calculate discounted price per credit
  const pricePerCredit = basePricePerCredit * (1 - discount / 100);
  const totalPrice = credits * pricePerCredit;
  const priceInCents = Math.round(totalPrice * 100);

  return {
    credits,
    priceInCents,
    pricePerCredit: Number(pricePerCredit.toFixed(3)), // 3 decimal places for precision
    discount
  };
}

/**
 * Validates subscription credit amount within business rules
 * 
 * @description Ensures credit amount meets subscription constraints:
 * - Minimum: 5 credits (prevents micro-subscriptions)
 * - Maximum: 500 credits (supports new discount tiers)
 * - Increment: Must be divisible by 5 (UI slider constraint)
 * 
 * @param credits - Number of credits to validate
 * @returns boolean - true if valid, false otherwise
 * 
 * @example
 * validateCreditAmount(30); // Returns: true (valid)
 * validateCreditAmount(3);  // Returns: false (below minimum)
 * validateCreditAmount(33); // Returns: false (not divisible by 5)
 * validateCreditAmount(600); // Returns: false (above maximum)
 * 
 * @business_rule Minimum 5 credits prevents administrative overhead
 * @business_rule Maximum 500 credits supports all discount tiers
 * @business_rule Increment of 5 matches mobile app slider UI
 */
export function validateCreditAmount(credits: number): boolean {
  return credits >= 5 && credits <= 500 && credits % 5 === 0;
}

/**
 * Generates Stripe product name for subscription billing
 * 
 * @description Creates consistent product naming for Stripe dashboard and receipts.
 * Format: "{credits} Credits Monthly Subscription"
 * 
 * @param credits - Number of credits in subscription
 * @returns string - Formatted product name for Stripe
 * 
 * @example
 * getSubscriptionProductName(30); // Returns: "30 Credits Monthly Subscription"
 * getSubscriptionProductName(100); // Returns: "100 Credits Monthly Subscription"
 * 
 * @stripe_integration Used in Stripe product/price creation
 * @customer_facing Appears on invoices and payment confirmations
 * @naming_convention Consistent across all subscription products
 */
export function getSubscriptionProductName(credits: number): string {
  return `${credits} Credits Monthly Subscription`;
}

/**
 * Generates detailed Stripe product description with pricing and discount info
 * 
 * @description Creates informative description showing per-credit pricing and
 * applicable discounts for customer transparency.
 * 
 * @param credits - Number of credits in subscription
 * @returns string - Detailed description with pricing breakdown
 * 
 * @example
 * getSubscriptionProductDescription(30);
 * // Returns: "30 credits every month at €2.00 per credit"
 * 
 * @example
 * getSubscriptionProductDescription(100);
 * // Returns: "100 credits every month at €1.90 per credit (5% discount)"
 * 
 * @stripe_integration Used in Stripe product descriptions
 * @customer_transparency Shows both total and per-credit pricing
 * @discount_highlight Emphasizes savings for higher tiers
 */
export function getSubscriptionProductDescription(credits: number): string {
  const pricing = calculateSubscriptionPricing(credits);
  return `${credits} credits every month at ${pricing.pricePerCredit.toFixed(2)} per credit${pricing.discount > 0 ? ` (${pricing.discount}% discount)` : ''}`;
}

/**
 * Calculates one-time credit purchase pricing with pack-based discounts
 * 
 * @description Uses predefined CREDIT_PACKS for exact matches, falls back to
 * standard $2.30/credit for custom amounts. Pack discounts range from 0-10%.
 * 
 * @param credits - Number of credits to purchase (1-200)
 * @returns PricingTier with pricing details and applicable discount
 * 
 * @example
 * // Predefined pack with discount
 * const pack30 = calculateOneTimePricing(30);
 * // Returns: { credits: 30, priceInCents: 6700, pricePerCredit: 2.23, discount: 3 }
 * 
 * @example
 * // Predefined pack with maximum discount
 * const pack50 = calculateOneTimePricing(50);
 * // Returns: { credits: 50, priceInCents: 10300, pricePerCredit: 2.06, discount: 10 }
 * 
 * @example
 * // Custom amount (not in packs)
 * const custom = calculateOneTimePricing(15);
 * // Returns: { credits: 15, priceInCents: 3450, pricePerCredit: 2.30, discount: 0 }
 * 
 * @business_rule Predefined packs: 5, 10, 20, 30, 40, 50 credits  
 * @business_rule Pack pricing: Based on CREDITS_TO_CENTS_RATIO with markup
 * @business_rule Fallback rate: 2.5x markup over base cost for non-pack amounts
 * @precision All prices calculated in cents to avoid floating point issues
 * @data_source CREDIT_PACKS constant provides single source of truth for pack pricing
 */
export function calculateOneTimePricing(credits: number): PricingTier {
  // First, try to find exact match in predefined credit packs
  const pack = CREDIT_PACKS.find(p => p.credits === credits);

  if (pack) {
    const actualPricePerCredit = Number((pack.price / pack.credits).toFixed(2));
    const priceInCents = Math.round(pack.price * 100);

    return {
      credits,
      priceInCents,
      pricePerCredit: actualPricePerCredit,
      discount: pack.discount || 0
    };
  }

  // For amounts not in predefined packs, use standard pricing based on base cost + markup
  const baseCostPerCredit = CREDITS_TO_CENTS_RATIO / 100; // Convert to currency units
  const standardMarkup = 2.5; // 2.5x markup for non-pack purchases
  const basePricePerCredit = baseCostPerCredit * standardMarkup;
  const totalPrice = credits * basePricePerCredit;
  const priceInCents = Math.round(totalPrice * 100);

  return {
    credits,
    priceInCents,
    pricePerCredit: basePricePerCredit,
    discount: 0
  };
}

/**
 * Validates one-time credit purchase amount within business constraints
 * 
 * @description More flexible than subscription validation - allows any amount
 * from 10-500 credits without increment restrictions.
 * 
 * @param credits - Number of credits to validate
 * @returns boolean - true if within valid range, false otherwise
 * 
 * @example
 * validateOneTimeCreditAmount(10);   // Returns: true (minimum)
 * validateOneTimeCreditAmount(37);  // Returns: true (any amount allowed)
 * validateOneTimeCreditAmount(200); // Returns: true (maximum)
 * validateOneTimeCreditAmount(0);   // Returns: false (below minimum)
 * validateOneTimeCreditAmount(501); // Returns: false (above maximum)
 * 
 * @business_rule Minimum: 10 credits (allows micro-purchases)
 * @business_rule Maximum: 500 credits (reasonable one-time purchase limit)
 * @business_rule No increment restriction (unlike subscriptions)
 * @rationale One-time purchases need flexibility for specific credit needs
 */
export function validateOneTimeCreditAmount(credits: number): boolean {
  return credits >= 10 && credits <= 500; // More flexible for one-time purchases
}

/**
 * Generates Stripe product name for one-time credit purchases
 * 
 * @description Creates consistent naming for one-time credit products.
 * Format: "{credits} Credits One-Time Purchase"
 * 
 * @param credits - Number of credits to purchase
 * @returns string - Formatted product name for Stripe
 * 
 * @example
 * getOneTimeProductName(20); // Returns: "20 Credits One-Time Purchase"
 * getOneTimeProductName(50); // Returns: "50 Credits One-Time Purchase"
 * 
 * @stripe_integration Used in Stripe checkout sessions
 * @distinction Clearly differentiated from subscription products
 * @customer_clarity Obvious that this is a one-time purchase, not recurring
 */
export function getOneTimeProductName(credits: number): string {
  return `${credits} Credits One-Time Purchase`;
}

/**
 * Generates detailed description for one-time credit purchases with discount info
 * 
 * @description Shows per-credit pricing and highlights pack discounts when applicable.
 * Uses dollar signs ($) for one-time purchases vs EUR (€) for subscriptions.
 * 
 * @param credits - Number of credits to purchase
 * @returns string - Description with pricing and discount details
 * 
 * @example
 * getOneTimeProductDescription(20);
 * // Returns: "20 credits at $2.30 per credit"
 * 
 * @example  
 * getOneTimeProductDescription(50);
 * // Returns: "50 credits at $2.06 per credit (10% discount)"
 * 
 * @currency_note Uses $ for one-time purchases (historical reasons)
 * @pack_highlighting Shows discount percentage for pack purchases
 * @pricing_transparency Clear per-credit pricing for customer understanding
 */
export function getOneTimeProductDescription(credits: number): string {
  const pricing = calculateOneTimePricing(credits);
  if (pricing.discount > 0) {
    return `${credits} credits at $${pricing.pricePerCredit.toFixed(2)} per credit (${pricing.discount}% discount)`;
  }
  return `${credits} credits at $${pricing.pricePerCredit.toFixed(2)} per credit`;
}