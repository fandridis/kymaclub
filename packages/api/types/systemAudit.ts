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
 * Supported entity types for audit logging
 */
export type SystemAuditEntityType = "business" | "user" | "venue";

/**
 * Supported audit actions
 * Add new actions here as needed for new admin features
 */
export type SystemAuditAction =
  | "update_fee_rate"
  | "suspend_business"
  | "activate_business"
  | "update_payout_settings";

/**
 * Parameters for creating a new audit log entry
 */
export interface CreateAuditLogParams {
  /** The admin user making the change */
  adminUserId: Id<"users">;
  /** Admin email (denormalized for display) */
  adminEmail: string;

  /** Type of entity being changed */
  entityType: SystemAuditEntityType;
  /** ID of the entity (as string for flexibility) */
  entityId: string;
  /** Name of the entity for display (optional) */
  entityName?: string;

  /** The action being performed */
  action: SystemAuditAction;
  /** Previous value (JSON stringified) */
  previousValue?: string;
  /** New value (JSON stringified) */
  newValue: string;
  /** Required reason for the change */
  reason: string;
}

/**
 * Audit log entry formatted for frontend display
 */
export interface AuditLogDisplay {
  _id: Id<"systemAuditLogs">;
  adminEmail: string;
  entityType: SystemAuditEntityType;
  entityName?: string;
  action: SystemAuditAction;
  previousValue?: string;
  newValue: string;
  reason: string;
  createdAt: number;
}
