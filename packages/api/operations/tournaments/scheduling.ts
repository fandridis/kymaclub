/**
 * Generic Tournament Scheduling
 * 
 * This module provides scheduling algorithms for tournament match generation.
 * The algorithms prioritize fairness in terms of:
 * - Opponent variety: Teams should face different opponents
 * - Workload balance: Players should have similar match counts
 */

import {
    GenericMatch,
    GenericTeam,
    Court,
    GeneratedSchedule,
    SchedulingConfig,
} from './types';
import { generateFixedTeams, generateRotatingTeams, getAllTeamMatchups } from './teams';

/***************************************************************
 * Schedule Generation
 ***************************************************************/

/**
 * Generate a complete tournament schedule
 * 
 * Supports two modes:
 * - Fixed teams: Teams stay the same throughout, play against other teams
 * - Rotating teams: Players rotate partners each round
 * 
 * @param config - Scheduling configuration
 * @param mode - 'fixed_teams' or 'rotating'
 * @returns Generated schedule with matches and player match counts
 */
export const generateSchedule = <TPlayerId = string>(
    config: SchedulingConfig<TPlayerId>,
    mode: 'fixed_teams' | 'rotating'
): GeneratedSchedule<TPlayerId> => {
    if (mode === 'fixed_teams') {
        return generateFixedTeamsSchedule(config);
    } else {
        return generateRotatingSchedule(config);
    }
};

/***************************************************************
 * Fixed Teams Schedule
 ***************************************************************/

/**
 * Generate schedule for fixed teams mode
 * 
 * Teams play against other teams with FAIRNESS-OPTIMIZED scheduling.
 * 
 * The algorithm prioritizes:
 * 1. Opponent Variety: Teams that have played each other the fewest times are matched first
 * 2. Workload Balance: When tied, matches involving players with fewer games are prioritized
 */
