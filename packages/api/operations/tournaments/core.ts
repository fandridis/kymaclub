/**
 * Generic Tournament Core Utilities
 * 
 * This module provides core utilities for tournament management that work
 * across different tournament formats. These functions are pure and stateless.
 */

import { GenericMatch, MatchStatus } from './types';

/***************************************************************
 * Round Management
 ***************************************************************/

/**
 * Get all matches for a specific round
 * 
 * @param matches - All tournament matches
 * @param roundNumber - Round to filter by (1-indexed)
 * @returns Matches in the specified round
 */
export const getMatchesForRound = <TPlayerId = string>(
    matches: GenericMatch<TPlayerId>[],
    roundNumber: number
): GenericMatch<TPlayerId>[] => {
    return matches.filter(m => m.roundNumber === roundNumber);
};

/**
 * Check if all matches in a round are complete
 * 
 * @param matches - All tournament matches
 * @param roundNumber - Round to check (1-indexed)
 * @returns True if all matches in the round have status 'completed'
 */
export const isRoundComplete = <TPlayerId = string>(
    matches: GenericMatch<TPlayerId>[],
    roundNumber: number
): boolean => {
    const roundMatches = getMatchesForRound(matches, roundNumber);
    return roundMatches.length > 0 && roundMatches.every(m => m.status === 'completed');
};

/**
 * Get the current round number (first incomplete round)
 * 
 * @param matches - All tournament matches
 * @returns Current round number (1-indexed), or 1 if no matches exist
 */
export const getCurrentRound = <TPlayerId = string>(
    matches: GenericMatch<TPlayerId>[]
): number => {
    if (matches.length === 0) return 1;

    const maxRound = Math.max(...matches.map(m => m.roundNumber));

    for (let round = 1; round <= maxRound; round++) {
        if (!isRoundComplete(matches, round)) {
            return round;
        }
    }

    // All rounds complete - return the last round
    return maxRound;
};

/**
 * Check if the tournament is complete (all matches finished)
 * 
 * @param matches - All tournament matches
 * @returns True if all matches have status 'completed'
 */
export const isTournamentComplete = <TPlayerId = string>(
    matches: GenericMatch<TPlayerId>[]
): boolean => {
    if (matches.length === 0) return false;
    return matches.every(m => m.status === 'completed');
};

/**
 * Get the total number of rounds in a tournament
 * 
 * @param matches - All tournament matches
 * @returns Maximum round number, or 0 if no matches
 */
export const getTotalRounds = <TPlayerId = string>(
    matches: GenericMatch<TPlayerId>[]
): number => {
    if (matches.length === 0) return 0;
    return Math.max(...matches.map(m => m.roundNumber));
};

/**
 * Get matches by status
 * 
 * @param matches - All tournament matches
 * @param status - Status to filter by
 * @returns Matches with the specified status
 */
export const getMatchesByStatus = <TPlayerId = string>(
    matches: GenericMatch<TPlayerId>[],
    status: MatchStatus
): GenericMatch<TPlayerId>[] => {
    return matches.filter(m => m.status === status);
};

/**
 * Count completed matches
 * 
 * @param matches - All tournament matches
 * @returns Number of completed matches
 */
export const countCompletedMatches = <TPlayerId = string>(
    matches: GenericMatch<TPlayerId>[]
): number => {
    return matches.filter(m => m.status === 'completed').length;
};

/***************************************************************
 * Match Utilities
 ***************************************************************/

/**
 * Get a match by ID
 * 
 * @param matches - All tournament matches
 * @param matchId - ID of the match to find
 * @returns The match, or undefined if not found
 */
export const getMatchById = <TPlayerId = string>(
    matches: GenericMatch<TPlayerId>[],
    matchId: string
): GenericMatch<TPlayerId> | undefined => {
    return matches.find(m => m.id === matchId);
};

/**
 * Get all matches a player is participating in
 * 
 * @param matches - All tournament matches
 * @param playerId - Player ID to search for
 * @returns Matches where the player is on either team
 */
export const getMatchesForPlayer = <TPlayerId = string>(
    matches: GenericMatch<TPlayerId>[],
    playerId: TPlayerId
): GenericMatch<TPlayerId>[] => {
    return matches.filter(m =>
        m.team1.includes(playerId) || m.team2.includes(playerId)
    );
};

/**
 * Extract all unique participant IDs from matches
 * 
 * @param matches - All tournament matches
 * @returns Array of unique participant IDs
 */
export const extractParticipantIds = <TPlayerId = string>(
    matches: GenericMatch<TPlayerId>[]
): TPlayerId[] => {
    const ids = new Set<TPlayerId>();

    for (const match of matches) {
        match.team1.forEach(id => ids.add(id));
        match.team2.forEach(id => ids.add(id));
    }

    return Array.from(ids);
};

/***************************************************************
 * Array Utilities
 ***************************************************************/

/**
 * Fisher-Yates shuffle algorithm - randomly shuffles an array
 * 
 * @param array - Array to shuffle
 * @returns New shuffled array (does not mutate original)
 */
export const shuffleArray = <T>(array: T[]): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

/***************************************************************
 * Validation Utilities
 ***************************************************************/

/**
 * Assert that a team has the expected number of players
 * 
 * @param team - Array of player IDs
 * @param expectedSize - Expected team size
 * @throws Error if team size doesn't match
 */
export const assertTeamSize = <T>(team: T[], expectedSize: number): void => {
    if (team.length !== expectedSize) {
        throw new Error(`Expected team of ${expectedSize} players, got ${team.length}`);
    }
};

/**
 * Safely cast an array to a tuple of specific size after validation
 * 
 * @param team - Array of player IDs
 * @param expectedSize - Expected team size (must be 2 for doubles)
 * @returns The team as a validated tuple
 * @throws Error if team size doesn't match
 */
export const asDoublesTeam = <T>(team: T[]): [T, T] => {
    assertTeamSize(team, 2);
    return [team[0], team[1]];
};

/**
 * Check if participant count is valid for the given team size
 * 
 * @param participantCount - Number of participants
 * @param teamSize - Number of players per team
 * @returns True if valid (must be divisible by teamSize * 2 for team vs team)
 */
export const isValidParticipantCount = (
    participantCount: number,
    teamSize: number
): boolean => {
    const playersPerMatch = teamSize * 2;
    return participantCount >= playersPerMatch && participantCount % teamSize === 0;
};

/**
 * Calculate minimum required courts for a configuration
 * 
 * @param participantCount - Number of participants
 * @param teamSize - Number of players per team
 * @returns Minimum courts needed to run all matches in parallel
 */
export const getMinimumCourts = (
    participantCount: number,
    teamSize: number
): number => {
    const playersPerMatch = teamSize * 2;
    return Math.floor(participantCount / playersPerMatch);
};

