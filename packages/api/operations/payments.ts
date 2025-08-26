/**
 * Dynamic subscription pricing logic and payment operations
 * Matches the pricing tiers used in the mobile app
 */

export type PricingTier = {
  credits: number;
  priceInCents: number;
  pricePerCredit: number;
  discount: number;
};

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
 * Calculate pricing for any credit amount based on tiered pricing
 */
export function calculateSubscriptionPricing(credits: number): PricingTier {
  let pricePerCredit: number;
  let discount: number;

  if (credits <= 40) {
    // 5 to 40 credits: $2.30 per credit
    pricePerCredit = 2.30;
    discount = 0;
  } else if (credits <= 80) {
    // 45 to 80 credits: $2.30 per credit (2.5% discount)
    pricePerCredit = 2.30;
    discount = 2.5;
  } else if (credits <= 120) {
    // 85 to 120 credits: $2.30 per credit (5% discount)
    pricePerCredit = 2.30;
    discount = 5.0;
  } else {
    // 125 to 150 credits: $2.30 per credit (10% discount)
    pricePerCredit = 2.30;
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
 * Validate that credit amount is within allowed range
 */
export function validateCreditAmount(credits: number): boolean {
  return credits >= 5 && credits <= 150 && credits % 5 === 0;
}

/**
 * Get Stripe product name for a specific credit amount
 */
export function getSubscriptionProductName(credits: number): string {
  return `${credits} Credits Monthly Subscription`;
}

/**
 * Get Stripe product description for a specific credit amount
 */
export function getSubscriptionProductDescription(credits: number): string {
  const pricing = calculateSubscriptionPricing(credits);
  return `${credits} credits every month at $${pricing.pricePerCredit.toFixed(2)} per credit${pricing.discount > 0 ? ` (${pricing.discount}% discount)` : ''}`;
}

/**
 * Calculate one-time credit purchase pricing
 * Uses the centralized CREDIT_PACKS constant for consistency
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
 * Validate one-time credit purchase amount
 */
export function validateOneTimeCreditAmount(credits: number): boolean {
  return credits >= 1 && credits <= 200; // More flexible for one-time purchases
}

/**
 * Get one-time purchase product name
 */
export function getOneTimeProductName(credits: number): string {
  return `${credits} Credits One-Time Purchase`;
}

/**
 * Get one-time purchase product description
 */
export function getOneTimeProductDescription(credits: number): string {
  const pricing = calculateOneTimePricing(credits);
  if (pricing.discount > 0) {
    return `${credits} credits at $${pricing.pricePerCredit.toFixed(2)} per credit (${pricing.discount}% discount)`;
  }
  return `${credits} credits at $${pricing.pricePerCredit.toFixed(2)} per credit`;
}