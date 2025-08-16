import { Infer, v } from "convex/values";
import { creditTransactionsFields } from "../convex/schema";

const creditTransactionFieldObject = v.object(creditTransactionsFields);

export type CreditTransaction = Infer<typeof creditTransactionFieldObject>;
export type CreditTransactionType = CreditTransaction['type'];
export type CreditTransactionReason = CreditTransaction['reason'];
