import {
    TournamentAmericanoConfig,
    TournamentAmericanoMatch,
    TournamentAmericanoStanding,
    TournamentAmericanoState,
    TournamentAmericanoPlayerCount,
    TournamentCourt,
    FixedTeam,
} from '../types/widget';

// Import generic utilities
import {
    // Core
    getMatchesForRound as genericGetMatchesForRound,
    isRoundComplete as genericIsRoundComplete,
    getCurrentRound as genericGetCurrentRound,
    isTournamentComplete as genericIsTournamentComplete,
    shuffleArray,
    // Standings
    calculateStandings as genericCalculateStandings,
    sortStandings as genericSortStandings,
    // Teams
    generateFixedTeams as genericGenerateFixedTeams,
    generateRotatingPairs as genericGenerateRotatingPairs,
    // Scheduling
    generateSchedule as genericGenerateSchedule,
    applyMatchResult as genericApplyMatchResult,
    createDefaultCourts as genericCreateDefaultCourts,
    // Types
    GenericMatch,
    GenericStanding,
    GenericTeam,
    SchedulingConfig,
} from './tournaments';

/**
 * Americano Tournament Operations - Pure Business Logic
 * 
 * This module implements the core logic for Americano-style padel tournaments.
 * All functions are pure with no side effects or database access.
 * 
 * Americano Format Rules:
 * - Players rotate partners each round (individual_rotation mode)
 * - Or play with fixed teams throughout (fixed_teams mode)
 * - Points-based scoring (typically 20, 21, 24, or 25 points per match)
 * - Multiple courts run matches in parallel
 * - Final standings based on total points scored
 * 
 * This module wraps the generic tournament utilities with Americano-specific
 * configuration (teamSize=2 for doubles padel).
 */

/** Team size for Americano (doubles padel) */
const AMERICANO_TEAM_SIZE = 2;

/***************************************************************
 * Configuration Validation
 ***************************************************************/

/**
 * Validates Americano tournament configuration
 * 
 * @param config - Tournament configuration to validate
 * @returns Object with isValid flag and any error messages
 */
