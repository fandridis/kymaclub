import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import type { Doc } from "../convex/_generated/dataModel";
import type {
    ClassInstanceWidget,
    WidgetParticipant,
    WidgetStatus,
    TournamentAmericanoConfig,
    WidgetConfig,
} from "../types/widget";
import { isAmericanoConfig } from "../types/widget";
import { tournamentAmericanoOperations } from "../operations/tournamentAmericano";

/**
 * Widget Business Rules
 * 
 * Validation rules for widget operations including authorization,
 * state transitions, and data integrity checks.
 */

/***************************************************************
 * Authorization Rules
 ***************************************************************/

/**
 * Verify user belongs to the business that owns the widget
 */
const userMustBeWidgetOwner = (
    widget: ClassInstanceWidget,
    user: Doc<"users">
): void => {
    if (widget.businessId !== user.businessId) {
        throw new ConvexError({
            message: "You are not authorized to manage this widget",
            field: "businessId",
            code: ERROR_CODES.UNAUTHORIZED,
        });
    }
};

/**
 * Verify user belongs to the business that owns the class instance
 */
const userMustBeInstanceOwner = (
    instance: Doc<"classInstances">,
    user: Doc<"users">
): void => {
    if (instance.businessId !== user.businessId) {
        throw new ConvexError({
            message: "You are not authorized to manage widgets for this class",
            field: "businessId",
            code: ERROR_CODES.UNAUTHORIZED,
        });
    }
};

/***************************************************************
 * Widget Attachment Rules
 ***************************************************************/

/**
 * Verify class instance can have a widget attached
 * - Instance must be scheduled (not cancelled/completed)
 * - Instance must not have already started
 */
const canAttachWidget = (instance: Doc<"classInstances">): void => {
    if (instance.status !== "scheduled") {
        throw new ConvexError({
            message: "Can only attach widgets to scheduled classes",
            field: "status",
            code: ERROR_CODES.ACTION_NOT_ALLOWED,
        });
    }

    const now = Date.now();
    if (instance.startTime <= now) {
        throw new ConvexError({
            message: "Cannot attach widget to a class that has already started",
            field: "startTime",
            code: ERROR_CODES.ACTION_NOT_ALLOWED,
        });
    }
};

/**
 * Verify class instance doesn't already have a widget
 */
const instanceMustNotHaveWidget = (existingWidget: ClassInstanceWidget | null): void => {
    if (existingWidget && !existingWidget.deleted) {
        throw new ConvexError({
            message: "This class already has a widget attached. Remove it first.",
            field: "classInstanceId",
            code: ERROR_CODES.DUPLICATE_RESOURCE,
        });
    }
};

/**
 * Verify widget can be detached (removed)
 * - Cannot detach if tournament is in progress
 */
const canDetachWidget = (widget: ClassInstanceWidget): void => {
    if (widget.status === "active") {
        throw new ConvexError({
            message: "Cannot remove widget while tournament is in progress",
            field: "status",
            code: ERROR_CODES.ACTION_NOT_ALLOWED,
        });
    }
};

/***************************************************************
 * Status Transition Rules
 ***************************************************************/

// Valid status transitions
const validTransitions: Record<WidgetStatus, WidgetStatus[]> = {
    setup: ["ready", "cancelled"],
    ready: ["active", "setup", "cancelled"],
    active: ["completed", "cancelled"],
    completed: [], // Terminal state
    cancelled: [], // Terminal state
};

/**
 * Verify status transition is valid
 */
const canTransitionStatus = (
    currentStatus: WidgetStatus,
    newStatus: WidgetStatus
): void => {
    const allowed = validTransitions[currentStatus];

    if (!allowed.includes(newStatus)) {
        throw new ConvexError({
            message: `Cannot transition from '${currentStatus}' to '${newStatus}'`,
            field: "status",
            code: ERROR_CODES.ACTION_NOT_ALLOWED,
        });
    }
};

/**
 * Verify widget is in expected status
 */
