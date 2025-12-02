import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserOrThrow } from "../utils";
import { widgetService } from "../../services/widgetService";
import { tournamentAmericanoService } from "../../services/tournamentAmericanoService";
import {
    widgetConfigValidator,
    widgetStatusValidator,
} from "../schema";

/***************************************************************
 * Widget Queries - Public API for reading widget data
 ***************************************************************/

/**
 * Get widget for a class instance
 * Returns the widget attached to a class instance (if any)
 */
export const getByInstance = query({
    args: {
        classInstanceId: v.id("classInstances"),
    },
    returns: v.union(
        v.object({
            _id: v.id("classInstanceWidgets"),
            _creationTime: v.number(),
            classInstanceId: v.id("classInstances"),
            businessId: v.id("businesses"),
            widgetConfig: widgetConfigValidator,
            widgetState: v.optional(v.any()), // State varies by type
            status: widgetStatusValidator,
            isLocked: v.optional(v.boolean()),
            createdAt: v.number(),
            createdBy: v.id("users"),
            updatedAt: v.optional(v.number()),
            updatedBy: v.optional(v.id("users")),
            deleted: v.optional(v.boolean()),
            deletedAt: v.optional(v.union(v.number(), v.null())),
            deletedBy: v.optional(v.union(v.id("users"), v.null())),
            participants: v.array(v.object({
                _id: v.id("widgetParticipants"),
                _creationTime: v.number(),
                widgetId: v.id("classInstanceWidgets"),
                bookingId: v.optional(v.id("bookings")),
                walkIn: v.optional(v.object({
                    name: v.string(),
                    phone: v.optional(v.string()),
                    email: v.optional(v.string()),
                })),
                displayName: v.string(),
                teamId: v.optional(v.string()),
                seedNumber: v.optional(v.number()),
                createdAt: v.number(),
                createdBy: v.id("users"),
                updatedAt: v.optional(v.number()),
                updatedBy: v.optional(v.id("users")),
            })),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        // Allow unauthenticated access for viewing
        console.log('getWidgetForInstance--->', args.classInstanceId);

        return widgetService.getWidgetForInstance({
            ctx,
            classInstanceId: args.classInstanceId,
        });
    },
});

/**
 * Get widget by ID
 * Returns a widget with all its participants
 */
export const getById = query({
    args: {
        widgetId: v.id("classInstanceWidgets"),
    },
    returns: v.union(
        v.object({
            _id: v.id("classInstanceWidgets"),
            _creationTime: v.number(),
            classInstanceId: v.id("classInstances"),
            businessId: v.id("businesses"),
            widgetConfig: widgetConfigValidator,
            widgetState: v.optional(v.any()),
            status: widgetStatusValidator,
            isLocked: v.optional(v.boolean()),
            createdAt: v.number(),
            createdBy: v.id("users"),
            updatedAt: v.optional(v.number()),
            updatedBy: v.optional(v.id("users")),
            deleted: v.optional(v.boolean()),
            deletedAt: v.optional(v.union(v.number(), v.null())),
            deletedBy: v.optional(v.union(v.id("users"), v.null())),
            participants: v.array(v.object({
                _id: v.id("widgetParticipants"),
                _creationTime: v.number(),
                widgetId: v.id("classInstanceWidgets"),
                bookingId: v.optional(v.id("bookings")),
                walkIn: v.optional(v.object({
                    name: v.string(),
                    phone: v.optional(v.string()),
                    email: v.optional(v.string()),
                })),
                displayName: v.string(),
                teamId: v.optional(v.string()),
                seedNumber: v.optional(v.number()),
                createdAt: v.number(),
                createdBy: v.id("users"),
                updatedAt: v.optional(v.number()),
                updatedBy: v.optional(v.id("users")),
            })),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        return widgetService.getWidgetById({
            ctx,
            widgetId: args.widgetId,
        });
    },
});

/**
 * Get participants for a widget
 */
export const getParticipants = query({
    args: {
        widgetId: v.id("classInstanceWidgets"),
    },
    returns: v.array(v.object({
        _id: v.id("widgetParticipants"),
        _creationTime: v.number(),
        widgetId: v.id("classInstanceWidgets"),
        bookingId: v.optional(v.id("bookings")),
        walkIn: v.optional(v.object({
            name: v.string(),
            phone: v.optional(v.string()),
            email: v.optional(v.string()),
        })),
        displayName: v.string(),
        teamId: v.optional(v.string()),
        seedNumber: v.optional(v.number()),
        createdAt: v.number(),
        createdBy: v.id("users"),
        updatedAt: v.optional(v.number()),
        updatedBy: v.optional(v.id("users")),
    })),
    handler: async (ctx, args) => {
        return widgetService.getParticipants({
            ctx,
            widgetId: args.widgetId,
        });
    },
});

/**
 * Get Americano tournament state
 * Returns full tournament state with summary
 */
export const getAmericanoTournamentState = query({
    args: {
        widgetId: v.id("classInstanceWidgets"),
    },
    returns: v.union(
        v.object({
            config: v.object({
                numberOfPlayers: v.union(v.literal(8), v.literal(12), v.literal(16)),
                matchPoints: v.union(v.literal(20), v.literal(21), v.literal(24), v.literal(25)),
                courts: v.array(v.object({
                    id: v.string(),
                    name: v.string(),
                })),
                maxMatchesPerPlayer: v.number(),
                mode: v.union(v.literal("individual_rotation"), v.literal("fixed_teams")),
            }),
            state: v.union(
                v.object({
                    currentRound: v.number(),
                    totalRounds: v.number(),
                    matches: v.array(v.object({
                        id: v.string(),
                        roundNumber: v.number(),
                        courtId: v.string(),
                        team1: v.array(v.string()),
                        team2: v.array(v.string()),
                        team1Score: v.optional(v.number()),
                        team2Score: v.optional(v.number()),
                        status: v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed")),
                        completedAt: v.optional(v.number()),
                    })),
                    standings: v.array(v.object({
                        participantId: v.string(),
                        matchesPlayed: v.number(),
                        matchesWon: v.number(),
                        matchesLost: v.number(),
                        pointsScored: v.number(),
                        pointsConceded: v.number(),
                        pointsDifference: v.number(),
                    })),
                    startedAt: v.optional(v.number()),
                    completedAt: v.optional(v.number()),
                }),
                v.null()
            ),
            participants: v.array(v.object({
                _id: v.id("widgetParticipants"),
                _creationTime: v.number(),
                widgetId: v.id("classInstanceWidgets"),
                bookingId: v.optional(v.id("bookings")),
                walkIn: v.optional(v.object({
                    name: v.string(),
                    phone: v.optional(v.string()),
                    email: v.optional(v.string()),
                })),
                displayName: v.string(),
                teamId: v.optional(v.string()),
                seedNumber: v.optional(v.number()),
                createdAt: v.number(),
                createdBy: v.id("users"),
                updatedAt: v.optional(v.number()),
                updatedBy: v.optional(v.id("users")),
            })),
            summary: v.union(
                v.object({
                    currentRound: v.number(),
                    totalRounds: v.number(),
                    completedMatches: v.number(),
                    totalMatches: v.number(),
                    isComplete: v.boolean(),
                    leader: v.union(
                        v.object({
                            participantId: v.string(),
                            matchesPlayed: v.number(),
                            matchesWon: v.number(),
                            matchesLost: v.number(),
                            pointsScored: v.number(),
                            pointsConceded: v.number(),
                            pointsDifference: v.number(),
                        }),
                        v.null()
                    ),
                }),
                v.null()
            ),
            classInstanceInfo: v.union(
                v.object({
                    className: v.string(),
                    venueName: v.string(),
                    startTime: v.number(),
                }),
                v.null()
            ),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        return tournamentAmericanoService.getTournamentState({
            ctx,
            widgetId: args.widgetId,
        });
    },
});

/**
 * Get current round matches for Americano tournament
 */
export const getAmericanoCurrentRoundMatches = query({
    args: {
        widgetId: v.id("classInstanceWidgets"),
    },
    returns: v.array(v.object({
        id: v.string(),
        roundNumber: v.number(),
        courtId: v.string(),
        team1: v.array(v.string()),
        team2: v.array(v.string()),
        team1Score: v.optional(v.number()),
        team2Score: v.optional(v.number()),
        status: v.union(v.literal("scheduled"), v.literal("in_progress"), v.literal("completed")),
        completedAt: v.optional(v.number()),
    })),
    handler: async (ctx, args) => {
        return tournamentAmericanoService.getCurrentRoundMatches({
            ctx,
            widgetId: args.widgetId,
        });
    },
});

/**
 * Get Americano tournament leaderboard
 */
export const getAmericanoLeaderboard = query({
    args: {
        widgetId: v.id("classInstanceWidgets"),
    },
    returns: v.array(v.object({
        participantId: v.string(),
        matchesPlayed: v.number(),
        matchesWon: v.number(),
        matchesLost: v.number(),
        pointsScored: v.number(),
        pointsConceded: v.number(),
        pointsDifference: v.number(),
    })),
    handler: async (ctx, args) => {
        return tournamentAmericanoService.getLeaderboard({
            ctx,
            widgetId: args.widgetId,
        });
    },
});

/**
 * Get widgets for a business (for dashboard)
 */
export const getBusinessWidgets = query({
    args: {
        status: v.optional(widgetStatusValidator),
        limit: v.optional(v.number()),
    },
    returns: v.array(v.object({
        _id: v.id("classInstanceWidgets"),
        _creationTime: v.number(),
        classInstanceId: v.id("classInstances"),
        businessId: v.id("businesses"),
        widgetConfig: widgetConfigValidator,
        widgetState: v.optional(v.any()),
        status: widgetStatusValidator,
        isLocked: v.optional(v.boolean()),
        createdAt: v.number(),
        createdBy: v.id("users"),
        updatedAt: v.optional(v.number()),
        updatedBy: v.optional(v.id("users")),
        deleted: v.optional(v.boolean()),
        deletedAt: v.optional(v.union(v.number(), v.null())),
        deletedBy: v.optional(v.union(v.id("users"), v.null())),
    })),
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUserOrThrow(ctx);

        if (!user.businessId) {
            return [];
        }

        return widgetService.getWidgetsForBusiness({
            ctx,
            args: {
                businessId: user.businessId,
                status: args.status,
                limit: args.limit,
            },
        });
    },
});
