import { describe, it, expect } from 'vitest';
import {
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
    assertTeamSize,
    asDoublesTeam,
} from './core';
import type { GenericMatch } from './types';

describe('Tournament Core Utilities', () => {
    // Test fixtures
    const createMatch = (
        id: string,
        roundNumber: number,
        status: GenericMatch['status'] = 'scheduled',
        team1: string[] = ['p1', 'p2'],
        team2: string[] = ['p3', 'p4']
    ): GenericMatch => ({
        id,
        roundNumber,
        courtId: 'court_a',
        team1,
        team2,
        status,
    });

    describe('getMatchesForRound', () => {
        it('should return matches for specified round', () => {
            const matches: GenericMatch[] = [
                createMatch('m1', 1),
                createMatch('m2', 1),
                createMatch('m3', 2),
            ];

            const round1 = getMatchesForRound(matches, 1);
            expect(round1).toHaveLength(2);
            expect(round1.map(m => m.id)).toEqual(['m1', 'm2']);
        });

        it('should return empty array for non-existent round', () => {
            const matches: GenericMatch[] = [createMatch('m1', 1)];
            expect(getMatchesForRound(matches, 5)).toEqual([]);
        });

        it('should return empty array for empty matches', () => {
            expect(getMatchesForRound([], 1)).toEqual([]);
        });
    });

    describe('isRoundComplete', () => {
        it('should return true when all matches in round are completed', () => {
            const matches: GenericMatch[] = [
                createMatch('m1', 1, 'completed'),
                createMatch('m2', 1, 'completed'),
            ];
            expect(isRoundComplete(matches, 1)).toBe(true);
        });

        it('should return false when some matches are not completed', () => {
            const matches: GenericMatch[] = [
                createMatch('m1', 1, 'completed'),
                createMatch('m2', 1, 'scheduled'),
            ];
            expect(isRoundComplete(matches, 1)).toBe(false);
        });

        it('should return false for empty matches', () => {
            expect(isRoundComplete([], 1)).toBe(false);
        });

        it('should return false for non-existent round', () => {
            const matches: GenericMatch[] = [createMatch('m1', 1, 'completed')];
            expect(isRoundComplete(matches, 5)).toBe(false);
        });

        it('should handle in_progress status as incomplete', () => {
            const matches: GenericMatch[] = [
                createMatch('m1', 1, 'in_progress'),
            ];
            expect(isRoundComplete(matches, 1)).toBe(false);
        });
    });

    describe('getCurrentRound', () => {
        it('should return 1 for empty matches', () => {
            expect(getCurrentRound([])).toBe(1);
        });

        it('should return first incomplete round', () => {
            const matches: GenericMatch[] = [
                createMatch('m1', 1, 'completed'),
                createMatch('m2', 1, 'completed'),
                createMatch('m3', 2, 'scheduled'),
            ];
            expect(getCurrentRound(matches)).toBe(2);
        });

        it('should return last round when all complete', () => {
            const matches: GenericMatch[] = [
                createMatch('m1', 1, 'completed'),
                createMatch('m2', 2, 'completed'),
                createMatch('m3', 3, 'completed'),
            ];
            expect(getCurrentRound(matches)).toBe(3);
        });

        it('should return 1 when first round is incomplete', () => {
            const matches: GenericMatch[] = [
                createMatch('m1', 1, 'scheduled'),
                createMatch('m2', 2, 'scheduled'),
            ];
            expect(getCurrentRound(matches)).toBe(1);
        });
    });

    describe('isTournamentComplete', () => {
        it('should return false for empty matches', () => {
            expect(isTournamentComplete([])).toBe(false);
        });

        it('should return true when all matches are completed', () => {
            const matches: GenericMatch[] = [
                createMatch('m1', 1, 'completed'),
                createMatch('m2', 2, 'completed'),
            ];
            expect(isTournamentComplete(matches)).toBe(true);
        });

        it('should return false when any match is not completed', () => {
            const matches: GenericMatch[] = [
                createMatch('m1', 1, 'completed'),
                createMatch('m2', 2, 'scheduled'),
            ];
            expect(isTournamentComplete(matches)).toBe(false);
        });

        it('should return false when matches are in progress', () => {
            const matches: GenericMatch[] = [
                createMatch('m1', 1, 'in_progress'),
            ];
            expect(isTournamentComplete(matches)).toBe(false);
        });
    });

    describe('getTotalRounds', () => {
        it('should return 0 for empty matches', () => {
            expect(getTotalRounds([])).toBe(0);
        });

        it('should return maximum round number', () => {
            const matches: GenericMatch[] = [
                createMatch('m1', 1),
                createMatch('m2', 3),
                createMatch('m3', 2),
            ];
            expect(getTotalRounds(matches)).toBe(3);
        });

        it('should return 1 for single round', () => {
            const matches: GenericMatch[] = [createMatch('m1', 1)];
            expect(getTotalRounds(matches)).toBe(1);
        });
    });

    describe('getMatchesByStatus', () => {
        const matches: GenericMatch[] = [
            createMatch('m1', 1, 'scheduled'),
            createMatch('m2', 1, 'in_progress'),
            createMatch('m3', 1, 'completed'),
            createMatch('m4', 1, 'cancelled'),
            createMatch('m5', 1, 'scheduled'),
        ];

        it('should filter by scheduled status', () => {
            const result = getMatchesByStatus(matches, 'scheduled');
            expect(result).toHaveLength(2);
            expect(result.map(m => m.id)).toEqual(['m1', 'm5']);
        });

        it('should filter by in_progress status', () => {
            const result = getMatchesByStatus(matches, 'in_progress');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('m2');
        });

        it('should filter by completed status', () => {
            const result = getMatchesByStatus(matches, 'completed');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('m3');
        });

        it('should filter by cancelled status', () => {
            const result = getMatchesByStatus(matches, 'cancelled');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('m4');
        });

        it('should return empty array when no matches have status', () => {
            const scheduledOnly = [createMatch('m1', 1, 'scheduled')];
            expect(getMatchesByStatus(scheduledOnly, 'completed')).toEqual([]);
        });
    });

    describe('countCompletedMatches', () => {
        it('should return 0 for empty matches', () => {
            expect(countCompletedMatches([])).toBe(0);
        });

        it('should count only completed matches', () => {
            const matches: GenericMatch[] = [
                createMatch('m1', 1, 'completed'),
                createMatch('m2', 1, 'scheduled'),
                createMatch('m3', 1, 'completed'),
            ];
            expect(countCompletedMatches(matches)).toBe(2);
        });

        it('should return 0 when no matches are completed', () => {
            const matches: GenericMatch[] = [
                createMatch('m1', 1, 'scheduled'),
                createMatch('m2', 1, 'in_progress'),
            ];
            expect(countCompletedMatches(matches)).toBe(0);
        });
    });

    describe('getMatchById', () => {
        const matches: GenericMatch[] = [
            createMatch('m1', 1),
            createMatch('m2', 1),
            createMatch('m3', 2),
        ];

        it('should find match by id', () => {
            const result = getMatchById(matches, 'm2');
            expect(result).toBeDefined();
            expect(result?.id).toBe('m2');
        });

        it('should return undefined for non-existent id', () => {
            expect(getMatchById(matches, 'nonexistent')).toBeUndefined();
        });

        it('should return undefined for empty matches', () => {
            expect(getMatchById([], 'm1')).toBeUndefined();
        });
    });

    describe('getMatchesForPlayer', () => {
        const matches: GenericMatch[] = [
            createMatch('m1', 1, 'scheduled', ['p1', 'p2'], ['p3', 'p4']),
            createMatch('m2', 1, 'scheduled', ['p5', 'p6'], ['p1', 'p7']),
            createMatch('m3', 2, 'scheduled', ['p8', 'p9'], ['p10', 'p11']),
        ];

        it('should find matches where player is on team1', () => {
            const result = getMatchesForPlayer(matches, 'p2');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('m1');
        });

        it('should find matches where player is on team2', () => {
            const result = getMatchesForPlayer(matches, 'p7');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('m2');
        });

        it('should find multiple matches for same player', () => {
            const result = getMatchesForPlayer(matches, 'p1');
            expect(result).toHaveLength(2);
            expect(result.map(m => m.id)).toEqual(['m1', 'm2']);
        });

        it('should return empty array for non-participating player', () => {
            expect(getMatchesForPlayer(matches, 'p99')).toEqual([]);
        });
    });

    describe('extractParticipantIds', () => {
        it('should return empty array for empty matches', () => {
            expect(extractParticipantIds([])).toEqual([]);
        });

        it('should extract unique participant ids', () => {
            const matches: GenericMatch[] = [
                createMatch('m1', 1, 'scheduled', ['p1', 'p2'], ['p3', 'p4']),
                createMatch('m2', 1, 'scheduled', ['p1', 'p5'], ['p2', 'p6']),
            ];
            const result = extractParticipantIds(matches);
            expect(result).toHaveLength(6);
            expect(new Set(result).size).toBe(6);
        });

        it('should handle duplicate players correctly', () => {
            const matches: GenericMatch[] = [
                createMatch('m1', 1, 'scheduled', ['p1', 'p2'], ['p3', 'p4']),
                createMatch('m2', 1, 'scheduled', ['p1', 'p2'], ['p5', 'p6']),
            ];
            const result = extractParticipantIds(matches);
            // p1 and p2 appear twice but should only be in result once
            expect(result.filter(id => id === 'p1')).toHaveLength(1);
            expect(result.filter(id => id === 'p2')).toHaveLength(1);
        });
    });

    describe('shuffleArray', () => {
        it('should preserve all elements', () => {
            const original = [1, 2, 3, 4, 5];
            const shuffled = shuffleArray(original);
            expect(shuffled).toHaveLength(5);
            expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
        });

        it('should not mutate original array', () => {
            const original = [1, 2, 3, 4, 5];
            const originalCopy = [...original];
            shuffleArray(original);
            expect(original).toEqual(originalCopy);
        });

        it('should handle empty array', () => {
            expect(shuffleArray([])).toEqual([]);
        });

        it('should handle single element', () => {
            expect(shuffleArray([1])).toEqual([1]);
        });

        it('should produce different order (statistically)', () => {
            const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            let differentOrder = false;
            
            // Try multiple times - at least once should be different
            for (let i = 0; i < 10; i++) {
                const shuffled = shuffleArray(original);
                if (JSON.stringify(shuffled) !== JSON.stringify(original)) {
                    differentOrder = true;
                    break;
                }
            }
            expect(differentOrder).toBe(true);
        });
    });

    describe('isValidParticipantCount', () => {
        it('should return true for valid doubles count', () => {
            expect(isValidParticipantCount(8, 2)).toBe(true);
            expect(isValidParticipantCount(12, 2)).toBe(true);
            expect(isValidParticipantCount(16, 2)).toBe(true);
        });

        it('should return true for valid singles count', () => {
            expect(isValidParticipantCount(4, 1)).toBe(true);
            expect(isValidParticipantCount(8, 1)).toBe(true);
        });

        it('should return false when not divisible by team size', () => {
            expect(isValidParticipantCount(7, 2)).toBe(false);
            expect(isValidParticipantCount(5, 2)).toBe(false);
        });

        it('should return false when fewer than minimum players', () => {
            expect(isValidParticipantCount(2, 2)).toBe(false); // Need 4 for 2v2
            expect(isValidParticipantCount(1, 1)).toBe(false); // Need 2 for 1v1
        });

        it('should handle team size of 3 (triples)', () => {
            expect(isValidParticipantCount(6, 3)).toBe(true); // 3v3
            expect(isValidParticipantCount(12, 3)).toBe(true);
            expect(isValidParticipantCount(7, 3)).toBe(false);
        });
    });

    describe('getMinimumCourts', () => {
        it('should calculate for doubles (teamSize=2)', () => {
            expect(getMinimumCourts(8, 2)).toBe(2);  // 8/4 = 2
            expect(getMinimumCourts(12, 2)).toBe(3); // 12/4 = 3
            expect(getMinimumCourts(16, 2)).toBe(4); // 16/4 = 4
        });

        it('should calculate for singles (teamSize=1)', () => {
            expect(getMinimumCourts(4, 1)).toBe(2);  // 4/2 = 2
            expect(getMinimumCourts(8, 1)).toBe(4);  // 8/2 = 4
        });

        it('should handle triples (teamSize=3)', () => {
            expect(getMinimumCourts(6, 3)).toBe(1);  // 6/6 = 1
            expect(getMinimumCourts(12, 3)).toBe(2); // 12/6 = 2
        });

        it('should floor non-integer results', () => {
            expect(getMinimumCourts(10, 2)).toBe(2); // 10/4 = 2.5 -> 2
        });
    });

    describe('assertTeamSize', () => {
        it('should not throw for correct team size', () => {
            expect(() => assertTeamSize(['p1', 'p2'], 2)).not.toThrow();
            expect(() => assertTeamSize(['p1'], 1)).not.toThrow();
            expect(() => assertTeamSize(['p1', 'p2', 'p3'], 3)).not.toThrow();
        });

        it('should throw for incorrect team size', () => {
            expect(() => assertTeamSize(['p1'], 2)).toThrow('Expected team of 2 players, got 1');
            expect(() => assertTeamSize(['p1', 'p2', 'p3'], 2)).toThrow('Expected team of 2 players, got 3');
        });

        it('should throw for empty array when expecting players', () => {
            expect(() => assertTeamSize([], 2)).toThrow('Expected team of 2 players, got 0');
        });
    });

    describe('asDoublesTeam', () => {
        it('should return tuple for valid doubles team', () => {
            const result = asDoublesTeam(['p1', 'p2']);
            expect(result).toEqual(['p1', 'p2']);
            expect(result[0]).toBe('p1');
            expect(result[1]).toBe('p2');
        });

        it('should throw for single player', () => {
            expect(() => asDoublesTeam(['p1'])).toThrow('Expected team of 2 players, got 1');
        });

        it('should throw for too many players', () => {
            expect(() => asDoublesTeam(['p1', 'p2', 'p3'])).toThrow('Expected team of 2 players, got 3');
        });

        it('should throw for empty array', () => {
            expect(() => asDoublesTeam([])).toThrow('Expected team of 2 players, got 0');
        });
    });
});