const widgetMustBeInStatus = (
    widget: ClassInstanceWidget,
    expectedStatuses: WidgetStatus[]
): void => {
    if (!expectedStatuses.includes(widget.status as WidgetStatus)) {
        throw new ConvexError({
            message: `Widget must be in ${expectedStatuses.join(" or ")} status`,
            field: "status",
            code: ERROR_CODES.ACTION_NOT_ALLOWED,
        });
    }
};

/***************************************************************
 * Participant Rules
 ***************************************************************/

/**
 * Verify participant can be added to widget
 * - Widget must be in setup or ready status
 */
const canAddParticipant = (widget: ClassInstanceWidget): void => {
    if (widget.status !== "setup" && widget.status !== "ready") {
        throw new ConvexError({
            message: "Can only add participants before tournament starts",
            field: "status",
            code: ERROR_CODES.ACTION_NOT_ALLOWED,
        });
    }
};

/**
 * Verify participant can be removed from widget
 * - Widget must be in setup or ready status
 */
const canRemoveParticipant = (widget: ClassInstanceWidget): void => {
    if (widget.status !== "setup" && widget.status !== "ready") {
        throw new ConvexError({
            message: "Can only remove participants before tournament starts",
            field: "status",
            code: ERROR_CODES.ACTION_NOT_ALLOWED,
        });
    }
};

/**
 * Verify booking is not already a participant
 */
const bookingMustNotBeParticipant = (
    existingParticipant: WidgetParticipant | null
): void => {
    if (existingParticipant) {
        throw new ConvexError({
            message: "This booking is already a participant in the tournament",
            field: "bookingId",
            code: ERROR_CODES.DUPLICATE_RESOURCE,
        });
    }
};

/**
 * Verify walk-in name is not already used
 */
const walkInNameMustBeUnique = (
    participants: WidgetParticipant[],
    walkInName: string
): void => {
    const existing = participants.find(
        p => p.walkIn?.name.toLowerCase() === walkInName.toLowerCase()
    );

    if (existing) {
        throw new ConvexError({
            message: `A participant named "${walkInName}" already exists`,
            field: "walkIn.name",
            code: ERROR_CODES.DUPLICATE_RESOURCE,
        });
    }
};

/***************************************************************
 * Tournament Start Rules
 ***************************************************************/

/**
 * Verify Americano tournament can be started
 * - Must have correct number of participants
 * - Config must be valid
 */
const canStartAmericanoTournament = (
    widget: ClassInstanceWidget,
    participants: WidgetParticipant[],
    config: TournamentAmericanoConfig
): void => {
    // Widget must be in ready or setup status
    if (widget.status !== "ready" && widget.status !== "setup") {
        throw new ConvexError({
            message: "Tournament must be in setup or ready status to start",
            field: "status",
            code: ERROR_CODES.ACTION_NOT_ALLOWED,
        });
    }

    // Validate participant count
    if (participants.length !== config.numberOfPlayers) {
        throw new ConvexError({
            message: `Need exactly ${config.numberOfPlayers} participants, have ${participants.length}`,
            field: "participants",
            code: ERROR_CODES.VALIDATION_ERROR,
        });
    }

    // Validate config
    const validation = tournamentAmericanoOperations.validateConfig(config);
    if (!validation.isValid) {
        throw new ConvexError({
            message: `Invalid tournament config: ${validation.errors.join(", ")}`,
            field: "config",
            code: ERROR_CODES.VALIDATION_ERROR,
        });
    }
};

/**
 * Verify any tournament can be started (dispatches to type-specific validation)
 */
