import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";

/***************************************************************
 * Settings Service - All settings-related operations
 ***************************************************************/

export const settingsService = {
    /**
     * Get or create user settings
     */
    getUserSettings: async ({
        ctx,
        user,
    }: {
        ctx: QueryCtx;
        user: Doc<"users">;
    }): Promise<Doc<"userSettings"> | null> => {
        const settings = await ctx.db
            .query("userSettings")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .filter(q => q.neq(q.field("deleted"), true))
            .first();

        return settings;
    },

    /**
     * Create or update user settings
     */
    upsertUserSettings: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            notifications?: {
                globalOptOut: boolean;
                preferences: {
                    booking_confirmation: { email: boolean; web: boolean; push: boolean; };
                    booking_reminder: { email: boolean; web: boolean; push: boolean; };
                    class_cancelled: { email: boolean; web: boolean; push: boolean; };
                    class_rebookable: { email: boolean; web: boolean; push: boolean; };
                    booking_cancelled_by_business: { email: boolean; web: boolean; push: boolean; };
                    payment_receipt: { email: boolean; web: boolean; push: boolean; };
                    credits_received_subscription: { email: boolean; web: boolean; push: boolean; };
                };
            };
            banners?: {
                welcomeBannerDismissed?: boolean;
            };
        };
        user: Doc<"users">;
    }): Promise<{ settingsId: Id<"userSettings"> }> => {
        const now = Date.now();

        // Check if settings exist
        const existingSettings = await ctx.db
            .query("userSettings")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .filter(q => q.neq(q.field("deleted"), true))
            .first();

        if (existingSettings) {
            // Update existing settings
            const updateData: any = {
                updatedAt: now,
                updatedBy: user._id,
            };

            if (args.notifications) {
                updateData.notifications = args.notifications;
            }

            if (args.banners) {
                updateData.banners = {
                    ...existingSettings.banners,
                    ...args.banners,
                };
            }

            await ctx.db.patch(existingSettings._id, updateData);
            return { settingsId: existingSettings._id };
        } else {
            // Create new settings
            const settingsId = await ctx.db.insert("userSettings", {
                userId: user._id,
                notifications: args.notifications,
                banners: args.banners,
                createdAt: now,
                createdBy: user._id,
            });

            return { settingsId };
        }
    },

    /**
     * Update user banner settings
     */
    updateUserBannerSettings: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            bannerName: string;
            dismissed: boolean;
        };
        user: Doc<"users">;
    }): Promise<{ success: boolean }> => {
        const now = Date.now();

        // Check if settings exist
        const existingSettings = await ctx.db
            .query("userSettings")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .filter(q => q.neq(q.field("deleted"), true))
            .first();

        const bannerUpdate = {
            [args.bannerName]: args.dismissed,
        };

        if (existingSettings) {
            // Update existing settings
            await ctx.db.patch(existingSettings._id, {
                banners: {
                    ...existingSettings.banners,
                    ...bannerUpdate,
                },
                updatedAt: now,
                updatedBy: user._id,
            });
        } else {
            // Create new settings with banner
            await ctx.db.insert("userSettings", {
                userId: user._id,
                banners: bannerUpdate,
                createdAt: now,
                createdBy: user._id,
            });
        }

        return { success: true };
    },

    /**
     * Get or create business settings
     */
    getBusinessSettings: async ({
        ctx,
        user,
    }: {
        ctx: QueryCtx;
        user: Doc<"users">;
    }): Promise<Doc<"businessSettings"> | null> => {
        if (!user.businessId) {
            throw new ConvexError({
                message: "User not associated with any business",
                field: "businessId",
                code: ERROR_CODES.USER_NOT_ASSOCIATED_WITH_BUSINESS
            });
        }

        const settings = await ctx.db
            .query("businessSettings")
            .withIndex("by_business", q => q.eq("businessId", user.businessId!))
            .filter(q => q.neq(q.field("deleted"), true))
            .first();

        return settings;
    },

    /**
     * Create or update business settings
     */
    upsertBusinessSettings: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            notifications?: {
                preferences: {
                    booking_created: { email: boolean; web: boolean; };
                    booking_cancelled_by_consumer: { email: boolean; web: boolean; };
                    booking_cancelled_by_business: { email: boolean; web: boolean; };
                    payment_received: { email: boolean; web: boolean; };
                    review_received?: { email: boolean; web: boolean; };
                };
            };
            banners?: {
                [key: string]: boolean;
            };
        };
        user: Doc<"users">;
    }): Promise<{ settingsId: Id<"businessSettings"> }> => {
        if (!user.businessId) {
            throw new ConvexError({
                message: "User not associated with any business",
                field: "businessId",
                code: ERROR_CODES.USER_NOT_ASSOCIATED_WITH_BUSINESS
            });
        }

        const now = Date.now();

        // Check if settings exist
        const existingSettings = await ctx.db
            .query("businessSettings")
            .withIndex("by_business", q => q.eq("businessId", user.businessId!))
            .filter(q => q.neq(q.field("deleted"), true))
            .first();

        if (existingSettings) {
            // Update existing settings
            const updateData: any = {
                updatedAt: now,
                updatedBy: user._id,
            };

            if (args.notifications) {
                updateData.notifications = args.notifications;
            }

            if (args.banners) {
                updateData.banners = {
                    ...existingSettings.banners,
                    ...args.banners,
                };
            }

            await ctx.db.patch(existingSettings._id, updateData);
            return { settingsId: existingSettings._id };
        } else {
            // Create new settings
            const settingsId = await ctx.db.insert("businessSettings", {
                businessId: user.businessId!,
                notifications: args.notifications,
                banners: args.banners,
                createdAt: now,
                createdBy: user._id,
            });

            return { settingsId };
        }
    },
};
