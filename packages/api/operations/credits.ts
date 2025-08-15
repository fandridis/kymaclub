import type { Id } from "../convex/_generated/dataModel";
import type {
  CreditLedgerEntry,
  GrantCreditArgs,
  TransferCreditArgs
} from "../utils/credits";
import { CREDIT_LEDGER_TYPES, CreditLedgerType } from "../utils/creditMappings";

/**
 * Generate ledger entries for granting credits to a user (purchase or bonus)
 * Pure function - returns the entries to be inserted
 */
export function createGrantLedgerEntries(args: GrantCreditArgs, now: number): CreditLedgerEntry[] {
  const { idempotencyKey, userId, amount, createdBy, description, kind = "purchase" } = args;
  const transactionId = idempotencyKey;

  const entries: CreditLedgerEntry[] = [];

  if (kind === "purchase") {
    const creditValue = args.creditValue ?? 2.0;
    const expiresAt = args.expiresAt ?? now + 3 * 30 * 24 * 60 * 60 * 1000; // 3 months

    // User receives purchased credits
    entries.push({
      transactionId,
      account: "customer",
      userId,
      amount,
      creditValue,
      expiresAt,
      type: CREDIT_LEDGER_TYPES.CREDIT_PURCHASE,
      description: description ?? "Credit purchase",
      idempotencyKey,
      effectiveAt: now,
      createdAt: now,
      createdBy,
    });

    // System balancing entry
    entries.push({
      transactionId,
      account: "system",
      systemEntity: "system",
      amount: -amount,
      creditValue,
      expiresAt,
      type: CREDIT_LEDGER_TYPES.SYSTEM_CREDIT_COST,
      description: description ?? "Credit purchase balancing entry",
      idempotencyKey,
      effectiveAt: now,
      createdAt: now,
      createdBy,
    });
  } else {
    // Bonus credits
    entries.push({
      transactionId,
      account: "customer",
      userId,
      amount,
      type: CREDIT_LEDGER_TYPES.CREDIT_BONUS,
      description: description ?? "Bonus credits granted by system",
      idempotencyKey,
      effectiveAt: now,
      createdAt: now,
      createdBy,
    });

    // System expense
    entries.push({
      transactionId,
      account: "system",
      systemEntity: "system",
      amount: -amount,
      type: CREDIT_LEDGER_TYPES.SYSTEM_CREDIT_COST,
      description: description ?? "Bonus credits expense",
      idempotencyKey,
      effectiveAt: now,
      createdAt: now,
      createdBy,
    });
  }

  return entries;
}

/**
 * Generate ledger entries for transferring credits from user to business
 * Pure function - returns the entries to be inserted
 */
export function createTransferLedgerEntries(
  args: TransferCreditArgs,
  now: number
): CreditLedgerEntry[] {
  const {
    idempotencyKey,
    userId,
    businessId,
    bookingId,
    classInstanceId,
    creditsAmount,
    createdBy,
    description
  } = args;

  const transactionId = idempotencyKey;

  const entries: CreditLedgerEntry[] = [];

  // User spends credits
  entries.push({
    transactionId,
    account: "customer",
    userId,
    amount: -creditsAmount,
    type: CREDIT_LEDGER_TYPES.CREDIT_SPEND,
    relatedBookingId: bookingId,
    relatedClassInstanceId: classInstanceId,
    description: description ?? "Class booking",
    idempotencyKey,
    effectiveAt: now,
    createdAt: now,
    createdBy,
  });

  // Business earns credits (full amount; no platform fee)
  if (creditsAmount > 0) {
    entries.push({
      transactionId,
      account: "business",
      businessId,
      amount: creditsAmount,
      type: CREDIT_LEDGER_TYPES.REVENUE_EARN,
      relatedBookingId: bookingId,
      relatedClassInstanceId: classInstanceId,
      description: description ?? "Class booking revenue",
      idempotencyKey,
      effectiveAt: now,
      createdAt: now,
      createdBy,
    });
  }

  return entries;
}

/**
 * Validate that ledger entries balance (double-entry accounting)
 * Pure function for domain validation
 */
export function validateLedgerBalance(entries: CreditLedgerEntry[]): boolean {
  const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
  return Math.abs(totalAmount) < 0.001; // Allow for small floating point errors
}

/**
 * Determine account type for a ledger entry based on entity fields
 * Pure function - no database calls
 */
export function determineAccountType(entry: {
  userId?: Id<"users">;
  businessId?: Id<"businesses">;
  systemEntity?: string;
}): "customer" | "business" | "system" | "payment_processor" {
  if (entry.userId) return "customer";
  if (entry.businessId) return "business";
  if (entry.systemEntity === "system") return "system";
  return "payment_processor";
}

/**
 * Create a single ledger entry with proper defaults and calculations
 * Pure function - returns the entry to be inserted
 */
export function createLedgerEntry(
  entry: {
    userId?: Id<"users">;
    businessId?: Id<"businesses">;
    systemEntity?: "system" | "payment_processor";
    amount: number;
    creditValue?: number;
    expiresAt?: number;
    type: CreditLedgerType;
    relatedBookingId?: Id<"bookings">;
    relatedClassInstanceId?: Id<"classInstances">;
    relatedPayoutId?: Id<"businessPayouts">;
  },
  transactionId: string,
  description: string,
  idempotencyKey: string,
  now: number,
  shouldExpireCredits: (type: CreditLedgerType) => boolean,
  calculateExpirationDate: (type: CreditLedgerType, settings: Record<string, number>, hasExtended: boolean, baseTime: number) => number | undefined
): {
  transactionId: string;
  userId?: Id<"users">;
  businessId?: Id<"businesses">;
  systemEntity?: "system" | "payment_processor";
  account: "customer" | "business" | "system" | "payment_processor";
  amount: number;
  creditValue?: number;
  expiresAt?: number;
  type: CreditLedgerType;
  relatedBookingId?: Id<"bookings">;
  relatedClassInstanceId?: Id<"classInstances">;
  relatedPayoutId?: Id<"businessPayouts">;
  description: string;
  idempotencyKey: string;
  effectiveAt: number;
  createdAt: number;
  deleted: boolean;
} {
  // Determine account type
  const account = determineAccountType(entry);

  // Calculate expiration if needed
  let expiresAt = entry.expiresAt;
  if (!expiresAt && entry.userId && shouldExpireCredits(entry.type)) {
    expiresAt = calculateExpirationDate(entry.type, {}, false, now);
  }

  return {
    transactionId,
    userId: entry.userId,
    businessId: entry.businessId,
    systemEntity: entry.systemEntity,
    account,
    amount: entry.amount,
    creditValue: entry.creditValue,
    expiresAt,
    type: entry.type,
    relatedBookingId: entry.relatedBookingId,
    relatedClassInstanceId: entry.relatedClassInstanceId,
    relatedPayoutId: entry.relatedPayoutId,
    description,
    idempotencyKey,
    effectiveAt: now,
    createdAt: now,
    deleted: false,
  };
}