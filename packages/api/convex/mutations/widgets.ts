import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { widgetService } from "../../services/widgetService";
import { tournamentAmericanoService } from "../../services/tournamentAmericanoService";
import {
    widgetConfigValidator,
    widgetStatusValidator,
    walkInFields,
} from "../schema";

/***************************************************************
 * Widget Mutations - Public API for modifying widget data
 * 
 * NEW PARTICIPANT MODEL:
 * - Bookings are auto-included (fetched live from bookings table)
 * - Walk-ins are managed via addWalkIn/removeWalkIn (stored in widget.walkIns)
 * - No sync needed - participants are always up to date
 ***************************************************************/

/**
 * Attach a widget to a class instance
 */
export const attachWidget = mutation({
    args: {
        classInstanceId: v.id("classInstances"),
        widgetConfig: widgetConfigValidator,
    },
    returns: v.object({
        widgetId: v.id("classInstanceWidgets"),
    }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return widgetService.attachWidget({
            ctx,
            args: {
                classInstanceId: args.classInstanceId,
                widgetConfig: args.widgetConfig,
            },
            user,
        });
    },
});

/**
 * Detach (remove) a widget from a class instance
 */
export const detachWidget = mutation({
    args: {
        widgetId: v.id("classInstanceWidgets"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        await widgetService.detachWidget({
            ctx,
            args: { widgetId: args.widgetId },
            user,
        });
        return null;
    },
});

/**
 * Add a walk-in participant to the widget
 * Adds to widget.walkIns array
 */
export const addWalkIn = mutation({
    args: {
        widgetId: v.id("classInstanceWidgets"),
        walkIn: v.object(walkInFields),
    },
    returns: v.object({
        walkInId: v.string(), // Returns the generated walk-in ID
    }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return widgetService.addWalkIn({
            ctx,
            args: {
                widgetId: args.widgetId,
                walkIn: args.walkIn,
            },
            user,
        });
    },
});

/**
 * Remove a walk-in participant from the widget
 * Removes from widget.walkIns array
 */
export const removeWalkIn = mutation({
    args: {
        widgetId: v.id("classInstanceWidgets"),
        walkInId: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        await widgetService.removeWalkIn({
            ctx,
            args: {
                widgetId: args.widgetId,
                walkInId: args.walkInId,
            },
            user,
        });
        return null;
    },
});

/**
 * Update widget status
 */
export const updateStatus = mutation({
    args: {
        widgetId: v.id("classInstanceWidgets"),
        newStatus: widgetStatusValidator,
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        await widgetService.updateStatus({
            ctx,
            args: {
                widgetId: args.widgetId,
                newStatus: args.newStatus,
            },
            user,
        });
        return null;
    },
});

/***************************************************************
 * Americano Tournament Mutations
 ***************************************************************/

/**
 * Start an Americano tournament
 * Initializes the tournament state and generates the schedule
 * Creates participants snapshot from current bookings + walk-ins
 */
export const startAmericanoTournament = mutation({
    args: {
        widgetId: v.id("classInstanceWidgets"),
    },
    returns: v.object({
        success: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return tournamentAmericanoService.startTournament({
            ctx,
            args: { widgetId: args.widgetId },
            user,
        });
    },
});

/**
 * Record an Americano match result
 */
export const recordAmericanoMatchResult = mutation({
    args: {
        widgetId: v.id("classInstanceWidgets"),
        matchId: v.string(),
        team1Score: v.number(),
        team2Score: v.number(),
    },
    returns: v.object({
        success: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return tournamentAmericanoService.recordMatchResult({
            ctx,
            args: {
                widgetId: args.widgetId,
                matchId: args.matchId,
                team1Score: args.team1Score,
                team2Score: args.team2Score,
            },
            user,
        });
    },
});

/**
 * Complete an Americano tournament
 * Finalizes the tournament and records final standings
 */
export const completeAmericanoTournament = mutation({
    args: {
        widgetId: v.id("classInstanceWidgets"),
    },
    returns: v.object({
        success: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return tournamentAmericanoService.completeTournament({
            ctx,
            args: { widgetId: args.widgetId },
            user,
        });
    },
});

/**
 * Advance to the next round in an Americano tournament
 * Manually advances when all matches in current round are complete
 */
export const advanceAmericanoRound = mutation({
    args: {
        widgetId: v.id("classInstanceWidgets"),
    },
    returns: v.object({
        success: v.boolean(),
        newRound: v.number(),
    }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return tournamentAmericanoService.advanceToNextRound({
            ctx,
            args: { widgetId: args.widgetId },
            user,
        });
    },
});

/**
 * Cancel an Americano tournament
 */
export const cancelAmericanoTournament = mutation({
    args: {
        widgetId: v.id("classInstanceWidgets"),
    },
    returns: v.object({
        success: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        return tournamentAmericanoService.cancelTournament({
            ctx,
            args: { widgetId: args.widgetId },
            user,
        });
    },
});

/***************************************************************
 * Widget Lock/Unlock Mutations
 ***************************************************************/

/**
 * Lock a widget - prevents modifications until unlocked
 */
export const lockWidget = mutation({
    args: {
        widgetId: v.id("classInstanceWidgets"),
    },
    returns: v.object({
        success: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        await widgetService.lockWidget({
            ctx,
            args: { widgetId: args.widgetId },
            user,
        });
        return { success: true };
    },
});

/**
 * Unlock a widget - allows modifications again
 */
export const unlockWidget = mutation({
    args: {
        widgetId: v.id("classInstanceWidgets"),
    },
    returns: v.object({
        success: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);
        await widgetService.unlockWidget({
            ctx,
            args: { widgetId: args.widgetId },
            user,
        });
        return { success: true };
    },
});
