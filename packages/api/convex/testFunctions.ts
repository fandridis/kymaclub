import { v } from "convex/values"
import { internalMutation, internalQuery, internalAction } from "./_generated/server";
import { creditService } from "../services/creditService";
import { CREDIT_LEDGER_TYPES, CreditLedgerType } from "../utils/creditMappings";
import { getAuthenticatedUserAndBusinessOrThrow } from "./utils";
import { reconciliationService } from "../services/reconciliationService";

export const createTestUser = internalMutation({
    args: {
        user: v.object({
            name: v.optional(v.string()),
            email: v.optional(v.string()),
            hasBusinessOnboarded: v.optional(v.boolean()),
            role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
            businessRole: v.optional(v.union(v.literal("owner"), v.literal("admin"), v.literal("user"))),
        })
    },
    returns: v.id("users"),
    handler: async (ctx, args) => {
        const user = await ctx.db.insert("users", {
            name: args.user.name || "Test User",
            email: args.user.email || "test@example.com",
            hasBusinessOnboarded: args.user.hasBusinessOnboarded ?? true,
            role: args.user.role || "admin",
            businessRole: args.user.businessRole || "admin",
        });

        return user;
    }
});

export const createTestBusiness = internalMutation({
    args: {
        userId: v.id("users"),
        business: v.object({
            name: v.optional(v.string()),
            email: v.optional(v.string()),
            phone: v.optional(v.string()),
            website: v.optional(v.string()),
            logo: v.optional(v.string()),
            images: v.optional(v.array(v.string())),
            timezone: v.optional(v.string()),
            currency: v.optional(v.string()),
            isActive: v.optional(v.boolean()),
            createdAt: v.optional(v.number()),
            createdBy: v.optional(v.id("users")),
            onboardingCompleted: v.optional(v.boolean()),
            feeStructure: v.optional(v.object({
                payoutFrequency: v.optional(v.union(v.literal("weekly"), v.literal("monthly"), v.literal("bi_monthly"))),
                minimumPayout: v.optional(v.number()),
            })),
            address: v.optional(v.object({
                street: v.string(),
                city: v.string(),
                state: v.string(),
                zipCode: v.string(),
                country: v.string(),
            })),
        })
    },
    returns: v.id("businesses"),
    handler: async (ctx, args) => {
        const business = await ctx.db.insert("businesses", {
            name: args.business.name || "Test Business",
            email: args.business.email || "test@example.com",
            phone: args.business.phone || "+1234567890",
            website: args.business.website || "https://test.com",
            logo: args.business.logo || "",
            images: args.business.images || [],
            timezone: args.business.timezone || "UTC",
            currency: args.business.currency || "USD",
            isActive: args.business.isActive ?? true,
            createdAt: args.business.createdAt || Date.now(),
            onboardingCompleted: args.business.onboardingCompleted ?? false,
            feeStructure: {
                payoutFrequency: args.business.feeStructure?.payoutFrequency || "monthly",
                minimumPayout: args.business.feeStructure?.minimumPayout || 50,
            },
            address: args.business.address || {
                street: "123 Test Street",
                city: "Test City",
                state: "TS",
                zipCode: "12345",
                country: "USA",
            },
            createdBy: args.userId,
        });

        return business;
    }
});

export const attachUserToBusiness = internalMutation({
    args: {
        userId: v.id("users"),
        businessId: v.id("businesses"),
        role: v.union(v.literal("owner"), v.literal("admin"), v.literal("user")),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            businessId: args.businessId,
            businessRole: args.role,
        });
        return null;
    },
});


export const createTestVenue = internalMutation({
    args: {
        venue: v.object({
            name: v.optional(v.string()),
            description: v.optional(v.string()),
            email: v.optional(v.string()),
            address: v.optional(v.object({
                street: v.optional(v.string()),
                city: v.optional(v.string()),
                state: v.optional(v.string()),
                zipCode: v.optional(v.string()),
                country: v.optional(v.string()),
            })),
            capacity: v.optional(v.number()),
            isActive: v.optional(v.boolean()),
            primaryCategory: v.optional(v.union(v.literal("yoga_studio"), v.literal("fitness_center"), v.literal("dance_studio"), v.literal("pilates_studio"), v.literal("swimming_facility"), v.literal("martial_arts_studio"), v.literal("climbing_gym"), v.literal("crossfit_box"), v.literal("wellness_center"), v.literal("outdoor_fitness"), v.literal("personal_training"), v.literal("rehabilitation_center"))),
        }),
    },
    returns: v.id("venues"),
    handler: async (ctx, args) => {
        const { user, business } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        const venue = await ctx.db.insert("venues", {
            name: args.venue.name || "Test Venue",
            description: args.venue.description || "A test venue for classes",
            email: args.venue.email || "venue@example.com",
            businessId: business._id,
            address: {
                street: args.venue.address?.street || "123 Test Street",
                city: args.venue.address?.city || "Test City",
                state: args.venue.address?.state || "TS",
                zipCode: args.venue.address?.zipCode || "12345",
                country: args.venue.address?.country || "USA",
            },
            capacity: args.venue.capacity || 30,
            isActive: args.venue.isActive ?? true,
            createdAt: Date.now(),
            createdBy: user._id,
            primaryCategory: args.venue.primaryCategory || 'wellness_center',
        });
        return venue;
    }
});

