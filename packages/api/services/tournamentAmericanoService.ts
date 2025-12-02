import type { Doc, Id } from "../convex/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import { widgetRules } from "../rules/widget";
import { tournamentAmericanoOperations } from "../operations/tournamentAmericano";
import type {
    TournamentAmericanoConfig,
    TournamentAmericanoState,
    TournamentAmericanoMatch,
    TournamentAmericanoStanding,
    WidgetParticipant,
    AmericanoWidgetState,
    isAmericanoConfig,
} from "../types/widget";

/***************************************************************
 * Tournament Americano Service - DB-Aware Operations
 * 
 * This service handles Americano-specific tournament operations
 * that require database access. It orchestrates between the pure
 * operations and the database layer.
 ***************************************************************/
export const tournamentAmericanoService = {
    /***************************************************************
     * Initialize Tournament
     * Sets up the tournament state from participants
     ***************************************************************/
    initialize: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            widgetId: Id<"classInstanceWidgets">;
        };
        user: Doc<"users">;
    }): Promise<{ success: boolean }> => {
        const widget = await ctx.db.get(args.widgetId);
        if (!widget || widget.deleted) {
            throw new ConvexError({
                message: "Widget not found",
                field: "widgetId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Authorization check
        widgetRules.userMustBeWidgetOwner(widget, user);

        // Verify this is an Americano widget
        if (widget.widgetConfig.type !== "tournament_americano") {
            throw new ConvexError({
                message: "Widget is not an Americano tournament",
                field: "widgetConfig.type",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }

        const config = widget.widgetConfig.config as TournamentAmericanoConfig;

        // Get participants
        const participants = await ctx.db
            .query("widgetParticipants")
            .withIndex("by_widget", q => q.eq("widgetId", args.widgetId))
            .collect();

        // Validate we can start
        widgetRules.canStartTournament(widget, participants);

        // Extract participant IDs
        const participantIds = participants.map(p => p._id.toString());

        // Initialize tournament state using pure operations
        const state = tournamentAmericanoOperations.initializeTournamentState(
            config,
            participantIds
        );

        // Update widget with state
        await ctx.db.patch(args.widgetId, {
            widgetState: {
                type: "tournament_americano" as const,
                state,
            },
            status: "active",
            updatedAt: Date.now(),
            updatedBy: user._id,
        });

        return { success: true };
    },

    /***************************************************************
     * Start Tournament
     * Transitions from setup/ready to active and initializes state
     ***************************************************************/
    startTournament: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            widgetId: Id<"classInstanceWidgets">;
        };
        user: Doc<"users">;
    }): Promise<{ success: boolean }> => {
        // Delegate to initialize which handles the full flow
        return tournamentAmericanoService.initialize({ ctx, args, user });
    },

    /***************************************************************
     * Record Match Result
     * Records the score for a completed match
     ***************************************************************/
    recordMatchResult: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            widgetId: Id<"classInstanceWidgets">;
            matchId: string;
            team1Score: number;
            team2Score: number;
        };
        user: Doc<"users">;
    }): Promise<{ success: boolean }> => {
        const widget = await ctx.db.get(args.widgetId);
        if (!widget || widget.deleted) {
            throw new ConvexError({
                message: "Widget not found",
                field: "widgetId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Authorization check
        widgetRules.userMustBeWidgetOwner(widget, user);

        // Business rule check
        widgetRules.canRecordMatchResult(widget);

        // Verify this is an Americano widget with state
        if (widget.widgetConfig.type !== "tournament_americano") {
            throw new ConvexError({
                message: "Widget is not an Americano tournament",
                field: "widgetConfig.type",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }

        if (!widget.widgetState || widget.widgetState.type !== "tournament_americano") {
            throw new ConvexError({
                message: "Tournament has not been initialized",
                field: "widgetState",
                code: ERROR_CODES.ACTION_NOT_ALLOWED,
            });
        }

        const config = widget.widgetConfig.config as TournamentAmericanoConfig;
        const currentState = widget.widgetState.state as TournamentAmericanoState;

        // Find the match
        const match = currentState.matches.find(m => m.id === args.matchId);
        if (!match) {
            throw new ConvexError({
                message: "Match not found",
                field: "matchId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Validate scores
        widgetRules.validateMatchScores(
            args.team1Score,
            args.team2Score,
            config.matchPoints
        );

        // Apply result using pure operations
        const newState = tournamentAmericanoOperations.applyMatchResult(
            currentState,
            {
                matchId: args.matchId,
                team1Score: args.team1Score,
                team2Score: args.team2Score,
            }
        );

        // Check if tournament is now complete
        const isComplete = tournamentAmericanoOperations.isTournamentComplete(newState);
        const newStatus = isComplete ? "completed" : "active";

        // Update widget state
        await ctx.db.patch(args.widgetId, {
            widgetState: {
                type: "tournament_americano" as const,
                state: {
                    ...newState,
                    completedAt: isComplete ? Date.now() : undefined,
                },
            },
            status: newStatus,
            updatedAt: Date.now(),
            updatedBy: user._id,
        });

        return { success: true };
    },

    /***************************************************************
     * Get Tournament State
     * Returns the current tournament state with computed values
     ***************************************************************/
    getTournamentState: async ({
        ctx,
        widgetId,
    }: {
        ctx: QueryCtx;
        widgetId: Id<"classInstanceWidgets">;
    }): Promise<{
        config: TournamentAmericanoConfig;
        state: TournamentAmericanoState | null;
        participants: WidgetParticipant[];
        summary: {
            currentRound: number;
            totalRounds: number;
            completedMatches: number;
            totalMatches: number;
            isComplete: boolean;
            leader: TournamentAmericanoStanding | null;
        } | null;
        classInstanceInfo: {
            className: string;
            venueName: string;
            startTime: number;
        } | null;
    } | null> => {
        const widget = await ctx.db.get(widgetId);
        if (!widget || widget.deleted) {
            return null;
        }

        // Verify this is an Americano widget
        if (widget.widgetConfig.type !== "tournament_americano") {
            return null;
        }

        const config = widget.widgetConfig.config as TournamentAmericanoConfig;

        // Get participants
        const participants = await ctx.db
            .query("widgetParticipants")
            .withIndex("by_widget", q => q.eq("widgetId", widgetId))
            .collect();

        // Get state if available
        const state = widget.widgetState?.type === "tournament_americano"
            ? (widget.widgetState.state as TournamentAmericanoState)
            : null;

        // Get summary if state exists
        const summary = state
            ? tournamentAmericanoOperations.getTournamentSummary(state)
            : null;

        // Get class instance and venue info
        let classInstanceInfo: {
            className: string;
            venueName: string;
            startTime: number;
        } | null = null;

        const classInstance = await ctx.db.get(widget.classInstanceId);
        if (classInstance) {
            const venue = await ctx.db.get(classInstance.venueId);
            classInstanceInfo = {
                className: classInstance.name ?? classInstance.templateSnapshot?.name ?? "Class",
                venueName: venue?.name ?? classInstance.venueSnapshot?.name ?? "Venue",
                startTime: classInstance.startTime,
            };
        }

        return {
            config,
            state,
            participants,
            summary,
            classInstanceInfo,
        };
    },

    /***************************************************************
     * Get Current Round Matches
     * Returns matches for the current round
     ***************************************************************/
    getCurrentRoundMatches: async ({
        ctx,
        widgetId,
    }: {
        ctx: QueryCtx;
        widgetId: Id<"classInstanceWidgets">;
    }): Promise<TournamentAmericanoMatch[]> => {
        const widget = await ctx.db.get(widgetId);
        if (!widget || widget.deleted) {
            return [];
        }

        if (widget.widgetConfig.type !== "tournament_americano") {
            return [];
        }

        if (!widget.widgetState || widget.widgetState.type !== "tournament_americano") {
            return [];
        }

        const state = widget.widgetState.state as TournamentAmericanoState;
        return tournamentAmericanoOperations.getMatchesForRound(
            state.matches,
            state.currentRound
        );
    },

    /***************************************************************
     * Get Leaderboard
     * Returns the current standings
     ***************************************************************/
    getLeaderboard: async ({
        ctx,
        widgetId,
    }: {
        ctx: QueryCtx;
        widgetId: Id<"classInstanceWidgets">;
    }): Promise<TournamentAmericanoStanding[]> => {
        const widget = await ctx.db.get(widgetId);
        if (!widget || widget.deleted) {
            return [];
        }

        if (widget.widgetConfig.type !== "tournament_americano") {
            return [];
        }

        if (!widget.widgetState || widget.widgetState.type !== "tournament_americano") {
            return [];
        }

        const state = widget.widgetState.state as TournamentAmericanoState;
        return state.standings;
    },

    /***************************************************************
     * Get Participant Matches
     * Returns all matches for a specific participant
     ***************************************************************/
    getParticipantMatches: async ({
        ctx,
        widgetId,
        participantId,
    }: {
        ctx: QueryCtx;
        widgetId: Id<"classInstanceWidgets">;
        participantId: string;
    }): Promise<TournamentAmericanoMatch[]> => {
        const widget = await ctx.db.get(widgetId);
        if (!widget || widget.deleted) {
            return [];
        }

        if (widget.widgetConfig.type !== "tournament_americano") {
            return [];
        }

        if (!widget.widgetState || widget.widgetState.type !== "tournament_americano") {
            return [];
        }

        const state = widget.widgetState.state as TournamentAmericanoState;

        // Find matches where participant is in either team
        return state.matches.filter(match =>
            match.team1.includes(participantId) ||
            match.team2.includes(participantId)
        );
    },

    /***************************************************************
     * Complete Tournament
     * Finalizes the tournament and calculates final standings
     ***************************************************************/
    completeTournament: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            widgetId: Id<"classInstanceWidgets">;
        };
        user: Doc<"users">;
    }): Promise<{ success: boolean }> => {
        const widget = await ctx.db.get(args.widgetId);
        if (!widget || widget.deleted) {
            throw new ConvexError({
                message: "Widget not found",
                field: "widgetId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Authorization check
        widgetRules.userMustBeWidgetOwner(widget, user);

        // Must be in active status
        widgetRules.widgetMustBeInStatus(widget, ["active"]);

        // Verify this is an Americano widget with state
        if (widget.widgetConfig.type !== "tournament_americano") {
            throw new ConvexError({
                message: "Widget is not an Americano tournament",
                field: "widgetConfig.type",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }

        if (!widget.widgetState || widget.widgetState.type !== "tournament_americano") {
            throw new ConvexError({
                message: "Tournament has not been initialized",
                field: "widgetState",
                code: ERROR_CODES.ACTION_NOT_ALLOWED,
            });
        }

        const currentState = widget.widgetState.state as TournamentAmericanoState;

        // Update state with completion time
        await ctx.db.patch(args.widgetId, {
            widgetState: {
                type: "tournament_americano" as const,
                state: {
                    ...currentState,
                    completedAt: Date.now(),
                },
            },
            status: "completed",
            updatedAt: Date.now(),
            updatedBy: user._id,
        });

        return { success: true };
    },

    /***************************************************************
     * Cancel Tournament
     * Cancels an active or setup tournament
     ***************************************************************/
    cancelTournament: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            widgetId: Id<"classInstanceWidgets">;
        };
        user: Doc<"users">;
    }): Promise<{ success: boolean }> => {
        const widget = await ctx.db.get(args.widgetId);
        if (!widget || widget.deleted) {
            throw new ConvexError({
                message: "Widget not found",
                field: "widgetId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Authorization check
        widgetRules.userMustBeWidgetOwner(widget, user);

        // Can cancel from setup, ready, or active
        widgetRules.widgetMustBeInStatus(widget, ["setup", "ready", "active"]);

        // Update status
        await ctx.db.patch(args.widgetId, {
            status: "cancelled",
            updatedAt: Date.now(),
            updatedBy: user._id,
        });

        return { success: true };
    },

    /***************************************************************
     * Advance to Next Round
     * Manually advances the tournament to the next round
     ***************************************************************/
    advanceToNextRound: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            widgetId: Id<"classInstanceWidgets">;
        };
        user: Doc<"users">;
    }): Promise<{ success: boolean; newRound: number }> => {
        const widget = await ctx.db.get(args.widgetId);
        if (!widget || widget.deleted) {
            throw new ConvexError({
                message: "Widget not found",
                field: "widgetId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Authorization check
        widgetRules.userMustBeWidgetOwner(widget, user);

        // Must be in active status
        widgetRules.widgetMustBeInStatus(widget, ["active"]);

        // Verify this is an Americano widget with state
        if (widget.widgetConfig.type !== "tournament_americano") {
            throw new ConvexError({
                message: "Widget is not an Americano tournament",
                field: "widgetConfig.type",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }

        if (!widget.widgetState || widget.widgetState.type !== "tournament_americano") {
            throw new ConvexError({
                message: "Tournament has not been initialized",
                field: "widgetState",
                code: ERROR_CODES.ACTION_NOT_ALLOWED,
            });
        }

        const currentState = widget.widgetState.state as TournamentAmericanoState;

        // Check if current round is complete
        const isCurrentRoundComplete = tournamentAmericanoOperations.isRoundComplete(
            currentState.matches,
            currentState.currentRound
        );

        if (!isCurrentRoundComplete) {
            throw new ConvexError({
                message: `Round ${currentState.currentRound} is not complete. All matches must be finished before advancing.`,
                field: "currentRound",
                code: ERROR_CODES.ACTION_NOT_ALLOWED,
            });
        }

        // Check if already on last round
        if (currentState.currentRound >= currentState.totalRounds) {
            throw new ConvexError({
                message: "Tournament is already on the final round. Complete all matches and finish the tournament.",
                field: "currentRound",
                code: ERROR_CODES.ACTION_NOT_ALLOWED,
            });
        }

        // Advance to next round
        const newState = tournamentAmericanoOperations.advanceToNextRound(currentState);

        // Update widget state
        await ctx.db.patch(args.widgetId, {
            widgetState: {
                type: "tournament_americano" as const,
                state: newState,
            },
            updatedAt: Date.now(),
            updatedBy: user._id,
        });

        return { success: true, newRound: newState.currentRound };
    },
};
