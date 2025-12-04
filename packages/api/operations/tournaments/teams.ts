/**
 * Generic Tournament Team Generation
 * 
 * This module provides team generation logic that works with any team size.
 * The teamSize parameter allows for singles (1), doubles (2), or larger teams.
 */

import { GenericTeam } from './types';
import { shuffleArray } from './core';

/***************************************************************
 * Team Validation
 ***************************************************************/

/**
 * Validate that team assignments are correct
 * 
 * Checks that:
 * - All teams have the correct number of players
 * - All players are valid participants
 * - Each player is assigned to exactly one team
 * 
 * @param teams - Teams to validate
 * @param participantIds - All valid participant IDs
 * @param teamSize - Expected number of players per team
 * @throws Error if validation fails
 */
export const validateTeamAssignments = <TPlayerId = string>(
    teams: GenericTeam<TPlayerId>[],
    participantIds: TPlayerId[],
    teamSize: number
): void => {
    const assignedPlayers = new Set<TPlayerId>();
    const participantSet = new Set(participantIds);

    for (const team of teams) {
        // Check team size
        if (team.playerIds.length !== teamSize) {
            throw new Error(
                `Team ${team.teamId} has ${team.playerIds.length} players, expected ${teamSize}`
            );
        }

        for (const playerId of team.playerIds) {
            // Check player is a valid participant
            if (!participantSet.has(playerId)) {
                throw new Error(
                    `Player ${String(playerId)} in team ${team.teamId} is not a participant`
                );
            }

            // Check player isn't assigned multiple times
            if (assignedPlayers.has(playerId)) {
                throw new Error(
                    `Player ${String(playerId)} is assigned to multiple teams`
                );
            }

            assignedPlayers.add(playerId);
        }
    }

    // Check all participants are assigned
    if (assignedPlayers.size !== participantIds.length) {
        const unassigned = participantIds.filter(id => !assignedPlayers.has(id));
        throw new Error(
            `Not all participants are assigned to teams. Unassigned: ${unassigned.map(String).join(', ')}`
        );
    }
};

/***************************************************************
 * Fixed Team Generation
 ***************************************************************/

/**
 * Generate fixed teams for a tournament
 * 
 * If predefined teams are provided, validates and uses them.
 * Otherwise, generates random team pairings.
 * 
 * @param participantIds - Array of participant IDs
 * @param teamSize - Number of players per team
 * @param predefinedTeams - Optional array of predefined teams
 * @returns Array of team objects
 * @throws Error if participant count is not divisible by teamSize
 */
export const generateFixedTeams = <TPlayerId = string>(
    participantIds: TPlayerId[],
    teamSize: number,
    predefinedTeams?: GenericTeam<TPlayerId>[]
): GenericTeam<TPlayerId>[] => {
    // Input validation
    if (teamSize < 1) {
        throw new Error('Team size must be at least 1');
    }
    if (participantIds.length === 0) {
        throw new Error('At least one participant is required');
    }
    if (participantIds.length % teamSize !== 0) {
        throw new Error(
            `Cannot create teams of ${teamSize} with ${participantIds.length} players ` +
            `(not evenly divisible)`
        );
    }

    // If predefined teams are provided, validate and use them
    if (predefinedTeams && predefinedTeams.length > 0) {
        validateTeamAssignments(predefinedTeams, participantIds, teamSize);
        return predefinedTeams;
    }

    // Generate random teams by shuffling participants
    const shuffled = shuffleArray([...participantIds]);
    const teams: GenericTeam<TPlayerId>[] = [];
    const teamCount = shuffled.length / teamSize;

    for (let i = 0; i < teamCount; i++) {
        const startIndex = i * teamSize;
        teams.push({
            teamId: `team_${i + 1}`,
            playerIds: shuffled.slice(startIndex, startIndex + teamSize),
        });
    }

    return teams;
};

/***************************************************************
 * Rotating Team Generation
 ***************************************************************/

