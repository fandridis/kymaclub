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
      it('should prioritize instance baseCredits over template baseCredits', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000), // 72 hours future
          baseCredits: 15
        } as Doc<"classInstances">;
        
        const template = {
          baseCredits: 8
        } as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.originalPrice).toBe(15);
        expect(result.finalPrice).toBe(13.5); // 15 - (15 * 0.1) = early bird discount
      });

      it('should use template baseCredits when instance has no baseCredits', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
          // No baseCredits property
        } as Doc<"classInstances">;
        
        const template = {
          baseCredits: 12
        } as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.originalPrice).toBe(12);
      });

      it('should use default price (10) when neither instance nor template has baseCredits', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
        } as Doc<"classInstances">;
        
        const template = {
          // No baseCredits property
        } as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.originalPrice).toBe(10);
      });

      it('should handle zero baseCredits correctly', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
          baseCredits: 0
        } as Doc<"classInstances">;
        
        const template = {
          baseCredits: 5
        } as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Logic is: instance.baseCredits || template.baseCredits || 10
        // So 0 (falsy) should fall back to template (5)
        expect(result.originalPrice).toBe(5);
        expect(result.finalPrice).toBe(4.5); // 5 - (5 * 0.1) early bird discount
      });
    });

    describe('Discount Calculation Safety', () => {
      it('should apply early bird discount (10%) for classes more than 48 hours away', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000), // 72 hours future
          baseCredits: 20
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.discountPercentage).toBe(0.1);
        expect(result.discountAmount).toBe(2);
        expect(result.finalPrice).toBe(18);
      });

      it('should apply low capacity discount (5%) when less than 50% full', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours (no early bird)
          baseCredits: 20,
          bookedCount: 3,
          capacity: 10 // 30% capacity
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.discountPercentage).toBe(0.05);
        expect(result.discountAmount).toBe(1);
        expect(result.finalPrice).toBe(19);
      });

      it('should not apply discounts when class is soon and well-booked', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours (no early bird)
          baseCredits: 20,
          bookedCount: 8,
          capacity: 10 // 80% capacity (no low capacity discount)
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.discountPercentage).toBe(0);
        expect(result.discountAmount).toBe(0);
        expect(result.finalPrice).toBe(20);
      });

      it('should prioritize early bird over capacity discount', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000), // 72 hours (early bird eligible)
          baseCredits: 20,
          bookedCount: 2,
          capacity: 10 // 20% capacity (also eligible for low capacity)
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Should apply early bird (10%), not low capacity (5%)
        expect(result.discountPercentage).toBe(0.1);
        expect(result.discountAmount).toBe(2);
        expect(result.finalPrice).toBe(18);
      });
    });

    describe('Edge Cases and Safety Guards', () => {
      it('should handle past class times safely', async () => {
        const instance = {
          startTime: Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago
          baseCredits: 20,
          bookedCount: 8,
          capacity: 10 // 80% capacity to avoid low capacity discount
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Should not apply early bird discount for past classes, and no low capacity discount due to high utilization
        expect(result.discountPercentage).toBe(0);
        expect(result.finalPrice).toBe(20);
      });

      it('should handle zero capacity safely (avoid division by zero)', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000),
          baseCredits: 20,
          bookedCount: 0,
          capacity: 0 // Zero capacity
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Should not crash, capacity utilization would be 0/0 = NaN
        expect(result.finalPrice).toBeGreaterThanOrEqual(0);
        expect(result.originalPrice).toBe(20);
        // When capacity is 0, bookedCount/capacity = 0/0 = NaN, NaN < 0.5 is false, so no discount
        // BUT: The current logic defaults to capacity 10 if capacity is 0, so 0/10 = 0 < 0.5, giving 5% discount
        expect(result.discountPercentage).toBe(0.05);
        expect(result.finalPrice).toBe(19); // 20 - 1
      });

      it('should handle missing capacity from template fallback', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000),
          baseCredits: 20,
          bookedCount: 3
          // No capacity property
        } as Doc<"classInstances">;
        
        const template = {
          capacity: 15
        } as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Should use template capacity (3/15 = 20% < 50%)
        expect(result.discountPercentage).toBe(0.05);
        expect(result.finalPrice).toBe(19);
      });

      it('should handle completely missing capacity data', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000),
          baseCredits: 20,
          bookedCount: 3
          // No capacity
        } as Doc<"classInstances">;
        
        const template = {
          // No capacity
        } as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Should use default capacity 10, so 3/10 = 30% < 50%
        expect(result.discountPercentage).toBe(0.05);
        expect(result.finalPrice).toBe(19);
      });

      it('should never produce negative prices', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
          baseCredits: 1 // Very low base price
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Even with 10% discount, should not go negative
        expect(result.finalPrice).toBeGreaterThanOrEqual(0);
        expect(result.finalPrice).toBe(0.9); // 1 - 0.1
      });

      it('should handle very high booking counts without crashing', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000),
          baseCredits: 20,
          bookedCount: 1000000, // Very high booking count
          capacity: 10
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        // Capacity utilization is 100000% (way over 50%), so no low capacity discount
        expect(result.discountPercentage).toBe(0);
        expect(result.finalPrice).toBe(20);
      });
    });

    describe('Price Calculation Accuracy', () => {
      it('should calculate discount amount correctly', async () => {
        const instance = {
          startTime: Date.now() + (72 * 60 * 60 * 1000),
          baseCredits: 25
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.originalPrice).toBe(25);
        expect(result.discountPercentage).toBe(0.1);
        expect(result.discountAmount).toBe(2.5); // 25 * 0.1
        expect(result.finalPrice).toBe(22.5); // 25 - 2.5
      });

      it('should handle floating point arithmetic correctly', async () => {
        const instance = {
          startTime: Date.now() + (24 * 60 * 60 * 1000),
          baseCredits: 33,
          bookedCount: 1,
          capacity: 3 // 33.33% capacity
        } as Doc<"classInstances">;
        
        const template = {} as Doc<"classTemplates">;
        
        const result = await calculateFinalPrice(instance, template);
        
        expect(result.discountPercentage).toBe(0.05);
        expect(result.discountAmount).toBeCloseTo(1.65, 2); // 33 * 0.05, using toBeCloseTo for floating point
        expect(result.finalPrice).toBeCloseTo(31.35, 2); // 33 - 1.65, using toBeCloseTo for floating point
      });
    });
  });

  describe('pricingOperations object', () => {
    it('should export calculateFinalPrice function', () => {
      expect(pricingOperations.calculateFinalPrice).toBe(calculateFinalPrice);
    });
  });
});