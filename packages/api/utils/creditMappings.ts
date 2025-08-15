/**
 * Credit System Type Mappings
 * 
 * Provides consistent mapping between:
 * - creditLedger.type (detailed transaction classification)
 * - creditTransactions.transactionAction (high-level action grouping)
 * - creditTransactions.transactionActor (who initiated the action)
 */

// Credit Ledger Types (detailed classification for reporting)
export const CREDIT_LEDGER_TYPES = {
  // Consumer actions
  CREDIT_PURCHASE: "credit_purchase" as const,
  CREDIT_SPEND: "credit_spend" as const,
  CREDIT_REFUND: "credit_refund" as const,
  CREDIT_BONUS: "credit_bonus" as const,
  CREDIT_EXPIRE: "credit_expire" as const,

  // Business actions
  REVENUE_EARN: "revenue_earn" as const,
  REVENUE_PAYOUT: "revenue_payout" as const,

  // System actions (balancing entries)
  SYSTEM_CREDIT_COST: "system_credit_cost" as const,
  SYSTEM_REFUND_COST: "system_refund_cost" as const,
  SYSTEM_PAYOUT_COST: "system_payout_cost" as const,
} as const;

// Transaction Actions (high-level grouping)
export const TRANSACTION_ACTIONS = {
  CREDIT_PURCHASE: "credit_purchase" as const,
  CREDIT_BONUS: "credit_bonus" as const,
  CREDIT_SPEND: "credit_spend" as const,
  CREDIT_EXPIRE: "credit_expire" as const,
  CREDIT_REFUND: "credit_refund" as const,
  REVENUE_EARN: "revenue_earn" as const,
  REVENUE_PAYOUT: "revenue_payout" as const,
  SYSTEM_OPERATION: "system_operation" as const,
} as const;

// Transaction Actors (who initiated the action)
export const TRANSACTION_ACTORS = {
  CONSUMER: "consumer" as const,
  BUSINESS: "business" as const,
  SYSTEM: "system" as const,
  PAYMENT_PROCESSOR: "payment_processor" as const,
} as const;

// Type exports
export type CreditLedgerType = typeof CREDIT_LEDGER_TYPES[keyof typeof CREDIT_LEDGER_TYPES];
export type TransactionAction = typeof TRANSACTION_ACTIONS[keyof typeof TRANSACTION_ACTIONS];
export type TransactionActor = typeof TRANSACTION_ACTORS[keyof typeof TRANSACTION_ACTORS];

/**
 * Map detailed ledger type to high-level transaction action
 */
export const mapLedgerTypeToAction = (ledgerType: CreditLedgerType): TransactionAction => {
  const mapping: Record<CreditLedgerType, TransactionAction> = {
    [CREDIT_LEDGER_TYPES.CREDIT_PURCHASE]: TRANSACTION_ACTIONS.CREDIT_PURCHASE,
    [CREDIT_LEDGER_TYPES.CREDIT_SPEND]: TRANSACTION_ACTIONS.CREDIT_SPEND,
    [CREDIT_LEDGER_TYPES.CREDIT_REFUND]: TRANSACTION_ACTIONS.CREDIT_REFUND,
    [CREDIT_LEDGER_TYPES.CREDIT_BONUS]: TRANSACTION_ACTIONS.CREDIT_BONUS,
    [CREDIT_LEDGER_TYPES.CREDIT_EXPIRE]: TRANSACTION_ACTIONS.CREDIT_EXPIRE,
    [CREDIT_LEDGER_TYPES.REVENUE_EARN]: TRANSACTION_ACTIONS.REVENUE_EARN,
    [CREDIT_LEDGER_TYPES.REVENUE_PAYOUT]: TRANSACTION_ACTIONS.REVENUE_PAYOUT,
    [CREDIT_LEDGER_TYPES.SYSTEM_CREDIT_COST]: TRANSACTION_ACTIONS.SYSTEM_OPERATION,
    [CREDIT_LEDGER_TYPES.SYSTEM_REFUND_COST]: TRANSACTION_ACTIONS.SYSTEM_OPERATION,
    [CREDIT_LEDGER_TYPES.SYSTEM_PAYOUT_COST]: TRANSACTION_ACTIONS.SYSTEM_OPERATION,
  };

  return mapping[ledgerType];
};

/**
 * Map ledger type to appropriate transaction actor
 */
export const mapLedgerTypeToActor = (ledgerType: CreditLedgerType): TransactionActor => {
  const mapping: Record<CreditLedgerType, TransactionActor> = {
    [CREDIT_LEDGER_TYPES.CREDIT_PURCHASE]: TRANSACTION_ACTORS.CONSUMER,
    [CREDIT_LEDGER_TYPES.CREDIT_SPEND]: TRANSACTION_ACTORS.CONSUMER,
    [CREDIT_LEDGER_TYPES.CREDIT_REFUND]: TRANSACTION_ACTORS.CONSUMER,
    [CREDIT_LEDGER_TYPES.CREDIT_BONUS]: TRANSACTION_ACTORS.SYSTEM,
    [CREDIT_LEDGER_TYPES.CREDIT_EXPIRE]: TRANSACTION_ACTORS.SYSTEM,
    [CREDIT_LEDGER_TYPES.REVENUE_EARN]: TRANSACTION_ACTORS.BUSINESS,
    [CREDIT_LEDGER_TYPES.REVENUE_PAYOUT]: TRANSACTION_ACTORS.BUSINESS,
    [CREDIT_LEDGER_TYPES.SYSTEM_CREDIT_COST]: TRANSACTION_ACTORS.SYSTEM,
    [CREDIT_LEDGER_TYPES.SYSTEM_REFUND_COST]: TRANSACTION_ACTORS.SYSTEM,
    [CREDIT_LEDGER_TYPES.SYSTEM_PAYOUT_COST]: TRANSACTION_ACTORS.SYSTEM,
  };

  return mapping[ledgerType];
};

/**
 * Determine transaction action and actor from a transaction's ledger entries
 * Uses the primary (non-system) entry to determine the action
 */
export const getTransactionMeta = (ledgerEntries: Array<{ type: CreditLedgerType; account: string }>) => {
  // Find the primary entry (non-system entry that describes the main action)
  const primaryEntry = ledgerEntries.find(entry => entry.account !== "system") || ledgerEntries[0];

  if (!primaryEntry) {
    throw new Error("Transaction must have at least one ledger entry");
  }

  return {
    action: mapLedgerTypeToAction(primaryEntry.type),
    actor: mapLedgerTypeToActor(primaryEntry.type),
  };
};

/**
 * Validate that transaction action matches its ledger entries
 */
export const validateTransactionConsistency = (
  transactionAction: TransactionAction,
  transactionActor: TransactionActor,
  ledgerEntries: Array<{ type: CreditLedgerType; account: string }>
): boolean => {
  const { action, actor } = getTransactionMeta(ledgerEntries);
  return action === transactionAction && actor === transactionActor;
};