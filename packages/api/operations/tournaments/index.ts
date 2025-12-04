/**
 * Generic Tournament Utilities
 * 
 * This module provides reusable tournament logic that works across different
 * formats (Americano, round-robin, etc.) and sports (padel, tennis, etc.).
 * 
 * Key features:
 * - Flexible team sizes (1v1, 2v2, 3v3, etc.)
 * - Fairness-optimized scheduling
 * - Generic standings calculation
 * - Round management utilities
 */

// Types
export * from './types';

// Core utilities
export {
    getMatchesForRound,
    isRoundComplete,
    getCurrentRound,
    isTournamentComplete,
    getTotalRounds,
    getMatchesByStatus,
    countCompletedMatches,
    getMatchById,
    getMatchesForPlayer,
    extractParticipantIds,
    shuffleArray,
    isValidParticipantCount,
    getMinimumCourts,
} from './core';

// Standings
export {
    calculateStandings,
    sortStandings,
    initializeStandings,
    getLeader,
    getTopStandings,
    findParticipantStanding,
} from './standings';

// Teams
export {
    validateTeamAssignments,
    generateFixedTeams,
    generateRotatingTeams,
    generateRotatingPairs,
    findTeamForPlayer,
    areTeammates,
    getAllTeamMatchups,
    calculateTeamCount,
} from './teams';

// Scheduling
export {
    generateSchedule,
    applyMatchResult,
    createDefaultCourts,
    getMatchesForCourt,
} from './scheduling';

