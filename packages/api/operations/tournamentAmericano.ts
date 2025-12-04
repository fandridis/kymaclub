import {
    TournamentAmericanoConfig,
    TournamentAmericanoMatch,
    TournamentAmericanoStanding,
    TournamentAmericanoState,
    TournamentAmericanoPlayerCount,
    TournamentCourt,
} from '../types/widget';

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
 */

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

    // Validate number of players
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
    return Math.floor(numberOfPlayers / 4);
};

/***************************************************************
 * Team Generation
 ***************************************************************/

/**
 * Generate teams for fixed_teams mode
 * 
 * @param participantIds - Array of participant IDs
 * @returns Array of team objects with two players each
 */
export const generateFixedTeams = (participantIds: string[]): Array<{
    teamId: string;
    playerIds: [string, string];
}> => {
    if (participantIds.length % 2 !== 0) {
        throw new Error('Fixed teams require an even number of players');
    }

    // Shuffle participants for random pairing
    const shuffled = shuffleArray([...participantIds]);
    const teams: Array<{ teamId: string; playerIds: [string, string] }> = [];

    for (let i = 0; i < shuffled.length; i += 2) {
        teams.push({
            teamId: `team_${Math.floor(i / 2) + 1}`,
            playerIds: [shuffled[i], shuffled[i + 1]],
        });
    }

    return teams;
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
    const n = participantIds.length;
    if (n < 4 || n % 2 !== 0) {
        throw new Error('Need at least 4 players and an even count for rotating pairs');
    }

    // Use round-robin rotation: fix first player, rotate others
    const fixed = participantIds[0];
    const rotating = participantIds.slice(1);

    // Rotate the non-fixed players based on round number
    const rotationCount = (roundNumber - 1) % rotating.length;
    const rotated = [
        ...rotating.slice(rotationCount),
        ...rotating.slice(0, rotationCount),
    ];

    // Create pairs: fixed with first rotated, then remaining in order
    const allPlayers = [fixed, ...rotated];
    const pairs: Array<[string, string]> = [];

    for (let i = 0; i < allPlayers.length; i += 2) {
        pairs.push([allPlayers[i], allPlayers[i + 1]]);
    }

    return pairs;
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
    const matches: TournamentAmericanoMatch[] = [];
    const playerMatchCounts = new Map<string, number>();

    // Initialize match counts
    participantIds.forEach(id => playerMatchCounts.set(id, 0));

    if (config.mode === 'fixed_teams') {
        return generateFixedTeamsSchedule(participantIds, config);
    } else {
        return generateRotatingSchedule(participantIds, config);
    }
};

/**
 * Generate schedule for fixed_teams mode
 * Teams play against other teams in a partial round-robin
 */
const generateFixedTeamsSchedule = (
    participantIds: string[],
    config: TournamentAmericanoConfig
): GeneratedSchedule => {
    const teams = generateFixedTeams(participantIds);
    const matches: TournamentAmericanoMatch[] = [];
    const playerMatchCounts = new Map<string, number>();

    // Initialize match counts
    participantIds.forEach(id => playerMatchCounts.set(id, 0));

    // Generate all possible team matchups
    const matchups: Array<{ team1Idx: number; team2Idx: number }> = [];
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            matchups.push({ team1Idx: i, team2Idx: j });
        }
    }

    // Shuffle matchups for variety
    const shuffledMatchups = shuffleArray(matchups);

    // Assign matches to rounds based on court availability
    const courtsPerRound = config.courts.length;
    let roundNumber = 1;
    let courtIndex = 0;
    let matchesThisRound = 0;

    for (const matchup of shuffledMatchups) {
        const team1 = teams[matchup.team1Idx];
        const team2 = teams[matchup.team2Idx];

        // Check if any player would exceed max matches
        const wouldExceed = [...team1.playerIds, ...team2.playerIds].some(
            id => (playerMatchCounts.get(id) || 0) >= config.maxMatchesPerPlayer
        );

        if (wouldExceed) continue;

        // Create match
        const match: TournamentAmericanoMatch = {
            id: `match_r${roundNumber}_c${courtIndex + 1}`,
            roundNumber,
            courtId: config.courts[courtIndex].id,
            team1: team1.playerIds,
            team2: team2.playerIds,
            status: 'scheduled',
        };

        matches.push(match);

        // Update match counts
        [...team1.playerIds, ...team2.playerIds].forEach(id => {
            playerMatchCounts.set(id, (playerMatchCounts.get(id) || 0) + 1);
        });

        // Advance court/round
        courtIndex++;
        matchesThisRound++;

        if (courtIndex >= courtsPerRound) {
            courtIndex = 0;
            roundNumber++;
            matchesThisRound = 0;
        }
    }

    return {
        totalRounds: roundNumber,
        matches,
        playerMatchCounts,
    };
};

