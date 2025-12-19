import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getBusinessById = internalQuery({
    args: { businessId: v.id("businesses") },
    handler: async (ctx, { businessId }) => {
        return await ctx.db.get(businessId);
    },
});

export const getMyBusiness = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const user = await ctx.db.get(userId);
        if (!user?.businessId) return null;

        return await ctx.db.get(user.businessId);
    },
});