/**
 * Generate rotating teams for a single round using round-robin rotation
 * 
 * Uses a rotation algorithm where one player stays fixed and others
 * rotate positions. This ensures maximum variety of partnerships
 * across rounds.
 * 
 * @param participantIds - Array of participant IDs
 * @param roundNumber - Current round (1-indexed)
 * @param teamSize - Number of players per team
 * @returns Array of teams for this round
 * @throws Error if participant count is invalid
 */
export const generateRotatingTeams = <TPlayerId = string>(
    participantIds: TPlayerId[],
    roundNumber: number,
    teamSize: number
): GenericTeam<TPlayerId>[] => {
    // Input validation
    if (teamSize < 1) {
        throw new Error('Team size must be at least 1');
    }
    if (roundNumber < 1) {
        throw new Error('Round number must be at least 1');
    }
    
    const n = participantIds.length;
    const playersPerMatch = teamSize * 2;

    if (n < playersPerMatch || n % teamSize !== 0) {
        throw new Error(
            `Need at least ${playersPerMatch} players and count divisible by ${teamSize} for teams of ${teamSize}`
        );
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

    // Reconstruct full list with fixed player at start
    const allPlayers = [fixed, ...rotated];

    // Create teams of the specified size
    const teams: GenericTeam<TPlayerId>[] = [];
    const teamCount = allPlayers.length / teamSize;

    for (let i = 0; i < teamCount; i++) {
        const startIndex = i * teamSize;
        teams.push({
            teamId: `round_${roundNumber}_team_${i + 1}`,
            playerIds: allPlayers.slice(startIndex, startIndex + teamSize),
        });
    }

    return teams;
};

/**
 * Generate rotating pairs for backward compatibility
 * This is a convenience wrapper for teamSize=2
 * 
 * @param participantIds - Array of participant IDs
 * @param roundNumber - Current round (1-indexed)
 * @returns Array of player pairs [playerId1, playerId2]
 */
export const generateRotatingPairs = <TPlayerId = string>(
    participantIds: TPlayerId[],
    roundNumber: number
): Array<[TPlayerId, TPlayerId]> => {
    const teams = generateRotatingTeams(participantIds, roundNumber, 2);
    return teams.map(team => [team.playerIds[0], team.playerIds[1]]);
};

/***************************************************************
 * Team Utilities
 ***************************************************************/

/**
 * Find the team that contains a specific player
 * 
 * @param teams - Array of teams to search
 * @param playerId - Player ID to find
 * @returns The team containing the player, or undefined
 */
export const findTeamForPlayer = <TPlayerId = string>(
    teams: GenericTeam<TPlayerId>[],
    playerId: TPlayerId
): GenericTeam<TPlayerId> | undefined => {
    return teams.find(team => team.playerIds.includes(playerId));
};

/**
 * Check if two players are on the same team
 * 
 * @param teams - Array of teams
 * @param player1Id - First player ID
 * @param player2Id - Second player ID
 * @returns True if both players are on the same team
 */
export const areTeammates = <TPlayerId = string>(
    teams: GenericTeam<TPlayerId>[],
    player1Id: TPlayerId,
    player2Id: TPlayerId
): boolean => {
    const team = findTeamForPlayer(teams, player1Id);
    return team ? team.playerIds.includes(player2Id) : false;
};

/**
 * Get all unique team matchups (team A vs team B combinations)
 * 
 * @param teams - Array of teams
 * @returns Array of matchups, each containing two team IDs
 */
export const getAllTeamMatchups = <TPlayerId = string>(
    teams: GenericTeam<TPlayerId>[]
): Array<{ team1Id: string; team2Id: string }> => {
    const matchups: Array<{ team1Id: string; team2Id: string }> = [];

    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            matchups.push({
                team1Id: teams[i].teamId,
                team2Id: teams[j].teamId,
            });
        }
    }

    return matchups;
};

/**
 * Calculate how many teams can be formed
 * 
 * @param participantCount - Number of participants
 * @param teamSize - Players per team
 * @returns Number of complete teams that can be formed
 */
export const calculateTeamCount = (
    participantCount: number,
    teamSize: number
): number => {
    return Math.floor(participantCount / teamSize);
};

