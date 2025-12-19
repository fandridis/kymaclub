"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import { stripeConnectService } from "../../services/stripeConnectService";

export const createConnectedAccount = action({
    args: {
        returnUrl: v.string(),
        refreshUrl: v.string(),
    },
    handler: async (ctx, { returnUrl, refreshUrl }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthenticated");
        }

        const user = await ctx.runQuery(internal.queries.core.getUserById, { userId });
        if (!user || !user.businessId) {
            throw new Error("User must be attached to a business");
        }

        const business = await ctx.runQuery(internal.queries.businesses.getBusinessById, {
            businessId: user.businessId
        });

        if (!business) {
            throw new Error("Business not found");
        }

        // Check if already has an account
        if (business.stripeConnectedAccountId) {
            // Create new link for existing account
            const link = await stripeConnectService.createAccountLink(
                business.stripeConnectedAccountId,
                returnUrl,
                refreshUrl
            );
            return { accountLink: link.url };
        }

        // Create new account
        const account = await stripeConnectService.createConnectedAccount(ctx, {
            businessId: business._id,
            email: business.email,
            name: business.name,
        });

        // Save account ID
        await ctx.runMutation(internal.mutations.stripeConnect.setConnectedAccountId, {
            businessId: business._id,
            stripeConnectedAccountId: account.id,
        });

        // Create onboarding link
        const link = await stripeConnectService.createAccountLink(
            account.id,
            returnUrl,
            refreshUrl
        );

        return { accountLink: link.url };
    },
});

export const getLoginLink = action({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthenticated");
        }

        const user = await ctx.runQuery(internal.queries.core.getUserById, { userId });
        if (!user?.businessId) {
            throw new Error("User must be attached to a business");
        }

        const business = await ctx.runQuery(internal.queries.businesses.getBusinessById, {
            businessId: user.businessId
        });

        if (!business?.stripeConnectedAccountId) {
            throw new Error("No connected account found");
        }

        const link = await stripeConnectService.createLoginLink(business.stripeConnectedAccountId);
        return { url: link.url };
    },
});

export const checkAccountStatus = action({
    args: {},
    handler: async (ctx): Promise<{
        status: "not_started" | "pending" | "enabled" | "disabled" | "rejected";
        detailsSubmitted: boolean;
        chargesEnabled: boolean;
    }> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Unauthenticated");
        }

        const user = await ctx.runQuery(internal.queries.core.getUserById, { userId });
        if (!user?.businessId) {
            throw new Error("User must be attached to a business");
        }

        const business = await ctx.runQuery(internal.queries.businesses.getBusinessById, {
            businessId: user.businessId
        });

        if (!business?.stripeConnectedAccountId) {
            return {
                status: "not_started",
                detailsSubmitted: false,
                chargesEnabled: false
            };
        }

        const status = await stripeConnectService.getAccountStatus(business.stripeConnectedAccountId);

        console.log('Stripe account status: ', status);

        // Calculate our status based on Stripe's status
        let derivedStatus: "not_started" | "pending" | "enabled" | "disabled" | "rejected" = "pending";
        if (status.chargesEnabled && status.detailsSubmitted) {
            derivedStatus = "enabled";
        } else if (status.requirements?.disabled_reason) {
            derivedStatus = "disabled"; // or rejected
            if (status.requirements.disabled_reason.startsWith("rejected")) {
                derivedStatus = "rejected";
            }
        }

        // Update DB with fresh status
        if (business.stripeConnectedAccountStatus !== derivedStatus) {
            await ctx.runMutation(internal.mutations.stripeConnect.updateConnectedAccountStatus, {
                stripeConnectedAccountId: business.stripeConnectedAccountId,
                status: derivedStatus,
            });
        }

        return {
            status: derivedStatus,
            detailsSubmitted: status.detailsSubmitted,
            chargesEnabled: status.chargesEnabled
        };
    }
})
