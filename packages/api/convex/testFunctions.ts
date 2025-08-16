import { v } from "convex/values"
import { internalMutation, internalQuery, internalAction } from "./_generated/server";
import { getAuthenticatedUserAndBusinessOrThrow } from "./utils";
import { creditService } from "../services/creditService";

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
            cancellationWindowHours: 10,
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
        userId: v.id("users"),
        amount: v.number(),
        description: v.optional(v.string()),
        externalReference: v.optional(v.string()),
    },
    returns: v.object({ transactionId: v.id("creditTransactions") }),
    handler: async (ctx, args) => {
        const result = await creditService.addCredits(ctx, {
            userId: args.userId,
            amount: args.amount,
            type: "purchase",
            reason: "user_buy",
            description: args.description || "Credit purchase",
            externalRef: args.externalReference,
        });
        return { transactionId: result.transactionId };
    },
});

export const getCreditTransactionsByUser = internalQuery({
    args: {
        userId: v.id("users"),
    },
    returns: v.array(v.any()),
    handler: async (ctx, args) => {
        const transactions = await ctx.db
            .query("creditTransactions")
            .withIndex("by_user", q => q.eq("userId", args.userId))
            .collect();
        return transactions;
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

export const createTestClassInstance = internalMutation({
    args: {
        templateId: v.id("classTemplates"),
        startTime: v.number(),
        endTime: v.number(),
        timezone: v.optional(v.string()),
    },
    returns: v.id("classInstances"),
    handler: async (ctx, args) => {
        const { user, business } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        const template = await ctx.db.get(args.templateId);
        if (!template) {
            throw new Error("Template not found");
        }

        const instanceId = await ctx.db.insert("classInstances", {
            businessId: business._id,
            templateId: args.templateId,
            venueId: template.venueId,
            startTime: args.startTime,
            endTime: args.endTime,
            timezone: args.timezone || "UTC",
            timePattern: new Date(args.startTime).toTimeString().slice(0, 5) + "-" + new Date(args.endTime).toTimeString().slice(0, 5),
            dayOfWeek: new Date(args.startTime).getDay(),
            status: "scheduled",
            bookedCount: 0,
            templateSnapshot: {
                name: template.name,
                description: template.description,
                instructor: template.instructor,
                imageStorageIds: template.imageStorageIds,
                deleted: template.deleted,
            },
            venueSnapshot: {
                name: "Test Venue", // This would normally come from the venue
                address: {
                    street: "123 Test St",
                    city: "Test City",
                    zipCode: "12345",
                    country: "USA"
                },
                imageStorageIds: [],
                deleted: false,
            },
            createdAt: Date.now(),
            createdBy: user._id,
        });
        return instanceId;
    },
});

export const giftCreditsToUser = internalMutation({
    args: {
        userId: v.id("users"),
        amount: v.number(),
        description: v.optional(v.string()),
    },
    returns: v.object({
        transactionId: v.id("creditTransactions"),
        newBalance: v.number()
    }),
    handler: async (ctx, args) => {
        const result = await creditService.addCredits(ctx, {
            userId: args.userId,
            amount: args.amount,
            type: "gift",
            reason: "admin_gift",
            description: args.description || `Gift of ${args.amount} credits`,
        });
        return result;
    },
});

export const getBookingById = internalQuery({
    args: {
        bookingId: v.id("bookings"),
    },
    returns: v.union(v.any(), v.null()),
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);
        return booking;
    },
});

export const getCreditTransactionsByBooking = internalQuery({
    args: {
        bookingId: v.id("bookings"),
    },
    returns: v.array(v.any()),
    handler: async (ctx, args) => {
        const transactions = await ctx.db
            .query("creditTransactions")
            .withIndex("by_booking", q => q.eq("bookingId", args.bookingId))
            .collect();
        return transactions;
    },
});

/**
 * Test simplified credit system end-to-end
 */
export const testCreditSystem = internalMutation({
    args: v.object({}),
    returns: v.object({
        success: v.boolean(),
        userId: v.id("users"),
        balanceAfterGift: v.number(),
        balanceAfterSpend: v.number(),
        finalBalance: v.number(),
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

        // Gift 10 credits
        const giftResult = await creditService.addCredits(ctx, {
            userId,
            amount: 10,
            type: "gift",
            reason: "admin_gift",
            description: "Test credit gift",
        });

        // Create a test business
        const businessId = await ctx.db.insert("businesses", {
            name: "Test Business",
            email: "test@business.com",
            isActive: true,
            address: {
                street: "123 Test St",
                city: "Test City",
                zipCode: "12345",
                country: "US"
            },
            timezone: "UTC",
            currency: "USD",
            onboardingCompleted: true,
            feeStructure: {
                payoutFrequency: "monthly",
                minimumPayout: 50
            },
            createdAt: Date.now(),
            createdBy: userId,
        });

        // Spend 3 credits (simulate booking)
        const spendResult = await creditService.spendCredits(ctx, {
            userId,
            amount: 3,
            description: "Test credit spend",
            businessId,
        });

        // Get final balance
        const finalBalance = await creditService.getBalance(ctx, userId);

        return {
            success: true,
            userId,
            balanceAfterGift: giftResult.newBalance,
            balanceAfterSpend: spendResult.newBalance,
            finalBalance,
            message: `Test completed: Gift 10 credits, spent 3, final balance ${finalBalance}. Expected: 7`,
        };
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
