import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateFinalPrice, pricingOperations } from "./pricing";
import type { Doc } from "../convex/_generated/dataModel";

// Mock console.log to reduce test noise
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => { });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Pricing Operations - Discount Rule Tests', () => {

  describe('calculateFinalPrice', () => {

    describe('Base Price Selection (Financial Safety)', () => {
      it('should prioritize instance price over template price', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000), // 72 hours future
          price: 1500, // 15 euros in cents
          discountRules: [{
            id: "early-bird",
            name: "Early Bird",
            condition: { type: "hours_before_min", hours: 48 },
            discount: { type: "fixed_amount", value: 150 }
          }]
        } as Doc<"classInstances">;

        const template = {
          price: 800 // 8 euros in cents (should be ignored)
        } as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        expect(result.originalPrice).toBe(1500);
        expect(result.finalPrice).toBe(1350); // 1500 - 150 discount
        expect(result.discountAmount).toBe(150);
      });

      it('should use template price when instance has no price', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
          // No price property, no discount rules (template rules not used in pricing logic)
        } as Doc<"classInstances">;

        const template = {
          price: 1200, // 12 euros in cents
          discountRules: [{
            id: "template-discount",
            name: "Template Discount",
            condition: { type: "always" },
            discount: { type: "fixed_amount", value: 50 }
          }]
        } as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        expect(result.originalPrice).toBe(1200);
        expect(result.finalPrice).toBe(1200); // No discount applied (no instance discount rules)
        expect(result.discountAmount).toBe(0);
      });

      it('should use default 0 cents when neither instance nor template has price', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
        } as Doc<"classInstances">;

        const template = {
          // No price property
        } as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        expect(result.originalPrice).toBe(0);
        expect(result.finalPrice).toBe(0); // No price, no discount
        expect(result.discountAmount).toBe(0);
      });

      it('should handle zero price correctly', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
          price: 0,
          discountRules: [{
            id: "instance-early-bird",
            name: "Instance Early Bird",
            condition: { type: "hours_before_min", hours: 48 },
            discount: { type: "fixed_amount", value: 50 }
          }]
        } as Doc<"classInstances">;

        const template = {
          price: 500,
        } as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        // Logic is: instance.price || template.price || 0
        // So 0 (falsy) should fall back to template (500)
        expect(result.originalPrice).toBe(500);
        expect(result.finalPrice).toBe(450); // 500 - 50 discount
        expect(result.discountAmount).toBe(50);
      });
    });

    describe('Discount Rule Evaluation', () => {
      it('should apply discount when hours_before_min condition is met', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000), // 72 hours future
          price: 2000,
          discountRules: [{
            id: "early-bird",
            name: "Early Bird",
            condition: { type: "hours_before_min", hours: 48 },
            discount: { type: "fixed_amount", value: 200 }
          }]
        } as Doc<"classInstances">;

        const template = {} as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        expect(result.discountAmount).toBe(200);
        expect(result.finalPrice).toBe(1800);
        expect(result.discountPercentage).toBe(0.1); // 200/2000
      });

      it('should not apply discount when hours_before_min condition is not met', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours future (less than 48)
          price: 2000,
          discountRules: [{
            id: "early-bird",
            name: "Early Bird",
            condition: { type: "hours_before_min", hours: 48 },
            discount: { type: "fixed_amount", value: 200 }
          }]
        } as Doc<"classInstances">;

        const template = {} as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        expect(result.discountAmount).toBe(0);
        expect(result.finalPrice).toBe(2000);
        expect(result.discountPercentage).toBe(0);
      });

      it('should apply hours_before_max discount when within time window', async () => {
        const instance = {
          startTime: Date.now() + (12 * 60 * 60 * 1000), // 12 hours future
          price: 2000,
          discountRules: [{
            id: "last-minute",
            name: "Last Minute Deal",
            condition: { type: "hours_before_max", hours: 24 },
            discount: { type: "fixed_amount", value: 100 }
          }]
        } as Doc<"classInstances">;

        const template = {} as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        expect(result.discountAmount).toBe(100);
        expect(result.finalPrice).toBe(1900);
        expect(result.discountPercentage).toBe(0.05); // 100/2000
      });

      it('should apply the highest valid discount when multiple rules exist', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000), // 72 hours future
          price: 2000,
          discountRules: [
            {
              id: "small-discount",
              name: "Small Discount",
              condition: { type: "hours_before_min", hours: 48 },
              discount: { type: "fixed_amount", value: 50 }
            },
            {
              id: "big-discount",
              name: "Big Early Bird",
              condition: { type: "hours_before_min", hours: 48 },
              discount: { type: "fixed_amount", value: 300 }
            }
          ]
        } as Doc<"classInstances">;

        const template = {} as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        // Should apply the highest discount (300), not the smaller one (50)
        expect(result.discountAmount).toBe(300);
        expect(result.finalPrice).toBe(1700);
        expect(result.discountPercentage).toBe(0.15); // 300/2000
      });
    });

    describe('Edge Cases and Safety Guards', () => {
      it('should handle past class times safely', async () => {
        const instance = {
          startTime: Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago
          price: 2000,
          discountRules: [{
            id: "early-bird",
            name: "Early Bird",
            condition: { type: "hours_before_min", hours: 48 },
            discount: { type: "fixed_amount", value: 200 }
          }]
        } as Doc<"classInstances">;

        const template = {} as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        // Should not apply discount for past classes (negative hours until class)
        expect(result.discountAmount).toBe(0);
        expect(result.finalPrice).toBe(2000);
        expect(result.discountPercentage).toBe(0);
      });

      it('should handle always condition type correctly', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000),
          price: 2000,
          discountRules: [{
            id: "always-discount",
            name: "Always Available",
            condition: { type: "always" },
            discount: { type: "fixed_amount", value: 100 }
          }]
        } as Doc<"classInstances">;

        const template = {} as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        // Always condition should always apply
        expect(result.discountAmount).toBe(100);
        expect(result.finalPrice).toBe(1900);
        expect(result.discountPercentage).toBe(0.05); // 100/2000
      });

      it('should only use instance discount rules (not template rules)', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
          price: 2000
          // No discount rules - template rules are not used by pricing logic
        } as Doc<"classInstances">;

        const template = {
          discountRules: [{
            id: "template-early-bird",
            name: "Template Early Bird",
            condition: { type: "hours_before_min", hours: 48 },
            discount: { type: "fixed_amount", value: 150 }
          }]
        } as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        // Should NOT use template discount rules - only instance rules are used
        expect(result.discountAmount).toBe(0);
        expect(result.finalPrice).toBe(2000);
        expect(result.discountPercentage).toBe(0);
      });

      it('should handle no discount rules gracefully', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000),
          price: 2000
          // No discount rules
        } as Doc<"classInstances">;

        const template = {
          // No discount rules
        } as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        // Should apply no discounts
        expect(result.discountAmount).toBe(0);
        expect(result.finalPrice).toBe(2000);
        expect(result.discountPercentage).toBe(0);
      });

      it('should never produce negative prices', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
          price: 100, // Very low base price (1 euro in cents)
          discountRules: [{
            id: "huge-discount",
            name: "Huge Discount",
            condition: { type: "always" },
            discount: { type: "fixed_amount", value: 200 } // Discount bigger than price
          }]
        } as Doc<"classInstances">;

        const template = {} as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        // Should not go negative, minimum is 0
        expect(result.finalPrice).toBe(0);
        expect(result.originalPrice).toBe(100);
        expect(result.discountAmount).toBe(200);
      });

      it('should prioritize instance rules over template rules', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
          price: 2000,
          discountRules: [{
            id: "instance-discount",
            name: "Instance Discount",
            condition: { type: "always" },
            discount: { type: "fixed_amount", value: 100 }
          }]
        } as Doc<"classInstances">;

        const template = {
          discountRules: [{
            id: "template-discount",
            name: "Template Discount",
            condition: { type: "always" },
            discount: { type: "fixed_amount", value: 300 } // Higher discount, but should be ignored
          }]
        } as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        // Should use instance rules, not template rules
        expect(result.discountAmount).toBe(100);
        expect(result.finalPrice).toBe(1900);
        expect(result.discountPercentage).toBe(0.05); // 100/2000
      });
    });

    describe('Price Calculation Accuracy', () => {
      it('should calculate discount amount correctly', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
          price: 2500,
          discountRules: [{
            id: "fixed-discount",
            name: "Fixed Discount",
            condition: { type: "always" },
            discount: { type: "fixed_amount", value: 250 }
          }]
        } as Doc<"classInstances">;

        const template = {} as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        expect(result.originalPrice).toBe(2500);
        expect(result.discountAmount).toBe(250);
        expect(result.finalPrice).toBe(2250); // 2500 - 250
        expect(result.discountPercentage).toBe(0.1); // 250/2500
      });

      it('should handle percentage calculation correctly', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000),
          price: 3300,
          discountRules: [{
            id: "precise-discount",
            name: "Precise Discount",
            condition: { type: "always" },
            discount: { type: "fixed_amount", value: 165 }
          }]
        } as Doc<"classInstances">;

        const template = {} as Doc<"classTemplates">;

        const result = await calculateFinalPrice(instance, template);

        expect(result.discountAmount).toBe(165);
        expect(result.finalPrice).toBe(3135); // 3300 - 165
        expect(result.discountPercentage).toBe(0.05); // 165/3300 = 0.05
      });
    });
  });

  describe('pricingOperations object', () => {
    it('should export calculateFinalPrice function', () => {
      expect(pricingOperations.calculateFinalPrice).toBe(calculateFinalPrice);
    });
  });
});