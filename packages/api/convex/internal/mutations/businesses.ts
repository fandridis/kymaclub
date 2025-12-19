import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireInternalUserOrThrow } from "../../utils";
import { systemAuditService } from "../../../services/systemAuditService";
import { feeRateValidator, validateFeeRate, validateReason } from "../../../validations/business";
import { ConvexError } from "convex/values";

/**
 * Update the platform fee rate for a business
 * Protected by requireInternalUserOrThrow - only internal/admin users can call this
 *
 * Business Rules:
 * - Fee rate must be one of the allowed values (0%, 5%, 10%, 15%, 20%, 25%, 30%)
 * - A reason is required for audit trail
 * - The change is logged to systemAuditLogs for compliance
 */
export const updateBusinessFeeRate = mutation({
  args: {
    businessId: v.id("businesses"),
    newFeeRate: feeRateValidator,
    reason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    previousFeeRate: v.number(),
    newFeeRate: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Require internal/admin user - throws if not authorized
    const adminUser = await requireInternalUserOrThrow(ctx);

    // Validate fee rate
    const feeRateValidation = validateFeeRate(args.newFeeRate);
    if (!feeRateValidation.success) {
      throw new ConvexError({
        message: feeRateValidation.error,
        field: "newFeeRate",
        code: "INVALID_FEE_RATE",
      });
    }

    // Validate reason
    const reasonValidation = validateReason(args.reason);
    if (!reasonValidation.success) {
      throw new ConvexError({
        message: reasonValidation.error,
        field: "reason",
        code: "INVALID_REASON",
      });
    }

    // Get current business
    const business = await ctx.db.get(args.businessId);
    if (!business) {
      throw new ConvexError({
        message: "Business not found",
        field: "businessId",
        code: "NOT_FOUND",
      });
    }

    // Get previous fee rate (default to 0.20 if not set)
    const previousFeeRate = business.feeStructure.baseFeeRate ?? 0.2;

    // Skip if no change
    if (previousFeeRate === args.newFeeRate) {
      return {
        success: true,
        previousFeeRate,
        newFeeRate: args.newFeeRate,
        message: "Fee rate unchanged",
      };
    }

    // Log the change to audit log (typed auditType + polymorphic entity reference)
    await systemAuditService.logBusinessFeeChange(ctx, {
      actor: {
        userId: adminUser._id,
        ...(adminUser.email ? { email: adminUser.email } : {}),
      },
      businessId: args.businessId,
      reason: args.reason.trim(),
      beforeFeeRate: previousFeeRate,
      afterFeeRate: args.newFeeRate,
    });

    // Update business fee structure
    await ctx.db.patch(args.businessId, {
      feeStructure: {
        ...business.feeStructure,
        baseFeeRate: args.newFeeRate,
      },
      updatedAt: Date.now(),
      updatedBy: adminUser._id,
    });

    const previousPercent = Math.round(previousFeeRate * 100);
    const newPercent = Math.round(args.newFeeRate * 100);

    return {
      success: true,
      previousFeeRate,
      newFeeRate: args.newFeeRate,
      message: `Fee rate updated from ${previousPercent}% to ${newPercent}%`,
    };
  },
});

/**
 * Authorize a business email manually.
 * Protected by requireInternalUserOrThrow - only internal/admin users can call this
 */
export const authorizeEmail = mutation({
  args: {
    email: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require internal/admin user - throws if not authorized
    const adminUser = await requireInternalUserOrThrow(ctx);

    // Check if email already exists
    const existing = await ctx.db
      .query("authorizedBusinessEmails")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error(`Email ${args.email} is already authorized`);
    }

    const id = await ctx.db.insert("authorizedBusinessEmails", {
      email: args.email,
      notes: args.notes,
      authorizedBy: adminUser._id,
      createdAt: Date.now(),
      createdBy: adminUser._id,
    });

    return id;
  },
});
