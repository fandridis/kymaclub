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
    it('should calculate pricing for tier 1 (5-44 credits) with no discount', () => {
      const pricing5 = calculateSubscriptionPricing(5);
      expect(pricing5).toEqual({
        credits: 5,
        priceInCents: 1000, // €10.00
        pricePerCredit: 2.00,
        discount: 0
      });

      const pricing25 = calculateSubscriptionPricing(25);
      expect(pricing25).toEqual({
        credits: 25,
        priceInCents: 5000, // €50.00
        pricePerCredit: 2.00,
        discount: 0
      });

      const pricing44 = calculateSubscriptionPricing(44);
      expect(pricing44).toEqual({
        credits: 44,
        priceInCents: 8800, // €88.00
        pricePerCredit: 2.00,
        discount: 0
      });
    });

    it('should calculate pricing for tier 2 (45-84 credits) with 2.5% discount', () => {
      const pricing45 = calculateSubscriptionPricing(45);
      expect(pricing45).toEqual({
        credits: 45,
        priceInCents: 8775, // €87.75
        pricePerCredit: 1.95,
        discount: 2.5
      });

      const pricing70 = calculateSubscriptionPricing(70);
      expect(pricing70).toEqual({
        credits: 70,
        priceInCents: 13650, // €136.50
        pricePerCredit: 1.95,
        discount: 2.5
      });

      const pricing84 = calculateSubscriptionPricing(84);
      expect(pricing84).toEqual({
        credits: 84,
        priceInCents: 16380, // €163.80
        pricePerCredit: 1.95,
        discount: 2.5
      });
    });

    it('should calculate pricing for tier 3 (85-124 credits) with 5% discount', () => {
      const pricing85 = calculateSubscriptionPricing(85);
      expect(pricing85).toEqual({
        credits: 85,
        priceInCents: 16150, // €161.50
        pricePerCredit: 1.90,
        discount: 5.0
      });

      const pricing100 = calculateSubscriptionPricing(100);
      expect(pricing100).toEqual({
        credits: 100,
        priceInCents: 19000, // €190.00
        pricePerCredit: 1.90,
        discount: 5.0
      });

      const pricing124 = calculateSubscriptionPricing(124);
      expect(pricing124).toEqual({
        credits: 124,
        priceInCents: 23560, // €235.60
        pricePerCredit: 1.90,
        discount: 5.0
      });
    });

    it('should calculate pricing for tier 4 (125+ credits) with 10% discount', () => {
      const pricing125 = calculateSubscriptionPricing(125);
      expect(pricing125).toEqual({
        credits: 125,
        priceInCents: 22500, // €225.00
        pricePerCredit: 1.80,
        discount: 10.0
      });

      const pricing150 = calculateSubscriptionPricing(150);
      expect(pricing150).toEqual({
        credits: 150,
        priceInCents: 27000, // €270.00
        pricePerCredit: 1.80,
        discount: 10.0
      });
    });

    it('should handle boundary values correctly', () => {
      // Test boundary between tier 1 and 2
      const tier1Max = calculateSubscriptionPricing(44);
      const tier2Min = calculateSubscriptionPricing(45);
      
      expect(tier1Max.discount).toBe(0);
      expect(tier2Min.discount).toBe(2.5);
      expect(tier2Min.priceInCents).toBeLessThan(tier1Max.priceInCents + 1000); // Should be cheaper per credit

      // Test boundary between tier 2 and 3
      const tier2Max = calculateSubscriptionPricing(84);
      const tier3Min = calculateSubscriptionPricing(85);
      
      expect(tier2Max.discount).toBe(2.5);
      expect(tier3Min.discount).toBe(5.0);

      // Test boundary between tier 3 and 4
      const tier3Max = calculateSubscriptionPricing(124);
      const tier4Min = calculateSubscriptionPricing(125);
      
      expect(tier3Max.discount).toBe(5.0);
      expect(tier4Min.discount).toBe(10.0);
    });
  });

  describe('calculateOneTimePricing', () => {
    it('should use predefined credit pack pricing when available', () => {
      // Test exact matches with CREDIT_PACKS
      const pricing5 = calculateOneTimePricing(5);
      expect(pricing5).toEqual({
        credits: 5,
        priceInCents: 1150, // €11.50
        pricePerCredit: 2.30,
        discount: 0
      });

      const pricing10 = calculateOneTimePricing(10);
      expect(pricing10).toEqual({
        credits: 10,
        priceInCents: 2300, // €23.00
        pricePerCredit: 2.30,
        discount: 0
      });

      const pricing30 = calculateOneTimePricing(30);
      expect(pricing30).toEqual({
        credits: 30,
        priceInCents: 6700, // €67.00
        pricePerCredit: 67 / 30, // ~€2.23
        discount: 3
      });

      const pricing50 = calculateOneTimePricing(50);
      expect(pricing50).toEqual({
        credits: 50,
        priceInCents: 10300, // €103.00
        pricePerCredit: 103 / 50, // €2.06
        discount: 10
      });
    });

    it('should use standard pricing for non-predefined amounts', () => {
      const pricing15 = calculateOneTimePricing(15);
      expect(pricing15).toEqual({
        credits: 15,
        priceInCents: 3450, // €34.50
        pricePerCredit: 2.30,
        discount: 0
      });

      const pricing100 = calculateOneTimePricing(100);
      expect(pricing100).toEqual({
        credits: 100,
        priceInCents: 23000, // €230.00
        pricePerCredit: 2.30,
        discount: 0
      });
    });

    it('should validate credit pack consistency', () => {
      // Verify CREDIT_PACKS constant is as expected
      expect(CREDIT_PACKS).toHaveLength(6);
      expect(CREDIT_PACKS[0]).toEqual({ credits: 5, price: 11.5 });
      expect(CREDIT_PACKS[5]).toEqual({ credits: 50, price: 103, discount: 10 });
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
      expect(validateCreditAmount(151)).toBe(false);
      expect(validateCreditAmount(200)).toBe(false);

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
      expect(validateOneTimeCreditAmount(1)).toBe(true);
      expect(validateOneTimeCreditAmount(5)).toBe(true);
      expect(validateOneTimeCreditAmount(50)).toBe(true);
      expect(validateOneTimeCreditAmount(100)).toBe(true);
      expect(validateOneTimeCreditAmount(200)).toBe(true);

      // Invalid amounts - below minimum
      expect(validateOneTimeCreditAmount(0)).toBe(false);

      // Invalid amounts - above maximum
      expect(validateOneTimeCreditAmount(201)).toBe(false);
      expect(validateOneTimeCreditAmount(500)).toBe(false);

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
      expect(desc5).toBe('5 credits every month at €2.00 per credit');

      const desc45 = getSubscriptionProductDescription(45);
      expect(desc45).toBe('45 credits every month at €1.95 per credit (2.5% discount)');

      const desc85 = getSubscriptionProductDescription(85);
      expect(desc85).toBe('85 credits every month at €1.90 per credit (5% discount)');

      const desc125 = getSubscriptionProductDescription(125);
      expect(desc125).toBe('125 credits every month at €1.80 per credit (10% discount)');
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
      const desc5 = getOneTimeProductDescription(5);
      expect(desc5).toBe('5 credits at $2.30 per credit');

      const desc30 = getOneTimeProductDescription(30);
      expect(desc30).toBe('30 credits at $2.23 per credit (3% discount)');

      const desc50 = getOneTimeProductDescription(50);
      expect(desc50).toBe('50 credits at $2.06 per credit (10% discount)');
    });

    it('should generate correct descriptions for non-predefined amounts', () => {
      const desc15 = getOneTimeProductDescription(15);
      expect(desc15).toBe('15 credits at $2.30 per credit');

      const desc100 = getOneTimeProductDescription(100);
      expect(desc100).toBe('100 credits at $2.30 per credit');
    });
  });

  describe('price calculation accuracy', () => {
    it('should handle floating point arithmetic correctly', () => {
      // Test problematic floating point calculations
      const pricing45 = calculateSubscriptionPricing(45);
      expect(pricing45.priceInCents).toBe(8775); // Should be exact, no rounding errors

      const pricing85 = calculateSubscriptionPricing(85);
      expect(pricing85.priceInCents).toBe(16150); // Should be exact

      const pricing125 = calculateSubscriptionPricing(125);
      expect(pricing125.priceInCents).toBe(22500); // Should be exact
    });

    it('should round to nearest cent for fractional amounts', () => {
      // Test edge cases that might result in fractional cents
      const pricing7 = calculateOneTimePricing(7);
      expect(Number.isInteger(pricing7.priceInCents)).toBe(true);
      expect(pricing7.priceInCents).toBe(1610); // 7 * 2.30 = 16.10
    });
  });

  describe('business logic consistency', () => {
    it('should ensure subscription pricing tiers provide meaningful savings', () => {
      const tier1Max = calculateSubscriptionPricing(44);
      const tier2Min = calculateSubscriptionPricing(45);
      const tier3Min = calculateSubscriptionPricing(85);
      const tier4Min = calculateSubscriptionPricing(125);

      // Each tier should offer better value per credit
      expect(tier2Min.pricePerCredit).toBeLessThan(tier1Max.pricePerCredit);
      expect(tier3Min.pricePerCredit).toBeLessThan(tier2Min.pricePerCredit);
      expect(tier4Min.pricePerCredit).toBeLessThan(tier3Min.pricePerCredit);
    });

    it('should ensure one-time pricing incentivizes larger purchases', () => {
      const pack30 = CREDIT_PACKS.find(p => p.credits === 30)!;
      const pack40 = CREDIT_PACKS.find(p => p.credits === 40)!;
      const pack50 = CREDIT_PACKS.find(p => p.credits === 50)!;

      const pricePerCredit30 = pack30.price / pack30.credits;
      const pricePerCredit40 = pack40.price / pack40.credits;
      const pricePerCredit50 = pack50.price / pack50.credits;

      // Larger packs should have better price per credit
      expect(pricePerCredit40).toBeLessThan(pricePerCredit30);
      expect(pricePerCredit50).toBeLessThan(pricePerCredit40);
    });
  });
});