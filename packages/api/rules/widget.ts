import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import type { Doc } from "../convex/_generated/dataModel";
import type {
    ClassInstanceWidget,
    WalkInEntry,
    SetupParticipant,
    WidgetStatus,
    TournamentAmericanoConfig,
} from "../types/widget";
import { isAmericanoConfig } from "../types/widget";
import { tournamentAmericanoOperations } from "../operations/tournamentAmericano";

/**
 * Widget Business Rules
 * 
 * Validation rules for widget operations including authorization,
 * state transitions, and data integrity checks.
 * 
 * NEW PARTICIPANT MODEL:
 * - Bookings are auto-included (no need to check for duplicates)
 * - Walk-ins are stored in widget.walkIns array
 * - SetupParticipant is the unified view during setup
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
 * Verify walk-in name is not already used
 * Checks against widget.walkIns array
 */
const walkInNameMustBeUnique = (
    walkIns: WalkInEntry[],
    walkInName: string
): void => {
    const existing = walkIns.find(
        w => w.name.toLowerCase() === walkInName.toLowerCase()
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
    participants: SetupParticipant[],
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
 * Uses SetupParticipant[] - the unified view of bookings + walk-ins
 */
const canStartTournament = (
    widget: ClassInstanceWidget,
    participants: SetupParticipant[]
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
 * Tournament Start Time Rules
 ***************************************************************/

/**
 * Hours before class start time when tournament can be started
 * This allows organizers to start tournaments shortly before class time
 * while preventing premature starts that could cause participant sync issues
 */
const START_WINDOW_HOURS = 2;

/**
 * Result of start time check
 */
interface StartTimeCheckResult {
    canStart: boolean;
    reason?: string;
    allowedStartTime?: number;
    minutesUntilAllowed?: number;
}

/**
 * Check if tournament can be started based on class start time
 * 
 * Rules:
 * - Tournament can only be started within START_WINDOW_HOURS hours of class start time
 * - This prevents premature starts that could cause participant sync issues
 * - Returns detailed info about when start will be allowed
 */
const checkStartTimeWindow = (
    classStartTime: number
): StartTimeCheckResult => {
    const now = Date.now();
    const startWindowMs = START_WINDOW_HOURS * 60 * 60 * 1000;
    const allowedStartTime = classStartTime - startWindowMs;

    if (now >= allowedStartTime) {
        return { canStart: true };
    }

    const minutesUntilAllowed = Math.ceil((allowedStartTime - now) / (60 * 1000));
    const hoursUntilAllowed = Math.floor(minutesUntilAllowed / 60);
    const remainingMinutes = minutesUntilAllowed % 60;

    let reason: string;
    if (hoursUntilAllowed > 0) {
        reason = `Tournament can be started ${hoursUntilAllowed}h ${remainingMinutes}m before class starts`;
    } else {
        reason = `Tournament can be started in ${remainingMinutes} minutes`;
    }

    return {
        canStart: false,
        reason,
        allowedStartTime,
        minutesUntilAllowed,
    };
};

/**
 * Enforce start time window (throws error if not within window)
 */
const enforceStartTimeWindow = (classStartTime: number): void => {
    const check = checkStartTimeWindow(classStartTime);
    if (!check.canStart) {
        throw new ConvexError({
            message: check.reason ?? "Tournament cannot be started yet",
            field: "startTime",
            code: ERROR_CODES.ACTION_NOT_ALLOWED,
        });
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

    // Note: Ties are allowed - both teams can have equal scores
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
    walkInNameMustBeUnique,

    // Tournament start
    canStartTournament,
    canStartAmericanoTournament,

    // Start time window
    checkStartTimeWindow,
    enforceStartTimeWindow,
    START_WINDOW_HOURS,

    // Match results
    canRecordMatchResult,
    validateMatchScores,

    // Round advancement
    canAdvanceRound,
};
