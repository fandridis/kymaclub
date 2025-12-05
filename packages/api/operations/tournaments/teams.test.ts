import { describe, it, expect } from 'vitest';
import {
    validateTeamAssignments,
    generateFixedTeams,
    generateRotatingTeams,
    generateRotatingPairs,
    findTeamForPlayer,
    areTeammates,
    getAllTeamMatchups,
    calculateTeamCount,
} from './teams';
import type { GenericTeam } from './types';

describe('Tournament Team Utilities', () => {
    describe('validateTeamAssignments', () => {
        const participants = ['p1', 'p2', 'p3', 'p4'];

        it('should pass for valid team assignments', () => {
            const teams: GenericTeam[] = [
                { teamId: 'team_1', playerIds: ['p1', 'p2'] },
                { teamId: 'team_2', playerIds: ['p3', 'p4'] },
            ];
            expect(() => validateTeamAssignments(teams, participants, 2)).not.toThrow();
        });

        it('should throw for wrong team size', () => {
            const teams: GenericTeam[] = [
                { teamId: 'team_1', playerIds: ['p1'] }, // Only 1 player
                { teamId: 'team_2', playerIds: ['p2', 'p3', 'p4'] },
            ];
            expect(() => validateTeamAssignments(teams, participants, 2)).toThrow(
                'Team team_1 has 1 players, expected 2'
            );
        });

        it('should throw for duplicate player', () => {
            const teams: GenericTeam[] = [
                { teamId: 'team_1', playerIds: ['p1', 'p2'] },
                { teamId: 'team_2', playerIds: ['p1', 'p3'] }, // p1 duplicated
            ];
            expect(() => validateTeamAssignments(teams, participants, 2)).toThrow(
                'Player p1 is assigned to multiple teams'
            );
        });

        it('should throw for missing player', () => {
            const teams: GenericTeam[] = [
                { teamId: 'team_1', playerIds: ['p1', 'p2'] },
                // p3 and p4 not assigned
            ];
            expect(() => validateTeamAssignments(teams, participants, 2)).toThrow(
                'Not all participants are assigned to teams'
            );
        });

        it('should throw for invalid player', () => {
            const teams: GenericTeam[] = [
                { teamId: 'team_1', playerIds: ['p1', 'p2'] },
                { teamId: 'team_2', playerIds: ['p3', 'p99'] }, // p99 not a participant
            ];
            expect(() => validateTeamAssignments(teams, participants, 2)).toThrow(
                'Player p99 in team team_2 is not a participant'
            );
        });
    });

    describe('generateFixedTeams', () => {
        it('should create correct number of teams', () => {
            const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
            const teams = generateFixedTeams(participants, 2);

            expect(teams).toHaveLength(3);
            teams.forEach(team => {
                expect(team.playerIds).toHaveLength(2);
                expect(team.teamId).toMatch(/^team_\d+$/);
            });
        });

        it('should include all players exactly once', () => {
            const participants = ['p1', 'p2', 'p3', 'p4'];
            const teams = generateFixedTeams(participants, 2);

            const allPlayerIds = teams.flatMap(t => t.playerIds);
            expect(allPlayerIds).toHaveLength(4);
            expect(new Set(allPlayerIds).size).toBe(4);
        });

        it('should use predefined teams when provided', () => {
            const participants = ['p1', 'p2', 'p3', 'p4'];
            const predefined: GenericTeam[] = [
                { teamId: 'custom_1', playerIds: ['p1', 'p3'] },
                { teamId: 'custom_2', playerIds: ['p2', 'p4'] },
            ];
            const teams = generateFixedTeams(participants, 2, predefined);

            expect(teams).toEqual(predefined);
        });

        it('should throw for odd number of players with teamSize 2', () => {
            const participants = ['p1', 'p2', 'p3'];
            expect(() => generateFixedTeams(participants, 2)).toThrow('not evenly divisible');
        });

        it('should throw for teamSize less than 1', () => {
            expect(() => generateFixedTeams(['p1', 'p2'], 0)).toThrow('Team size must be at least 1');
        });

        it('should throw for empty participants', () => {
            expect(() => generateFixedTeams([], 2)).toThrow('At least one participant is required');
        });

        it('should handle singles (teamSize=1)', () => {
            const participants = ['p1', 'p2', 'p3', 'p4'];
            const teams = generateFixedTeams(participants, 1);

            expect(teams).toHaveLength(4);
            teams.forEach(team => {
                expect(team.playerIds).toHaveLength(1);
            });
        });

        it('should handle triples (teamSize=3)', () => {
            const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
            const teams = generateFixedTeams(participants, 3);

            expect(teams).toHaveLength(2);
            teams.forEach(team => {
                expect(team.playerIds).toHaveLength(3);
            });
        });
    });

    describe('generateRotatingTeams', () => {
        const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];

        it('should create teams for a round', () => {
            const teams = generateRotatingTeams(participants, 1, 2);

            expect(teams).toHaveLength(4);
            teams.forEach(team => {
                expect(team.playerIds).toHaveLength(2);
            });
        });

        it('should include all players in teams', () => {
            const teams = generateRotatingTeams(participants, 1, 2);
            const allPlayers = teams.flatMap(t => t.playerIds);

            expect(allPlayers).toHaveLength(8);
            expect(new Set(allPlayers).size).toBe(8);
        });

        it('should produce different teams for different rounds', () => {
            const round1 = generateRotatingTeams(participants, 1, 2);
            const round2 = generateRotatingTeams(participants, 2, 2);

            const round1Str = JSON.stringify(round1.map(t => t.playerIds.sort()));
            const round2Str = JSON.stringify(round2.map(t => t.playerIds.sort()));

            expect(round1Str).not.toBe(round2Str);
        });

        it('should throw for teamSize less than 1', () => {
            expect(() => generateRotatingTeams(participants, 1, 0)).toThrow(
                'Team size must be at least 1'
            );
        });

        it('should throw for round number less than 1', () => {
            expect(() => generateRotatingTeams(participants, 0, 2)).toThrow(
                'Round number must be at least 1'
            );
        });

        it('should throw for too few players', () => {
            expect(() => generateRotatingTeams(['p1', 'p2'], 1, 2)).toThrow(
                'Need at least 4 players'
            );
        });

        it('should throw when players not divisible by teamSize', () => {
            expect(() => generateRotatingTeams(['p1', 'p2', 'p3', 'p4', 'p5'], 1, 2)).toThrow(
                'divisible by 2'
            );
        });

        it('should create team ids with round number', () => {
            const teams = generateRotatingTeams(participants, 3, 2);
            teams.forEach(team => {
                expect(team.teamId).toMatch(/^round_3_team_\d+$/);
            });
        });
    });

    describe('generateRotatingPairs', () => {
        const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

        it('should create pairs for all players', () => {
            const pairs = generateRotatingPairs(participants, 1);

            expect(pairs).toHaveLength(3);
            pairs.forEach(pair => {
                expect(pair).toHaveLength(2);
            });
        });

        it('should return tuple type', () => {
            const pairs = generateRotatingPairs(participants, 1);

            pairs.forEach(pair => {
                expect(typeof pair[0]).toBe('string');
                expect(typeof pair[1]).toBe('string');
            });
        });

        it('should produce different pairs for different rounds', () => {
            const round1 = generateRotatingPairs(participants, 1);
            const round2 = generateRotatingPairs(participants, 2);

            const round1Str = JSON.stringify(round1.map(p => [...p].sort()));
            const round2Str = JSON.stringify(round2.map(p => [...p].sort()));

            expect(round1Str).not.toBe(round2Str);
        });

        it('should throw for fewer than 4 players', () => {
            expect(() => generateRotatingPairs(['p1', 'p2'], 1)).toThrow();
        });
    });

    describe('findTeamForPlayer', () => {
        const teams: GenericTeam[] = [
            { teamId: 'team_1', playerIds: ['p1', 'p2'] },
            { teamId: 'team_2', playerIds: ['p3', 'p4'] },
        ];

        it('should find team containing player', () => {
            const result = findTeamForPlayer(teams, 'p3');
            expect(result).toBeDefined();
            expect(result?.teamId).toBe('team_2');
        });

        it('should return undefined for non-existent player', () => {
            const result = findTeamForPlayer(teams, 'p99');
            expect(result).toBeUndefined();
        });

        it('should return undefined for empty teams', () => {
            const result = findTeamForPlayer([], 'p1');
            expect(result).toBeUndefined();
        });
    });

    describe('areTeammates', () => {
        const teams: GenericTeam[] = [
            { teamId: 'team_1', playerIds: ['p1', 'p2'] },
            { teamId: 'team_2', playerIds: ['p3', 'p4'] },
        ];

        it('should return true for players on same team', () => {
            expect(areTeammates(teams, 'p1', 'p2')).toBe(true);
            expect(areTeammates(teams, 'p3', 'p4')).toBe(true);
        });

        it('should return false for players on different teams', () => {
            expect(areTeammates(teams, 'p1', 'p3')).toBe(false);
            expect(areTeammates(teams, 'p2', 'p4')).toBe(false);
        });

        it('should return false when player not found', () => {
            expect(areTeammates(teams, 'p1', 'p99')).toBe(false);
            expect(areTeammates(teams, 'p99', 'p1')).toBe(false);
        });

        it('should handle same player check', () => {
            // Same player is technically on same team as themselves
            expect(areTeammates(teams, 'p1', 'p1')).toBe(true);
        });
    });

    describe('getAllTeamMatchups', () => {
        it('should generate all possible matchups', () => {
            const teams: GenericTeam[] = [
                { teamId: 'a', playerIds: [] },
                { teamId: 'b', playerIds: [] },
                { teamId: 'c', playerIds: [] },
            ];
            const matchups = getAllTeamMatchups(teams);

            // 3 teams = 3 matchups (a-b, a-c, b-c)
            expect(matchups).toHaveLength(3);
        });

        it('should not create duplicate matchups', () => {
            const teams: GenericTeam[] = [
                { teamId: 'a', playerIds: [] },
                { teamId: 'b', playerIds: [] },
            ];
            const matchups = getAllTeamMatchups(teams);

            // Should only have one matchup (a-b), not (b-a) too
            expect(matchups).toHaveLength(1);
            expect(matchups[0]).toEqual({ team1Id: 'a', team2Id: 'b' });
        });

        it('should return empty array for single team', () => {
            const teams: GenericTeam[] = [{ teamId: 'a', playerIds: [] }];
            expect(getAllTeamMatchups(teams)).toEqual([]);
        });

        it('should return empty array for no teams', () => {
            expect(getAllTeamMatchups([])).toEqual([]);
        });

        it('should handle 4 teams correctly', () => {
            const teams: GenericTeam[] = [
                { teamId: 'a', playerIds: [] },
                { teamId: 'b', playerIds: [] },
                { teamId: 'c', playerIds: [] },
                { teamId: 'd', playerIds: [] },
            ];
            const matchups = getAllTeamMatchups(teams);

            // 4 teams = 6 matchups (4 choose 2)
            expect(matchups).toHaveLength(6);
        });
    });

    describe('calculateTeamCount', () => {
        it('should calculate for doubles', () => {
            expect(calculateTeamCount(8, 2)).toBe(4);
            expect(calculateTeamCount(12, 2)).toBe(6);
        });

        it('should calculate for singles', () => {
            expect(calculateTeamCount(4, 1)).toBe(4);
            expect(calculateTeamCount(8, 1)).toBe(8);
        });

        it('should calculate for triples', () => {
            expect(calculateTeamCount(6, 3)).toBe(2);
            expect(calculateTeamCount(12, 3)).toBe(4);
        });

        it('should floor non-integer results', () => {
            expect(calculateTeamCount(5, 2)).toBe(2); // 5/2 = 2.5 -> 2
            expect(calculateTeamCount(7, 3)).toBe(2); // 7/3 = 2.33 -> 2
        });

        it('should return 0 for fewer participants than team size', () => {
            expect(calculateTeamCount(1, 2)).toBe(0);
            expect(calculateTeamCount(2, 3)).toBe(0);
        });
    });
});

