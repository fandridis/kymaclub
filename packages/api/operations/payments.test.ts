import { describe, it, expect } from "vitest";
import { 
  calculateSubscriptionPricing, 
  calculateOneTimePricing,
  validateCreditAmount,
  validateOneTimeCreditAmount,
  getSubscriptionProductName,
  getSubscriptionProductDescription,
  getOneTimeProductName,
  getOneTimeProductDescription,
  CREDIT_PACKS,
  type PricingTier 
} from "./payments";

describe('Payment Operations', () => {
  
  describe('calculateSubscriptionPricing', () => {
    it('should calculate pricing for tier 1 (5-99 credits) with no discount', () => {
      const pricing5 = calculateSubscriptionPricing(5);
      expect(pricing5).toEqual({
        credits: 5,
        priceInCents: 250, // 2.50 (0.50 per credit)
        pricePerCredit: 0.50,
        discount: 0
      });

      const pricing25 = calculateSubscriptionPricing(25);
      expect(pricing25).toEqual({
        credits: 25,
        priceInCents: 1250, // 12.50 (0.50 per credit)
        pricePerCredit: 0.50,
        discount: 0
      });

      const pricing95 = calculateSubscriptionPricing(95);
      expect(pricing95).toEqual({
        credits: 95,
        priceInCents: 4750, // 47.50 (0.50 per credit)
        pricePerCredit: 0.50,
        discount: 0
      });
    });

    it('should calculate pricing for tier 2 (100-199 credits) with 3% discount', () => {
      const pricing100 = calculateSubscriptionPricing(100);
      expect(pricing100).toEqual({
        credits: 100,
        priceInCents: 4850, // 48.50 (0.485 per credit with 3% discount)
        pricePerCredit: 0.485,
        discount: 3
      });

      const pricing150 = calculateSubscriptionPricing(150);
      expect(pricing150).toEqual({
        credits: 150,
        priceInCents: 7275, // 72.75 (0.485 per credit with 3% discount)
        pricePerCredit: 0.485,
        discount: 3
      });

      const pricing195 = calculateSubscriptionPricing(195);
      expect(pricing195).toEqual({
        credits: 195,
        priceInCents: 9458, // 94.575 rounded to 94.58 (0.485 per credit)
        pricePerCredit: 0.485,
        discount: 3
      });
    });

    it('should calculate pricing for tier 3 (200-299 credits) with 5% discount', () => {
      const pricing200 = calculateSubscriptionPricing(200);
      expect(pricing200).toEqual({
        credits: 200,
        priceInCents: 9500, // 95.00 (0.475 per credit with 5% discount)
        pricePerCredit: 0.475,
        discount: 5.0
      });

      const pricing250 = calculateSubscriptionPricing(250);
      expect(pricing250).toEqual({
        credits: 250,
        priceInCents: 11875, // 118.75 (0.475 per credit with 5% discount)
        pricePerCredit: 0.475,
        discount: 5.0
      });

      const pricing295 = calculateSubscriptionPricing(295);
      expect(pricing295).toEqual({
        credits: 295,
        priceInCents: 14013, // 140.125 rounded to 140.13 (0.475 per credit)
        pricePerCredit: 0.475,
        discount: 5.0
      });
    });

    it('should calculate pricing for tier 4 (300-449 credits) with 7% discount', () => {
      const pricing300 = calculateSubscriptionPricing(300);
      expect(pricing300).toEqual({
        credits: 300,
        priceInCents: 13950, // 139.50 (0.465 per credit with 7% discount)
        pricePerCredit: 0.465,
        discount: 7.0
      });

      const pricing400 = calculateSubscriptionPricing(400);
      expect(pricing400).toEqual({
        credits: 400,
        priceInCents: 18600, // 186.00 (0.465 per credit with 7% discount)
        pricePerCredit: 0.465,
        discount: 7.0
      });
    });

    it('should calculate pricing for tier 5 (450-500 credits) with 10% discount', () => {
      const pricing450 = calculateSubscriptionPricing(450);
      expect(pricing450).toEqual({
        credits: 450,
        priceInCents: 20250, // 202.50 (0.45 per credit with 10% discount)
        pricePerCredit: 0.45,
        discount: 10.0
      });

      const pricing500 = calculateSubscriptionPricing(500);
      expect(pricing500).toEqual({
        credits: 500,
        priceInCents: 22500, // 225.00 (0.45 per credit with 10% discount)
        pricePerCredit: 0.45,
        discount: 10.0
      });
    });

    it('should handle boundary values correctly', () => {
      // Test boundary between tier 1 and 2
      const tier1Max = calculateSubscriptionPricing(99);
      const tier2Min = calculateSubscriptionPricing(100);
      
      expect(tier1Max.discount).toBe(0);
      expect(tier2Min.discount).toBe(3);
      expect(tier2Min.pricePerCredit).toBeLessThan(tier1Max.pricePerCredit); // Should be cheaper per credit

      // Test boundary between tier 2 and 3
      const tier2Max = calculateSubscriptionPricing(199);
      const tier3Min = calculateSubscriptionPricing(200);
      
      expect(tier2Max.discount).toBe(3);
      expect(tier3Min.discount).toBe(5.0);

      // Test boundary between tier 3 and 4
      const tier3Max = calculateSubscriptionPricing(299);
      const tier4Min = calculateSubscriptionPricing(300);
      
      expect(tier3Max.discount).toBe(5.0);
      expect(tier4Min.discount).toBe(7.0);

      // Test boundary between tier 4 and 5
      const tier4Max = calculateSubscriptionPricing(449);
      const tier5Min = calculateSubscriptionPricing(450);
      
      expect(tier4Max.discount).toBe(7.0);
      expect(tier5Min.discount).toBe(10.0);
    });
  });

  describe('calculateOneTimePricing', () => {
    it('should use predefined credit pack pricing when available', () => {
      // Test exact matches with CREDIT_PACKS
      const pricing10 = calculateOneTimePricing(10);
      expect(pricing10).toEqual({
        credits: 10,
        priceInCents: 650, // 6.50 (0.65 per credit)
        pricePerCredit: 0.65,
        discount: 0
      });

      const pricing25 = calculateOneTimePricing(25);
      expect(pricing25).toEqual({
        credits: 25,
        priceInCents: 1625, // 16.25 (0.65 per credit)
        pricePerCredit: 0.65,
        discount: 0
      });

      const pricing100 = calculateOneTimePricing(100);
      expect(pricing100).toEqual({
        credits: 100,
        priceInCents: 6338, // 63.38 (0.63 per credit with 2.5% discount)
        pricePerCredit: 0.63,
        discount: 2.5
      });

      const pricing500 = calculateOneTimePricing(500);
      expect(pricing500).toEqual({
        credits: 500,
        priceInCents: 27625, // 276.25 (0.55 per credit with 15% discount)
        pricePerCredit: 0.55,
        discount: 15
      });
    });

    it('should use standard pricing for non-predefined amounts', () => {
      const pricing15 = calculateOneTimePricing(15);
      expect(pricing15).toEqual({
        credits: 15,
        priceInCents: 1875, // 18.75 (1.25 per credit standard with 2.5x markup)
        pricePerCredit: 1.25,
        discount: 0
      });

      const pricing75 = calculateOneTimePricing(75);
      expect(pricing75).toEqual({
        credits: 75,
        priceInCents: 9375, // 93.75 (1.25 per credit standard with 2.5x markup)
        pricePerCredit: 1.25,
        discount: 0
      });
    });

    it('should validate credit pack consistency', () => {
      // Verify CREDIT_PACKS constant is as expected
      expect(CREDIT_PACKS).toHaveLength(8);
      expect(CREDIT_PACKS[0]).toEqual({ credits: 10, price: 6.5 });
      expect(CREDIT_PACKS[1]).toEqual({ credits: 25, price: 16.25 });
      expect(CREDIT_PACKS[7]).toEqual({ credits: 500, price: 276.25, discount: 15 });
    });
  });

  describe('validateCreditAmount', () => {
    it('should validate subscription credit amounts correctly', () => {
      // Valid amounts
      expect(validateCreditAmount(5)).toBe(true);
      expect(validateCreditAmount(10)).toBe(true);
      expect(validateCreditAmount(50)).toBe(true);
      expect(validateCreditAmount(150)).toBe(true);

      // Invalid amounts - below minimum
      expect(validateCreditAmount(0)).toBe(false);
      expect(validateCreditAmount(4)).toBe(false);

      // Invalid amounts - above maximum
      expect(validateCreditAmount(505)).toBe(false);
      expect(validateCreditAmount(600)).toBe(false);

      // Invalid amounts - not multiples of 5
      expect(validateCreditAmount(7)).toBe(false);
      expect(validateCreditAmount(13)).toBe(false);
      expect(validateCreditAmount(52)).toBe(false);

      // Invalid amounts - negative
      expect(validateCreditAmount(-5)).toBe(false);
    });
  });

  describe('validateOneTimeCreditAmount', () => {
    it('should validate one-time credit amounts correctly', () => {
      // Valid amounts
      expect(validateOneTimeCreditAmount(10)).toBe(true);
      expect(validateOneTimeCreditAmount(15)).toBe(true);
      expect(validateOneTimeCreditAmount(50)).toBe(true);
      expect(validateOneTimeCreditAmount(100)).toBe(true);
      expect(validateOneTimeCreditAmount(500)).toBe(true);

      // Invalid amounts - below minimum
      expect(validateOneTimeCreditAmount(0)).toBe(false);
      expect(validateOneTimeCreditAmount(9)).toBe(false);

      // Invalid amounts - above maximum
      expect(validateOneTimeCreditAmount(501)).toBe(false);
      expect(validateOneTimeCreditAmount(1000)).toBe(false);

      // Invalid amounts - negative
      expect(validateOneTimeCreditAmount(-1)).toBe(false);
    });
  });

  describe('getSubscriptionProductName', () => {
    it('should generate correct product names', () => {
      expect(getSubscriptionProductName(5)).toBe('5 Credits Monthly Subscription');
      expect(getSubscriptionProductName(50)).toBe('50 Credits Monthly Subscription');
      expect(getSubscriptionProductName(150)).toBe('150 Credits Monthly Subscription');
    });
  });

  describe('getSubscriptionProductDescription', () => {
    it('should generate correct descriptions with discount information', () => {
      const desc5 = getSubscriptionProductDescription(5);
      expect(desc5).toBe('5 credits every month at 0.50 per credit');

      const desc100 = getSubscriptionProductDescription(100);
      expect(desc100).toBe('100 credits every month at 0.48 per credit (3% discount)');

      const desc200 = getSubscriptionProductDescription(200);
      expect(desc200).toBe('200 credits every month at 0.47 per credit (5% discount)');

      const desc450 = getSubscriptionProductDescription(450);
      expect(desc450).toBe('450 credits every month at 0.45 per credit (10% discount)');
    });
  });

  describe('getOneTimeProductName', () => {
    it('should generate correct one-time product names', () => {
      expect(getOneTimeProductName(5)).toBe('5 Credits One-Time Purchase');
      expect(getOneTimeProductName(30)).toBe('30 Credits One-Time Purchase');
      expect(getOneTimeProductName(100)).toBe('100 Credits One-Time Purchase');
    });
  });

  describe('getOneTimeProductDescription', () => {
    it('should generate correct descriptions for predefined packs', () => {
      const desc10 = getOneTimeProductDescription(10);
      expect(desc10).toBe('10 credits at $0.65 per credit');

      const desc100 = getOneTimeProductDescription(100);
      expect(desc100).toBe('100 credits at $0.63 per credit (2.5% discount)');

      const desc500 = getOneTimeProductDescription(500);
      expect(desc500).toBe('500 credits at $0.55 per credit (15% discount)');
    });

    it('should generate correct descriptions for non-predefined amounts', () => {
      const desc15 = getOneTimeProductDescription(15);
      expect(desc15).toBe('15 credits at $1.25 per credit');

      const desc75 = getOneTimeProductDescription(75);
      expect(desc75).toBe('75 credits at $1.25 per credit');
    });
  });

  describe('price calculation accuracy', () => {
    it('should handle floating point arithmetic correctly', () => {
      // Test problematic floating point calculations
      const pricing100 = calculateSubscriptionPricing(100);
      expect(pricing100.priceInCents).toBe(4850); // Should be exact, no rounding errors

      const pricing200 = calculateSubscriptionPricing(200);
      expect(pricing200.priceInCents).toBe(9500); // Should be exact

      const pricing450 = calculateSubscriptionPricing(450);
      expect(pricing450.priceInCents).toBe(20250); // Should be exact
    });

    it('should round to nearest cent for fractional amounts', () => {
      // Test edge cases that might result in fractional cents
      const pricing7 = calculateOneTimePricing(7);
      expect(Number.isInteger(pricing7.priceInCents)).toBe(true);
      expect(pricing7.priceInCents).toBe(875); // 7 * 1.25 = 8.75
    });
  });

  describe('business logic consistency', () => {
    it('should ensure subscription pricing tiers provide meaningful savings', () => {
      const tier1Max = calculateSubscriptionPricing(99);
      const tier2Min = calculateSubscriptionPricing(100);
      const tier3Min = calculateSubscriptionPricing(200);
      const tier4Min = calculateSubscriptionPricing(300);
      const tier5Min = calculateSubscriptionPricing(450);

      // Each tier should offer better value per credit
      expect(tier2Min.pricePerCredit).toBeLessThan(tier1Max.pricePerCredit);
      expect(tier3Min.pricePerCredit).toBeLessThan(tier2Min.pricePerCredit);
      expect(tier4Min.pricePerCredit).toBeLessThan(tier3Min.pricePerCredit);
      expect(tier5Min.pricePerCredit).toBeLessThan(tier4Min.pricePerCredit);
    });

    it('should ensure one-time pricing incentivizes larger purchases', () => {
      const pack100 = CREDIT_PACKS.find(p => p.credits === 100)!;
      const pack200 = CREDIT_PACKS.find(p => p.credits === 200)!;
      const pack500 = CREDIT_PACKS.find(p => p.credits === 500)!;

      const pricePerCredit100 = pack100.price / pack100.credits;
      const pricePerCredit200 = pack200.price / pack200.credits;
      const pricePerCredit500 = pack500.price / pack500.credits;

      // Larger packs should have better price per credit
      expect(pricePerCredit200).toBeLessThan(pricePerCredit100);
      expect(pricePerCredit500).toBeLessThan(pricePerCredit200);
    });
  });
});