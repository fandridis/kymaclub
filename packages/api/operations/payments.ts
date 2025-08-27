/**
 * Payment Operations - Dynamic Pricing and Credit Management
 * 
 * This module implements the complete pricing logic for both subscription and one-time
 * credit purchases. All pricing follows tiered discount structures that match mobile app
 * UI and provide consistent pricing across all platforms.
 * 
 * Key Concepts:
 * - Subscriptions: Monthly recurring credits with volume discounts (5-150 credits)
 * - One-time purchases: Single credit purchases with pack-based pricing (1-200 credits)
 * - Tiered discounts: Larger volumes get better per-credit pricing
 * - Currency: All prices in EUR (€) with cent-based calculations for precision
 */

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
 */
export const CREDIT_PACKS: CreditPack[] = [
  { credits: 5, price: 11.5 },   // $2.30 per credit
  { credits: 10, price: 23.0 },  // $2.30 per credit
  { credits: 20, price: 46.0 },  // $2.30 per credit
  { credits: 30, price: 67, discount: 3 },   // $2.23 per credit with 3% discount
  { credits: 40, price: 87, discount: 5 },   // $2.175 per credit with 5% discount
  { credits: 50, price: 103, discount: 10 }, // $2.06 per credit with 10% discount
];

/**
 * Calculates subscription pricing with tiered volume discounts
 * 
 * @description Implements 4-tier discount structure for monthly subscriptions:
 * Tier 1 (5-44): €2.00/credit (0% discount)
 * Tier 2 (45-84): €1.95/credit (2.5% discount)  
 * Tier 3 (85-124): €1.90/credit (5% discount)
 * Tier 4 (125-150): €1.80/credit (10% discount)
 * 
 * @param credits - Number of credits per month (5-150)
 * @returns PricingTier with credits, priceInCents, pricePerCredit, discount
 * 
 * @example
 * // Tier 1 pricing (no discount)
 * const tier1 = calculateSubscriptionPricing(30);
 * // Returns: { credits: 30, priceInCents: 6000, pricePerCredit: 2.00, discount: 0 }
 * 
 * @example
 * // Tier 2 pricing (2.5% discount)
 * const tier2 = calculateSubscriptionPricing(60);
 * // Returns: { credits: 60, priceInCents: 11700, pricePerCredit: 1.95, discount: 2.5 }
 * 
 * @example
 * // Tier 4 pricing (maximum 10% discount)
 * const tier4 = calculateSubscriptionPricing(140);
 * // Returns: { credits: 140, priceInCents: 25200, pricePerCredit: 1.80, discount: 10.0 }
 * 
 * @business_rule Tier boundaries: 5-44, 45-84, 85-124, 125-150 credits
 * @business_rule Base price: €2.00 per credit before discounts
 * @business_rule Currency: EUR (€) for all transactions
 * @precision Prices converted to cents using Math.round() to prevent floating point issues
 */
export function calculateSubscriptionPricing(credits: number): PricingTier {
  const basePrice = 2.00; // €2.00 base price per credit
  let pricePerCredit: number;
  let discount: number;

  if (credits < 45) {
    // 5 to 40 credits: €2.00 per credit (no discount)
    pricePerCredit = basePrice;
    discount = 0;
  } else if (credits < 85) {
    // 45 to 84 credits: €1.95 per credit (2.5% discount)
    pricePerCredit = 1.95;
    discount = 2.5;
  } else if (credits < 125) {
    // 85 to 124 credits: €1.90 per credit (5% discount)
    pricePerCredit = 1.90;
    discount = 5.0;
  } else {
    // 125 to 150 credits: €1.80 per credit (10% discount)
    pricePerCredit = 1.80;
    discount = 10.0;
  }

  const totalPrice = credits * pricePerCredit;
  const priceInCents = Math.round(totalPrice * 100); // Convert to cents

  return {
    credits,
    priceInCents,
    pricePerCredit,
    discount
  };
}

/**
 * Validates subscription credit amount within business rules
 * 
 * @description Ensures credit amount meets subscription constraints:
 * - Minimum: 5 credits (prevents micro-subscriptions)
 * - Maximum: 150 credits (reasonable business limit)
 * - Increment: Must be divisible by 5 (UI slider constraint)
 * 
 * @param credits - Number of credits to validate
 * @returns boolean - true if valid, false otherwise
 * 
 * @example
 * validateCreditAmount(30); // Returns: true (valid)
 * validateCreditAmount(3);  // Returns: false (below minimum)
 * validateCreditAmount(33); // Returns: false (not divisible by 5)
 * validateCreditAmount(200); // Returns: false (above maximum)
 * 
 * @business_rule Minimum 5 credits prevents administrative overhead
 * @business_rule Maximum 150 credits prevents excessive monthly charges
 * @business_rule Increment of 5 matches mobile app slider UI
 */
export function validateCreditAmount(credits: number): boolean {
  return credits >= 5 && credits <= 150 && credits % 5 === 0;
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
  return `${credits} credits every month at €${pricing.pricePerCredit.toFixed(2)} per credit${pricing.discount > 0 ? ` (${pricing.discount}% discount)` : ''}`;
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
 * @business_rule Pack discounts: 0%, 0%, 0%, 3%, 5%, 10% respectively
 * @business_rule Fallback rate: $2.30 per credit for non-pack amounts
 * @precision All prices calculated in cents to avoid floating point issues
 * @data_source CREDIT_PACKS constant provides single source of truth for pack pricing
 */
export function calculateOneTimePricing(credits: number): PricingTier {
  // First, try to find exact match in predefined credit packs
  const pack = CREDIT_PACKS.find(p => p.credits === credits);
  
  if (pack) {
    const actualPricePerCredit = pack.price / pack.credits;
    const priceInCents = Math.round(pack.price * 100);
    
    return {
      credits,
      priceInCents,
      pricePerCredit: actualPricePerCredit,
      discount: pack.discount || 0
    };
  }
  
  // For amounts not in predefined packs, use standard $2.30 per credit
  const basePricePerCredit = 2.30;
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
 * from 1-200 credits without increment restrictions.
 * 
 * @param credits - Number of credits to validate
 * @returns boolean - true if within valid range, false otherwise
 * 
 * @example
 * validateOneTimeCreditAmount(1);   // Returns: true (minimum)
 * validateOneTimeCreditAmount(37);  // Returns: true (any amount allowed)
 * validateOneTimeCreditAmount(200); // Returns: true (maximum)
 * validateOneTimeCreditAmount(0);   // Returns: false (below minimum)
 * validateOneTimeCreditAmount(250); // Returns: false (above maximum)
 * 
 * @business_rule Minimum: 1 credit (allows micro-purchases)
 * @business_rule Maximum: 200 credits (reasonable one-time purchase limit)
 * @business_rule No increment restriction (unlike subscriptions)
 * @rationale One-time purchases need flexibility for specific credit needs
 */
export function validateOneTimeCreditAmount(credits: number): boolean {
  return credits >= 1 && credits <= 200; // More flexible for one-time purchases
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