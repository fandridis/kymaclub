import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Id } from "../convex/_generated/dataModel";
import type {
  CreateAuditLogParams,
  SystemAuditEntityType,
  AuditLogDisplay,
} from "../types/systemAudit";

/**
 * System Audit Service
 *
 * Handles logging and retrieval of admin actions for compliance and accountability.
 * All sensitive changes (fee rate updates, business suspensions, etc.) are logged
 * with who made the change, what was changed, and why.
 */
export const systemAuditService = {
  /**
   * Log an admin action to the audit log
   *
   * @param ctx - Mutation context
   * @param params - Audit log parameters
   * @returns The ID of the created audit log entry
   */
  logAction: async (
    ctx: MutationCtx,
    params: CreateAuditLogParams
  ): Promise<Id<"systemAuditLogs">> => {
    const {
      adminUserId,
      adminEmail,
      entityType,
      entityId,
      entityName,
      action,
      previousValue,
      newValue,
      reason,
    } = params;

    const logId = await ctx.db.insert("systemAuditLogs", {
      adminUserId,
      adminEmail,
      entityType,
      entityId,
      entityName,
      action,
      previousValue,
      newValue,
      reason,
      createdAt: Date.now(),
    });

    return logId;
  },

  /**
   * Get audit logs for a specific entity
   *
   * @param ctx - Query context
   * @param entityType - Type of entity ("business", "user", "venue")
   * @param entityId - ID of the entity
   * @param limit - Maximum number of logs to return (default: 10)
   * @returns Array of audit log entries, newest first
   */
  getLogsForEntity: async (
    ctx: QueryCtx,
    entityType: SystemAuditEntityType,
    entityId: string,
    limit: number = 10
  ): Promise<AuditLogDisplay[]> => {
    const logs = await ctx.db
      .query("systemAuditLogs")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", entityType).eq("entityId", entityId)
      )
      .order("desc")
      .take(limit);

    return logs.map((log) => ({
      _id: log._id,
      adminEmail: log.adminEmail,
      entityType: log.entityType as SystemAuditEntityType,
      entityName: log.entityName,
      action: log.action as AuditLogDisplay["action"],
      previousValue: log.previousValue,
      newValue: log.newValue,
      reason: log.reason,
      createdAt: log.createdAt,
    }));
  },

  /**
   * Get audit logs by action type
   *
   * @param ctx - Query context
   * @param action - The action to filter by
   * @param limit - Maximum number of logs to return (default: 50)
   * @returns Array of audit log entries, newest first
   */
  getLogsByAction: async (
    ctx: QueryCtx,
    action: string,
    limit: number = 50
  ): Promise<AuditLogDisplay[]> => {
    const logs = await ctx.db
      .query("systemAuditLogs")
      .withIndex("by_action", (q) => q.eq("action", action))
      .order("desc")
      .take(limit);

    return logs.map((log) => ({
      _id: log._id,
      adminEmail: log.adminEmail,
      entityType: log.entityType as SystemAuditEntityType,
      entityName: log.entityName,
      action: log.action as AuditLogDisplay["action"],
      previousValue: log.previousValue,
      newValue: log.newValue,
      reason: log.reason,
      createdAt: log.createdAt,
    }));
  },

  /**
   * Get recent audit logs across all entities
   *
   * @param ctx - Query context
   * @param limit - Maximum number of logs to return (default: 50)
   * @returns Array of audit log entries, newest first
   */
  getRecentLogs: async (
    ctx: QueryCtx,
    limit: number = 50
  ): Promise<AuditLogDisplay[]> => {
    const logs = await ctx.db
      .query("systemAuditLogs")
      .withIndex("by_created")
      .order("desc")
      .take(limit);

    return logs.map((log) => ({
      _id: log._id,
      adminEmail: log.adminEmail,
      entityType: log.entityType as SystemAuditEntityType,
      entityName: log.entityName,
      action: log.action as AuditLogDisplay["action"],
      previousValue: log.previousValue,
      newValue: log.newValue,
      reason: log.reason,
      createdAt: log.createdAt,
    }));
  },
};
