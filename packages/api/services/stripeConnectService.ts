import Stripe from "stripe";
import { Doc, Id } from "../convex/_generated/dataModel";
import { ActionCtx } from "../convex/_generated/server";
import { internal } from "../convex/_generated/api";

// Lazy initialization of Stripe client to avoid crashes in test environment where key is missing
const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
    return new Stripe(key, {
        apiVersion: "2025-02-24.acacia",
    });
};

export const stripeConnectService = {
    /**
     * Create a Stripe Express Connected Account for a business
     */
    async createConnectedAccount(
        ctx: ActionCtx,
        { businessId, email, name }: { businessId: Id<"businesses">; email: string; name: string }
    ) {
        const stripe = getStripe();
        const account = await stripe.accounts.create({
            type: "express",
            country: "GR", // Defaulting to Greece based on currency 'eur' usage in codebase, but could be dynamic
            email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: "individual", // Default, can be updated during onboarding
            metadata: {
                businessId,
                convexEnv: process.env.CONVEX_CLOUD_URL ?? "local",
            },
            settings: {
                payouts: {
                    schedule: {
                        interval: "weekly",
                        weekly_anchor: "monday",
                    }
                }
            }
        });

        return account;
    },

    /**
     * Create an Account Link for onboarding
     */
    async createAccountLink(
        connectedAccountId: string,
        returnUrl: string,
        refreshUrl: string
    ) {
        const stripe = getStripe();
        const accountLink = await stripe.accountLinks.create({
            account: connectedAccountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: "account_onboarding",
        });

        return accountLink;
    },

    /**
     * Get fresh account status from Stripe
     */
    async getAccountStatus(connectedAccountId: string) {
        const stripe = getStripe();
        const account = await stripe.accounts.retrieve(connectedAccountId);
        return {
            chargesEnabled: account.charges_enabled,
            detailsSubmitted: account.details_submitted,
            payoutsEnabled: account.payouts_enabled,
            requirements: account.requirements,
        };
    },

    /**
     * Create a login link for the Express Dashboard
     */
    async createLoginLink(connectedAccountId: string) {
        const stripe = getStripe();
        const loginLink = await stripe.accounts.createLoginLink(connectedAccountId);
        return loginLink;
    },

    /**
     * Handle account.updated webhook event
     */
    async handleAccountUpdated(ctx: ActionCtx, event: Stripe.Event) {
        const account = event.data.object as Stripe.Account;
        const connectedAccountId = account.id;

        // Check status
        const chargesEnabled = account.charges_enabled;
        const detailsSubmitted = account.details_submitted;
        const payoutsEnabled = account.payouts_enabled;

        let status: "not_started" | "pending" | "enabled" | "disabled" | "rejected" = "pending";

        if (chargesEnabled && detailsSubmitted) {
            status = "enabled";
        } else if (account.requirements?.disabled_reason) {
            // e.g. "rejected.fraud", "requirements.past_due"
            status = "disabled"; // Map disabled/rejected to disabled for now, or distinguish
            if (account.requirements.disabled_reason.startsWith("rejected")) {
                status = "rejected";
            }
        } else if (!detailsSubmitted) {
            status = "pending"; // or "not_started" if we can distinguish, but usually pending
        }

        console.log(`[Stripe Connect] Updating account ${connectedAccountId} status to ${status}`);

        await ctx.runMutation(internal.mutations.stripeConnect.updateConnectedAccountStatus, {
            stripeConnectedAccountId: connectedAccountId,
            status,
        });
    }
};
