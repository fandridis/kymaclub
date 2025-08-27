import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateFinalPrice, pricingOperations } from "./pricing";
import type { Doc } from "../convex/_generated/dataModel";

// Mock console.log to reduce test noise
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Pricing Operations - Safety Tests', () => {
  
  describe('calculateFinalPrice', () => {
    
    describe('Base Price Selection (Financial Safety)', () => {
      it('should prioritize instance price over template price', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000), // 72 hours future
          price: 1500 // 15 euros in cents
        } as Doc<"classInstances">;
        
        const template = {
          price: 800 // 8 euros in cents
        } as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.originalPrice).toBe(1500);
        expect(result.finalPrice).toBe(1350); // 1500 - (1500 * 0.1) = early bird discount
      });

      it('should use template price when instance has no price', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
          // No price property
        } as Doc<"classInstances">;
        
        const template = {
          price: 1200 // 12 euros in cents
        } as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.originalPrice).toBe(1200);
      });

      it('should use default price (1000 cents) when neither instance nor template has price', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
        } as Doc<"classInstances">;
        
        const template = {
          // No price property
        } as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.originalPrice).toBe(1000);
      });

      it('should handle zero price correctly', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
          price: 0
        } as Doc<"classInstances">;
        
        const template = {
          price: 500
        } as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Logic is: instance.price || template.price || 1000
        // So 0 (falsy) should fall back to template (500)
        expect(result.originalPrice).toBe(500);
        expect(result.finalPrice).toBe(450); // 500 - (500 * 0.1) early bird discount
      });
    });

    describe('Discount Calculation Safety', () => {
      it('should apply early bird discount (10%) for classes more than 48 hours away', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000), // 72 hours future
          price: 2000
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.discountPercentage).toBe(0.1);
        expect(result.discountAmount).toBe(200);
        expect(result.finalPrice).toBe(1800);
      });

      it('should apply low capacity discount (5%) when less than 50% full', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours (no early bird)
          price: 2000,
          bookedCount: 3,
          capacity: 10 // 30% capacity
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.discountPercentage).toBe(0.05);
        expect(result.discountAmount).toBe(100);
        expect(result.finalPrice).toBe(1900);
      });

      it('should not apply discounts when class is soon and well-booked', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours (no early bird)
          price: 2000,
          bookedCount: 8,
          capacity: 10 // 80% capacity (no low capacity discount)
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.discountPercentage).toBe(0);
        expect(result.discountAmount).toBe(0);
        expect(result.finalPrice).toBe(2000);
      });

      it('should prioritize early bird over capacity discount', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000), // 72 hours (early bird eligible)
          price: 2000,
          bookedCount: 2,
          capacity: 10 // 20% capacity (also eligible for low capacity)
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Should apply early bird (10%), not low capacity (5%)
        expect(result.discountPercentage).toBe(0.1);
        expect(result.discountAmount).toBe(200);
        expect(result.finalPrice).toBe(1800);
      });
    });

    describe('Edge Cases and Safety Guards', () => {
      it('should handle past class times safely', async () => {
        const instance = {
          startTime: Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago
          price: 2000,
          bookedCount: 8,
          capacity: 10 // 80% capacity to avoid low capacity discount
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Should not apply early bird discount for past classes, and no low capacity discount due to high utilization
        expect(result.discountPercentage).toBe(0);
        expect(result.finalPrice).toBe(2000);
      });

      it('should handle zero capacity safely (avoid division by zero)', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000),
          price: 2000,
          bookedCount: 0,
          capacity: 0 // Zero capacity
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Should not crash, capacity utilization would be 0/0 = NaN
        expect(result.finalPrice).toBeGreaterThanOrEqual(0);
        expect(result.originalPrice).toBe(2000);
        // When capacity is 0, bookedCount/capacity = 0/0 = NaN, NaN < 0.5 is false, so no discount
        // BUT: The current logic defaults to capacity 10 if capacity is 0, so 0/10 = 0 < 0.5, giving 5% discount
        expect(result.discountPercentage).toBe(0.05);
        expect(result.finalPrice).toBe(1900); // 2000 - 100
      });

      it('should handle missing capacity from template fallback', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000),
          price: 2000,
          bookedCount: 3
          // No capacity property
        } as Doc<"classInstances">;
        
        const template = {
          capacity: 15
        } as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Should use template capacity (3/15 = 20% < 50%)
        expect(result.discountPercentage).toBe(0.05);
        expect(result.finalPrice).toBe(1900);
      });

      it('should handle completely missing capacity data', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000),
          price: 2000,
          bookedCount: 3
          // No capacity
        } as Doc<"classInstances">;
        
        const template = {
          // No capacity
        } as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Should use default capacity 10, so 3/10 = 30% < 50%
        expect(result.discountPercentage).toBe(0.05);
        expect(result.finalPrice).toBe(1900);
      });

      it('should never produce negative prices', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
          price: 100 // Very low base price (1 euro in cents)
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Even with 10% discount, should not go negative
        expect(result.finalPrice).toBeGreaterThanOrEqual(0);
        expect(result.finalPrice).toBe(90); // 100 - 10
      });

      it('should handle very high booking counts without crashing', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000),
          price: 2000,
          bookedCount: 1000000, // Very high booking count
          capacity: 10
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Capacity utilization is 100000% (way over 50%), so no low capacity discount
        expect(result.discountPercentage).toBe(0);
        expect(result.finalPrice).toBe(2000);
      });
    });

    describe('Price Calculation Accuracy', () => {
      it('should calculate discount amount correctly', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
          price: 2500
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.originalPrice).toBe(2500);
        expect(result.discountPercentage).toBe(0.1);
        expect(result.discountAmount).toBe(250); // 2500 * 0.1
        expect(result.finalPrice).toBe(2250); // 2500 - 250
      });

      it('should handle floating point arithmetic correctly', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000),
          price: 3300,
          bookedCount: 1,
          capacity: 3 // 33.33% capacity
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.discountPercentage).toBe(0.05);
        expect(result.discountAmount).toBe(165); // 3300 * 0.05 = 165 (Math.round handles this)
        expect(result.finalPrice).toBe(3135); // 3300 - 165
      });
    });
  });

  describe('pricingOperations object', () => {
    it('should export calculateFinalPrice function', () => {
      expect(pricingOperations.calculateFinalPrice).toBe(calculateFinalPrice);
    });
  });
});