export const createTestClassTemplate = internalMutation({
    args: {
        userId: v.id("users"),
        businessId: v.id("businesses"),
        template: v.object({
            name: v.string(),
            description: v.string(),
            businessId: v.id("businesses"),
            venueId: v.id("venues"),
            instructor: v.id("users"),
            duration: v.number(),
            capacity: v.number(),
            baseCredits: v.number(),
            tags: v.array(v.string()),
            color: v.string(),
        })
    },
    returns: v.id("classTemplates"),
    handler: async (ctx, args) => {
        const classTemplate = await ctx.db.insert("classTemplates", {
            name: args.template.name,
            description: args.template.description,
            businessId: args.template.businessId,
            venueId: args.template.venueId,
            instructor: args.template.instructor,
            duration: args.template.duration,
            capacity: args.template.capacity,
            baseCredits: args.template.baseCredits,
            tags: args.template.tags,
            color: args.template.color,
            allowWaitlist: true,
            isActive: true,
            bookingWindow: {
                minHours: 2,
                maxHours: 168
            },
            cancellationWindowHours: 24,
            deleted: false,
            createdAt: Date.now(),
            createdBy: args.userId,
        });
        return classTemplate;
    }
});

export const createTestStorageFile = internalAction({
    args: {
        content: v.string(),
        contentType: v.optional(v.string()),
    },
    returns: v.id("_storage"),
    handler: async (ctx, args) => {
        const blob = new Blob([args.content], { type: args.contentType ?? "text/plain" });
        const storageId = await ctx.storage.store(blob);
        return storageId;
    },
});

// Credit system test helpers
export const recordCreditPurchase = internalMutation({
    args: {
        idempotencyKey: v.string(),
        userId: v.id("users"),
        amount: v.number(),
        description: v.optional(v.string()),
        externalReference: v.optional(v.string()),
        creditValue: v.optional(v.number()),
        expiresAt: v.optional(v.number()),
    },
    returns: v.object({ transactionId: v.string() }),
    handler: async (ctx, args) => {
        return await creditService.createTransaction(ctx, {
            idempotencyKey: args.idempotencyKey,
            description: args.description || "Credit purchase",
            entries: [
                {
                    userId: args.userId,
                    amount: args.amount,
                    type: 'credit_purchase',
                    creditValue: args.creditValue,
                    expiresAt: args.expiresAt,
                },
                {
                    systemEntity: "system",
                    amount: -args.amount,
                    type: CREDIT_LEDGER_TYPES.SYSTEM_CREDIT_COST,
                }
            ]
        });
    },
});

export const recordBookingLedgerEntries = internalMutation({
    args: {
        fromUserId: v.id("users"),
        toBusinessId: v.id("businesses"),
        amount: v.number(),
        description: v.string(),
        relatedBookingId: v.optional(v.id("bookings")),
        relatedClassInstanceId: v.optional(v.id("classInstances")),
    },
    returns: v.object({ transactionId: v.string() }),
    handler: async (ctx, args) => {
        return await creditService.createTransaction(ctx, {
            idempotencyKey: `booking_${args.fromUserId}_${args.toBusinessId}_${Date.now()}`,
            description: args.description,
            entries: [
                {
                    userId: args.fromUserId,
                    amount: -args.amount,
                    type: CREDIT_LEDGER_TYPES.CREDIT_SPEND,
                    relatedBookingId: args.relatedBookingId,
                    relatedClassInstanceId: args.relatedClassInstanceId,
                },
                {
                    businessId: args.toBusinessId,
                    amount: args.amount,
                    type: CREDIT_LEDGER_TYPES.REVENUE_EARN,
                    relatedBookingId: args.relatedBookingId,
                    relatedClassInstanceId: args.relatedClassInstanceId,
                }
            ]
        });
    },
});

