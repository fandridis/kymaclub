/**
 * Generic Tournament Standings Utilities
 * 
 * This module provides standings calculation logic that works across
 * different tournament formats. Points are calculated based on match scores.
 */

import { GenericMatch, GenericStanding } from './types';

/***************************************************************
 * Standings Calculation
 ***************************************************************/

/**
 * Calculate standings from match results
 * 
 * For each participant, calculates:
 * - Matches played, won, lost
 * - Points scored and conceded
 * - Points difference
 * 
 * @param matches - All tournament matches (including completed ones)
 * @param participantIds - All participant IDs
 * @returns Sorted standings array (best to worst)
 */
export const calculateStandings = <TPlayerId = string>(
    matches: GenericMatch<TPlayerId>[],
    participantIds: TPlayerId[]
): GenericStanding<TPlayerId>[] => {
    // Initialize standings for all participants
    const standingsMap = new Map<TPlayerId, GenericStanding<TPlayerId>>();

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
 * 1. Points difference (descending) - primary ranking criteria
 * 2. Points scored (descending) - tiebreaker
 * 3. Matches won (descending) - secondary tiebreaker
 * 
 * @param standings - Array of standings to sort
 * @returns New sorted array (does not mutate original)
 */
export const sortStandings = <TPlayerId = string>(
    standings: GenericStanding<TPlayerId>[]
): GenericStanding<TPlayerId>[] => {
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

/**
 * Initialize empty standings for a list of participants
 * 
 * @param participantIds - Array of participant IDs
 * @returns Array of standings with all values at zero
 */
export const initializeStandings = <TPlayerId = string>(
    participantIds: TPlayerId[]
): GenericStanding<TPlayerId>[] => {
    return participantIds.map(id => ({
        participantId: id,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        pointsScored: 0,
        pointsConceded: 0,
        pointsDifference: 0,
    }));
};

/**
 * Get the leader (first place) from standings
 * 
 * @param standings - Sorted standings array
 * @returns The leader, or null if standings are empty
 */
export const getLeader = <TPlayerId = string>(
    standings: GenericStanding<TPlayerId>[]
): GenericStanding<TPlayerId> | null => {
    return standings.length > 0 ? standings[0] : null;
};

/**
 * Get top N standings
 * 
 * @param standings - Sorted standings array
 * @param count - Number of top standings to return
 * @returns Top N standings
 */
export const getTopStandings = <TPlayerId = string>(
    standings: GenericStanding<TPlayerId>[],
    count: number
): GenericStanding<TPlayerId>[] => {
    return standings.slice(0, count);
};

/**
 * Find a participant's standing
 * 
 * @param standings - Sorted standings array
 * @param participantId - Participant to find
 * @returns The standing and position (1-indexed), or null if not found
 */
export const findParticipantStanding = <TPlayerId = string>(
    standings: GenericStanding<TPlayerId>[],
    participantId: TPlayerId
): { standing: GenericStanding<TPlayerId>; position: number } | null => {
    const index = standings.findIndex(s => s.participantId === participantId);
    if (index === -1) return null;
    return {
        standing: standings[index],
        position: index + 1,
    };
};

