import { describe, it, expect, beforeEach } from 'vitest';
import { TestConvexForDataModel } from 'convex-test';
import { GenericDataModel } from 'convex/server';
import { testT, createTestVenue, createTestClassTemplate, createTestClassInstance } from './helpers';
import { api, internal } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import type { WidgetConfig, TournamentAmericanoConfig } from '../types/widget';

describe('Widget System Integration Tests', () => {
    // Test data
    let userId: Id<"users">;
    let businessId: Id<"businesses">;
    let venueId: Id<"venues">;
    let templateId: Id<"classTemplates">;
    let instanceId: Id<"classInstances">;
    let asUser: TestConvexForDataModel<GenericDataModel>;

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
        userId = await testT.mutation(internal.testFunctions.createTestUser, {
            user: {
                name: "Tournament Admin",
                email: "admin@tournament.test",
                role: "admin",
                hasBusinessOnboarded: true,
            }
        });

        // Create test business
        businessId = await testT.mutation(internal.testFunctions.createTestBusiness, {
            userId,
            business: { name: "Tournament Club" }
        });

        // Attach user to business
        await testT.mutation(internal.testFunctions.attachUserToBusiness, {
            userId,
            businessId,
            role: "admin"
        });

        // Create authenticated test context
        asUser = testT.withIdentity({ subject: userId });

        // Create test venue using authenticated context
        venueId = await createTestVenue(asUser, 'Tournament Arena');

        // Create test class template
        templateId = await createTestClassTemplate(asUser, userId, businessId, venueId, {
            name: "Padel Americano",
            description: "Americano tournament class",
            duration: 120,
            capacity: 16,
            price: 1500,
            tags: ['padel', 'tournament'],
            color: '#FFD700',
        });

        // Create test class instance (within start time window - 1 hour from now)
        // Tournament start rule allows starting within 2 hours of class time
        const startTime = Date.now() + (1 * 60 * 60 * 1000); // 1 hour from now
        const endTime = startTime + (2 * 60 * 60 * 1000);
        instanceId = await createTestClassInstance(asUser, templateId, startTime, endTime);
    });

    describe('Widget Attachment', () => {
        it('should attach a widget to a class instance', async () => {
            const result = await asUser.mutation(api.mutations.widgets.attachWidget, {
                classInstanceId: instanceId,
                widgetConfig,
            });

            expect(result.widgetId).toBeDefined();

            // Verify widget was created
            const widget = await asUser.query(api.queries.widgets.getById, {
                widgetId: result.widgetId,
            });

            expect(widget).not.toBeNull();
            expect(widget?.status).toBe('setup');
            expect(widget?.widgetConfig.type).toBe('tournament_americano');
        });

        it('should not allow attaching multiple widgets to same instance', async () => {
            // First attachment
            await asUser.mutation(api.mutations.widgets.attachWidget, {
                classInstanceId: instanceId,
                widgetConfig,
            });

            // Second attachment should fail
            await expect(
                asUser.mutation(api.mutations.widgets.attachWidget, {
                    classInstanceId: instanceId,
                    widgetConfig,
                })
            ).rejects.toThrow();
        });

        it('should detach a widget from class instance', async () => {
            const { widgetId } = await asUser.mutation(api.mutations.widgets.attachWidget, {
                classInstanceId: instanceId,
                widgetConfig,
            });

            await asUser.mutation(api.mutations.widgets.detachWidget, {
                widgetId,
            });

            // Verify widget is gone
            const widget = await asUser.query(api.queries.widgets.getByInstance, {
                classInstanceId: instanceId,
            });

            expect(widget).toBeNull();
        });
    });

    describe('Walk-in Management', () => {
        let widgetId: Id<"classInstanceWidgets">;

        beforeEach(async () => {
            const result = await asUser.mutation(api.mutations.widgets.attachWidget, {
                classInstanceId: instanceId,
                widgetConfig,
            });
            widgetId = result.widgetId;
        });

        it('should add walk-in participants', async () => {
            const result = await asUser.mutation(api.mutations.widgets.addWalkIn, {
                widgetId,
                walkIn: {
                    name: 'John Doe',
                    phone: '+1234567890',
                },
            });

            expect(result.walkInId).toBeDefined();

            // Verify participant was added via setupParticipants
            const participants = await asUser.query(api.queries.widgets.getSetupParticipants, {
                widgetId,
            });

            expect(participants.length).toBe(1);
            expect(participants[0].displayName).toBe('John Doe');
            expect(participants[0].isWalkIn).toBe(true);
            expect(participants[0].walkInPhone).toBe('+1234567890');
        });

        it('should not allow duplicate walk-in names', async () => {
            await asUser.mutation(api.mutations.widgets.addWalkIn, {
                widgetId,
                walkIn: { name: 'John Doe' },
            });

            await expect(
                asUser.mutation(api.mutations.widgets.addWalkIn, {
                    widgetId,
                    walkIn: { name: 'John Doe' },
                })
            ).rejects.toThrow();
        });

        it('should remove walk-in participants', async () => {
            const { walkInId } = await asUser.mutation(api.mutations.widgets.addWalkIn, {
                widgetId,
                walkIn: { name: 'To Remove' },
            });

            await asUser.mutation(api.mutations.widgets.removeWalkIn, {
                widgetId,
                walkInId,
            });

            const participants = await asUser.query(api.queries.widgets.getSetupParticipants, {
                widgetId,
            });

            expect(participants.length).toBe(0);
        });
    });

    describe('Tournament Lifecycle', () => {
        let widgetId: Id<"classInstanceWidgets">;

        beforeEach(async () => {
            const result = await asUser.mutation(api.mutations.widgets.attachWidget, {
                classInstanceId: instanceId,
                widgetConfig,
            });
            widgetId = result.widgetId;
        });

        it('should not start tournament without enough participants', async () => {
            // Add only 4 participants (need 8)
            for (let i = 0; i < 4; i++) {
                await asUser.mutation(api.mutations.widgets.addWalkIn, {
                    widgetId,
                    walkIn: { name: `Player ${i + 1}` },
                });
            }

            await expect(
                asUser.mutation(api.mutations.widgets.startAmericanoTournament, {
                    widgetId,
                })
            ).rejects.toThrow();
        });

        it('should start tournament with correct number of participants', async () => {
            // Add all 8 participants
            for (let i = 0; i < 8; i++) {
                await asUser.mutation(api.mutations.widgets.addWalkIn, {
                    widgetId,
                    walkIn: { name: `Player ${i + 1}` },
                });
            }

            const result = await asUser.mutation(api.mutations.widgets.startAmericanoTournament, {
                widgetId,
            });

            expect(result.success).toBe(true);

            // Verify tournament state
            const state = await asUser.query(api.queries.widgets.getAmericanoTournamentState, {
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
                await asUser.mutation(api.mutations.widgets.addWalkIn, {
                    widgetId,
                    walkIn: { name: `Player ${i + 1}` },
                });
            }

            await asUser.mutation(api.mutations.widgets.startAmericanoTournament, {
                widgetId,
            });

            // Get first match
            const state = await asUser.query(api.queries.widgets.getAmericanoTournamentState, {
                widgetId,
            });

            const firstMatch = state?.state?.matches[0];
            expect(firstMatch).toBeDefined();

            // Record result
            const result = await asUser.mutation(api.mutations.widgets.recordAmericanoMatchResult, {
                widgetId,
                matchId: firstMatch!.id,
                team1Score: 21,
                team2Score: 15,
            });

            expect(result.success).toBe(true);

            // Verify match was updated
            const updatedState = await asUser.query(api.queries.widgets.getAmericanoTournamentState, {
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
                await asUser.mutation(api.mutations.widgets.addWalkIn, {
                    widgetId,
                    walkIn: { name: `Player ${i + 1}` },
                });
            }

            await asUser.mutation(api.mutations.widgets.startAmericanoTournament, {
                widgetId,
            });

            const state = await asUser.query(api.queries.widgets.getAmericanoTournamentState, {
                widgetId,
            });

            const firstMatch = state?.state?.matches[0];

            // Ties should be allowed now
            await asUser.mutation(api.mutations.widgets.recordAmericanoMatchResult, {
                widgetId,
                matchId: firstMatch!.id,
                team1Score: 18,
                team2Score: 18, // Tied score is allowed
            });

            // Verify the tied score was saved
            const updatedState = await asUser.query(api.queries.widgets.getAmericanoTournamentState, {
                widgetId,
            });
            const updatedMatch = updatedState?.state?.matches.find(m => m.id === firstMatch!.id);
            expect(updatedMatch?.team1Score).toBe(18);
            expect(updatedMatch?.team2Score).toBe(18);
        });

        it('should complete tournament', async () => {
            // Setup and start tournament
            for (let i = 0; i < 8; i++) {
                await asUser.mutation(api.mutations.widgets.addWalkIn, {
                    widgetId,
                    walkIn: { name: `Player ${i + 1}` },
                });
            }

            await asUser.mutation(api.mutations.widgets.startAmericanoTournament, {
                widgetId,
            });

            // Complete tournament
            const result = await asUser.mutation(api.mutations.widgets.completeAmericanoTournament, {
                widgetId,
            });

            expect(result.success).toBe(true);

            // Verify status
            const widget = await asUser.query(api.queries.widgets.getById, {
                widgetId,
            });

            expect(widget?.status).toBe('completed');
        });

        it('should cancel tournament', async () => {
            const result = await asUser.mutation(api.mutations.widgets.cancelAmericanoTournament, {
                widgetId,
            });

            expect(result.success).toBe(true);

            const widget = await asUser.query(api.queries.widgets.getById, {
                widgetId,
            });

            expect(widget?.status).toBe('cancelled');
        });
    });

    describe('Query Operations', () => {
        let widgetId: Id<"classInstanceWidgets">;

        beforeEach(async () => {
            const result = await asUser.mutation(api.mutations.widgets.attachWidget, {
                classInstanceId: instanceId,
                widgetConfig,
            });
            widgetId = result.widgetId;
        });

        it('should get widget by instance', async () => {
            const widget = await asUser.query(api.queries.widgets.getByInstance, {
                classInstanceId: instanceId,
            });

            expect(widget).not.toBeNull();
            expect(widget?._id).toBe(widgetId);
        });

        it('should get widget by ID with setup participants', async () => {
            // Add a walk-in participant
            await asUser.mutation(api.mutations.widgets.addWalkIn, {
                widgetId,
                walkIn: { name: 'Test Player' },
            });

            const widget = await asUser.query(api.queries.widgets.getById, {
                widgetId,
            });

            expect(widget).not.toBeNull();
            expect(widget?.setupParticipants.length).toBe(1);
        });

        it('should get leaderboard', async () => {
            // Setup and start tournament
            for (let i = 0; i < 8; i++) {
                await asUser.mutation(api.mutations.widgets.addWalkIn, {
                    widgetId,
                    walkIn: { name: `Player ${i + 1}` },
                });
            }

            await asUser.mutation(api.mutations.widgets.startAmericanoTournament, {
                widgetId,
            });

            const leaderboard = await asUser.query(api.queries.widgets.getAmericanoLeaderboard, {
                widgetId,
            });

            expect(leaderboard.length).toBe(8);
            // All should start with 0 points
            expect(leaderboard.every(s => s.pointsScored === 0)).toBe(true);
        });
    });
});