export const getCreditLedgerByTransaction = internalQuery({
    args: {
        transactionId: v.string(),
    },
    returns: v.array(v.any()),
    handler: async (ctx, args) => {
        const entries = await ctx.db
            .query("creditLedger")
            .withIndex("by_transactionId", q => q.eq("transactionId", args.transactionId))
            .collect();
        return entries;
    },
});

export const getCreditLedgerByUser = internalQuery({
    args: {
        userId: v.id("users"),
    },
    returns: v.array(v.any()),
    handler: async (ctx, args) => {
        const entries = await ctx.db
            .query("creditLedger")
            .withIndex("by_user", q => q.eq("userId", args.userId))
            .collect();
        return entries;
    },
});

export const getUserById = internalQuery({
    args: {
        userId: v.id("users"),
    },
    returns: v.union(v.any(), v.null()),
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        return user;
    },
});

export const getBusinessById = internalQuery({
    args: {
        businessId: v.id("businesses"),
    },
    returns: v.union(v.any(), v.null()),
    handler: async (ctx, args) => {
        const business = await ctx.db.get(args.businessId);
        return business;
    },
});

export const deleteUser = internalMutation({
    args: {
        userId: v.id("users"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.delete(args.userId);
        return null;
    },
});

export const createTestBooking = internalMutation({
    args: {
        userId: v.id("users"),
        businessId: v.id("businesses"),
        classInstanceId: v.id("classInstances"),
        creditsUsed: v.number(),
    },
    returns: v.id("bookings"),
    handler: async (ctx, args) => {
        const now = Date.now();
        const bookingId = await ctx.db.insert("bookings", {
            businessId: args.businessId,
            userId: args.userId,
            classInstanceId: args.classInstanceId,
            status: "pending",
            originalPrice: args.creditsUsed,
            finalPrice: args.creditsUsed,
            creditsUsed: args.creditsUsed,
            creditTransactionId: "test_transaction_id",
            bookedAt: now,
            createdAt: now,
            createdBy: args.userId,
        });
        return bookingId;
    },
});

/**
 * Test credit system end-to-end with reconciliation
 */
export const testCreditSystem = internalMutation({
    args: v.object({}),
    returns: v.object({
        success: v.boolean(),
        userId: v.id("users"),
        balanceAfterGift: v.number(),
        balanceAfterSpend: v.number(),
        cachedBalance: v.number(),
        ledgerBalance: v.number(),
        reconciliationDelta: v.number(),
        message: v.string(),
    }),
    handler: async (ctx) => {
        // Create test user
        const userId = await ctx.db.insert("users", {
            name: "Credit Test User",
            email: "credittest@example.com",
            hasBusinessOnboarded: false,
            role: "user",
        });

        // Gift 10 credits from system
        await creditService.createTransaction(ctx, {
            idempotencyKey: `test_gift_${userId}_${Date.now()}`,
            description: "Test credit gift",
            entries: [
                {
                    systemEntity: "system",
                    amount: -10,
                    type: CREDIT_LEDGER_TYPES.SYSTEM_CREDIT_COST,
                },
                {
                    userId,
                    amount: 10,
                    type: CREDIT_LEDGER_TYPES.CREDIT_BONUS,
                    creditValue: 2.0,
                }
            ]
        });

        // Reconcile after gift
        const reconcileAfterGift = await reconciliationService.reconcileUser({
            ctx,
            userId,
            updateCache: true,
        });

        // Spend 3 credits (simulate booking)
        await creditService.createTransaction(ctx, {
            idempotencyKey: `test_spend_${userId}_${Date.now()}`,
            description: "Test credit spend",
            entries: [
                {
                    userId,
                    amount: -3,
                    type: CREDIT_LEDGER_TYPES.CREDIT_SPEND,
                },
                {
                    systemEntity: "system",
                    amount: 3,
                    type: CREDIT_LEDGER_TYPES.SYSTEM_REFUND_COST,
                }
            ]
        });

        // Final reconciliation
        const finalReconcile = await reconciliationService.reconcileUser({
            ctx,
            userId,
            updateCache: true,
        });

        // Get final balances
        const ledgerBalance = await creditService.getBalance(ctx, { userId });
        const user = await ctx.db.get(userId);
        const cachedBalance = (user as any).credits ?? 0;

        return {
            success: true,
            userId,
            balanceAfterGift: reconcileAfterGift.actualCredits,
            balanceAfterSpend: finalReconcile.actualCredits,
            cachedBalance,
            ledgerBalance,
            reconciliationDelta: finalReconcile.actualCredits - cachedBalance,
            message: `Test completed: Gift 10 credits, spent 3, final balance ${finalReconcile.actualCredits}. Cache and ledger ${cachedBalance === ledgerBalance ? 'match' : 'differ'}`,
        };
    },
});

// Additional test helpers for reconciliation testing
export const createCreditLedgerEntry = internalMutation({
    args: {
        userId: v.id("users"),
        amount: v.number(),
        type: v.string(),
        effectiveAt: v.number(),
        creditValue: v.optional(v.number()),
        expiresAt: v.optional(v.number()),
        description: v.string(),
        deleted: v.optional(v.boolean()),
        relatedBookingId: v.optional(v.id("bookings")),
        relatedClassInstanceId: v.optional(v.id("classInstances")),
    },
    returns: v.id("creditLedger"),
    handler: async (ctx, args) => {
        const entryId = await ctx.db.insert("creditLedger", {
            transactionId: `test_${args.userId}_${Date.now()}`,
            account: "customer",
            userId: args.userId,
            amount: args.amount,
            type: args.type as CreditLedgerType,
            effectiveAt: args.effectiveAt,
            creditValue: args.creditValue,
            expiresAt: args.expiresAt,
            description: args.description,
            idempotencyKey: `test_${args.userId}_${Date.now()}_${Math.random()}`,
            deleted: args.deleted ?? false,
            relatedBookingId: args.relatedBookingId,
            relatedClassInstanceId: args.relatedClassInstanceId,
            createdAt: Date.now(),
        });
        return entryId;
    },
});

export const updateUserCredits = internalMutation({
    args: {
        userId: v.id("users"),
        credits: v.optional(v.number()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const updates: any = {};

        if (args.credits !== undefined) {
            updates.credits = args.credits;
        }

        await ctx.db.patch(args.userId, updates);
        return null;
    },
});

// Test functions for reconciliation service
export const testReconcileUser = internalMutation({
    args: {
        userId: v.id("users"),
        options: v.optional(v.object({
            forceUpdate: v.optional(v.boolean()),
            includeAnalysis: v.optional(v.boolean()),
            dryRun: v.optional(v.boolean()),
        })),
    },
    returns: v.object({
        userId: v.id("users"),
        availableCredits: v.number(),
        wasUpdated: v.boolean(),
        deltaAvailableCredits: v.number(),
        inconsistencyCount: v.number(),
    }),
    handler: async (ctx, args) => {
        const { reconciliationService } = await import("../services/reconciliationService");

        const result = await reconciliationService.reconcileUser({
            ctx,
            userId: args.userId,
            updateCache: true
        });

        return {
            userId: result.userId,
            availableCredits: result.actualCredits,
            wasUpdated: result.wasUpdated,
            deltaAvailableCredits: result.actualCredits - result.cachedCredits,
            inconsistencyCount: 0,
        };
    },
});

export const testReconcileCreditScenario = internalMutation({
    args: {
        userId: v.id("users"),
    },
    returns: v.object({
        success: v.boolean(),
        initialBalance: v.number(),
        finalBalance: v.number(),
        wasReconciled: v.boolean(),
        message: v.string(),
    }),
    handler: async (ctx, args) => {
        const { reconciliationService } = await import("../services/reconciliationService");

        try {
            // Step 1: Create ledger entry (100 credits)
            await ctx.db.insert("creditLedger", {
                transactionId: `test_${args.userId}_${Date.now()}`,
                account: "customer",
                userId: args.userId,
                amount: 100,
                type: CREDIT_LEDGER_TYPES.CREDIT_PURCHASE,
                effectiveAt: Date.now() - 1000,
                creditValue: 2.0,
                description: "Test credit purchase",
                idempotencyKey: `test_${Date.now()}`,
                deleted: false,
                createdAt: Date.now(),
            });

            // Step 2: Set incorrect cached balance (50 credits)
            await ctx.db.patch(args.userId, {
                credits: 50,
            });

            // Step 3: Get initial cached balance
            const userBefore = await ctx.db.get(args.userId);
            const initialBalance = userBefore?.credits ?? 0;

            // Step 4: Reconcile
            const reconcileResult = await reconciliationService.reconcileUser({
                ctx,
                userId: args.userId,
                updateCache: true
            });

            // Step 5: Get final balance
            const userAfter = await ctx.db.get(args.userId);
            const finalBalance = userAfter?.credits ?? 0;

            return {
                success: true,
                initialBalance,
                finalBalance,
                wasReconciled: reconcileResult.wasUpdated,
                message: `Reconciled ${initialBalance} -> ${finalBalance} credits`
            };

        } catch (error) {
            return {
                success: false,
                initialBalance: 0,
                finalBalance: 0,
                wasReconciled: false,
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    },
});