/**
 * Generate schedule for individual_rotation mode
 * Players rotate partners each round, with GREEDY selection for fairness.
 */
const generateRotatingSchedule = (
    participantIds: string[],
    config: TournamentAmericanoConfig
): GeneratedSchedule => {
    const matches: TournamentAmericanoMatch[] = [];
    // Initialize or re-initialize match counts at the start of the process
    const playerMatchCounts = new Map<string, number>(
        participantIds.map(id => [id, 0])
    );
    const maxCourts = config.courts.length;
    // Determine the max number of matches that can run in a round
    const courtsPerRound = Math.min(maxCourts, Math.floor(participantIds.length / 4));
    // Max rounds needed to cover all unique pairings
    const maxCombinatorialRounds = participantIds.length - 1;

    for (let round = 1; round <= maxCombinatorialRounds; round++) {
        const potentialPairs = generateRotatingPairs(participantIds, round);

        // Transform pairs into potential matches for this round
        const potentialMatches: {
            team1: [string, string],
            team2: [string, string],
            players: string[]
        }[] = [];

        // Group pairs into matches (Pair 0 vs Pair 1, Pair 2 vs Pair 3, etc.)
        for (let i = 0; i < potentialPairs.length; i += 2) {
            const team1 = potentialPairs[i];
            const team2 = potentialPairs[i + 1];

            if (team1 && team2) {
                potentialMatches.push({
                    team1: team1,
                    team2: team2,
                    players: [...team1, ...team2],
                });
            }
        }

        // --- CORE FAIRNESS IMPROVEMENT: Greedy Selection ---

        // 1. Filter out matches where any player is already at max
        let availableMatches = potentialMatches.filter(match =>
            !match.players.some(id =>
                (playerMatchCounts.get(id) || 0) >= config.maxMatchesPerPlayer
            )
        );

        // 2. Sort available matches based on player workload (fairness metric)
        // Sort by the SUM of current match counts for all 4 players (ascending).
        // Matches involving players who have played the LEAST will be prioritized.
        availableMatches.sort((matchA, matchB) => {
            const workloadA = matchA.players.reduce((sum, id) => sum + (playerMatchCounts.get(id) || 0), 0);
            const workloadB = matchB.players.reduce((sum, id) => sum + (playerMatchCounts.get(id) || 0), 0);
            return workloadA - workloadB;
        });

        // 3. Select the top N matches, where N is courtsPerRound, and handle conflicts.
        const matchesInThisRound: TournamentAmericanoMatch[] = [];
        const playersPlayingThisRound = new Set<string>();
        let courtIndex = 0;

        for (const potentialMatch of availableMatches) {
            // Check for conflicts: ensure no player is already assigned a match in this round
            const isConflict = potentialMatch.players.some(id => playersPlayingThisRound.has(id));

            // Also check the court limit
            if (isConflict || courtIndex >= courtsPerRound) {
                continue;
            }

            // No conflict and court available: Schedule the match
            const match: TournamentAmericanoMatch = {
                id: `match_r${round}_c${courtIndex + 1}`,
                roundNumber: round,
                courtId: config.courts[courtIndex].id,
                team1: potentialMatch.team1,
                team2: potentialMatch.team2,
                status: 'scheduled',
            };

            matchesInThisRound.push(match);
            potentialMatch.players.forEach(id => {
                playersPlayingThisRound.add(id);
                // Update match counts immediately after selection
                playerMatchCounts.set(id, (playerMatchCounts.get(id) || 0) + 1);
            });
            courtIndex++;
        }

        matches.push(...matchesInThisRound);

        // 4. Stop Condition: Check if all players have reached max matches AFTER processing the round
        const allAtMax = participantIds.every(
            id => (playerMatchCounts.get(id) || 0) >= config.maxMatchesPerPlayer
        );
        if (allAtMax) break;
    }

    // Determine actual total rounds used
    const totalRounds = matches.length > 0
        ? Math.max(...matches.map(m => m.roundNumber))
        : 0;

    return {
        totalRounds,
        matches,
        playerMatchCounts,
    };
};

