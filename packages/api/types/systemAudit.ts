/**
 * TypeScript types for system audit logging
 *
 * Used to track admin actions for compliance and accountability.
 * All sensitive changes (fee rate updates, business suspensions, etc.)
 * are logged with who made the change, what was changed, and why.
 */

import { Doc, Id } from "../convex/_generated/dataModel";

/**
 * System audit log document type - derived from Convex schema
 */
export type SystemAuditLog = Doc<"systemAuditLogs">;

/**
 * Supported audit event types (typed enum)
 *
 * Start small and extend as new audit-worthy actions are added.
 */
export type SystemAuditType = "business_fee_change";

/**
 * Polymorphic entity reference for audit logs
 * Mirrors scheduledNotificationFields.relatedEntity pattern.
 */
export type SystemAuditRelatedEntity =
  | {
    entityType: "businesses";
    entityId: Id<"businesses">;
  };

/**
 * Actor snapshot for audit logs
 */
export interface SystemAuditActor {
  userId: Id<"users">;
  email?: string;
}

/**
 * Structured changes payload for business fee changes
 */
export interface BusinessFeeChangeAuditChanges {
  feeRate: {
    before: number;
    after: number;
  };
}

/**
 * Display shape for business fee change audit log entries
 */
export interface BusinessFeeChangeAuditLogDisplay {
  _id: Id<"systemAuditLogs">;
  auditType: "business_fee_change";
  relatedEntity: SystemAuditRelatedEntity;
  actor: SystemAuditActor;
  reason: string;
  changes: BusinessFeeChangeAuditChanges;
  createdAt: number;
}

/**
 * Input params for creating a business fee change audit log entry
 */
export interface LogBusinessFeeChangeParams {
  actor: SystemAuditActor;
  businessId: Id<"businesses">;
  reason: string;
  beforeFeeRate: number;
  afterFeeRate: number;
}
