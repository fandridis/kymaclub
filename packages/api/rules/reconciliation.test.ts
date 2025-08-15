import { describe, it, expect } from "vitest";
import { ConvexError } from "convex/values";
import type { Id, Doc } from "../convex/_generated/dataModel";
import type { UserCreditBalance } from "../utils/reconciliation";
import { reconciliationRules } from "./reconciliation";

const MOCK_USER_ID = "user123" as Id<"users">;
const MOCK_TIME = 1640000000000;

describe("reconciliationRules", () => {
  describe("validateUserId", () => {
    it("should pass for valid user ID", () => {
      expect(() => reconciliationRules.validateUserId(MOCK_USER_ID)).not.toThrow();
    });

    it("should throw for undefined user ID", () => {
      expect(() => reconciliationRules.validateUserId(undefined as any))
        .toThrow(ConvexError);
    });
  });

  describe("validateReconciliationOptions", () => {
    it("should pass for valid options", () => {
      expect(() => reconciliationRules.validateReconciliationOptions({ forceUpdate: true }))
        .not.toThrow();

      expect(() => reconciliationRules.validateReconciliationOptions(undefined))
        .not.toThrow();
    });

    it("should throw for invalid options", () => {
      expect(() => reconciliationRules.validateReconciliationOptions("invalid" as any))
        .toThrow(ConvexError);
    });
  });

  describe("validateBulkReconciliationArgs", () => {
    it("should pass for valid bulk args", () => {
      expect(() => reconciliationRules.validateBulkReconciliationArgs({
        batchSize: 100,
        userIds: [MOCK_USER_ID]
      })).not.toThrow();
    });

    it("should throw for invalid batch size", () => {
      expect(() => reconciliationRules.validateBulkReconciliationArgs({
        batchSize: 0
      })).toThrow(ConvexError);

      expect(() => reconciliationRules.validateBulkReconciliationArgs({
        batchSize: 2000
      })).toThrow(ConvexError);
    });

    it("should throw for too many users", () => {
      const manyUsers = Array(10001).fill(MOCK_USER_ID) as Id<"users">[];

      expect(() => reconciliationRules.validateBulkReconciliationArgs({
        userIds: manyUsers
      })).toThrow(ConvexError);
    });
  });

  describe("validateUserExists", () => {
    it("should return user if exists", () => {
      const mockUser = {
        _id: MOCK_USER_ID,
        email: "test@test.com"
      } as Doc<"users">;

      const result = reconciliationRules.validateUserExists(mockUser, MOCK_USER_ID);
      expect(result).toBe(mockUser);
    });

    it("should throw if user not found", () => {
      expect(() => reconciliationRules.validateUserExists(null, MOCK_USER_ID))
        .toThrow(ConvexError);
    });
  });

  describe("validateCalculatedBalance", () => {
    it("should pass for valid balance", () => {
      const balance: UserCreditBalance = {
        availableCredits: 100,
        heldCredits: 10,
        lifetimeCredits: 200,
        expiredCredits: 5,
        totalCredits: 115,
        calculatedAt: MOCK_TIME
      };

      expect(() => reconciliationRules.validateCalculatedBalance(balance, MOCK_USER_ID))
        .not.toThrow();
    });

    it("should throw for negative available credits", () => {
      const balance: UserCreditBalance = {
        availableCredits: -10,
        heldCredits: 10,
        lifetimeCredits: 200,
        expiredCredits: 5,
        totalCredits: 5,
        calculatedAt: MOCK_TIME
      };

      expect(() => reconciliationRules.validateCalculatedBalance(balance, MOCK_USER_ID))
        .toThrow(ConvexError);
    });

    it("should throw for negative lifetime credits", () => {
      const balance: UserCreditBalance = {
        availableCredits: 100,
        heldCredits: 10,
        lifetimeCredits: -50,
        expiredCredits: 5,
        totalCredits: 115,
        calculatedAt: MOCK_TIME
      };

      expect(() => reconciliationRules.validateCalculatedBalance(balance, MOCK_USER_ID))
        .toThrow(ConvexError);
    });

    it("should throw when available + held exceeds total", () => {
      const balance: UserCreditBalance = {
        availableCredits: 100,
        heldCredits: 50,
        lifetimeCredits: 200,
        expiredCredits: 5,
        totalCredits: 100, // Less than available + held
        calculatedAt: MOCK_TIME
      };

      expect(() => reconciliationRules.validateCalculatedBalance(balance, MOCK_USER_ID))
        .toThrow(ConvexError);
    });

    it("should throw for unreasonably high lifetime credits", () => {
      const balance: UserCreditBalance = {
        availableCredits: 100,
        heldCredits: 10,
        lifetimeCredits: 2000000, // Too high
        expiredCredits: 5,
        totalCredits: 115,
        calculatedAt: MOCK_TIME
      };

      expect(() => reconciliationRules.validateCalculatedBalance(balance, MOCK_USER_ID))
        .toThrow(ConvexError);
    });
  });

  describe("shouldUpdateCache", () => {
    const computedBalance: UserCreditBalance = {
      availableCredits: 100,
      heldCredits: 10,
      lifetimeCredits: 200,
      expiredCredits: 5,
      totalCredits: 115,
      calculatedAt: MOCK_TIME
    };

    it("should return true when forceUpdate is set", () => {
      const cachedBalance = {
        credits: 100,
        heldCredits: 10,
        lifetimeCredits: 200,
        creditsLastUpdated: MOCK_TIME
      };

      const result = reconciliationRules.shouldUpdateCache(
        computedBalance,
        cachedBalance,
        { forceUpdate: true }
      );

      expect(result).toBe(true);
    });

    it("should return true when never updated", () => {
      const cachedBalance = {
        credits: 100,
        heldCredits: 10,
        lifetimeCredits: 200,
        creditsLastUpdated: null
      };

      const result = reconciliationRules.shouldUpdateCache(
        computedBalance,
        cachedBalance
      );

      expect(result).toBe(true);
    });

    it("should return true when significant differences exist", () => {
      const cachedBalance = {
        credits: 90, // 10 credit difference
        heldCredits: 10,
        lifetimeCredits: 200,
        creditsLastUpdated: MOCK_TIME
      };

      const result = reconciliationRules.shouldUpdateCache(
        computedBalance,
        cachedBalance
      );

      expect(result).toBe(true);
    });

    it("should return false when values match within tolerance", () => {
      const cachedBalance = {
        credits: 100.005, // Within tolerance
        heldCredits: 10,
        lifetimeCredits: 200,
        creditsLastUpdated: MOCK_TIME
      };

      const result = reconciliationRules.shouldUpdateCache(
        computedBalance,
        cachedBalance
      );

      expect(result).toBe(false);
    });
  });

  describe("detectInconsistencies", () => {
    const computedBalance: UserCreditBalance = {
      availableCredits: 100,
      heldCredits: 10,
      lifetimeCredits: 200,
      expiredCredits: 5,
      totalCredits: 115,
      calculatedAt: MOCK_TIME
    };

    it("should detect no inconsistencies when values match", () => {
      const cachedBalance = {
        credits: 100,
        heldCredits: 10,
        lifetimeCredits: 200,
        creditsLastUpdated: MOCK_TIME
      };

      const inconsistencies = reconciliationRules.detectInconsistencies(
        computedBalance,
        cachedBalance,
        MOCK_TIME
      );

      expect(inconsistencies).toHaveLength(0);
    });

    it("should detect available credits mismatch", () => {
      const cachedBalance = {
        credits: 90,
        heldCredits: 10,
        lifetimeCredits: 200,
        creditsLastUpdated: MOCK_TIME
      };

      const inconsistencies = reconciliationRules.detectInconsistencies(
        computedBalance,
        cachedBalance,
        MOCK_TIME
      );

      expect(inconsistencies).toHaveLength(1);
      expect(inconsistencies[0]).toContain("Available credits mismatch");
    });

    it("should detect stale cache data", () => {
      const cachedBalance = {
        credits: 100,
        heldCredits: 10,
        lifetimeCredits: 200,
        creditsLastUpdated: MOCK_TIME - (8 * 24 * 60 * 60 * 1000) // 8 days ago
      };

      const inconsistencies = reconciliationRules.detectInconsistencies(
        computedBalance,
        cachedBalance,
        MOCK_TIME
      );

      expect(inconsistencies).toHaveLength(1);
      expect(inconsistencies[0]).toContain("Stale cache data");
    });

    it("should detect multiple inconsistencies", () => {
      const cachedBalance = {
        credits: 90, // Mismatch
        heldCredits: 5, // Mismatch
        lifetimeCredits: 180, // Mismatch
        creditsLastUpdated: MOCK_TIME - (8 * 24 * 60 * 60 * 1000) // Stale
      };

      const inconsistencies = reconciliationRules.detectInconsistencies(
        computedBalance,
        cachedBalance,
        MOCK_TIME
      );

      expect(inconsistencies).toHaveLength(4); // 3 mismatches + stale data
    });
  });

  describe("validateReconciliationFrequency", () => {
    it("should pass when never reconciled", () => {
      expect(() => reconciliationRules.validateReconciliationFrequency(null))
        .not.toThrow();
    });

    it("should pass when enough time has passed", () => {
      const lastUpdated = MOCK_TIME - 120000; // 2 minutes ago

      expect(() => reconciliationRules.validateReconciliationFrequency(
        lastUpdated,
        60000, // 1 minute minimum
        MOCK_TIME
      )).not.toThrow();
    });

    it("should throw when reconciled too recently", () => {
      const lastUpdated = MOCK_TIME - 30000; // 30 seconds ago

      expect(() => reconciliationRules.validateReconciliationFrequency(
        lastUpdated,
        60000, // 1 minute minimum
        MOCK_TIME
      )).toThrow(ConvexError);
    });
  });
});