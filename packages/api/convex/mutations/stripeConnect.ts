import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const setConnectedAccountId = internalMutation({
    args: {
        businessId: v.id("businesses"),
        stripeConnectedAccountId: v.string(),
    },
    handler: async (ctx, { businessId, stripeConnectedAccountId }) => {
        await ctx.db.patch(businessId, {
            stripeConnectedAccountId,
            stripeConnectedAccountStatus: "pending", // Initial status
            stripeConnectedAccountOnboardedAt: undefined,
        });
    },
});

export const updateConnectedAccountStatus = internalMutation({
    args: {
        stripeConnectedAccountId: v.string(),
        status: v.union(
            v.literal("not_started"),
            v.literal("pending"),
            v.literal("enabled"),
            v.literal("disabled"),
            v.literal("rejected")
        ),
    },
    handler: async (ctx, { stripeConnectedAccountId, status }) => {
        const business = await ctx.db
            .query("businesses")
            .filter((q) => q.eq(q.field("stripeConnectedAccountId"), stripeConnectedAccountId))
            .first();

        if (!business) {
            console.error(`Business with stripeConnectedAccountId ${stripeConnectedAccountId} not found`);
            return;
        }

        await ctx.db.patch(business._id, {
            stripeConnectedAccountStatus: status,
            stripeConnectedAccountOnboardedAt: status === "enabled" ? Date.now() : undefined,
        });
    },
});
