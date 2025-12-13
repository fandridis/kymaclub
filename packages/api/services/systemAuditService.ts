import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Id } from "../convex/_generated/dataModel";
import type {
  BusinessFeeChangeAuditLogDisplay,
  LogBusinessFeeChangeParams,
} from "../types/systemAudit";

/**
 * System Audit Service
 *
 * Handles logging and retrieval of admin actions for compliance and accountability.
 * All sensitive changes are logged with who made the change, what was changed, and why.
 */
export const systemAuditService = {
  /**
   * Log a business fee rate change
   */
  logBusinessFeeChange: async (
    ctx: MutationCtx,
    params: LogBusinessFeeChangeParams
  ): Promise<Id<"systemAuditLogs">> => {
    const { actor, businessId, reason, beforeFeeRate, afterFeeRate } = params;
    const logId = await ctx.db.insert("systemAuditLogs", {
      auditType: "business_fee_change",
      relatedEntity: {
        entityType: "businesses",
        entityId: businessId,
      },
      actor: {
        userId: actor.userId,
        ...(actor.email ? { email: actor.email } : {}),
      },
      reason,
      changes: {
        feeRate: { before: beforeFeeRate, after: afterFeeRate },
      },
      createdAt: Date.now(),
    });

    return logId;
  },

  /**
   * Get fee change audit logs for a business (newest first)
   */
  getBusinessFeeChangeLogs: async (
    ctx: QueryCtx,
    businessId: Id<"businesses">,
    limit: number = 10
  ): Promise<BusinessFeeChangeAuditLogDisplay[]> => {
    const logs = await ctx.db
      .query("systemAuditLogs")
      .withIndex("by_type_entity", (q) =>
        q
          .eq("auditType", "business_fee_change")
          .eq("relatedEntity.entityType", "businesses")
          .eq("relatedEntity.entityId", businessId)
      )
      .order("desc")
      .take(limit);

    return logs.map((log) => ({
      _id: log._id,
      auditType: log.auditType,
      relatedEntity: log.relatedEntity,
      actor: log.actor,
      reason: log.reason,
      changes: log.changes,
      createdAt: log.createdAt,
    }));
  },
};
