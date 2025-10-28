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
    it('should calculate pricing for tier 1 (20, 30 credits) with 5% discount', () => {
      const pricing20 = calculateSubscriptionPricing(20);
      expect(pricing20).toEqual({
        credits: 20,
        priceInCents: 2090, // 20.90 (1.045 per credit with 5% discount from 1.1 base)
        pricePerCredit: 1.045,
        discount: 5
      });

      const pricing30 = calculateSubscriptionPricing(30);
      expect(pricing30).toEqual({
        credits: 30,
        priceInCents: 3135, // 31.35 (1.045 per credit with 5% discount from 1.1 base)
        pricePerCredit: 1.045,
        discount: 5
      });
    });

    it('should calculate pricing for tier 2 (50, 70 credits) with 7% discount', () => {
      const pricing50 = calculateSubscriptionPricing(50);
      expect(pricing50).toEqual({
        credits: 50,
        priceInCents: 5115, // 51.15 (1.023 per credit with 7% discount from 1.1 base)
        pricePerCredit: 1.023,
        discount: 7
      });

      const pricing70 = calculateSubscriptionPricing(70);
      expect(pricing70).toEqual({
        credits: 70,
        priceInCents: 7161, // 71.61 (1.023 per credit with 7% discount from 1.1 base)
        pricePerCredit: 1.023,
        discount: 7
      });
    });

    it('should calculate pricing for tier 3 (100, 200 credits) with 10% discount', () => {
      const pricing100 = calculateSubscriptionPricing(100);
      expect(pricing100).toEqual({
        credits: 100,
        priceInCents: 9900, // 99.00 (0.99 per credit with 10% discount from 1.1 base)
        pricePerCredit: 0.99,
        discount: 10
      });

      const pricing200 = calculateSubscriptionPricing(200);
      expect(pricing200).toEqual({
        credits: 200,
        priceInCents: 19800, // 198.00 (0.99 per credit with 10% discount from 1.1 base)
        pricePerCredit: 0.99,
        discount: 10
      });
    });

    it('should handle boundary values correctly', () => {
      // Test boundary between tier 1 and 2
      const pricing30 = calculateSubscriptionPricing(30);
      const pricing50 = calculateSubscriptionPricing(50);
      expect(pricing30.discount).toBe(5);
      expect(pricing50.discount).toBe(7);

      // Test boundary between tier 2 and 3
      const pricing70 = calculateSubscriptionPricing(70);
      const pricing100 = calculateSubscriptionPricing(100);
      expect(pricing70.discount).toBe(7);
      expect(pricing100.discount).toBe(10);
    });
  });

  describe('calculateOneTimePricing', () => {
    it('should use predefined credit pack pricing when available', () => {
      // Test exact matches with CREDIT_PACKS
      const pricing10 = calculateOneTimePricing(10);
      expect(pricing10).toEqual({
        credits: 10,
        priceInCents: 1100, // 11.00 (1.1 per credit)
        pricePerCredit: 1.1,
        discount: 0
      });

      const pricing40 = calculateOneTimePricing(40);
      expect(pricing40).toEqual({
        credits: 40,
        priceInCents: 4268, // 42.68 (1.067 per credit with 3% discount)
        pricePerCredit: 1.07, // rounded to 1.07
        discount: 3
      });

      const pricing100 = calculateOneTimePricing(100);
      expect(pricing100).toEqual({
        credits: 100,
        priceInCents: 10450, // 104.50 (1.045 per credit with 5% discount)
        pricePerCredit: 1.04, // 104.50 / 100 = 1.045 rounded to 1.04 (toFixed(2))
        discount: 5
      });

      const pricing150 = calculateOneTimePricing(150);
      expect(pricing150).toEqual({
        credits: 150,
        priceInCents: 15675, // 156.75 (1.045 per credit with 5% discount)
        pricePerCredit: 1.04, // 156.75 / 150 = 1.045 rounded to 1.04 (toFixed(2))
        discount: 5
      });

      const pricing200 = calculateOneTimePricing(200);
      expect(pricing200).toEqual({
        credits: 200,
        priceInCents: 20460, // 204.60 (1.023 per credit with 7% discount)
        pricePerCredit: 1.02, // 204.60 / 200 = 1.023 rounded to 1.02
        discount: 7
      });
    });

    it('should validate credit pack consistency', () => {
      // Verify CREDIT_PACKS constant is as expected
      expect(CREDIT_PACKS).toHaveLength(8);
      expect(CREDIT_PACKS[0]).toEqual({ credits: 10, price: 11.00 });
      expect(CREDIT_PACKS[2]).toEqual({ credits: 40, price: 42.68, discount: 3 });
      expect(CREDIT_PACKS[6]).toEqual({ credits: 150, price: 156.75, discount: 5 });
      expect(CREDIT_PACKS[7]).toEqual({ credits: 200, price: 204.60, discount: 7 });
    });
  });

  describe('validateCreditAmount', () => {
    it('should validate subscription credit amounts correctly', () => {
      // Valid tier amounts
      expect(validateCreditAmount(20)).toBe(true);
      expect(validateCreditAmount(30)).toBe(true);
      expect(validateCreditAmount(50)).toBe(true);
      expect(validateCreditAmount(70)).toBe(true);
      expect(validateCreditAmount(100)).toBe(true);
      expect(validateCreditAmount(200)).toBe(true);

      // Invalid amounts - not in tier list
      expect(validateCreditAmount(10)).toBe(false);
      expect(validateCreditAmount(15)).toBe(false);
      expect(validateCreditAmount(25)).toBe(false);
      expect(validateCreditAmount(40)).toBe(false);
      expect(validateCreditAmount(75)).toBe(false);
      expect(validateCreditAmount(150)).toBe(false);
      expect(validateCreditAmount(300)).toBe(false);

      // Invalid amounts - negative
      expect(validateCreditAmount(-10)).toBe(false);

      // Invalid amounts - beyond max
      expect(validateCreditAmount(300)).toBe(false);
    });
  });

  describe('validateOneTimeCreditAmount', () => {
    it('should validate one-time credit amounts correctly', () => {
      // Valid amounts (allowed tiers)
      expect(validateOneTimeCreditAmount(10)).toBe(true);
      expect(validateOneTimeCreditAmount(20)).toBe(true);
      expect(validateOneTimeCreditAmount(40)).toBe(true);
      expect(validateOneTimeCreditAmount(60)).toBe(true);
      expect(validateOneTimeCreditAmount(80)).toBe(true);
      expect(validateOneTimeCreditAmount(100)).toBe(true);
      expect(validateOneTimeCreditAmount(150)).toBe(true);
      expect(validateOneTimeCreditAmount(200)).toBe(true);

      // Invalid amounts - below minimum or not in tier list
      expect(validateOneTimeCreditAmount(0)).toBe(false);
      expect(validateOneTimeCreditAmount(5)).toBe(false);
      expect(validateOneTimeCreditAmount(15)).toBe(false);
      expect(validateOneTimeCreditAmount(25)).toBe(false);

      // Invalid amounts - above maximum
      expect(validateOneTimeCreditAmount(201)).toBe(false);
      expect(validateOneTimeCreditAmount(500)).toBe(false);

      // Invalid amounts - negative
      expect(validateOneTimeCreditAmount(-1)).toBe(false);
    });
  });

  describe('getSubscriptionProductName', () => {
    it('should generate correct product names', () => {
      expect(getSubscriptionProductName(20)).toBe('20 Credits Monthly Subscription');
      expect(getSubscriptionProductName(100)).toBe('100 Credits Monthly Subscription');
      expect(getSubscriptionProductName(200)).toBe('200 Credits Monthly Subscription');
    });
  });

  describe('getSubscriptionProductDescription', () => {
    it('should generate correct descriptions with discount information', () => {
      const desc20 = getSubscriptionProductDescription(20);
      expect(desc20).toBe('20 credits every month at 1.04 per credit (5% discount)');

      const desc50 = getSubscriptionProductDescription(50);
      expect(desc50).toBe('50 credits every month at 1.02 per credit (7% discount)');

      const desc100 = getSubscriptionProductDescription(100);
      expect(desc100).toBe('100 credits every month at 0.99 per credit (10% discount)');

      const desc200 = getSubscriptionProductDescription(200);
      expect(desc200).toBe('200 credits every month at 0.99 per credit (10% discount)');
    });
  });

  describe('getOneTimeProductName', () => {
    it('should generate correct one-time product names', () => {
      expect(getOneTimeProductName(10)).toBe('10 Credits One-Time Purchase');
      expect(getOneTimeProductName(50)).toBe('50 Credits One-Time Purchase');
      expect(getOneTimeProductName(100)).toBe('100 Credits One-Time Purchase');
    });
  });

  describe('getOneTimeProductDescription', () => {
    it('should generate correct descriptions for predefined packs', () => {
      const desc10 = getOneTimeProductDescription(10);
      expect(desc10).toBe('10 credits at €1.10 per credit');

      const desc100 = getOneTimeProductDescription(100);
      expect(desc100).toBe('100 credits at €1.04 per credit (5% discount)');

      const desc200 = getOneTimeProductDescription(200);
      expect(desc200).toBe('200 credits at €1.02 per credit (7% discount)');
    });
  });

  describe('price calculation accuracy', () => {
    it('should handle floating point arithmetic correctly', () => {
      // Test problematic floating point calculations
      const pricing100 = calculateSubscriptionPricing(100);
      expect(pricing100.priceInCents).toBe(9900); // Should be exact, no rounding errors

      const pricing200 = calculateSubscriptionPricing(200);
      expect(pricing200.priceInCents).toBe(19800); // Should be exact

      // Test smaller tiers
      const pricing20 = calculateSubscriptionPricing(20);
      expect(pricing20.priceInCents).toBe(2090); // 20 * 1.045 = 20.90

      const pricing50 = calculateSubscriptionPricing(50);
      expect(pricing50.priceInCents).toBe(5115); // 50 * 1.023 = 51.15
    });
  });

  describe('business logic consistency', () => {
    it('should ensure subscription pricing tiers provide meaningful savings', () => {
      const tier1 = calculateSubscriptionPricing(30);
      const tier2 = calculateSubscriptionPricing(50);
      const tier3 = calculateSubscriptionPricing(100);
      const tier4 = calculateSubscriptionPricing(200);

      // Each tier should offer better value per credit
      expect(tier2.pricePerCredit).toBeLessThan(tier1.pricePerCredit);
      expect(tier3.pricePerCredit).toBeLessThan(tier2.pricePerCredit);
      expect(tier4.pricePerCredit).toBeLessThanOrEqual(tier3.pricePerCredit);

      // Verify actual values for clarity
      expect(tier1.pricePerCredit).toBe(1.045); // 5% off 1.1 base
      expect(tier2.pricePerCredit).toBe(1.023);  // 7% off 1.1 base
      expect(tier3.pricePerCredit).toBe(0.99); // 10% off 1.1 base
      expect(tier4.pricePerCredit).toBe(0.99);  // 10% off (same tier as 100)
    });

    it('should ensure one-time pricing incentivizes larger purchases', () => {
      const pack10 = CREDIT_PACKS.find(p => p.credits === 10)!;
      const pack100 = CREDIT_PACKS.find(p => p.credits === 100)!;
      const pack200 = CREDIT_PACKS.find(p => p.credits === 200)!;

      const pricePerCredit10 = pack10.price / pack10.credits;
      const pricePerCredit100 = pack100.price / pack100.credits;
      const pricePerCredit200 = pack200.price / pack200.credits;

      // Larger packs should have better price per credit
      expect(pricePerCredit100).toBeLessThan(pricePerCredit10);
      expect(pricePerCredit200).toBeLessThan(pricePerCredit100);
    });
  });
});
