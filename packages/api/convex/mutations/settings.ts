import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { settingsService } from "../../services/settingsService";
import { getAuthenticatedUserOrThrow } from "../utils";

/***************************************************************
 * Upsert User Settings
 ***************************************************************/
export const upsertUserSettingsArgs = v.object({
    notifications: v.optional(v.object({
        globalOptOut: v.boolean(),
        preferences: v.object({
            booking_confirmation: v.optional(v.object({
                email: v.boolean(),
                web: v.boolean(),
                push: v.boolean(),
            })),
            booking_reminder: v.optional(v.object({
                email: v.boolean(),
                web: v.boolean(),
                push: v.boolean(),
            })),
            class_cancelled: v.optional(v.object({
                email: v.boolean(),
                web: v.boolean(),
                push: v.boolean(),
            })),
            class_rebookable: v.optional(v.object({
                email: v.boolean(),
                web: v.boolean(),
                push: v.boolean(),
            })),
            booking_cancelled_by_business: v.optional(v.object({
                email: v.boolean(),
                web: v.boolean(),
                push: v.boolean(),
            })),
            payment_receipt: v.optional(v.object({
                email: v.boolean(),
                web: v.boolean(),
                push: v.boolean(),
            })),
            credits_received_subscription: v.optional(v.object({
                email: v.boolean(),
                web: v.boolean(),
                push: v.boolean(),
            })),
            credits_received_admin_gift: v.optional(v.object({
                email: v.boolean(),
                web: v.boolean(),
                push: v.boolean(),
            })),
            welcome_bonus: v.optional(v.object({
                email: v.boolean(),
                web: v.boolean(),
                push: v.boolean(),
            })),
        }),
    })),
    banners: v.optional(v.object({
        welcomeBannerDismissed: v.optional(v.boolean()),
    })),
});

export const upsertUserSettings = mutation({
    args: upsertUserSettingsArgs,
    returns: v.object({
        settingsId: v.id("userSettings"),
    }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await settingsService.upsertUserSettings({ ctx, args, user });
    }
});

/***************************************************************
 * Update User Banner Settings
 ***************************************************************/
export const updateUserBannerSettingsArgs = v.object({
    bannerName: v.string(),
    dismissed: v.boolean(),
});

export const updateUserBannerSettings = mutation({
    args: updateUserBannerSettingsArgs,
    returns: v.object({
        success: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await settingsService.updateUserBannerSettings({ ctx, args, user });
    }
});

/***************************************************************
 * Upsert Business Settings
 ***************************************************************/
export const upsertBusinessSettingsArgs = v.object({
    notifications: v.optional(v.object({
        preferences: v.object({
            booking_created: v.object({
                email: v.boolean(),
                web: v.boolean(),
            }),
            booking_cancelled_by_consumer: v.object({
                email: v.boolean(),
                web: v.boolean(),
            }),
            booking_cancelled_by_business: v.object({
                email: v.boolean(),
                web: v.boolean(),
            }),
            payment_received: v.object({
                email: v.boolean(),
                web: v.boolean(),
            }),
            review_received: v.optional(v.object({
                email: v.boolean(),
                web: v.boolean(),
            })),
        }),
    })),
    banners: v.optional(v.record(v.string(), v.boolean())),
});

export const upsertBusinessSettings = mutation({
    args: upsertBusinessSettingsArgs,
    returns: v.object({
        settingsId: v.id("businessSettings"),
    }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return await settingsService.upsertBusinessSettings({ ctx, args, user });
    }
});
