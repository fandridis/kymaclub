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
    it('should calculate pricing for tier 1 (1-50 credits) with 10% discount', () => {
      const pricing5 = calculateSubscriptionPricing(5);
      expect(pricing5).toEqual({
        credits: 5,
        priceInCents: 270, // 2.70 (0.54 per credit with 10% discount)
        pricePerCredit: 0.54,
        discount: 10
      });

      const pricing25 = calculateSubscriptionPricing(25);
      expect(pricing25).toEqual({
        credits: 25,
        priceInCents: 1350, // 13.50 (0.54 per credit with 10% discount)
        pricePerCredit: 0.54,
        discount: 10
      });

      const pricing50 = calculateSubscriptionPricing(50);
      expect(pricing50).toEqual({
        credits: 50,
        priceInCents: 2700, // 27.00 (0.54 per credit with 10% discount)
        pricePerCredit: 0.54,
        discount: 10
      });
    });

    it('should calculate pricing for tier 2 (51-100 credits) with 15% discount', () => {
      const pricing75 = calculateSubscriptionPricing(75);
      expect(pricing75).toEqual({
        credits: 75,
        priceInCents: 3825, // 38.25 (0.51 per credit with 15% discount)
        pricePerCredit: 0.51,
        discount: 15
      });

      const pricing100 = calculateSubscriptionPricing(100);
      expect(pricing100).toEqual({
        credits: 100,
        priceInCents: 5100, // 51.00 (0.51 per credit with 15% discount)
        pricePerCredit: 0.51,
        discount: 15
      });
    });

    it('should calculate pricing for tier 3 (101-300 credits) with 15% discount', () => {
      const pricing150 = calculateSubscriptionPricing(150);
      expect(pricing150).toEqual({
        credits: 150,
        priceInCents: 7650, // 76.50 (0.51 per credit with 15% discount)
        pricePerCredit: 0.51,
        discount: 15
      });

      const pricing200 = calculateSubscriptionPricing(200);
      expect(pricing200).toEqual({
        credits: 200,
        priceInCents: 10200, // 102.00 (0.51 per credit with 15% discount)
        pricePerCredit: 0.51,
        discount: 15
      });

      const pricing300 = calculateSubscriptionPricing(300);
      expect(pricing300).toEqual({
        credits: 300,
        priceInCents: 15300, // 153.00 (0.51 per credit with 15% discount)
        pricePerCredit: 0.51,
        discount: 15
      });
    });

    it('should calculate pricing for tier 4 (301-500 credits) with 20% discount', () => {
      const pricing350 = calculateSubscriptionPricing(350);
      expect(pricing350).toEqual({
        credits: 350,
        priceInCents: 16800, // 168.00 (0.48 per credit with 20% discount)
        pricePerCredit: 0.48,
        discount: 20
      });

      const pricing400 = calculateSubscriptionPricing(400);
      expect(pricing400).toEqual({
        credits: 400,
        priceInCents: 19200, // 192.00 (0.48 per credit with 20% discount)
        pricePerCredit: 0.48,
        discount: 20
      });

      const pricing500 = calculateSubscriptionPricing(500);
      expect(pricing500).toEqual({
        credits: 500,
        priceInCents: 24000, // 240.00 (0.48 per credit with 20% discount)
        pricePerCredit: 0.48,
        discount: 20
      });
    });

    it('should handle boundary values correctly', () => {
      // Test boundary between tier 1 and 2
      const pricing50 = calculateSubscriptionPricing(50);
      const pricing51 = calculateSubscriptionPricing(51);
      expect(pricing50.discount).toBe(10);
      expect(pricing51.discount).toBe(15);

      // Test boundary between tier 2 and 3
      const pricing100 = calculateSubscriptionPricing(100);
      const pricing101 = calculateSubscriptionPricing(101);
      expect(pricing100.discount).toBe(15);
      expect(pricing101.discount).toBe(15);

      // Test boundary between tier 3 and 4
      const pricing300 = calculateSubscriptionPricing(300);
      const pricing301 = calculateSubscriptionPricing(301);
      expect(pricing300.discount).toBe(15);
      expect(pricing301.discount).toBe(20);
    });
  });

  describe('calculateOneTimePricing', () => {
    it('should use predefined credit pack pricing when available', () => {
      // Test exact matches with CREDIT_PACKS
      const pricing10 = calculateOneTimePricing(10);
      expect(pricing10).toEqual({
        credits: 10,
        priceInCents: 600, // 6.00 (0.60 per credit)
        pricePerCredit: 0.6,
        discount: 0
      });

      const pricing25 = calculateOneTimePricing(25);
      expect(pricing25).toEqual({
        credits: 25,
        priceInCents: 1500, // 15.00 (0.60 per credit)
        pricePerCredit: 0.6,
        discount: 0
      });

      const pricing100 = calculateOneTimePricing(100);
      expect(pricing100).toEqual({
        credits: 100,
        priceInCents: 5850, // 58.50 (0.585 per credit with 2.5% discount)
        pricePerCredit: 0.58,
        discount: 2.5
      });

      const pricing500 = calculateOneTimePricing(500);
      expect(pricing500).toEqual({
        credits: 500,
        priceInCents: 25500, // 255.00 (0.51 per credit with 15% discount)
        pricePerCredit: 0.51,
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
      expect(CREDIT_PACKS[0]).toEqual({ credits: 10, price: 6 });
      expect(CREDIT_PACKS[1]).toEqual({ credits: 25, price: 15 });
      expect(CREDIT_PACKS[7]).toEqual({ credits: 500, price: 255, discount: 15 });
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
      expect(desc5).toBe('5 credits every month at 0.54 per credit (10% discount)');

      const desc100 = getSubscriptionProductDescription(100);
      expect(desc100).toBe('100 credits every month at 0.51 per credit (15% discount)');

      const desc200 = getSubscriptionProductDescription(200);
      expect(desc200).toBe('200 credits every month at 0.51 per credit (15% discount)');

      const desc450 = getSubscriptionProductDescription(450);
      expect(desc450).toBe('450 credits every month at 0.48 per credit (20% discount)');
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
      expect(desc10).toBe('10 credits at $0.60 per credit');

      const desc100 = getOneTimeProductDescription(100);
      expect(desc100).toBe('100 credits at $0.58 per credit (2.5% discount)');

      const desc500 = getOneTimeProductDescription(500);
      expect(desc500).toBe('500 credits at $0.51 per credit (15% discount)');
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
      expect(pricing100.priceInCents).toBe(5100); // Should be exact, no rounding errors

      const pricing200 = calculateSubscriptionPricing(200);
      expect(pricing200.priceInCents).toBe(10200); // Should be exact

      const pricing450 = calculateSubscriptionPricing(450);
      expect(pricing450.priceInCents).toBe(21600); // Should be exact
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
      const tier1Max = calculateSubscriptionPricing(50);
      const tier2Min = calculateSubscriptionPricing(51);
      const tier3Min = calculateSubscriptionPricing(101);
      const tier4Min = calculateSubscriptionPricing(301);

      // Each tier should offer better value per credit
      expect(tier2Min.pricePerCredit).toBeLessThan(tier1Max.pricePerCredit);
      expect(tier3Min.pricePerCredit).toBeLessThanOrEqual(tier2Min.pricePerCredit); // Same discount, so same or better
      expect(tier4Min.pricePerCredit).toBeLessThan(tier3Min.pricePerCredit);
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