import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { creditService } from "../../../services/creditService";
import { requireInternalUserOrThrow } from "../../utils";
import { internal } from "../../_generated/api";

/**
 * Gift credits to a user (internal admin function)
 * Protected by requireInternalUserOrThrow - only internal/admin users can call this
 */
export const giftCredits = mutation({
    args: v.object({
        userId: v.id("users"),
        amount: v.number(),
        description: v.optional(v.string()),
    }),
    returns: v.object({
        success: v.boolean(),
        transactionId: v.id("creditTransactions"),
        newBalance: v.number(),
        message: v.string(),
    }),
    handler: async (ctx, args) => {
        // Require internal/admin user - throws if not authorized
        const adminUser = await requireInternalUserOrThrow(ctx);

        const { userId, amount, description = `Gift of ${amount} credits` } = args;

        const result = await creditService.addCredits(ctx, {
            userId,
            amount,
            type: "gift",
            reason: "admin_gift",
            description,
            initiatedBy: adminUser._id, // Track which admin initiated the gift
        });

        // Send push notification to the user
        try {
            await ctx.runMutation(internal.mutations.pushNotifications.sendPushNotification, {
                to: userId,
                notification: {
                    title: "Credits Gifted",
                    body: `You have been gifted ${amount} credits from KymaClub!`,
                    data: {
                        type: "credit_gift",
                        transactionId: result.transactionId,
                        amount,
                        newBalance: result.newBalance,
                    },
                    sound: "default",
                    priority: "high" as const,
                    channelId: "credits",
                },
            });
        } catch (error) {
            // Log error but don't fail the credit gifting operation
            console.error("Failed to send push notification for credit gift:", error);
        }

        return {
            success: true,
            transactionId: result.transactionId,
            newBalance: result.newBalance,
            message: `Successfully gifted ${amount} credits. New balance: ${result.newBalance}`,
        };
    },
});

