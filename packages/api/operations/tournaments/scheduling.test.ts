import { describe, it, expect } from 'vitest';
import {
    generateSchedule,
    applyMatchResult,
    createDefaultCourts,
    getMatchesForCourt,
} from './scheduling';
import type { GenericMatch, Court, SchedulingConfig } from './types';

describe('Tournament Scheduling Utilities', () => {
    // Test fixtures
    const defaultCourts: Court[] = [
        { id: 'court_a', name: 'Court A' },
        { id: 'court_b', name: 'Court B' },
    ];

    const createConfig = (
        participantIds: string[],
        maxMatchesPerPlayer: number = 5,
        teamSize: number = 2,
        courts: Court[] = defaultCourts
    ): SchedulingConfig => ({
        participantIds,
        courts,
        maxMatchesPerPlayer,
        teamSize,
    });

    describe('generateSchedule', () => {
        describe('fixed_teams mode', () => {
            it('should generate schedule for fixed teams', () => {
                const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
                const config = createConfig(participants, 7);

                const result = generateSchedule(config, 'fixed_teams');

                expect(result.totalRounds).toBeGreaterThan(0);
                expect(result.matches.length).toBeGreaterThan(0);
                expect(Object.keys(result.playerMatchCounts)).toHaveLength(8);
            });

            it('should respect max matches per player', () => {
                const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
                const config = createConfig(participants, 3);

                const result = generateSchedule(config, 'fixed_teams');

                Object.values(result.playerMatchCounts).forEach(count => {
                    expect(count).toBeLessThanOrEqual(3);
                });
            });

            it('should assign matches to valid courts', () => {
                const participants = ['p1', 'p2', 'p3', 'p4'];
                const config = createConfig(participants, 5);

                const result = generateSchedule(config, 'fixed_teams');
                const courtIds = defaultCourts.map(c => c.id);

                result.matches.forEach(match => {
                    expect(courtIds).toContain(match.courtId);
                });
            });

            it('should throw for empty courts', () => {
                const participants = ['p1', 'p2', 'p3', 'p4'];
                const config = createConfig(participants, 5, 2, []);

                expect(() => generateSchedule(config, 'fixed_teams')).toThrow(
                    'At least one court is required'
                );
            });

            it('should throw for empty participants', () => {
                const config = createConfig([], 5);

                expect(() => generateSchedule(config, 'fixed_teams')).toThrow(
                    'At least one participant is required'
                );
            });

            it('should create matches with correct team sizes', () => {
                const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
                const config = createConfig(participants, 5, 2);

                const result = generateSchedule(config, 'fixed_teams');

                result.matches.forEach(match => {
                    expect(match.team1).toHaveLength(2);
                    expect(match.team2).toHaveLength(2);
                });
            });
        });

        describe('rotating mode', () => {
            it('should generate schedule for rotating teams', () => {
                const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
                const config = createConfig(participants, 7);

                const result = generateSchedule(config, 'rotating');

                expect(result.totalRounds).toBeGreaterThan(0);
                expect(result.matches.length).toBeGreaterThan(0);
            });

            it('should respect max matches per player in rotating mode', () => {
                const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
                const config = createConfig(participants, 3);

                const result = generateSchedule(config, 'rotating');

                Object.values(result.playerMatchCounts).forEach(count => {
                    expect(count).toBeLessThanOrEqual(3);
                });
            });

            it('should throw for empty courts in rotating mode', () => {
                const participants = ['p1', 'p2', 'p3', 'p4'];
                const config = createConfig(participants, 5, 2, []);

                expect(() => generateSchedule(config, 'rotating')).toThrow(
                    'At least one court is required'
                );
            });

            it('should throw for empty participants in rotating mode', () => {
                const config = createConfig([], 5);

                expect(() => generateSchedule(config, 'rotating')).toThrow(
                    'At least one participant is required'
                );
            });

            it('should balance player workloads', () => {
                const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
                const config = createConfig(participants, 5);

                const result = generateSchedule(config, 'rotating');
                const counts = Object.values(result.playerMatchCounts);
                const minCount = Math.min(...counts);
                const maxCount = Math.max(...counts);

                // Workload should be relatively balanced (difference <= 2)
                expect(maxCount - minCount).toBeLessThanOrEqual(2);
            });
        });

        describe('fairness metrics', () => {
            it('should not schedule same player in multiple matches per round', () => {
                const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
                const config = createConfig(participants, 7);

                const result = generateSchedule(config, 'rotating');

                // Group matches by round
                const matchesByRound = new Map<number, GenericMatch[]>();
                result.matches.forEach(match => {
                    const roundMatches = matchesByRound.get(match.roundNumber) || [];
                    roundMatches.push(match);
                    matchesByRound.set(match.roundNumber, roundMatches);
                });

                // Check each round for player conflicts
                matchesByRound.forEach((roundMatches) => {
                    const playersInRound = new Set<string>();
                    roundMatches.forEach(match => {
                        match.team1.forEach(p => {
                            expect(playersInRound.has(p)).toBe(false);
                            playersInRound.add(p);
                        });
                        match.team2.forEach(p => {
                            expect(playersInRound.has(p)).toBe(false);
                            playersInRound.add(p);
                        });
                    });
                });
            });
        });
    });

    describe('applyMatchResult', () => {
        const createMatch = (id: string): GenericMatch => ({
            id,
            roundNumber: 1,
            courtId: 'court_a',
            team1: ['p1', 'p2'],
            team2: ['p3', 'p4'],
            status: 'scheduled',
        });

        it('should update match with score and status', () => {
            const matches: GenericMatch[] = [createMatch('m1'), createMatch('m2')];

            const updated = applyMatchResult(matches, 'm1', 21, 15);

            const m1 = updated.find(m => m.id === 'm1');
            expect(m1?.status).toBe('completed');
            expect(m1?.team1Score).toBe(21);
            expect(m1?.team2Score).toBe(15);
        });

        it('should set completedAt timestamp', () => {
            const matches: GenericMatch[] = [createMatch('m1')];
            const customTimestamp = 1234567890;

            const updated = applyMatchResult(matches, 'm1', 21, 15, customTimestamp);

            const m1 = updated.find(m => m.id === 'm1');
            expect(m1?.completedAt).toBe(customTimestamp);
        });

        it('should use current time when timestamp not provided', () => {
            const matches: GenericMatch[] = [createMatch('m1')];
            const beforeTime = Date.now();

            const updated = applyMatchResult(matches, 'm1', 21, 15);

            const afterTime = Date.now();
            const m1 = updated.find(m => m.id === 'm1');
            expect(m1?.completedAt).toBeGreaterThanOrEqual(beforeTime);
            expect(m1?.completedAt).toBeLessThanOrEqual(afterTime);
        });

        it('should not mutate original array', () => {
            const matches: GenericMatch[] = [createMatch('m1')];
            const originalStatus = matches[0].status;

            applyMatchResult(matches, 'm1', 21, 15);

            expect(matches[0].status).toBe(originalStatus);
        });

        it('should not modify other matches', () => {
            const matches: GenericMatch[] = [createMatch('m1'), createMatch('m2')];

            const updated = applyMatchResult(matches, 'm1', 21, 15);

            const m2 = updated.find(m => m.id === 'm2');
            expect(m2?.status).toBe('scheduled');
            expect(m2?.team1Score).toBeUndefined();
        });

        it('should handle non-existent match id gracefully', () => {
            const matches: GenericMatch[] = [createMatch('m1')];

            const updated = applyMatchResult(matches, 'nonexistent', 21, 15);

            // Should return all matches unchanged
            expect(updated).toHaveLength(1);
            expect(updated[0].status).toBe('scheduled');
        });

        it('should handle empty matches array', () => {
            const updated = applyMatchResult([], 'm1', 21, 15);
            expect(updated).toEqual([]);
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

        it('should generate correct court ids', () => {
            const courts = createDefaultCourts(3);
            expect(courts[0].id).toBe('court_a');
            expect(courts[1].id).toBe('court_b');
            expect(courts[2].id).toBe('court_c');
        });

        it('should handle more than 12 courts with numbers', () => {
            const courts = createDefaultCourts(15);

            // First 12 should be letters
            expect(courts[11].name).toBe('Court L');

            // After 12 should be numbers
            expect(courts[12].name).toBe('Court 13');
            expect(courts[12].id).toBe('court_13');
            expect(courts[13].name).toBe('Court 14');
            expect(courts[14].name).toBe('Court 15');
        });

        it('should handle zero courts', () => {
            const courts = createDefaultCourts(0);
            expect(courts).toEqual([]);
        });

        it('should handle single court', () => {
            const courts = createDefaultCourts(1);
            expect(courts).toHaveLength(1);
            expect(courts[0]).toEqual({ id: 'court_a', name: 'Court A' });
        });
    });

    describe('getMatchesForCourt', () => {
        const matches: GenericMatch[] = [
            { id: 'm1', roundNumber: 1, courtId: 'court_a', team1: ['p1'], team2: ['p2'], status: 'scheduled' },
            { id: 'm2', roundNumber: 1, courtId: 'court_b', team1: ['p3'], team2: ['p4'], status: 'scheduled' },
            { id: 'm3', roundNumber: 2, courtId: 'court_a', team1: ['p1'], team2: ['p3'], status: 'scheduled' },
            { id: 'm4', roundNumber: 2, courtId: 'court_a', team1: ['p2'], team2: ['p4'], status: 'completed' },
        ];

        it('should filter matches by court', () => {
            const courtAMatches = getMatchesForCourt(matches, 'court_a');

            expect(courtAMatches).toHaveLength(3);
            courtAMatches.forEach(match => {
                expect(match.courtId).toBe('court_a');
            });
        });

        it('should return correct matches for different court', () => {
            const courtBMatches = getMatchesForCourt(matches, 'court_b');

            expect(courtBMatches).toHaveLength(1);
            expect(courtBMatches[0].id).toBe('m2');
        });

        it('should return empty array for non-existent court', () => {
            const result = getMatchesForCourt(matches, 'court_z');
            expect(result).toEqual([]);
        });

        it('should return empty array for empty matches', () => {
            const result = getMatchesForCourt([], 'court_a');
            expect(result).toEqual([]);
        });

        it('should include all match statuses', () => {
            const courtAMatches = getMatchesForCourt(matches, 'court_a');

            const statuses = courtAMatches.map(m => m.status);
            expect(statuses).toContain('scheduled');
            expect(statuses).toContain('completed');
        });
    });
});

