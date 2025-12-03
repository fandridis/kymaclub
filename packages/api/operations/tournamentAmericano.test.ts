import { describe, it, expect } from 'vitest';
import {
    validateConfig,
    getMinimumCourts,
    generateFixedTeams,
    generateRotatingPairs,
    generateSchedule,
    calculateStandings,
    sortStandings,
    getMatchesForRound,
    isRoundComplete,
    getCurrentRound,
    isTournamentComplete,
    applyMatchResult,
    initializeTournamentState,
    getTournamentSummary,
    createDefaultCourts,
} from './tournamentAmericano';
import type { TournamentAmericanoConfig, TournamentAmericanoMatch } from '../types/widget';

describe('Tournament Americano Operations', () => {
    // Default test config
    const validConfig: TournamentAmericanoConfig = {
        numberOfPlayers: 8,
        matchPoints: 21,
        courts: [
            { id: 'court_a', name: 'Court A' },
            { id: 'court_b', name: 'Court B' },
        ],
        maxMatchesPerPlayer: 7,
        mode: 'individual_rotation',
    };

    describe('validateConfig', () => {
        it('should validate a correct config', () => {
            const result = validateConfig(validConfig);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid player count', () => {
            const invalidConfig = { ...validConfig, numberOfPlayers: 10 as any };
            const result = validateConfig(invalidConfig);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.includes('Invalid number of players'))).toBe(true);
        });

        it('should reject config without courts', () => {
            const invalidConfig = { ...validConfig, courts: [] };
            const result = validateConfig(invalidConfig);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('At least one court is required.');
        });

        it('should reject too low maxMatchesPerPlayer', () => {
            const invalidConfig = { ...validConfig, maxMatchesPerPlayer: 1 };
            const result = validateConfig(invalidConfig);
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('too low');
        });
    });

    describe('getMinimumCourts', () => {
        it('should calculate minimum courts for 8 players', () => {
            expect(getMinimumCourts(8)).toBe(2);
        });

        it('should calculate minimum courts for 12 players', () => {
            expect(getMinimumCourts(12)).toBe(3);
        });

        it('should calculate minimum courts for 16 players', () => {
            expect(getMinimumCourts(16)).toBe(4);
        });
    });

    describe('generateFixedTeams', () => {
        it('should create correct number of teams', () => {
            const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
            const teams = generateFixedTeams(participants);

            expect(teams).toHaveLength(4);
            teams.forEach(team => {
                expect(team.playerIds).toHaveLength(2);
                expect(team.teamId).toMatch(/^team_\d+$/);
            });
        });

        it('should throw for odd number of players', () => {
            const participants = ['p1', 'p2', 'p3'];
            expect(() => generateFixedTeams(participants)).toThrow();
        });

        it('should include all players exactly once', () => {
            const participants = ['p1', 'p2', 'p3', 'p4'];
            const teams = generateFixedTeams(participants);

            const allPlayerIds = teams.flatMap(t => t.playerIds);
            expect(allPlayerIds).toHaveLength(4);
            expect(new Set(allPlayerIds).size).toBe(4);
        });
    });

    describe('generateRotatingPairs', () => {
        it('should create pairs for all players', () => {
            const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
            const pairs = generateRotatingPairs(participants, 1);

            expect(pairs).toHaveLength(4);
            pairs.forEach(pair => {
                expect(pair).toHaveLength(2);
            });
        });

        it('should include all players in pairs', () => {
            const participants = ['p1', 'p2', 'p3', 'p4'];
            const pairs = generateRotatingPairs(participants, 1);

            const allPlayers = pairs.flat();
            expect(allPlayers).toHaveLength(4);
            expect(new Set(allPlayers).size).toBe(4);
        });

        it('should generate different pairs for different rounds', () => {
            const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
            const round1 = generateRotatingPairs(participants, 1);
            const round2 = generateRotatingPairs(participants, 2);

            // Pairs should be different (at least one pair should differ)
            const round1Str = JSON.stringify(round1.sort());
            const round2Str = JSON.stringify(round2.sort());
            expect(round1Str).not.toBe(round2Str);
        });

        it('should throw for fewer than 4 players', () => {
            expect(() => generateRotatingPairs(['p1', 'p2'], 1)).toThrow();
        });
    });

    describe('generateSchedule', () => {
        it('should generate schedule for individual rotation', () => {
            const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
            const result = generateSchedule({ participantIds: participants, config: validConfig });

            expect(result.totalRounds).toBeGreaterThan(0);
            expect(result.matches.length).toBeGreaterThan(0);
            expect(result.playerMatchCounts.size).toBe(8);
        });

        it('should generate schedule for fixed teams', () => {
            const fixedConfig: TournamentAmericanoConfig = {
                ...validConfig,
                mode: 'fixed_teams',
            };
            const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
            const result = generateSchedule({ participantIds: participants, config: fixedConfig });

            expect(result.totalRounds).toBeGreaterThan(0);
            expect(result.matches.length).toBeGreaterThan(0);
        });

        it('should respect maxMatchesPerPlayer', () => {
            const limitedConfig: TournamentAmericanoConfig = {
                ...validConfig,
                maxMatchesPerPlayer: 3,
            };
            const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
            const result = generateSchedule({ participantIds: participants, config: limitedConfig });

            result.playerMatchCounts.forEach((count) => {
                expect(count).toBeLessThanOrEqual(3);
            });
        });

        it('should assign matches to correct courts', () => {
            const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
            const result = generateSchedule({ participantIds: participants, config: validConfig });

            result.matches.forEach(match => {
                expect(validConfig.courts.map(c => c.id)).toContain(match.courtId);
            });
        });
    });

    describe('calculateStandings', () => {
        const participants = ['p1', 'p2', 'p3', 'p4'];

        it('should initialize standings with zeros', () => {
            const matches: TournamentAmericanoMatch[] = [];
            const standings = calculateStandings(matches, participants);

            expect(standings).toHaveLength(4);
            standings.forEach(s => {
                expect(s.matchesPlayed).toBe(0);
                expect(s.matchesWon).toBe(0);
                expect(s.matchesLost).toBe(0);
                expect(s.pointsScored).toBe(0);
                expect(s.pointsConceded).toBe(0);
                expect(s.pointsDifference).toBe(0);
            });
        });

        it('should calculate standings from completed matches', () => {
            const matches: TournamentAmericanoMatch[] = [
                {
                    id: 'm1',
                    roundNumber: 1,
                    courtId: 'court_a',
                    team1: ['p1', 'p2'],
                    team2: ['p3', 'p4'],
                    team1Score: 21,
                    team2Score: 15,
                    status: 'completed',
                },
            ];

            const standings = calculateStandings(matches, participants);

            // p1 and p2 should have won
            const p1Standing = standings.find(s => s.participantId === 'p1')!;
            expect(p1Standing.matchesWon).toBe(1);
            expect(p1Standing.pointsScored).toBe(21);
            expect(p1Standing.pointsConceded).toBe(15);
            expect(p1Standing.pointsDifference).toBe(6);

            // p3 and p4 should have lost
            const p3Standing = standings.find(s => s.participantId === 'p3')!;
            expect(p3Standing.matchesLost).toBe(1);
            expect(p3Standing.pointsScored).toBe(15);
            expect(p3Standing.pointsConceded).toBe(21);
            expect(p3Standing.pointsDifference).toBe(-6);
        });

        it('should ignore non-completed matches', () => {
            const matches: TournamentAmericanoMatch[] = [
                {
                    id: 'm1',
                    roundNumber: 1,
                    courtId: 'court_a',
                    team1: ['p1', 'p2'],
                    team2: ['p3', 'p4'],
                    status: 'scheduled',
                },
            ];

            const standings = calculateStandings(matches, participants);
            standings.forEach(s => {
                expect(s.matchesPlayed).toBe(0);
            });
        });
    });

    describe('sortStandings', () => {
        it('should sort by points difference first', () => {
            const standings = [
                { participantId: 'p1', matchesPlayed: 2, matchesWon: 1, matchesLost: 1, pointsScored: 40, pointsConceded: 42, pointsDifference: -2 },
                { participantId: 'p2', matchesPlayed: 2, matchesWon: 2, matchesLost: 0, pointsScored: 42, pointsConceded: 30, pointsDifference: 12 },
                { participantId: 'p3', matchesPlayed: 2, matchesWon: 0, matchesLost: 2, pointsScored: 30, pointsConceded: 42, pointsDifference: -12 },
            ];

            const sorted = sortStandings(standings);

            expect(sorted[0].participantId).toBe('p2');
            expect(sorted[1].participantId).toBe('p1');
            expect(sorted[2].participantId).toBe('p3');
        });

        it('should use points scored as tiebreaker', () => {
            const standings = [
                { participantId: 'p1', matchesPlayed: 2, matchesWon: 1, matchesLost: 1, pointsScored: 35, pointsConceded: 35, pointsDifference: 0 },
                { participantId: 'p2', matchesPlayed: 2, matchesWon: 1, matchesLost: 1, pointsScored: 40, pointsConceded: 40, pointsDifference: 0 },
            ];

            const sorted = sortStandings(standings);

            expect(sorted[0].participantId).toBe('p2'); // More points scored
        });
    });

    describe('getMatchesForRound', () => {
        const matches: TournamentAmericanoMatch[] = [
            { id: 'm1', roundNumber: 1, courtId: 'a', team1: [], team2: [], status: 'completed' },
            { id: 'm2', roundNumber: 1, courtId: 'b', team1: [], team2: [], status: 'completed' },
            { id: 'm3', roundNumber: 2, courtId: 'a', team1: [], team2: [], status: 'scheduled' },
        ];

        it('should filter matches by round', () => {
            const round1 = getMatchesForRound(matches, 1);
            expect(round1).toHaveLength(2);

            const round2 = getMatchesForRound(matches, 2);
            expect(round2).toHaveLength(1);
        });
    });

    describe('isRoundComplete', () => {
        it('should return true when all matches in round are completed', () => {
            const matches: TournamentAmericanoMatch[] = [
                { id: 'm1', roundNumber: 1, courtId: 'a', team1: [], team2: [], status: 'completed' },
                { id: 'm2', roundNumber: 1, courtId: 'b', team1: [], team2: [], status: 'completed' },
            ];

            expect(isRoundComplete(matches, 1)).toBe(true);
        });

        it('should return false when some matches are not completed', () => {
            const matches: TournamentAmericanoMatch[] = [
                { id: 'm1', roundNumber: 1, courtId: 'a', team1: [], team2: [], status: 'completed' },
                { id: 'm2', roundNumber: 1, courtId: 'b', team1: [], team2: [], status: 'scheduled' },
            ];

            expect(isRoundComplete(matches, 1)).toBe(false);
        });
    });

    describe('getCurrentRound', () => {
        it('should return 1 for empty matches', () => {
            expect(getCurrentRound([])).toBe(1);
        });

        it('should return first incomplete round', () => {
            const matches: TournamentAmericanoMatch[] = [
                { id: 'm1', roundNumber: 1, courtId: 'a', team1: [], team2: [], status: 'completed' },
                { id: 'm2', roundNumber: 1, courtId: 'b', team1: [], team2: [], status: 'completed' },
                { id: 'm3', roundNumber: 2, courtId: 'a', team1: [], team2: [], status: 'scheduled' },
            ];

            expect(getCurrentRound(matches)).toBe(2);
        });
    });

    describe('applyMatchResult', () => {
        it('should update match with score', () => {
            const state = initializeTournamentState(validConfig, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']);
            const matchId = state.matches[0].id;

            const newState = applyMatchResult(state, {
                matchId,
                team1Score: 21,
                team2Score: 18,
            });

            const updatedMatch = newState.matches.find(m => m.id === matchId);
            expect(updatedMatch?.status).toBe('completed');
            expect(updatedMatch?.team1Score).toBe(21);
            expect(updatedMatch?.team2Score).toBe(18);
        });

        it('should recalculate standings after result', () => {
            const state = initializeTournamentState(validConfig, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']);
            const matchId = state.matches[0].id;

            const newState = applyMatchResult(state, {
                matchId,
                team1Score: 21,
                team2Score: 18,
            });

            // Some standings should now have non-zero values
            const hasNonZeroStandings = newState.standings.some(
                s => s.pointsScored > 0 || s.pointsConceded > 0
            );
            expect(hasNonZeroStandings).toBe(true);
        });
    });

    describe('initializeTournamentState', () => {
        it('should create initial state with correct structure', () => {
            const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
            const state = initializeTournamentState(validConfig, participants);

            expect(state.currentRound).toBe(1);
            expect(state.totalRounds).toBeGreaterThan(0);
            expect(state.matches.length).toBeGreaterThan(0);
            expect(state.standings).toHaveLength(8);
            expect(state.startedAt).toBeDefined();
        });

        it('should throw for wrong participant count', () => {
            const wrongCount = ['p1', 'p2', 'p3', 'p4']; // Need 8
            expect(() => initializeTournamentState(validConfig, wrongCount)).toThrow();
        });
    });

    describe('getTournamentSummary', () => {
        it('should return correct summary', () => {
            const state = initializeTournamentState(validConfig, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']);
            const summary = getTournamentSummary(state);

            expect(summary.currentRound).toBe(1);
            expect(summary.totalRounds).toBeGreaterThan(0);
            expect(summary.completedMatches).toBe(0);
            expect(summary.totalMatches).toBe(state.matches.length);
            expect(summary.isComplete).toBe(false);
        });
    });

    describe('createDefaultCourts', () => {
        it('should create correct number of courts', () => {
            const courts = createDefaultCourts(4);
            expect(courts).toHaveLength(4);
        });

        it('should name courts with letters', () => {
            const courts = createDefaultCourts(4);
            expect(courts[0].name).toBe('Court A');
            expect(courts[1].name).toBe('Court B');
            expect(courts[2].name).toBe('Court C');
            expect(courts[3].name).toBe('Court D');
        });

        it('should limit to 8 courts', () => {
            const courts = createDefaultCourts(10);
            expect(courts).toHaveLength(8);
        });
    });
});

