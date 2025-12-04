/**
 * Generic Tournament Types
 * 
 * These types are designed to be reusable across different tournament formats
 * (Americano, round-robin, etc.) and sports (padel, tennis, etc.).
 * 
 * The key abstraction is that team size is configurable - allowing for
 * 1v1 (singles), 2v2 (doubles), 3v3, etc.
 */

/***************************************************************
 * Core Match Types
 ***************************************************************/

/**
 * Status of a match in the tournament
 */
export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Generic match structure that works with any team size
 * 
 * @template TPlayerId - Type of player identifier (usually string)
 */
export interface GenericMatch<TPlayerId = string> {
    /** Unique identifier for the match */
    id: string;
    /** Round number (1-indexed) */
    roundNumber: number;
    /** Court identifier where match is played */
    courtId: string;
    /** Array of player IDs on team 1 */
    team1: TPlayerId[];
    /** Array of player IDs on team 2 */
    team2: TPlayerId[];
    /** Current status of the match */
    status: MatchStatus;
    /** Score for team 1 (only set when completed) */
    team1Score?: number;
    /** Score for team 2 (only set when completed) */
    team2Score?: number;
    /** Timestamp when match was completed */
    completedAt?: number;
}

/***************************************************************
 * Standing Types
 ***************************************************************/

/**
 * Generic standing for a participant in a tournament
 * 
 * @template TPlayerId - Type of player identifier (usually string)
 */
export interface GenericStanding<TPlayerId = string> {
    /** Player/participant identifier */
    participantId: TPlayerId;
    /** Number of matches played */
    matchesPlayed: number;
    /** Number of matches won */
    matchesWon: number;
    /** Number of matches lost */
    matchesLost: number;
    /** Total points scored across all matches */
    pointsScored: number;
    /** Total points conceded across all matches */
    pointsConceded: number;
    /** Points difference (scored - conceded) */
    pointsDifference: number;
}

/***************************************************************
 * Team Types
 ***************************************************************/

/**
 * A fixed team with a specific set of players
 * 
 * @template TPlayerId - Type of player identifier (usually string)
 */
export interface GenericTeam<TPlayerId = string> {
    /** Unique identifier for the team */
    teamId: string;
    /** Array of player IDs in this team */
    playerIds: TPlayerId[];
}

/**
 * Configuration for team generation
 */
export interface TeamConfig {
    /** Number of players per team (e.g., 2 for doubles, 1 for singles) */
    teamSize: number;
}

/***************************************************************
 * Court Types
 ***************************************************************/

/**
 * A court/field where matches can be played
 */
export interface Court {
    /** Unique identifier for the court */
    id: string;
    /** Display name for the court */
    name: string;
}

/***************************************************************
 * Scheduling Types
 ***************************************************************/

/**
 * Configuration for schedule generation
 * 
 * @template TPlayerId - Type of player identifier (usually string)
 */
export interface SchedulingConfig<TPlayerId = string> {
    /** All participant IDs */
    participantIds: TPlayerId[];
    /** Available courts */
    courts: Court[];
    /** Maximum matches any single player can play */
    maxMatchesPerPlayer: number;
    /** Number of players per team */
    teamSize: number;
    /** Pre-defined teams (for fixed team modes) */
    predefinedTeams?: GenericTeam<TPlayerId>[];
}

/**
 * Result of schedule generation
 * 
 * @template TPlayerId - Type of player identifier (usually string)
 */
export interface GeneratedSchedule<TPlayerId = string> {
    /** Total number of rounds in the tournament */
    totalRounds: number;
    /** All matches in the tournament */
    matches: GenericMatch<TPlayerId>[];
    /** Record of player ID (as string) to number of matches they play */
    playerMatchCounts: Record<string, number>;
}

/***************************************************************
 * Tournament State Types
 ***************************************************************/

/**
 * Generic tournament state
 * 
 * @template TPlayerId - Type of player identifier (usually string)
 */
export interface GenericTournamentState<TPlayerId = string> {
    /** Current round being played (1-indexed) */
    currentRound: number;
    /** Total number of rounds */
    totalRounds: number;
    /** All matches in the tournament */
    matches: GenericMatch<TPlayerId>[];
    /** Current standings */
    standings: GenericStanding<TPlayerId>[];
    /** Timestamp when tournament started */
    startedAt?: number;
    /** Timestamp when tournament completed */
    completedAt?: number;
}

/***************************************************************
 * Match Result Types
 ***************************************************************/

/**
 * Result to apply to a match
 */
export interface MatchResult {
    /** ID of the match to update */
    matchId: string;
    /** Score for team 1 */
    team1Score: number;
    /** Score for team 2 */
    team2Score: number;
}

