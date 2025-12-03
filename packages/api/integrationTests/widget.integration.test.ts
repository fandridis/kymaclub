import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { modules } from '../convex/test.setup';
import { api, internal } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import type { WidgetConfig, TournamentAmericanoConfig } from '../types/widget';

describe('Widget System Integration Tests', () => {
    const t = convexTest(schema, modules);

    // Test data
    let userId: Id<"users">;
    let businessId: Id<"businesses">;
    let venueId: Id<"venues">;
    let templateId: Id<"classTemplates">;
    let instanceId: Id<"classInstances">;

    // Default Americano config for testing
    const defaultAmericanoConfig: TournamentAmericanoConfig = {
        numberOfPlayers: 8,
        matchPoints: 21,
        courts: [
            { id: 'court_a', name: 'Court A' },
            { id: 'court_b', name: 'Court B' },
        ],
        maxMatchesPerPlayer: 7,
        mode: 'individual_rotation',
    };

    const widgetConfig: WidgetConfig = {
        type: 'tournament_americano',
        config: defaultAmericanoConfig,
    };

    beforeEach(async () => {
        // Create test user
        userId = await t.mutation(internal.testFunctions.createTestUser, {
            user: {
                name: "Tournament Admin",
                email: "admin@tournament.test",
                role: "admin",
                hasBusinessOnboarded: true,
            }
        });

        // Create test business
        businessId = await t.mutation(internal.testFunctions.createTestBusiness, {
            userId,
            business: { name: "Tournament Club" }
        });

        // Attach user to business
        await t.mutation(internal.testFunctions.attachUserToBusiness, {
            userId,
            businessId,
            role: "admin"
        });

        // Create test venue
        venueId = await t.mutation(internal.testFunctions.createTestVenue, {
            venue: {
                name: 'Tournament Arena',
                email: 'arena@tournament.test',
                address: {
                    street: '123 Sport St',
                    city: 'Sportsville',
                    state: 'SP',
                    zipCode: '12345',
                    country: 'USA'
                },
                primaryCategory: 'wellness_center'
            }
        });

        // Create test class template
        templateId = await t.mutation(internal.testFunctions.createTestClassTemplate, {
            userId,
            businessId,
            template: {
                name: "Padel Americano",
                description: "Americano tournament class",
                businessId,
                venueId,
                instructor: userId,
                duration: 120,
                capacity: 16,
                price: 1500,
                tags: ['padel', 'tournament'],
                color: '#FFD700',
            }
        });

        // Create test class instance (future date)
        const startTime = Date.now() + (24 * 60 * 60 * 1000); // Tomorrow
        instanceId = await t.mutation(internal.testFunctions.createTestClassInstance, {
            instance: {
                templateId,
                venueId,
                businessId,
                startTime,
                endTime: startTime + (2 * 60 * 60 * 1000),
            }
        });
    });

    describe('Widget Attachment', () => {
        it('should attach a widget to a class instance', async () => {
            const result = await t.mutation(api.mutations.widgets.attachWidget, {
                classInstanceId: instanceId,
                widgetConfig,
            }, { sessionId: userId });

            expect(result.widgetId).toBeDefined();

            // Verify widget was created
            const widget = await t.query(api.queries.widgets.getById, {
                widgetId: result.widgetId,
            });

            expect(widget).not.toBeNull();
            expect(widget?.status).toBe('setup');
            expect(widget?.widgetConfig.type).toBe('tournament_americano');
        });

        it('should not allow attaching multiple widgets to same instance', async () => {
            // First attachment
            await t.mutation(api.mutations.widgets.attachWidget, {
                classInstanceId: instanceId,
                widgetConfig,
            }, { sessionId: userId });

            // Second attachment should fail
            await expect(
                t.mutation(api.mutations.widgets.attachWidget, {
                    classInstanceId: instanceId,
                    widgetConfig,
                }, { sessionId: userId })
            ).rejects.toThrow();
        });

        it('should detach a widget from class instance', async () => {
            const { widgetId } = await t.mutation(api.mutations.widgets.attachWidget, {
                classInstanceId: instanceId,
                widgetConfig,
            }, { sessionId: userId });

            await t.mutation(api.mutations.widgets.detachWidget, {
                widgetId,
            }, { sessionId: userId });

            // Verify widget is gone
            const widget = await t.query(api.queries.widgets.getByInstance, {
                classInstanceId: instanceId,
            });

            expect(widget).toBeNull();
        });
    });

    describe('Walk-in Management', () => {
        let widgetId: Id<"classInstanceWidgets">;

        beforeEach(async () => {
            const result = await t.mutation(api.mutations.widgets.attachWidget, {
                classInstanceId: instanceId,
                widgetConfig,
            }, { sessionId: userId });
            widgetId = result.widgetId;
        });

        it('should add walk-in participants', async () => {
            const result = await t.mutation(api.mutations.widgets.addWalkIn, {
                widgetId,
                walkIn: {
                    name: 'John Doe',
                    phone: '+1234567890',
                },
            }, { sessionId: userId });

            expect(result.walkInId).toBeDefined();

            // Verify participant was added via setupParticipants
            const participants = await t.query(api.queries.widgets.getSetupParticipants, {
                widgetId,
            });

            expect(participants.length).toBe(1);
            expect(participants[0].displayName).toBe('John Doe');
            expect(participants[0].isWalkIn).toBe(true);
            expect(participants[0].walkInPhone).toBe('+1234567890');
        });

        it('should not allow duplicate walk-in names', async () => {
            await t.mutation(api.mutations.widgets.addWalkIn, {
                widgetId,
                walkIn: { name: 'John Doe' },
            }, { sessionId: userId });

            await expect(
                t.mutation(api.mutations.widgets.addWalkIn, {
                    widgetId,
                    walkIn: { name: 'John Doe' },
                }, { sessionId: userId })
            ).rejects.toThrow();
        });

        it('should remove walk-in participants', async () => {
            const { walkInId } = await t.mutation(api.mutations.widgets.addWalkIn, {
                widgetId,
                walkIn: { name: 'To Remove' },
            }, { sessionId: userId });

            await t.mutation(api.mutations.widgets.removeWalkIn, {
                widgetId,
                walkInId,
            }, { sessionId: userId });

            const participants = await t.query(api.queries.widgets.getSetupParticipants, {
                widgetId,
            });

            expect(participants.length).toBe(0);
        });
    });

    describe('Tournament Lifecycle', () => {
        let widgetId: Id<"classInstanceWidgets">;

        beforeEach(async () => {
            const result = await t.mutation(api.mutations.widgets.attachWidget, {
                classInstanceId: instanceId,
                widgetConfig,
            }, { sessionId: userId });
            widgetId = result.widgetId;
        });

        it('should not start tournament without enough participants', async () => {
            // Add only 4 participants (need 8)
            for (let i = 0; i < 4; i++) {
                await t.mutation(api.mutations.widgets.addWalkIn, {
                    widgetId,
                    walkIn: { name: `Player ${i + 1}` },
                }, { sessionId: userId });
            }

            await expect(
                t.mutation(api.mutations.widgets.startAmericanoTournament, {
                    widgetId,
                }, { sessionId: userId })
            ).rejects.toThrow();
        });

        it('should start tournament with correct number of participants', async () => {
            // Add all 8 participants
            for (let i = 0; i < 8; i++) {
                await t.mutation(api.mutations.widgets.addWalkIn, {
                    widgetId,
                    walkIn: { name: `Player ${i + 1}` },
                }, { sessionId: userId });
            }

            const result = await t.mutation(api.mutations.widgets.startAmericanoTournament, {
                widgetId,
            }, { sessionId: userId });

            expect(result.success).toBe(true);

            // Verify tournament state
            const state = await t.query(api.queries.widgets.getAmericanoTournamentState, {
                widgetId,
            });

            expect(state).not.toBeNull();
            expect(state?.state).not.toBeNull();
            expect(state?.state?.matches.length).toBeGreaterThan(0);
            expect(state?.state?.standings.length).toBe(8);
            // Verify participants snapshot was created
            expect(state?.participants.length).toBe(8);
        });

        it('should record match results', async () => {
            // Setup tournament
            for (let i = 0; i < 8; i++) {
                await t.mutation(api.mutations.widgets.addWalkIn, {
                    widgetId,
                    walkIn: { name: `Player ${i + 1}` },
                }, { sessionId: userId });
            }

            await t.mutation(api.mutations.widgets.startAmericanoTournament, {
                widgetId,
            }, { sessionId: userId });

            // Get first match
            const state = await t.query(api.queries.widgets.getAmericanoTournamentState, {
                widgetId,
            });

            const firstMatch = state?.state?.matches[0];
            expect(firstMatch).toBeDefined();

            // Record result
            const result = await t.mutation(api.mutations.widgets.recordAmericanoMatchResult, {
                widgetId,
                matchId: firstMatch!.id,
                team1Score: 21,
                team2Score: 15,
            }, { sessionId: userId });

            expect(result.success).toBe(true);

            // Verify match was updated
            const updatedState = await t.query(api.queries.widgets.getAmericanoTournamentState, {
                widgetId,
            });

            const updatedMatch = updatedState?.state?.matches.find(m => m.id === firstMatch!.id);
            expect(updatedMatch?.status).toBe('completed');
            expect(updatedMatch?.team1Score).toBe(21);
            expect(updatedMatch?.team2Score).toBe(15);
        });

        it('should allow tied scores', async () => {
            // Setup tournament
            for (let i = 0; i < 8; i++) {
                await t.mutation(api.mutations.widgets.addWalkIn, {
                    widgetId,
                    walkIn: { name: `Player ${i + 1}` },
                }, { sessionId: userId });
            }

            await t.mutation(api.mutations.widgets.startAmericanoTournament, {
                widgetId,
            }, { sessionId: userId });

            const state = await t.query(api.queries.widgets.getAmericanoTournamentState, {
                widgetId,
            });

            const firstMatch = state?.state?.matches[0];

            // Ties should be allowed now
            await t.mutation(api.mutations.widgets.recordAmericanoMatchResult, {
                widgetId,
                matchId: firstMatch!.id,
                team1Score: 18,
                team2Score: 18, // Tied score is allowed
            }, { sessionId: userId });

            // Verify the tied score was saved
            const updatedState = await t.query(api.queries.widgets.getAmericanoTournamentState, {
                widgetId,
            });
            const updatedMatch = updatedState?.state?.matches.find(m => m.id === firstMatch!.id);
            expect(updatedMatch?.team1Score).toBe(18);
            expect(updatedMatch?.team2Score).toBe(18);
        });

        it('should complete tournament', async () => {
            // Setup and start tournament
            for (let i = 0; i < 8; i++) {
                await t.mutation(api.mutations.widgets.addWalkIn, {
                    widgetId,
                    walkIn: { name: `Player ${i + 1}` },
                }, { sessionId: userId });
            }

            await t.mutation(api.mutations.widgets.startAmericanoTournament, {
                widgetId,
            }, { sessionId: userId });

            // Complete tournament
            const result = await t.mutation(api.mutations.widgets.completeAmericanoTournament, {
                widgetId,
            }, { sessionId: userId });

            expect(result.success).toBe(true);

            // Verify status
            const widget = await t.query(api.queries.widgets.getById, {
                widgetId,
            });

            expect(widget?.status).toBe('completed');
        });

        it('should cancel tournament', async () => {
            const result = await t.mutation(api.mutations.widgets.cancelAmericanoTournament, {
                widgetId,
            }, { sessionId: userId });

            expect(result.success).toBe(true);

            const widget = await t.query(api.queries.widgets.getById, {
                widgetId,
            });

            expect(widget?.status).toBe('cancelled');
        });
    });

    describe('Query Operations', () => {
        let widgetId: Id<"classInstanceWidgets">;

        beforeEach(async () => {
            const result = await t.mutation(api.mutations.widgets.attachWidget, {
                classInstanceId: instanceId,
                widgetConfig,
            }, { sessionId: userId });
            widgetId = result.widgetId;
        });

        it('should get widget by instance', async () => {
            const widget = await t.query(api.queries.widgets.getByInstance, {
                classInstanceId: instanceId,
            });

            expect(widget).not.toBeNull();
            expect(widget?._id).toBe(widgetId);
        });

        it('should get widget by ID with setup participants', async () => {
            // Add a walk-in participant
            await t.mutation(api.mutations.widgets.addWalkIn, {
                widgetId,
                walkIn: { name: 'Test Player' },
            }, { sessionId: userId });

            const widget = await t.query(api.queries.widgets.getById, {
                widgetId,
            });

            expect(widget).not.toBeNull();
            expect(widget?.setupParticipants.length).toBe(1);
        });

        it('should get leaderboard', async () => {
            // Setup and start tournament
            for (let i = 0; i < 8; i++) {
                await t.mutation(api.mutations.widgets.addWalkIn, {
                    widgetId,
                    walkIn: { name: `Player ${i + 1}` },
                }, { sessionId: userId });
            }

            await t.mutation(api.mutations.widgets.startAmericanoTournament, {
                widgetId,
            }, { sessionId: userId });

            const leaderboard = await t.query(api.queries.widgets.getAmericanoLeaderboard, {
                widgetId,
            });

            expect(leaderboard.length).toBe(8);
            // All should start with 0 points
            expect(leaderboard.every(s => s.pointsScored === 0)).toBe(true);
        });
    });
});