const generateFixedTeamsSchedule = <TPlayerId = string>(
    config: SchedulingConfig<TPlayerId>
): GeneratedSchedule<TPlayerId> => {
    const { participantIds, courts, maxMatchesPerPlayer, teamSize, predefinedTeams } = config;

    // Input validation
    if (courts.length === 0) {
        throw new Error('At least one court is required for scheduling');
    }
    if (participantIds.length === 0) {
        throw new Error('At least one participant is required');
    }

    // Generate teams
    const teams = generateFixedTeams(participantIds, teamSize, predefinedTeams);
    const matches: GenericMatch<TPlayerId>[] = [];
    
    // Use Record instead of Map for Convex compatibility
    const playerMatchCounts: Record<string, number> = {};
    participantIds.forEach(id => { playerMatchCounts[String(id)] = 0; });
    
    const courtsPerRound = courts.length;

    // Initialize opponent tracking: Map<TeamId, Map<OpponentTeamId, Count>>
    const teamOpponentCounts = new Map<string, Map<string, number>>();
    teams.forEach(t1 => {
        const opponentMap = new Map<string, number>();
        teams.forEach(t2 => {
            if (t1.teamId !== t2.teamId) opponentMap.set(t2.teamId, 0);
        });
        teamOpponentCounts.set(t1.teamId, opponentMap);
    });

    // Generate ALL possible team matchups
    const allMatchups = getAllTeamMatchups(teams);

    let roundNumber = 1;

    // --- Dynamic Scheduling Loop ---
    while (true) {
        // A. Filter available matchups (not exceeding max matches)
        const availableMatchups = allMatchups.filter(matchup => {
            const team1 = teams.find(t => t.teamId === matchup.team1Id);
            const team2 = teams.find(t => t.teamId === matchup.team2Id);
            if (!team1 || !team2) return false;

            // Check if any player would exceed max matches
            const allPlayers = [...team1.playerIds, ...team2.playerIds];
            return !allPlayers.some(
                id => (playerMatchCounts[String(id)] || 0) >= maxMatchesPerPlayer
            );
        });

        if (availableMatchups.length === 0) break;

        // B. Sort based on Fairness Metrics (Opponent Variety & Workload Balance)
        availableMatchups.sort((matchA, matchB) => {
            const team1A = teams.find(t => t.teamId === matchA.team1Id)!;
            const team2A = teams.find(t => t.teamId === matchA.team2Id)!;
            const team1B = teams.find(t => t.teamId === matchB.team1Id)!;
            const team2B = teams.find(t => t.teamId === matchB.team2Id)!;

            // Priority 1: Opponent Variety (minimize times these two teams have played)
            const playsA = teamOpponentCounts.get(matchA.team1Id)?.get(matchA.team2Id) || 0;
            const playsB = teamOpponentCounts.get(matchB.team1Id)?.get(matchB.team2Id) || 0;
            if (playsA !== playsB) {
                return playsA - playsB; // ASC: Matchup played least wins
            }

            // Priority 2: Workload Balance (minimize total player match counts)
            const workloadA = [...team1A.playerIds, ...team2A.playerIds].reduce(
                (sum, id) => sum + (playerMatchCounts[String(id)] || 0), 0
            );
            const workloadB = [...team1B.playerIds, ...team2B.playerIds].reduce(
                (sum, id) => sum + (playerMatchCounts[String(id)] || 0), 0
            );
            return workloadA - workloadB; // ASC: Matchup with least played players wins
        });

        // C. Schedule the Round - greedy selection
        const teamsPlayingThisRound = new Set<string>();
        let courtIndex = 0;
        let matchesInRound = 0;

        for (const matchup of availableMatchups) {
            if (courtIndex >= courtsPerRound) break;

            const team1 = teams.find(t => t.teamId === matchup.team1Id)!;
            const team2 = teams.find(t => t.teamId === matchup.team2Id)!;

            // Check for conflict: ensure neither team is already scheduled for this round
            if (teamsPlayingThisRound.has(team1.teamId) || teamsPlayingThisRound.has(team2.teamId)) {
                continue;
            }

            // Create match
            const match: GenericMatch<TPlayerId> = {
                id: `match_r${roundNumber}_c${courtIndex + 1}`,
                roundNumber,
                courtId: courts[courtIndex].id,
                team1: team1.playerIds,
                team2: team2.playerIds,
                status: 'scheduled',
            };

            matches.push(match);
            matchesInRound++;
            courtIndex++;

            // Update tracking
            teamsPlayingThisRound.add(team1.teamId);
            teamsPlayingThisRound.add(team2.teamId);

            // Update player match counts
            [...team1.playerIds, ...team2.playerIds].forEach(id => {
                playerMatchCounts[String(id)] = (playerMatchCounts[String(id)] || 0) + 1;
            });

            // Update opponent tracking (for next round's scoring)
            const count1 = teamOpponentCounts.get(team1.teamId)!;
            count1.set(team2.teamId, (count1.get(team2.teamId) || 0) + 1);
            const count2 = teamOpponentCounts.get(team2.teamId)!;
            count2.set(team1.teamId, (count2.get(team1.teamId) || 0) + 1);
        }

        // If no matches were scheduled this round, we must stop to prevent infinite loop
        if (matchesInRound === 0) {
            break;
        }

        roundNumber++;
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
 * Rotating Schedule
 ***************************************************************/

/**
 * Generate schedule for rotating teams mode
 * 
 * Players rotate partners each round, with GREEDY selection for fairness.
 */
const generateRotatingSchedule = <TPlayerId = string>(
    config: SchedulingConfig<TPlayerId>
): GeneratedSchedule<TPlayerId> => {
    const { participantIds, courts, maxMatchesPerPlayer, teamSize } = config;

    // Input validation
    if (courts.length === 0) {
        throw new Error('At least one court is required for scheduling');
    }
    if (participantIds.length === 0) {
        throw new Error('At least one participant is required');
    }

    const matches: GenericMatch<TPlayerId>[] = [];
    
    // Use Record instead of Map for Convex compatibility
    const playerMatchCounts: Record<string, number> = {};
    participantIds.forEach(id => { playerMatchCounts[String(id)] = 0; });
    
    const maxCourts = courts.length;
    const playersPerMatch = teamSize * 2;

    // Determine the max number of matches that can run in a round
    const courtsPerRound = Math.min(maxCourts, Math.floor(participantIds.length / playersPerMatch));
    // Max rounds needed to cover all unique pairings
    const maxCombinatorialRounds = participantIds.length - 1;

    for (let round = 1; round <= maxCombinatorialRounds; round++) {
        const teams = generateRotatingTeams(participantIds, round, teamSize);

        // Transform teams into potential matches for this round
        const potentialMatches: {
            team1: TPlayerId[];
            team2: TPlayerId[];
            players: TPlayerId[];
        }[] = [];

        // Group teams into matches (Team 0 vs Team 1, Team 2 vs Team 3, etc.)
        for (let i = 0; i < teams.length; i += 2) {
            const team1 = teams[i];
            const team2 = teams[i + 1];

            if (team1 && team2) {
                potentialMatches.push({
                    team1: team1.playerIds,
                    team2: team2.playerIds,
                    players: [...team1.playerIds, ...team2.playerIds],
                });
            }
        }

        // --- CORE FAIRNESS IMPROVEMENT: Greedy Selection ---

        // 1. Filter out matches where any player is already at max
        let availableMatches = potentialMatches.filter(match =>
            !match.players.some(id =>
                (playerMatchCounts[String(id)] || 0) >= maxMatchesPerPlayer
            )
        );

        // 2. Sort available matches based on player workload (fairness metric)
        availableMatches.sort((matchA, matchB) => {
            const workloadA = matchA.players.reduce(
                (sum, id) => sum + (playerMatchCounts[String(id)] || 0), 0
            );
            const workloadB = matchB.players.reduce(
                (sum, id) => sum + (playerMatchCounts[String(id)] || 0), 0
            );
            return workloadA - workloadB;
        });

        // 3. Select matches while handling conflicts
        const matchesInThisRound: GenericMatch<TPlayerId>[] = [];
        const playersPlayingThisRound = new Set<TPlayerId>();
        let courtIndex = 0;

        for (const potentialMatch of availableMatches) {
            // Check for conflicts: ensure no player is already assigned a match in this round
            const isConflict = potentialMatch.players.some(id => playersPlayingThisRound.has(id));

            // Also check the court limit
            if (isConflict || courtIndex >= courtsPerRound) {
                continue;
            }

            // No conflict and court available: Schedule the match
            const match: GenericMatch<TPlayerId> = {
                id: `match_r${round}_c${courtIndex + 1}`,
                roundNumber: round,
                courtId: courts[courtIndex].id,
                team1: potentialMatch.team1,
                team2: potentialMatch.team2,
                status: 'scheduled',
            };

            matchesInThisRound.push(match);
            potentialMatch.players.forEach(id => {
                playersPlayingThisRound.add(id);
                playerMatchCounts[String(id)] = (playerMatchCounts[String(id)] || 0) + 1;
            });
            courtIndex++;
        }

        matches.push(...matchesInThisRound);

        // Stop if all players have reached max matches
        const allAtMax = participantIds.every(
            id => (playerMatchCounts[String(id)] || 0) >= maxMatchesPerPlayer
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
 * Match Result Processing
 ***************************************************************/

/**
 * Apply a match result to an array of matches
 * 
 * @param matches - Current matches array
 * @param matchId - ID of match to update
 * @param team1Score - Score for team 1
 * @param team2Score - Score for team 2
 * @param timestamp - Optional timestamp for completion (defaults to Date.now())
 * @returns New matches array with the result applied
 */
export const applyMatchResult = <TPlayerId = string>(
    matches: GenericMatch<TPlayerId>[],
    matchId: string,
    team1Score: number,
    team2Score: number,
    timestamp: number = Date.now()
): GenericMatch<TPlayerId>[] => {
    return matches.map(match => {
        if (match.id !== matchId) return match;

        return {
            ...match,
            team1Score,
            team2Score,
            status: 'completed' as const,
            completedAt: timestamp,
        };
    });
};

/***************************************************************
 * Court Utilities
 ***************************************************************/

/**
 * Create default court configuration
 * 
 * @param count - Number of courts to create
 * @returns Array of court objects with sequential naming
 */
export const createDefaultCourts = (count: number): Court[] => {
    const courtNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const courts: Court[] = [];

    for (let i = 0; i < count && i < courtNames.length; i++) {
        courts.push({
            id: `court_${courtNames[i].toLowerCase()}`,
            name: `Court ${courtNames[i]}`,
        });
    }

    // If more courts needed than letters, use numbers
    for (let i = courtNames.length; i < count; i++) {
        courts.push({
            id: `court_${i + 1}`,
            name: `Court ${i + 1}`,
        });
    }

    return courts;
};

/**
 * Get matches for a specific court
 * 
 * @param matches - All tournament matches
 * @param courtId - Court ID to filter by
 * @returns Matches scheduled on the specified court
 */
export const getMatchesForCourt = <TPlayerId = string>(
    matches: GenericMatch<TPlayerId>[],
    courtId: string
): GenericMatch<TPlayerId>[] => {
    return matches.filter(m => m.courtId === courtId);
};

