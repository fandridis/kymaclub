import { v } from "convex/values"
import { internalMutation, internalQuery, internalAction, mutation } from "./_generated/server";
import { getAuthenticatedUserAndBusinessOrThrow } from "./utils";
import { creditService } from "../services/creditService";
import { internalMutationWithTriggers } from "./triggers";

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
        const businessId = await ctx.db.insert("businesses", {
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

        // Create business settings with all notifications enabled
        await ctx.db.insert("businessSettings", {
            businessId: businessId,
            notifications: {
                preferences: {
                    booking_created: { email: true, web: true },
                    booking_cancelled_by_consumer: { email: true, web: true },
                    booking_cancelled_by_business: { email: true, web: true },
                    payment_received: { email: true, web: true },
                    review_received: { email: true, web: true },
                },
            },
            createdAt: Date.now(),
            createdBy: args.userId,
        });

        return businessId;
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
            primaryCategory: v.optional(v.union(
                v.literal("yoga_studio"),
                v.literal("fitness_center"),
                v.literal("dance_studio"),
                v.literal("pilates_studio"),
                v.literal("swimming_facility"),
                v.literal("martial_arts_studio"),
                v.literal("climbing_gym"),
                v.literal("crossfit_box"),
                v.literal("wellness_center"),
                v.literal("outdoor_fitness"),
                v.literal("personal_training"),
                v.literal("rehabilitation_center"),
                v.literal("creative_studio"),
                v.literal("sport_facility")
            )),
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
            price: v.number(),
            tags: v.array(v.string()),
            color: v.string(),
            primaryCategory: v.optional(v.string()),
            requiresConfirmation: v.optional(v.boolean()),
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
            price: args.template.price,
            tags: args.template.tags,
            color: args.template.color,
            primaryCategory: (args.template.primaryCategory as any) || 'yoga',
            requiresConfirmation: args.template.requiresConfirmation,
            allowWaitlist: true,
            isActive: true,
            bookingWindow: {
                minHours: 2,
                maxHours: 168
            },
            cancellationWindowHours: 12,
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
        booking: v.object({
            businessId: v.id("businesses"),
            userId: v.id("users"),
            classInstanceId: v.id("classInstances"),
            status: v.optional(v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled_by_consumer"), v.literal("cancelled_by_business"), v.literal("no_show"))),
            originalPrice: v.optional(v.number()),
            finalPrice: v.optional(v.number()),
            creditTransactionId: v.optional(v.string()),
            bookedAt: v.optional(v.number()),
            createdAt: v.optional(v.number()),
            createdBy: v.optional(v.id("users")),
        })
    },
    returns: v.id("bookings"),
    handler: async (ctx, args) => {
        const now = Date.now();
        // Get user info for metadata if possible
        const user = await ctx.db.get(args.booking.userId);

        const bookingId = await ctx.db.insert("bookings", {
            businessId: args.booking.businessId,
            userId: args.booking.userId,
            classInstanceId: args.booking.classInstanceId,
            status: args.booking.status || "pending",
            originalPrice: args.booking.originalPrice || 10,
            finalPrice: args.booking.finalPrice || 10,
            creditTransactionId: args.booking.creditTransactionId || "test_transaction_id",
            platformFeeRate: 0.20, // Default platform fee rate for test bookings
            refundAmount: undefined, // Will be set on cancellation if applicable
            // Include user metadata for test bookings if user exists
            userSnapshot: user ? {
                name: user.name || undefined,
                email: user.email || undefined,
                phone: user.phone || undefined,
            } : {
                name: "Test User",
                email: "test@example.com",
                phone: "+1234567890",
            },
            bookedAt: args.booking.bookedAt || now,
            createdAt: args.booking.createdAt || now,
            createdBy: args.booking.createdBy || args.booking.userId,
        });
        return bookingId;
    },
});