export const validateConfig = (config: TournamentAmericanoConfig): {
    isValid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];

    // Validate number of players (Americano-specific valid counts)
    const validPlayerCounts: TournamentAmericanoPlayerCount[] = [8, 12, 16];
    if (!validPlayerCounts.includes(config.numberOfPlayers)) {
        errors.push(`Invalid number of players: ${config.numberOfPlayers}. Must be 8, 12, or 16.`);
    }

    // Validate courts
    if (!config.courts || config.courts.length === 0) {
        errors.push('At least one court is required.');
    }

    // For fixed_teams mode, player count must be even (for pairs)
    if (config.mode === 'fixed_teams' && config.numberOfPlayers % 2 !== 0) {
        errors.push('Fixed teams mode requires an even number of players.');
    }

    // Validate max matches per player is reasonable
    const minMatchesNeeded = config.mode === 'fixed_teams'
        ? Math.ceil((config.numberOfPlayers / 2 - 1) / 2) // At least play some other teams
        : 3; // At least 3 rotations in individual mode

    if (config.maxMatchesPerPlayer < minMatchesNeeded) {
        errors.push(`Max matches per player (${config.maxMatchesPerPlayer}) is too low. Minimum: ${minMatchesNeeded}`);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Calculate minimum required courts for a configuration
 */
export const getMinimumCourts = (numberOfPlayers: TournamentAmericanoPlayerCount): number => {
    // 4 players per match (2v2), need at least enough courts to play all at once
    return Math.floor(numberOfPlayers / (AMERICANO_TEAM_SIZE * 2));
};

/***************************************************************
 * Team Generation (Wrappers for generic utilities)
 ***************************************************************/

/**
 * Generate teams for fixed_teams mode
 * 
 * If predefined teams are provided, validates and uses them.
 * Otherwise, generates random team pairings.
 * 
 * @param participantIds - Array of participant IDs
 * @param predefinedTeams - Optional array of predefined teams from config
 * @returns Array of team objects with two players each
 */
export const generateFixedTeams = (
    participantIds: string[],
    predefinedTeams?: FixedTeam[]
): Array<{
    teamId: string;
    playerIds: [string, string];
}> => {
    // Convert FixedTeam to GenericTeam if provided
    const genericPredefined: GenericTeam<string>[] | undefined = predefinedTeams?.map(t => ({
        teamId: t.teamId,
        playerIds: [...t.playerIds],
    }));

    const teams = genericGenerateFixedTeams(participantIds, AMERICANO_TEAM_SIZE, genericPredefined);

    // Cast back to Americano-specific format with [string, string] tuple
    return teams.map(t => ({
        teamId: t.teamId,
        playerIds: t.playerIds as [string, string],
    }));
};

/**
 * Generate rotating pairs for a single round in individual_rotation mode
 * Uses a round-robin rotation algorithm where one player stays fixed
 * and others rotate positions
 * 
 * @param participantIds - Array of participant IDs
 * @param roundNumber - Current round (1-indexed)
 * @returns Array of pairs for this round
 */
export const generateRotatingPairs = (
    participantIds: string[],
    roundNumber: number
): Array<[string, string]> => {
    return genericGenerateRotatingPairs(participantIds, roundNumber);
};

/***************************************************************
 * Schedule Generation
 ***************************************************************/

interface ScheduleParams {
    participantIds: string[];
    config: TournamentAmericanoConfig;
}

interface GeneratedSchedule {
    totalRounds: number;
    matches: TournamentAmericanoMatch[];
    playerMatchCounts: Map<string, number>;
}

/**
 * Generate complete tournament schedule
 * 
 * @param params - Participants and config
 * @returns Generated schedule with all rounds and matches
 */
export const generateSchedule = (params: ScheduleParams): GeneratedSchedule => {
    const { participantIds, config } = params;

    // Convert to generic scheduling config
    const schedulingConfig: SchedulingConfig<string> = {
        participantIds,
        courts: config.courts,
        maxMatchesPerPlayer: config.maxMatchesPerPlayer,
        teamSize: AMERICANO_TEAM_SIZE,
        predefinedTeams: config.fixedTeams?.map(t => ({
            teamId: t.teamId,
            playerIds: [...t.playerIds],
        })),
    };

    const mode = config.mode === 'fixed_teams' ? 'fixed_teams' : 'rotating';
    const result = genericGenerateSchedule(schedulingConfig, mode);

    // Convert generic matches to Americano matches
    // Note: Generic status includes 'cancelled' but Americano only has scheduled/in_progress/completed
    // Since we're generating new matches, they will always be 'scheduled' initially
    const americanoMatches: TournamentAmericanoMatch[] = result.matches.map(m => ({
        id: m.id,
        roundNumber: m.roundNumber,
        courtId: m.courtId,
        team1: m.team1 as [string, string],
        team2: m.team2 as [string, string],
        status: m.status as TournamentAmericanoMatch['status'],
        team1Score: m.team1Score,
        team2Score: m.team2Score,
        completedAt: m.completedAt,
    }));

    return {
        totalRounds: result.totalRounds,
        matches: americanoMatches,
        playerMatchCounts: result.playerMatchCounts,
    };
};

/***************************************************************
 * Standings Calculation (Wrappers for generic utilities)
 ***************************************************************/

/**
 * Calculate standings from match results
 * 
 * @param matches - All tournament matches (including completed ones)
 * @param participantIds - All participant IDs
 * @returns Sorted standings array (best to worst)
 */
export const calculateStandings = (
    matches: TournamentAmericanoMatch[],
    participantIds: string[]
): TournamentAmericanoStanding[] => {
    // Convert to generic matches
    const genericMatches: GenericMatch<string>[] = matches.map(m => ({
        id: m.id,
        roundNumber: m.roundNumber,
        courtId: m.courtId,
        team1: [...m.team1],
        team2: [...m.team2],
        status: m.status,
        team1Score: m.team1Score,
        team2Score: m.team2Score,
        completedAt: m.completedAt,
    }));

    const genericStandings = genericCalculateStandings(genericMatches, participantIds);

    // Convert back to Americano standings
    return genericStandings.map(s => ({
        participantId: s.participantId,
        matchesPlayed: s.matchesPlayed,
        matchesWon: s.matchesWon,
        matchesLost: s.matchesLost,
        pointsScored: s.pointsScored,
        pointsConceded: s.pointsConceded,
        pointsDifference: s.pointsDifference,
    }));
};

/**
 * Sort standings by:
 * 1. Points difference (descending)
 * 2. Points scored (descending)
 * 3. Matches won (descending)
 */
export const sortStandings = (
    standings: TournamentAmericanoStanding[]
): TournamentAmericanoStanding[] => {
    // Convert to generic and back
    const genericStandings: GenericStanding<string>[] = standings.map(s => ({
        participantId: s.participantId,
        matchesPlayed: s.matchesPlayed,
        matchesWon: s.matchesWon,
        matchesLost: s.matchesLost,
        pointsScored: s.pointsScored,
        pointsConceded: s.pointsConceded,
        pointsDifference: s.pointsDifference,
    }));

    const sorted = genericSortStandings(genericStandings);

    return sorted.map(s => ({
        participantId: s.participantId,
        matchesPlayed: s.matchesPlayed,
        matchesWon: s.matchesWon,
        matchesLost: s.matchesLost,
        pointsScored: s.pointsScored,
        pointsConceded: s.pointsConceded,
        pointsDifference: s.pointsDifference,
    }));
};

/***************************************************************
 * Round Management (Wrappers for generic utilities)
 ***************************************************************/

/**
 * Get matches for a specific round
 */
export const getMatchesForRound = (
    matches: TournamentAmericanoMatch[],
    roundNumber: number
): TournamentAmericanoMatch[] => {
    return matches.filter(m => m.roundNumber === roundNumber);
};

/**
 * Check if a round is complete (all matches finished)
 */
export const isRoundComplete = (
    matches: TournamentAmericanoMatch[],
    roundNumber: number
): boolean => {
    const roundMatches = getMatchesForRound(matches, roundNumber);
    return roundMatches.length > 0 && roundMatches.every(m => m.status === 'completed');
};

/**
 * Get current round number (first incomplete round)
 */
export const getCurrentRound = (matches: TournamentAmericanoMatch[]): number => {
    if (matches.length === 0) return 1;

    const maxRound = Math.max(...matches.map(m => m.roundNumber));

    for (let round = 1; round <= maxRound; round++) {
        if (!isRoundComplete(matches, round)) {
            return round;
        }
    }

    // All rounds complete
    return maxRound;
};

/**
 * Check if tournament is complete (all rounds finished)
 */
export const isTournamentComplete = (state: TournamentAmericanoState): boolean => {
    if (state.matches.length === 0) return false;
    return state.matches.every(m => m.status === 'completed');
};

/***************************************************************
 * Match Result Processing
 ***************************************************************/

interface MatchResult {
    matchId: string;
    team1Score: number;
    team2Score: number;
}

/**
 * Apply a match result to the tournament state
 * Note: This does NOT auto-advance to the next round. Use advanceToNextRound() separately.
 * 
 * @param state - Current tournament state
 * @param result - Match result to apply
 * @returns Updated tournament state
 */
export const applyMatchResult = (
    state: TournamentAmericanoState,
    result: MatchResult
): TournamentAmericanoState => {
    const updatedMatches = state.matches.map(match => {
        if (match.id !== result.matchId) return match;

        return {
            ...match,
            team1Score: result.team1Score,
            team2Score: result.team2Score,
            status: 'completed' as const,
            completedAt: Date.now(),
        };
    });

    // Recalculate standings
    const participantIds = extractParticipantIds(updatedMatches);
    const updatedStandings = calculateStandings(updatedMatches, participantIds);

    // Keep current round unchanged - manual advancement required
    return {
        ...state,
        matches: updatedMatches,
        standings: updatedStandings,
    };
};

/**
 * Advance to the next round
 * Only succeeds if all matches in current round are complete
 * 
 * @param state - Current tournament state
 * @returns Updated tournament state with incremented currentRound
 * @throws Error if current round is not complete
 */
export const advanceToNextRound = (
    state: TournamentAmericanoState
): TournamentAmericanoState => {
    // Check if current round is complete
    if (!isRoundComplete(state.matches, state.currentRound)) {
        throw new Error(`Round ${state.currentRound} is not complete yet`);
    }

    // Check if this is the last round
    if (state.currentRound >= state.totalRounds) {
        throw new Error('Tournament is already on the final round');
    }

    return {
        ...state,
        currentRound: state.currentRound + 1,
    };
};

/**
 * Extract all unique participant IDs from matches
 */
const extractParticipantIds = (matches: TournamentAmericanoMatch[]): string[] => {
    const ids = new Set<string>();

    for (const match of matches) {
        match.team1.forEach(id => ids.add(id));
        match.team2.forEach(id => ids.add(id));
    }

    return Array.from(ids);
};

/***************************************************************
 * State Initialization
 ***************************************************************/

/**
 * Initialize tournament state from config and participants
 * 
 * @param config - Tournament configuration
 * @param participantIds - Array of participant IDs
 * @returns Initial tournament state
 */
export const initializeTournamentState = (
    config: TournamentAmericanoConfig,
    participantIds: string[]
): Omit<TournamentAmericanoState, 'participants'> => {
    // Validate participant count
    if (participantIds.length !== config.numberOfPlayers) {
        throw new Error(
            `Expected ${config.numberOfPlayers} players, got ${participantIds.length}`
        );
    }

    // Generate schedule
    const schedule = generateSchedule({ participantIds, config });

    // Initialize standings
    const standings = participantIds.map(id => ({
        participantId: id,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        pointsScored: 0,
        pointsConceded: 0,
        pointsDifference: 0,
    }));

    return {
        currentRound: 1,
        totalRounds: schedule.totalRounds,
        matches: schedule.matches,
        standings,
        startedAt: Date.now(),
    };
};

/***************************************************************
 * Preview Schedule Generation
 ***************************************************************/

/**
 * Preview schedule result type
 */
export interface PreviewSchedule {
    totalRounds: number;
    matches: TournamentAmericanoMatch[];
    standings: TournamentAmericanoStanding[];
    placeholderCount: number;
    isPreview: true;
}

/**
 * Generate a preview schedule with placeholder players for unfilled spots
 * 
 * This is used during setup mode to show participants what the schedule
 * will look like, even before all players have registered.
 * 
 * For fixed_teams mode, if teams are already configured, the preview will
 * use those teams. Players not yet assigned to teams will appear as placeholders.
 * 
 * @param participantIds - Array of actual participant IDs (can be empty or partial)
 * @param config - Tournament configuration
 * @returns Preview schedule with placeholders for missing players
 */
export const generatePreviewSchedule = (
    participantIds: string[],
    config: TournamentAmericanoConfig
): PreviewSchedule => {
    const targetCount = config.numberOfPlayers;
    const actualCount = participantIds.length;
    const placeholderCount = Math.max(0, targetCount - actualCount);

    // Create full participant list with placeholders
    const allParticipantIds: string[] = [...participantIds];
    for (let i = 0; i < placeholderCount; i++) {
        allParticipantIds.push(`placeholder_${i + 1}`);
    }

    // Ensure we have exactly the right number of participants
    // (truncate if somehow we have more than needed)
    const finalParticipantIds = allParticipantIds.slice(0, targetCount);

    // For fixed_teams mode with pre-configured teams, create preview teams
    // that include placeholders for unassigned players
    let previewConfig = config;
    if (config.mode === 'fixed_teams' && config.fixedTeams && config.fixedTeams.length > 0) {
        // Create placeholder teams for players not yet in a team
        const assignedPlayers = new Set<string>();
        config.fixedTeams.forEach(team => {
            team.playerIds.forEach(id => assignedPlayers.add(id));
        });

        const unassignedPlayers = finalParticipantIds.filter(id => !assignedPlayers.has(id));
        const placeholderTeams: FixedTeam[] = [];

        // Pair up unassigned players into placeholder teams
        for (let i = 0; i < unassignedPlayers.length; i += 2) {
            if (i + 1 < unassignedPlayers.length) {
                placeholderTeams.push({
                    teamId: `preview_team_${Math.floor(i / 2) + config.fixedTeams.length + 1}`,
                    playerIds: [unassignedPlayers[i], unassignedPlayers[i + 1]],
                });
            }
        }

        previewConfig = {
            ...config,
            fixedTeams: [...config.fixedTeams, ...placeholderTeams],
        };
    }

    // Generate schedule using existing logic
    const schedule = generateSchedule({
        participantIds: finalParticipantIds,
        config: previewConfig,
    });

    // Initialize preview standings (all zeros)
    const standings: TournamentAmericanoStanding[] = finalParticipantIds.map(id => ({
        participantId: id,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        pointsScored: 0,
        pointsConceded: 0,
        pointsDifference: 0,
    }));

    return {
        totalRounds: schedule.totalRounds,
        matches: schedule.matches,
        standings,
        placeholderCount,
        isPreview: true,
    };
};

/***************************************************************
 * Utility Functions
 ***************************************************************/

/**
 * Get statistics summary for display
 */
export const getTournamentSummary = (state: TournamentAmericanoState): {
    currentRound: number;
    totalRounds: number;
    completedMatches: number;
    totalMatches: number;
    isComplete: boolean;
    leader: TournamentAmericanoStanding | null;
} => {
    const completedMatches = state.matches.filter(m => m.status === 'completed').length;
    const isComplete = isTournamentComplete(state);

    return {
        currentRound: state.currentRound,
        totalRounds: state.totalRounds,
        completedMatches,
        totalMatches: state.matches.length,
        isComplete,
        leader: state.standings.length > 0 ? state.standings[0] : null,
    };
};

/**
 * Create default court configuration
 * Note: Americano tournaments are limited to 8 courts maximum
 */
export const createDefaultCourts = (count: number): TournamentCourt[] => {
    // Americano tournaments traditionally support up to 8 courts
    const maxCourts = Math.min(count, 8);
    return genericCreateDefaultCourts(maxCourts);
};

// Export all operations as a namespace
export const tournamentAmericanoOperations = {
    // Validation
    validateConfig,
    getMinimumCourts,

    // Team generation
    generateFixedTeams,
    generateRotatingPairs,

    // Schedule
    generateSchedule,
    generatePreviewSchedule,

    // Standings
    calculateStandings,
    sortStandings,

    // Round management
    getMatchesForRound,
    isRoundComplete,
    getCurrentRound,
    isTournamentComplete,
    advanceToNextRound,

    // Match results
    applyMatchResult,

    // Initialization
    initializeTournamentState,

    // Utilities
    getTournamentSummary,
    createDefaultCourts,
};
