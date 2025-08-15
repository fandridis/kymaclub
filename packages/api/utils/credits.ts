import type { Id } from "../convex/_generated/dataModel";
import { nanoid } from "nanoid";
import { CreditLedgerType } from "./creditMappings";

/**
 * Credit utility types and functions
 */

// Input types for credit operations
export type GrantCreditArgs = {
  idempotencyKey: string;
  userId: Id<"users">;
  amount: number;
  createdBy: Id<"users">;
  description?: string;
  externalReference?: string;
  creditValue?: number;
  expiresAt?: number;
  kind?: "purchase" | "bonus";
};

export type TransferCreditArgs = {
  idempotencyKey: string;
  bookingId: Id<"bookings">;
  classInstanceId: Id<"classInstances">;
  businessId: Id<"businesses">;
  userId: Id<"users">;
  creditsAmount: number;
  createdBy: Id<"users">;
  description?: string;
};

export type ReconcileUserArgs = {
  userId: Id<"users">;
  updateCache?: boolean;
};

// Result types
export type CreditTransferResult = {
  transactionId: string;
};

export type ReconcileResult = {
  cachedCredits: number;
  computedCredits: number;
  deltaCredits: number;
  cachedLifetimeCredits: number;
  computedLifetimeCredits: number;
  deltaLifetimeCredits: number;
  updated: boolean;
};

// Ledger entry types for domain operations
export interface CreditLedgerEntry {
  transactionId: string;
  account: "customer" | "business" | "system";
  userId?: Id<"users">;
  businessId?: Id<"businesses">;
  systemEntity?: string;
  amount: number;
  creditValue?: number;
  expiresAt?: number;
  type: CreditLedgerType;
  relatedBookingId?: Id<"bookings">;
  relatedClassInstanceId?: Id<"classInstances">;
  description: string;
  idempotencyKey: string;
  effectiveAt: number;
  createdAt: number;
  createdBy: Id<"users">;
}

/**
 * Generate a consistent idempotency key for a logical operation.
 */
export function makeIdempotencyKey(namespace: string, stableId?: string | number): string {
  if (stableId !== undefined && stableId !== null) {
    return `${namespace}:${stableId}`;
  }
  return `${namespace}:${nanoid()}`;
}

/**
 * Validate credit amount is positive and within limits
 */
export function validateCreditAmount(amount: number): void {
  if (amount <= 0) {
    throw new Error("Credit amount must be positive");
  }

  if (!Number.isFinite(amount)) {
    throw new Error("Credit amount must be a finite number");
  }

  if (amount > 10000) {
    throw new Error("Credit amount exceeds maximum limit of 10,000");
  }
}