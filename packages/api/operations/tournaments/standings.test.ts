import { describe, it, expect } from 'vitest';
import {
    calculateStandings,
    sortStandings,
    initializeStandings,
    getLeader,
    getTopStandings,
    findParticipantStanding,
} from './standings';
import type { GenericMatch, GenericStanding } from './types';

describe('Tournament Standings Utilities', () => {
    // Test fixtures
    const createCompletedMatch = (
        id: string,
        team1: string[],
        team2: string[],
        team1Score: number,
        team2Score: number
    ): GenericMatch => ({
        id,
        roundNumber: 1,
        courtId: 'court_a',
        team1,
        team2,
        status: 'completed',
        team1Score,
        team2Score,
    });

    const createScheduledMatch = (
        id: string,
        team1: string[],
        team2: string[]
    ): GenericMatch => ({
        id,
        roundNumber: 1,
        courtId: 'court_a',
        team1,
        team2,
        status: 'scheduled',
    });

    describe('calculateStandings', () => {
        const participants = ['p1', 'p2', 'p3', 'p4'];

        it('should initialize standings with zeros for empty matches', () => {
            const standings = calculateStandings([], participants);

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
            const matches: GenericMatch[] = [
                createCompletedMatch('m1', ['p1', 'p2'], ['p3', 'p4'], 21, 15),
            ];

            const standings = calculateStandings(matches, participants);

            // p1 and p2 should have won
            const p1 = standings.find(s => s.participantId === 'p1')!;
            expect(p1.matchesPlayed).toBe(1);
            expect(p1.matchesWon).toBe(1);
            expect(p1.matchesLost).toBe(0);
            expect(p1.pointsScored).toBe(21);
            expect(p1.pointsConceded).toBe(15);
            expect(p1.pointsDifference).toBe(6);

            const p2 = standings.find(s => s.participantId === 'p2')!;
            expect(p2.matchesWon).toBe(1);
            expect(p2.pointsScored).toBe(21);

            // p3 and p4 should have lost
            const p3 = standings.find(s => s.participantId === 'p3')!;
            expect(p3.matchesPlayed).toBe(1);
            expect(p3.matchesWon).toBe(0);
            expect(p3.matchesLost).toBe(1);
            expect(p3.pointsScored).toBe(15);
            expect(p3.pointsConceded).toBe(21);
            expect(p3.pointsDifference).toBe(-6);
        });

        it('should ignore non-completed matches', () => {
            const matches: GenericMatch[] = [
                createScheduledMatch('m1', ['p1', 'p2'], ['p3', 'p4']),
            ];

            const standings = calculateStandings(matches, participants);
            standings.forEach(s => {
                expect(s.matchesPlayed).toBe(0);
            });
        });

        it('should accumulate stats across multiple matches', () => {
            const matches: GenericMatch[] = [
                createCompletedMatch('m1', ['p1', 'p2'], ['p3', 'p4'], 21, 18),
                createCompletedMatch('m2', ['p1', 'p3'], ['p2', 'p4'], 20, 15),
            ];

            const standings = calculateStandings(matches, participants);

            const p1 = standings.find(s => s.participantId === 'p1')!;
            expect(p1.matchesPlayed).toBe(2);
            expect(p1.matchesWon).toBe(2);
            expect(p1.pointsScored).toBe(41); // 21 + 20
            expect(p1.pointsConceded).toBe(33); // 18 + 15
        });

        it('should handle mixed completed and scheduled matches', () => {
            const matches: GenericMatch[] = [
                createCompletedMatch('m1', ['p1', 'p2'], ['p3', 'p4'], 21, 15),
                createScheduledMatch('m2', ['p1', 'p3'], ['p2', 'p4']),
            ];

            const standings = calculateStandings(matches, participants);

            const p1 = standings.find(s => s.participantId === 'p1')!;
            expect(p1.matchesPlayed).toBe(1); // Only completed match counted
        });

        it('should return sorted standings', () => {
            const matches: GenericMatch[] = [
                createCompletedMatch('m1', ['p1', 'p2'], ['p3', 'p4'], 10, 21), // p1,p2 lose
            ];

            const standings = calculateStandings(matches, participants);

            // Winners should be first
            expect(standings[0].participantId).toBe('p3');
        });
    });

    describe('sortStandings', () => {
        it('should sort by points difference (primary)', () => {
            const standings: GenericStanding[] = [
                { participantId: 'p1', matchesPlayed: 2, matchesWon: 1, matchesLost: 1, pointsScored: 40, pointsConceded: 42, pointsDifference: -2 },
                { participantId: 'p2', matchesPlayed: 2, matchesWon: 2, matchesLost: 0, pointsScored: 42, pointsConceded: 30, pointsDifference: 12 },
                { participantId: 'p3', matchesPlayed: 2, matchesWon: 0, matchesLost: 2, pointsScored: 30, pointsConceded: 42, pointsDifference: -12 },
            ];

            const sorted = sortStandings(standings);

            expect(sorted[0].participantId).toBe('p2'); // +12
            expect(sorted[1].participantId).toBe('p1'); // -2
            expect(sorted[2].participantId).toBe('p3'); // -12
        });

        it('should use points scored as tiebreaker', () => {
            const standings: GenericStanding[] = [
                { participantId: 'p1', matchesPlayed: 2, matchesWon: 1, matchesLost: 1, pointsScored: 35, pointsConceded: 35, pointsDifference: 0 },
                { participantId: 'p2', matchesPlayed: 2, matchesWon: 1, matchesLost: 1, pointsScored: 40, pointsConceded: 40, pointsDifference: 0 },
            ];

            const sorted = sortStandings(standings);

            expect(sorted[0].participantId).toBe('p2'); // More points scored
            expect(sorted[1].participantId).toBe('p1');
        });

        it('should use matches won as tertiary tiebreaker', () => {
            const standings: GenericStanding[] = [
                { participantId: 'p1', matchesPlayed: 3, matchesWon: 1, matchesLost: 2, pointsScored: 40, pointsConceded: 40, pointsDifference: 0 },
                { participantId: 'p2', matchesPlayed: 3, matchesWon: 2, matchesLost: 1, pointsScored: 40, pointsConceded: 40, pointsDifference: 0 },
            ];

            const sorted = sortStandings(standings);

            expect(sorted[0].participantId).toBe('p2'); // More wins
            expect(sorted[1].participantId).toBe('p1');
        });

        it('should not mutate original array', () => {
            const standings: GenericStanding[] = [
                { participantId: 'p1', matchesPlayed: 2, matchesWon: 0, matchesLost: 2, pointsScored: 30, pointsConceded: 42, pointsDifference: -12 },
                { participantId: 'p2', matchesPlayed: 2, matchesWon: 2, matchesLost: 0, pointsScored: 42, pointsConceded: 30, pointsDifference: 12 },
            ];
            const originalFirst = standings[0].participantId;

            sortStandings(standings);

            expect(standings[0].participantId).toBe(originalFirst);
        });

        it('should handle empty array', () => {
            expect(sortStandings([])).toEqual([]);
        });

        it('should handle single standing', () => {
            const standings: GenericStanding[] = [
                { participantId: 'p1', matchesPlayed: 1, matchesWon: 1, matchesLost: 0, pointsScored: 21, pointsConceded: 15, pointsDifference: 6 },
            ];
            const sorted = sortStandings(standings);
            expect(sorted).toHaveLength(1);
            expect(sorted[0].participantId).toBe('p1');
        });
    });

    describe('initializeStandings', () => {
        it('should create standings with all zeros', () => {
            const participants = ['p1', 'p2', 'p3'];
            const standings = initializeStandings(participants);

            expect(standings).toHaveLength(3);
            standings.forEach((s, i) => {
                expect(s.participantId).toBe(participants[i]);
                expect(s.matchesPlayed).toBe(0);
                expect(s.matchesWon).toBe(0);
                expect(s.matchesLost).toBe(0);
                expect(s.pointsScored).toBe(0);
                expect(s.pointsConceded).toBe(0);
                expect(s.pointsDifference).toBe(0);
            });
        });

        it('should handle empty participants', () => {
            expect(initializeStandings([])).toEqual([]);
        });

        it('should handle single participant', () => {
            const standings = initializeStandings(['p1']);
            expect(standings).toHaveLength(1);
            expect(standings[0].participantId).toBe('p1');
        });
    });

    describe('getLeader', () => {
        it('should return first standing as leader', () => {
            const standings: GenericStanding[] = [
                { participantId: 'p1', matchesPlayed: 2, matchesWon: 2, matchesLost: 0, pointsScored: 42, pointsConceded: 30, pointsDifference: 12 },
                { participantId: 'p2', matchesPlayed: 2, matchesWon: 1, matchesLost: 1, pointsScored: 35, pointsConceded: 35, pointsDifference: 0 },
            ];

            const leader = getLeader(standings);

            expect(leader).not.toBeNull();
            expect(leader?.participantId).toBe('p1');
        });

        it('should return null for empty standings', () => {
            expect(getLeader([])).toBeNull();
        });
    });

    describe('getTopStandings', () => {
        const standings: GenericStanding[] = [
            { participantId: 'p1', matchesPlayed: 3, matchesWon: 3, matchesLost: 0, pointsScored: 63, pointsConceded: 45, pointsDifference: 18 },
            { participantId: 'p2', matchesPlayed: 3, matchesWon: 2, matchesLost: 1, pointsScored: 55, pointsConceded: 50, pointsDifference: 5 },
            { participantId: 'p3', matchesPlayed: 3, matchesWon: 1, matchesLost: 2, pointsScored: 50, pointsConceded: 55, pointsDifference: -5 },
            { participantId: 'p4', matchesPlayed: 3, matchesWon: 0, matchesLost: 3, pointsScored: 45, pointsConceded: 63, pointsDifference: -18 },
        ];

        it('should return top N standings', () => {
            const top2 = getTopStandings(standings, 2);

            expect(top2).toHaveLength(2);
            expect(top2[0].participantId).toBe('p1');
            expect(top2[1].participantId).toBe('p2');
        });

        it('should return all if count exceeds length', () => {
            const result = getTopStandings(standings, 10);
            expect(result).toHaveLength(4);
        });

        it('should return empty for count 0', () => {
            expect(getTopStandings(standings, 0)).toEqual([]);
        });

        it('should handle empty standings', () => {
            expect(getTopStandings([], 3)).toEqual([]);
        });
    });

    describe('findParticipantStanding', () => {
        const standings: GenericStanding[] = [
            { participantId: 'p1', matchesPlayed: 3, matchesWon: 3, matchesLost: 0, pointsScored: 63, pointsConceded: 45, pointsDifference: 18 },
            { participantId: 'p2', matchesPlayed: 3, matchesWon: 2, matchesLost: 1, pointsScored: 55, pointsConceded: 50, pointsDifference: 5 },
            { participantId: 'p3', matchesPlayed: 3, matchesWon: 1, matchesLost: 2, pointsScored: 50, pointsConceded: 55, pointsDifference: -5 },
        ];

        it('should find participant and return position', () => {
            const result = findParticipantStanding(standings, 'p2');

            expect(result).not.toBeNull();
            expect(result?.standing.participantId).toBe('p2');
            expect(result?.position).toBe(2); // 1-indexed
        });

        it('should return position 1 for first place', () => {
            const result = findParticipantStanding(standings, 'p1');
            expect(result?.position).toBe(1);
        });

        it('should return null for non-existent participant', () => {
            const result = findParticipantStanding(standings, 'p99');
            expect(result).toBeNull();
        });

        it('should return null for empty standings', () => {
            const result = findParticipantStanding([], 'p1');
            expect(result).toBeNull();
        });

        it('should find last place correctly', () => {
            const result = findParticipantStanding(standings, 'p3');
            expect(result?.position).toBe(3);
        });
    });
});