export const patchTestBooking = internalMutation({
    args: {
        bookingId: v.id("bookings"),
        status: v.optional(v.union(
            v.literal("pending"),
            v.literal("completed"),
            v.literal("cancelled_by_consumer"),
            v.literal("cancelled_by_business"),
            v.literal("cancelled_by_business_rebookable"),
            v.literal("no_show")
        )),
        refundAmount: v.optional(v.number()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const now = Date.now();
        const updates: any = {
            updatedAt: now,
        };
        if (args.status !== undefined) {
            updates.status = args.status;
            // Set completedAt when marking as completed
            if (args.status === "completed") {
                updates.completedAt = now;
            }
        }
        if (args.refundAmount !== undefined) {
            updates.refundAmount = args.refundAmount;
        }
        await ctx.db.patch(args.bookingId, updates);
        return null;
    },
});

export const updateTestBusiness = internalMutation({
    args: {
        businessId: v.id("businesses"),
        feeStructure: v.optional(v.object({
            baseFeeRate: v.optional(v.number()),
            payoutFrequency: v.optional(v.union(v.literal("weekly"), v.literal("monthly"), v.literal("bi_monthly"))),
            minimumPayout: v.optional(v.number()),
        })),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const updates: any = {
            updatedAt: Date.now(),
        };
        if (args.feeStructure !== undefined) {
            const business = await ctx.db.get(args.businessId);
            if (!business) {
                throw new Error("Business not found");
            }
            updates.feeStructure = {
                ...business.feeStructure,
                ...args.feeStructure,
            };
        }
        await ctx.db.patch(args.businessId, updates);
        return null;
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

        const venue = await ctx.db.get(template.venueId);
        if (!venue) {
            throw new Error("Venue not found");
        }

        const primaryCategory = template.primaryCategory ?? 'yoga';

        const instanceId = await ctx.db.insert("classInstances", {
            businessId: business._id,
            templateId: args.templateId,
            venueId: template.venueId,
            primaryCategory,
            startTime: args.startTime,
            endTime: args.endTime,
            timezone: args.timezone || "UTC",
            timePattern: new Date(args.startTime).toTimeString().slice(0, 5) + "-" + new Date(args.endTime).toTimeString().slice(0, 5),
            dayOfWeek: new Date(args.startTime).getDay(),
            status: "scheduled",
            bookedCount: 0,
            templateSnapshot: {
                name: template.name,
                shortDescription: template.shortDescription,
                instructor: template.instructor,
                duration: template.duration,
                imageStorageIds: template.imageStorageIds,
                deleted: template.deleted,
                primaryCategory,
            },
            venueSnapshot: {
                name: venue.name, // Use the actual venue name
                address: {
                    street: venue.address.street,
                    city: venue.address.city,
                    zipCode: venue.address.zipCode,
                    country: venue.address.country,
                    state: venue.address.state,
                },
                imageStorageIds: venue.imageStorageIds || [],
                deleted: venue.deleted || false,
            },
            // Copy requiresConfirmation from template
            requiresConfirmation: template.requiresConfirmation,
            createdAt: Date.now(),
            createdBy: user._id,
        });
        return instanceId;
    },
});

/**
 * Cancel a class instance for testing purposes.
 * Uses internalMutationWithTriggers to ensure triggers fire when status changes.
 */
export const cancelTestClassInstance = internalMutationWithTriggers({
    args: {
        instanceId: v.id("classInstances"),
    },
    returns: v.id("classInstances"),
    handler: async (ctx, args) => {
        const instance = await ctx.db.get(args.instanceId);
        if (!instance) {
            throw new Error("Class instance not found");
        }

        await ctx.db.patch(args.instanceId, {
            status: "cancelled",
            updatedAt: Date.now(),
        });

        return args.instanceId;
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

// Notification system test helpers
export const createTestNotification = internalMutation({
    args: {
        notification: v.object({
            businessId: v.id("businesses"),
            recipientType: v.union(v.literal("business"), v.literal("consumer")),
            recipientUserId: v.optional(v.id("users")),
            type: v.union(
                // Business notifications
                v.literal("booking_created"),
                v.literal("booking_cancelled_by_consumer"),
                v.literal("booking_awaiting_approval"),
                v.literal("review_received"),
                v.literal("payment_received"),
                // Consumer notifications
                v.literal("booking_confirmation"),
                v.literal("booking_reminder"),
                v.literal("booking_approved"),
                v.literal("booking_rejected"),
                v.literal("class_cancelled"),
                v.literal("class_rebookable"),
                v.literal("booking_cancelled_by_business"),
                v.literal("payment_receipt"),
                v.literal("credits_received_subscription"),
                v.literal("credits_received_admin_gift"),
                v.literal("welcome_bonus")
            ),
            title: v.string(),
            message: v.string(),
            metadata: v.optional(v.object({
                className: v.optional(v.string()),
                userEmail: v.optional(v.string()),
                userName: v.optional(v.string()),
                amount: v.optional(v.number()),
            })),
            relatedBookingId: v.optional(v.id("bookings")),
            relatedClassInstanceId: v.optional(v.id("classInstances")),
            deliveryStatus: v.optional(v.union(
                v.literal("pending"),
                v.literal("sent"),
                v.literal("failed")
            )),
            seen: v.optional(v.boolean()),
            createdAt: v.optional(v.number()),
        })
    },
    returns: v.id("notifications"),
    handler: async (ctx, args) => {
        const { user } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        const notificationId = await ctx.db.insert("notifications", {
            businessId: args.notification.businessId,
            recipientType: args.notification.recipientType,
            recipientUserId: args.notification.recipientUserId,
            type: args.notification.type,
            title: args.notification.title,
            message: args.notification.message,
            metadata: args.notification.metadata,
            relatedBookingId: args.notification.relatedBookingId,
            relatedClassInstanceId: args.notification.relatedClassInstanceId,
            deliveryStatus: args.notification.deliveryStatus || "sent",
            seen: args.notification.seen || false,
            seenAt: undefined,
            failureReason: undefined,
            retryCount: undefined,
            sentToEmail: false,
            sentToWeb: true,
            sentToPush: false,
            createdAt: args.notification.createdAt || Date.now(),
            createdBy: user._id,
        });
        return notificationId;
    },
});

export const createTestUserNotificationSettings = internalMutation({
    args: {
        userId: v.id("users"),
        settings: v.object({
            globalOptOut: v.optional(v.boolean()),
            createdAt: v.optional(v.number()),
            updatedAt: v.optional(v.number()),
        })
    },
    returns: v.id("userSettings"),
    handler: async (ctx, args) => {
        const { user } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        const settingsId = await ctx.db.insert("userSettings", {
            userId: args.userId,
            notifications: {
                globalOptOut: args.settings.globalOptOut ?? false,
                preferences: {
                    booking_confirmation: {
                        email: true,
                        web: true,
                        push: true,
                    },
                    booking_reminder: {
                        email: true,
                        web: true,
                        push: true,
                    },
                    class_cancelled: {
                        email: true,
                        web: true,
                        push: true,
                    },
                    booking_cancelled_by_business: {
                        email: true,
                        web: true,
                        push: true,
                    },
                    payment_receipt: {
                        email: true,
                        web: true,
                        push: true,
                    },
                    class_rebookable: {
                        email: true,
                        web: true,
                        push: true,
                    },
                    credits_received_subscription: {
                        email: true,
                        web: true,
                        push: true,
                    },
                    credits_received_admin_gift: {
                        email: true,
                        web: true,
                        push: true,
                    },
                },
            },
            createdAt: args.settings.createdAt || Date.now(),
            createdBy: user._id,
        });
        return settingsId;
    },
});

export const createTestBusinessNotificationSettings = internalMutation({
    args: {
        businessId: v.id("businesses"),
        settings: v.object({
            createdAt: v.optional(v.number()),
            updatedAt: v.optional(v.number()),
        })
    },
    returns: v.id("businessSettings"),
    handler: async (ctx, args) => {
        const { user } = await getAuthenticatedUserAndBusinessOrThrow(ctx);
        const settingsId = await ctx.db.insert("businessSettings", {
            businessId: args.businessId,
            notifications: {
                preferences: {
                    booking_created: {
                        email: true,
                        web: true,
                    },
                    booking_cancelled_by_consumer: {
                        email: true,
                        web: true,
                    },
                    booking_cancelled_by_business: {
                        email: true,
                        web: true,
                    },
                    payment_received: {
                        email: true,
                        web: true,
                    },
                },
            },
            createdAt: args.settings.createdAt || Date.now(),
            createdBy: user._id,
        });
        return settingsId;
    },
});

export const updateUser = internalMutation({
    args: {
        userId: v.id("users"),
        updates: v.object({
            name: v.optional(v.string()),
            email: v.optional(v.string()),
            hasConsumerOnboarded: v.optional(v.boolean()),
            hasBusinessOnboarded: v.optional(v.boolean()),
            role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
            businessRole: v.optional(v.union(v.literal("owner"), v.literal("admin"), v.literal("user"))),
            credits: v.optional(v.number()),
        })
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const updates: any = {};

        if (args.updates.name !== undefined) updates.name = args.updates.name;
        if (args.updates.email !== undefined) updates.email = args.updates.email;
        if (args.updates.hasConsumerOnboarded !== undefined) updates.hasConsumerOnboarded = args.updates.hasConsumerOnboarded;
        if (args.updates.hasBusinessOnboarded !== undefined) updates.hasBusinessOnboarded = args.updates.hasBusinessOnboarded;
        if (args.updates.role !== undefined) updates.role = args.updates.role;
        if (args.updates.businessRole !== undefined) updates.businessRole = args.updates.businessRole;
        if (args.updates.credits !== undefined) updates.credits = args.updates.credits;

        if (Object.keys(updates).length > 0) {
            updates.updatedAt = Date.now();
            await ctx.db.patch(args.userId, updates);
        }

        return null;
    },
});

export const testSendClassRebookableNotification = internalMutation({
    args: {
        userId: v.id("users"),
        classInstanceId: v.id("classInstances"),
        bookingId: v.id("bookings"),
        sendActualNotification: v.optional(v.boolean()),
    },
    returns: v.object({
        deepLink: v.string(),
        notification: v.object({
            title: v.string(),
            body: v.string(),
            data: v.object({
                deepLink: v.string(),
                notificationType: v.string(),
                classInstanceId: v.optional(v.id("classInstances")),
                bookingId: v.optional(v.id("bookings")),
            })
        })
    }),
    handler: async (ctx, args) => {
        // Import the deep linking utilities
        const { createNotificationWithDeepLink } = await import("../utils/deep-linking");

        // Create the notification content with deep link
        const notificationContent = createNotificationWithDeepLink(
            'class_rebookable',
            'Booking Available Again - Test',
            `Test rebookable notification for class instance ${args.classInstanceId}`,
            {
                classInstanceId: args.classInstanceId,
                bookingId: args.bookingId,
                additionalData: {
                    testMode: true,
                }
            }
        );

        // Also test the deep link generation directly
        const { generateNotificationDeepLink } = await import("../utils/deep-linking");
        const directDeepLink = generateNotificationDeepLink('class_rebookable', {
            classInstanceId: args.classInstanceId
        });

        // Optionally send the actual push notification
        if (args.sendActualNotification) {
            const { components } = await import("../convex/_generated/api");
            await ctx.runMutation(components.pushNotifications.public.sendPushNotification, {
                logLevel: "DEBUG",
                userId: args.userId,
                notification: notificationContent,
            });
            // ("✅ Actual push notification sent!");
        }

        return {
            deepLink: directDeepLink,
            notification: notificationContent
        };
    },
});

export const testDeepLinkGeneration = internalMutation({
    args: {
        type: v.union(
            v.literal("booking_cancelled_by_business"),
            v.literal("booking_reminder"),
            v.literal("class_cancelled"),
            v.literal("class_rebookable"),
            v.literal("booking_confirmation"),
            v.literal("booking_created"),
            v.literal("booking_cancelled_by_consumer"),
            v.literal("payment_received"),
            v.literal("payment_receipt")
        ),
        classInstanceId: v.optional(v.id("classInstances")),
        venueId: v.optional(v.id("venues")),
    },
    returns: v.object({
        type: v.string(),
        deepLink: v.string(),
        data: v.object({
            classInstanceId: v.optional(v.id("classInstances")),
            venueId: v.optional(v.id("venues")),
        })
    }),
    handler: async (ctx, args) => {
        const { generateNotificationDeepLink } = await import("../utils/deep-linking");

        const data = {
            classInstanceId: args.classInstanceId,
            venueId: args.venueId,
        };

        const deepLink = generateNotificationDeepLink(args.type, data);

        return {
            type: args.type,
            deepLink,
            data
        };
    },
});


/**
 * Reset test data in database
 */
export const resetTestData = mutation({
    args: {
        testRunId: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        // Delete test venues
        const venues = await ctx.db
            .query("venues")
            .filter(q => q.eq(q.field("name"), "gefatest01 Test Yoga Studio"))
            .collect();

        for (const venue of venues) {
            await ctx.db.delete(venue._id);
        }

        // Delete test templates
        const templates = await ctx.db
            .query("classTemplates")
            .filter(q => q.eq(q.field("name"), "gefatest01 Morning Hatha Yoga"))
            .collect();

        for (const template of templates) {
            await ctx.db.delete(template._id);
        }

        // Delete test class instances
        const instances = await ctx.db
            .query("classInstances")
            .filter(q => q.eq(q.field("name"), "gefatest01 Morning Hatha Yoga"))
            .collect();

        for (const instance of instances) {
            await ctx.db.delete(instance._id);
        }

        return {
            success: true,
            deletedCount: venues.length + templates.length + instances.length
        };
    },
});