const canStartTournament = (
    widget: ClassInstanceWidget,
    participants: WidgetParticipant[]
): void => {
    // Widget must be in ready or setup status
    if (widget.status !== "ready" && widget.status !== "setup") {
        throw new ConvexError({
            message: "Tournament must be in setup or ready status to start",
            field: "status",
            code: ERROR_CODES.ACTION_NOT_ALLOWED,
        });
    }

    const widgetConfig = widget.widgetConfig;

    // Dispatch to type-specific validation
    if (isAmericanoConfig(widgetConfig)) {
        canStartAmericanoTournament(widget, participants, widgetConfig.config);
    } else if (widgetConfig.type === 'tournament_round_robin') {
        // Round Robin validation
        const expectedCount = widgetConfig.config.numberOfTeams * widgetConfig.config.playersPerTeam;
        if (participants.length !== expectedCount) {
            throw new ConvexError({
                message: `Need exactly ${expectedCount} participants (${widgetConfig.config.numberOfTeams} teams × ${widgetConfig.config.playersPerTeam} players), have ${participants.length}`,
                field: "participants",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }
    } else if (widgetConfig.type === 'tournament_brackets') {
        // Brackets validation
        if (participants.length !== widgetConfig.config.numberOfParticipants) {
            throw new ConvexError({
                message: `Need exactly ${widgetConfig.config.numberOfParticipants} participants, have ${participants.length}`,
                field: "participants",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }
    }
};

/***************************************************************
 * Match Result Rules
 ***************************************************************/

/**
 * Verify match result can be recorded
 */
const canRecordMatchResult = (widget: ClassInstanceWidget): void => {
    if (widget.status !== "active") {
        throw new ConvexError({
            message: "Can only record match results for active tournaments",
            field: "status",
            code: ERROR_CODES.ACTION_NOT_ALLOWED,
        });
    }
};

/**
 * Validate match scores
 */
const validateMatchScores = (
    team1Score: number,
    team2Score: number,
    matchPoints: number
): void => {
    if (team1Score < 0 || team2Score < 0) {
        throw new ConvexError({
            message: "Scores cannot be negative",
            field: "score",
            code: ERROR_CODES.VALIDATION_ERROR,
        });
    }

    // In Americano, scores should typically add up to matchPoints
    // (one team reaches the target, the other has remaining points)
    // But we allow flexible scoring for edge cases
    if (team1Score > matchPoints || team2Score > matchPoints) {
        throw new ConvexError({
            message: `Scores cannot exceed ${matchPoints} points`,
            field: "score",
            code: ERROR_CODES.VALIDATION_ERROR,
        });
    }

    // Scores shouldn't be equal (there's always a winner)
    if (team1Score === team2Score) {
        throw new ConvexError({
            message: "Scores cannot be equal - there must be a winner",
            field: "score",
            code: ERROR_CODES.VALIDATION_ERROR,
        });
    }
};

/***************************************************************
 * Round Advancement Rules
 ***************************************************************/

/**
 * Verify round can be advanced
 */
const canAdvanceRound = (
    widget: ClassInstanceWidget,
    currentRound: number,
    totalRounds: number
): void => {
    if (widget.status !== "active") {
        throw new ConvexError({
            message: "Can only advance rounds in active tournaments",
            field: "status",
            code: ERROR_CODES.ACTION_NOT_ALLOWED,
        });
    }

    if (currentRound >= totalRounds) {
        throw new ConvexError({
            message: "Already at the final round",
            field: "currentRound",
            code: ERROR_CODES.ACTION_NOT_ALLOWED,
        });
    }
};

/***************************************************************
 * Export Rules Object
 ***************************************************************/

export const widgetRules = {
    // Authorization
    userMustBeWidgetOwner,
    userMustBeInstanceOwner,

    // Widget attachment
    canAttachWidget,
    instanceMustNotHaveWidget,
    canDetachWidget,

    // Status transitions
    canTransitionStatus,
    widgetMustBeInStatus,

    // Participants
    canAddParticipant,
    canRemoveParticipant,
    bookingMustNotBeParticipant,
    walkInNameMustBeUnique,

    // Tournament start
    canStartTournament,
    canStartAmericanoTournament,

    // Match results
    canRecordMatchResult,
    validateMatchScores,

    // Round advancement
    canAdvanceRound,
};