/***************************************************************
 * Standings Calculation
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
    // Initialize standings for all participants
    const standingsMap = new Map<string, TournamentAmericanoStanding>();

    participantIds.forEach(id => {
        standingsMap.set(id, {
            participantId: id,
            matchesPlayed: 0,
            matchesWon: 0,
            matchesLost: 0,
            pointsScored: 0,
            pointsConceded: 0,
            pointsDifference: 0,
        });
    });

    // Process completed matches
    const completedMatches = matches.filter(m => m.status === 'completed');

    for (const match of completedMatches) {
        if (match.team1Score === undefined || match.team2Score === undefined) continue;

        const team1Won = match.team1Score > match.team2Score;

        // Update team 1 players
        for (const playerId of match.team1) {
            const standing = standingsMap.get(playerId);
            if (standing) {
                standing.matchesPlayed++;
                standing.pointsScored += match.team1Score;
                standing.pointsConceded += match.team2Score;
                standing.pointsDifference = standing.pointsScored - standing.pointsConceded;
                if (team1Won) {
                    standing.matchesWon++;
                } else {
                    standing.matchesLost++;
                }
            }
        }

        // Update team 2 players
        for (const playerId of match.team2) {
            const standing = standingsMap.get(playerId);
            if (standing) {
                standing.matchesPlayed++;
                standing.pointsScored += match.team2Score;
                standing.pointsConceded += match.team1Score;
                standing.pointsDifference = standing.pointsScored - standing.pointsConceded;
                if (!team1Won) {
                    standing.matchesWon++;
                } else {
                    standing.matchesLost++;
                }
            }
        }
    }

    // Convert to array and sort
    const standings = Array.from(standingsMap.values());

    return sortStandings(standings);
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
    return [...standings].sort((a, b) => {
        // Primary: Points difference
        if (b.pointsDifference !== a.pointsDifference) {
            return b.pointsDifference - a.pointsDifference;
        }
        // Secondary: Points scored
        if (b.pointsScored !== a.pointsScored) {
            return b.pointsScored - a.pointsScored;
        }
        // Tertiary: Matches won
        return b.matchesWon - a.matchesWon;
    });
};

/***************************************************************
 * Round Management
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

    // Generate schedule using existing logic
    const schedule = generateSchedule({
        participantIds: finalParticipantIds,
        config,
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
 * Fisher-Yates shuffle algorithm
 */
const shuffleArray = <T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

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
 */
export const createDefaultCourts = (count: number): TournamentCourt[] => {
    const courtNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const courts: TournamentCourt[] = [];

    for (let i = 0; i < count && i < courtNames.length; i++) {
        courts.push({
            id: `court_${courtNames[i].toLowerCase()}`,
            name: `Court ${courtNames[i]}`,
        });
    }

    return courts;
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

