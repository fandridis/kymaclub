import { Doc } from "../convex/_generated/dataModel";

export type CreditTransaction = Doc<"creditTransactions">;
export type CreditTransactionType = CreditTransaction['type'];
export type CreditTransactionReason = CreditTransaction['reason'];
export type CreditTransactionStatus = CreditTransaction['status'];