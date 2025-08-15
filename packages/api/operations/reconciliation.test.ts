import { describe, it, expect } from "vitest";
import type { Id } from "../convex/_generated/dataModel";
import type { LedgerEntry } from "../utils/reconciliation";
import {
  calculateUserBalanceFromLedger,
  createReconciliationResult,
  prepareUserCacheUpdate,
  createUserBatches,
  calculateBulkProcessingStats,
  validateLedgerEntries,
  sortResultsByPriority
} from "./reconciliation";

const MOCK_USER_ID = "user123" as Id<"users">;
const MOCK_TIME = 1640000000000; // Fixed timestamp for testing

describe("reconciliation operations", () => {
  describe("calculateUserBalanceFromLedger", () => {
    it("should calculate correct balance with mixed entries", () => {
      const entries: LedgerEntry[] = [
        {
          userId: MOCK_USER_ID,
          amount: 100,
          type: "CREDIT_PURCHASE",
          effectiveAt: MOCK_TIME - 1000,
          deleted: false
        },
        {
          userId: MOCK_USER_ID, 
          amount: -20,
          type: "BOOKING_CHARGE",
          effectiveAt: MOCK_TIME - 500,
          deleted: false
        },
        {
          userId: MOCK_USER_ID,
          amount: 50,
          type: "BONUS_CREDIT",
          effectiveAt: MOCK_TIME - 200,
          deleted: false
        }
      ];

      const balance = calculateUserBalanceFromLedger(entries, MOCK_TIME);

      expect(balance.availableCredits).toBe(130); // 100 - 20 + 50
      expect(balance.lifetimeCredits).toBe(150); // 100 + 50 (positive entries only)
      expect(balance.totalCredits).toBe(130);
      expect(balance.calculatedAt).toBe(MOCK_TIME);
    });

    it("should handle expired credits correctly", () => {
      const entries: LedgerEntry[] = [
        {
          userId: MOCK_USER_ID,
          amount: 100,
          type: "CREDIT_PURCHASE", 
          effectiveAt: MOCK_TIME - 2000,
          expiresAt: MOCK_TIME - 1000, // Already expired
          deleted: false
        },
        {
          userId: MOCK_USER_ID,
          amount: 50,
          type: "CREDIT_PURCHASE",
          effectiveAt: MOCK_TIME - 500,
          expiresAt: MOCK_TIME + 1000, // Not expired
          deleted: false
        }
      ];

      const balance = calculateUserBalanceFromLedger(entries, MOCK_TIME);

      expect(balance.availableCredits).toBe(50); // Only non-expired credits
      expect(balance.expiredCredits).toBe(100); // Expired credits tracked separately
      expect(balance.lifetimeCredits).toBe(150); // All positive entries
      expect(balance.totalCredits).toBe(150); // Available + expired
    });

    it("should skip deleted and future entries", () => {
      const entries: LedgerEntry[] = [
        {
          userId: MOCK_USER_ID,
          amount: 100,
          type: "CREDIT_PURCHASE",
          effectiveAt: MOCK_TIME - 1000,
          deleted: false
        },
        {
          userId: MOCK_USER_ID,
          amount: 50,
          type: "CREDIT_PURCHASE", 
          effectiveAt: MOCK_TIME - 500,
          deleted: true // Should be skipped
        },
        {
          userId: MOCK_USER_ID,
          amount: 25,
          type: "CREDIT_PURCHASE",
          effectiveAt: MOCK_TIME + 1000, // Future entry, should be skipped
          deleted: false
        }
      ];

      const balance = calculateUserBalanceFromLedger(entries, MOCK_TIME);

      expect(balance.availableCredits).toBe(100); // Only the first entry
      expect(balance.lifetimeCredits).toBe(100);
    });

    it("should ensure no negative balances", () => {
      const entries: LedgerEntry[] = [
        {
          userId: MOCK_USER_ID,
          amount: -100, // More debits than credits
          type: "BOOKING_CHARGE",
          effectiveAt: MOCK_TIME - 1000,
          deleted: false
        }
      ];

      const balance = calculateUserBalanceFromLedger(entries, MOCK_TIME);

      expect(balance.availableCredits).toBe(0); // Should not go negative
      expect(balance.heldCredits).toBe(0);
      expect(balance.lifetimeCredits).toBe(0);
    });
  });

  describe("createReconciliationResult", () => {
    it("should create complete reconciliation result", () => {
      const computedBalance = {
        availableCredits: 100,
        heldCredits: 10,
        lifetimeCredits: 200,
        expiredCredits: 5,
        totalCredits: 115,
        calculatedAt: MOCK_TIME
      };

      const cachedBalance = {
        credits: 90,
        heldCredits: 15,
        lifetimeCredits: 190,
        creditsLastUpdated: MOCK_TIME - 1000
      };

      const inconsistencies = ["Test inconsistency"];

      const result = createReconciliationResult(
        MOCK_USER_ID,
        computedBalance,
        cachedBalance,
        inconsistencies,
        true,
        MOCK_TIME
      );

      expect(result.userId).toBe(MOCK_USER_ID);
      expect(result.computedBalance).toEqual(computedBalance);
      expect(result.cachedBalance).toEqual(cachedBalance);
      expect(result.deltas.availableCredits).toBe(10); // 100 - 90
      expect(result.deltas.heldCredits).toBe(-5); // 10 - 15  
      expect(result.deltas.lifetimeCredits).toBe(10); // 200 - 190
      expect(result.wasUpdated).toBe(true);
      expect(result.inconsistencies).toEqual(inconsistencies);
      expect(result.reconciledAt).toBe(MOCK_TIME);
    });
  });

  describe("prepareUserCacheUpdate", () => {
    it("should prepare correct user cache update", () => {
      const balance = {
        availableCredits: 100,
        heldCredits: 10,
        lifetimeCredits: 200,
        expiredCredits: 5,
        totalCredits: 115,
        calculatedAt: MOCK_TIME
      };

      const updatedBy = "admin123" as Id<"users">;

      const update = prepareUserCacheUpdate(balance, updatedBy, MOCK_TIME);

      expect(update.credits).toBe(100);
      expect(update.heldCredits).toBe(10);
      expect(update.lifetimeCredits).toBe(200);
      expect(update.creditsLastUpdated).toBe(MOCK_TIME);
    });
  });

  describe("createUserBatches", () => {
    it("should create correct batches", () => {
      const userIds = ["user1", "user2", "user3", "user4", "user5"] as Id<"users">[];
      
      const batches = createUserBatches(userIds, 2);

      expect(batches).toHaveLength(3);
      expect(batches[0]).toEqual(["user1", "user2"]);
      expect(batches[1]).toEqual(["user3", "user4"]);
      expect(batches[2]).toEqual(["user5"]);
    });

    it("should handle empty array", () => {
      const batches = createUserBatches([], 10);
      expect(batches).toHaveLength(0);
    });

    it("should throw error for invalid batch size", () => {
      expect(() => createUserBatches(["user1"] as Id<"users">[], 0))
        .toThrow("Batch size must be positive");
    });
  });

  describe("calculateBulkProcessingStats", () => {
    it("should calculate correct statistics", () => {
      const results = [
        {
          userId: MOCK_USER_ID,
          wasUpdated: true,
          inconsistencies: ["test"],
          computedBalance: {} as any,
          cachedBalance: {} as any,
          deltas: {} as any,
          reconciledAt: MOCK_TIME
        },
        {
          userId: "user2" as Id<"users">,
          wasUpdated: false,
          inconsistencies: [],
          computedBalance: {} as any,
          cachedBalance: {} as any,
          deltas: {} as any,
          reconciledAt: MOCK_TIME
        }
      ];

      const errors = [{ userId: "user3" as Id<"users">, error: "Test error" }];

      const stats = calculateBulkProcessingStats(results, errors, MOCK_TIME, MOCK_TIME + 1000);

      expect(stats.processedCount).toBe(2);
      expect(stats.updatedCount).toBe(1);
      expect(stats.inconsistencyCount).toBe(1);
      expect(stats.processingTimeMs).toBe(1000);
      expect(stats.errorCount).toBe(1);
      expect(stats.averageProcessingTimeMs).toBe(500);
    });
  });

  describe("validateLedgerEntries", () => {
    it("should return no errors for valid entries", () => {
      const entries: LedgerEntry[] = [
        {
          userId: MOCK_USER_ID,
          amount: 100,
          type: "CREDIT_PURCHASE",
          effectiveAt: MOCK_TIME,
          deleted: false
        }
      ];

      const errors = validateLedgerEntries(entries);
      expect(errors).toHaveLength(0);
    });

    it("should detect invalid amounts", () => {
      const entries: LedgerEntry[] = [
        {
          userId: MOCK_USER_ID,
          amount: NaN,
          type: "CREDIT_PURCHASE", 
          effectiveAt: MOCK_TIME,
          deleted: false
        }
      ];

      const errors = validateLedgerEntries(entries);
      expect(errors).toContain("Entry 0: amount must be a finite number");
    });

    it("should detect invalid timestamps", () => {
      const entries: LedgerEntry[] = [
        {
          userId: MOCK_USER_ID,
          amount: 100,
          type: "CREDIT_PURCHASE",
          effectiveAt: 0,
          expiresAt: -1,
          deleted: false
        }
      ];

      const errors = validateLedgerEntries(entries);
      expect(errors).toContain("Entry 0: effectiveAt must be positive");
      expect(errors).toContain("Entry 0: expiresAt must be after effectiveAt");
    });

    it("should detect missing required fields", () => {
      const entries: LedgerEntry[] = [
        {
          userId: "" as any,
          amount: 100,
          type: "",
          effectiveAt: MOCK_TIME,
          deleted: false
        }
      ];

      const errors = validateLedgerEntries(entries);
      expect(errors).toContain("Entry 0: userId is required");
      expect(errors).toContain("Entry 0: type must be a non-empty string");
    });
  });

  describe("sortResultsByPriority", () => {
    it("should prioritize results with inconsistencies", () => {
      const results = [
        {
          userId: "user1" as Id<"users">,
          inconsistencies: [],
          deltas: { availableCredits: 10, heldCredits: 0, lifetimeCredits: 0 },
          wasUpdated: false,
          computedBalance: {} as any,
          cachedBalance: {} as any,
          reconciledAt: MOCK_TIME
        },
        {
          userId: "user2" as Id<"users">,
          inconsistencies: ["Has issues"],
          deltas: { availableCredits: 5, heldCredits: 0, lifetimeCredits: 0 },
          wasUpdated: false,
          computedBalance: {} as any,
          cachedBalance: {} as any,
          reconciledAt: MOCK_TIME
        }
      ];

      const sorted = sortResultsByPriority(results);

      expect(sorted[0].userId).toBe("user2"); // Has inconsistencies, should be first
      expect(sorted[1].userId).toBe("user1");
    });

    it("should sort by delta magnitude when no inconsistencies", () => {
      const results = [
        {
          userId: "user1" as Id<"users">,
          inconsistencies: [],
          deltas: { availableCredits: 5, heldCredits: 0, lifetimeCredits: 0 },
          wasUpdated: false,
          computedBalance: {} as any,
          cachedBalance: {} as any,
          reconciledAt: MOCK_TIME
        },
        {
          userId: "user2" as Id<"users">,
          inconsistencies: [],
          deltas: { availableCredits: 20, heldCredits: 0, lifetimeCredits: 0 },
          wasUpdated: false,
          computedBalance: {} as any,
          cachedBalance: {} as any,
          reconciledAt: MOCK_TIME
        }
      ];

      const sorted = sortResultsByPriority(results);

      expect(sorted[0].userId).toBe("user2"); // Larger delta, should be first
      expect(sorted[1].userId).toBe("user1");
    });
  });
});