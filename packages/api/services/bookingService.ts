import { PaginationResult, PaginationOptions } from "convex/server";
import type { Doc, Id } from "../convex/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import { ERROR_CODES } from "../utils/errorCodes";
import { ConvexError } from "convex/values";
import { creditService } from "./creditService";
import { calculateBestDiscount } from "../utils/classDiscount";
import { BookingWithDetails } from "../types/booking";


/***************************************************************
 * Booking Service - All booking-related operations
 ***************************************************************/
export const bookingService = {
    /***************************************************************
     * Get Current User Bookings Handler
     * Returns paginated bookings for the authenticated user
     ***************************************************************/
    getCurrentUserBookings: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {
            paginationOpts: PaginationOptions;
            includeHistory?: boolean;
        };
        user: Doc<"users">;
    }): Promise<PaginationResult<BookingWithDetails>> => {
        const { includeHistory = false } = args;

        // Build status filter
        let statusFilter;
        if (includeHistory) {
            // Include all booking statuses
            statusFilter = (q: any) => q.gte(q.field("createdAt"), 0); // Always true
        } else {
            // Only include active bookings (pending)
            statusFilter = (q: any) => q.eq(q.field("status"), "pending");
        }

        // Get paginated bookings for current user
        const result = await ctx.db
            .query("bookings")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                statusFilter(q)
            ))
            .order("desc") // Most recent first
            .paginate(args.paginationOpts);

        // Enrich bookings with related data
        const enrichedBookings: BookingWithDetails[] = [];

        for (const booking of result.page) {
            const enrichedBooking: BookingWithDetails = { ...booking };

            // Get class instance
            if (booking.classInstanceId) {
                enrichedBooking.classInstance = await ctx.db.get(booking.classInstanceId) || undefined;

                // Get class template if instance exists
                if (enrichedBooking.classInstance?.templateId) {
                    enrichedBooking.classTemplate = await ctx.db.get(enrichedBooking.classInstance.templateId) || undefined;
                }

                // Get venue if instance exists
                if (enrichedBooking.classInstance?.venueId) {
                    enrichedBooking.venue = await ctx.db.get(enrichedBooking.classInstance.venueId) || undefined;
                }
            }

            enrichedBookings.push(enrichedBooking);
        }

        return {
            ...result,
            page: enrichedBookings
        };
    },

    /***************************************************************
     * Get Booking By ID Handler
     * Returns a specific booking with details (must belong to user)
     ***************************************************************/
    getBookingById: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {
            bookingId: Id<"bookings">;
        };
        user: Doc<"users">;
    }): Promise<BookingWithDetails> => {
        const booking = await ctx.db.get(args.bookingId);

        if (!booking) {
            throw new ConvexError({
                message: "Booking not found",
                field: "bookingId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        // Ensure booking belongs to current user
        if (booking.userId !== user._id) {
            throw new ConvexError({
                message: "You don't have permission to view this booking",
                field: "bookingId",
                code: ERROR_CODES.UNAUTHORIZED
            });
        }

        if (booking.deleted) {
            throw new ConvexError({
                message: "Booking has been deleted",
                field: "bookingId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND
            });
        }

        // Enrich with related data
        const enrichedBooking: BookingWithDetails = { ...booking };

        if (booking.classInstanceId) {
            enrichedBooking.classInstance = await ctx.db.get(booking.classInstanceId) || undefined;

            if (enrichedBooking.classInstance?.templateId) {
                enrichedBooking.classTemplate = await ctx.db.get(enrichedBooking.classInstance.templateId) || undefined;
            }

            if (enrichedBooking.classInstance?.venueId) {
                enrichedBooking.venue = await ctx.db.get(enrichedBooking.classInstance.venueId) || undefined;
            }
        }

        return enrichedBooking;
    },

    /***************************************************************
     * Get Current User Upcoming Bookings Handler
     * Returns user's upcoming bookings (pending status only)
     ***************************************************************/
    getCurrentUserUpcomingBookings: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {
            daysAhead?: number;
        };
        user: Doc<"users">;
    }): Promise<BookingWithDetails[]> => {
        const daysAhead = args.daysAhead ?? 30; // Default 30 days
        const now = Date.now();
        const endDate = now + (daysAhead * 24 * 60 * 60 * 1000);

        // Get user's pending bookings
        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                q.eq(q.field("status"), "pending")
            ))
            .collect();

        // Filter by date and enrich with details
        const upcomingBookings: BookingWithDetails[] = [];

        for (const booking of bookings) {
            const classInstance = booking.classInstanceId
                ? await ctx.db.get(booking.classInstanceId)
                : null;

            // Skip if class instance not found or is in the past or too far in future
            if (!classInstance || classInstance.startTime < now || classInstance.startTime > endDate) {
                continue;
            }

            const enrichedBooking: BookingWithDetails = {
                ...booking,
                classInstance: classInstance || undefined
            };

            // Get template and venue
            if (classInstance.templateId) {
                enrichedBooking.classTemplate = await ctx.db.get(classInstance.templateId) || undefined;
            }

            if (classInstance.venueId) {
                enrichedBooking.venue = await ctx.db.get(classInstance.venueId) || undefined;
            }

            upcomingBookings.push(enrichedBooking);
        }

        // Sort by class start time (earliest first)
        return upcomingBookings.sort((a, b) => {
            const aStartTime = a.classInstance?.startTime ?? 0;
            const bStartTime = b.classInstance?.startTime ?? 0;
            return aStartTime - bStartTime;
        });
    },

    /***************************************************************
     * Get Current User Booking History Handler  
     * Returns user's historical bookings (completed, cancelled, no_show)
     ***************************************************************/
    getCurrentUserBookingHistory: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {
            paginationOpts: PaginationOptions;
            daysBack?: number;
        };
        user: Doc<"users">;
    }): Promise<PaginationResult<BookingWithDetails>> => {
        const daysBack = args.daysBack ?? 90; // Default 90 days
        const cutoffDate = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

        // Get historical bookings (completed, cancelled, no_show)
        const result = await ctx.db
            .query("bookings")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                q.or(
                    q.eq(q.field("status"), "completed"),
                    q.eq(q.field("status"), "cancelled"),
                    q.eq(q.field("status"), "no_show")
                ),
                q.gte(q.field("createdAt"), cutoffDate)
            ))
            .order("desc") // Most recent first
            .paginate(args.paginationOpts);

        // Enrich with related data
        const enrichedBookings: BookingWithDetails[] = [];

        for (const booking of result.page) {
            const enrichedBooking: BookingWithDetails = { ...booking };

            if (booking.classInstanceId) {
                enrichedBooking.classInstance = await ctx.db.get(booking.classInstanceId) || undefined;

                if (enrichedBooking.classInstance?.templateId) {
                    enrichedBooking.classTemplate = await ctx.db.get(enrichedBooking.classInstance.templateId) || undefined;
                }

                if (enrichedBooking.classInstance?.venueId) {
                    enrichedBooking.venue = await ctx.db.get(enrichedBooking.classInstance.venueId) || undefined;
                }
            }

            enrichedBookings.push(enrichedBooking);
        }

        return {
            ...result,
            page: enrichedBookings
        };
    },

    /***************************************************************
     * Get Current User Bookings By Status Handler
     * Returns user's bookings filtered by specific status
     ***************************************************************/
    getCurrentUserBookingsByStatus: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {
            status: "confirmed" | "waitlisted" | "completed" | "cancelled" | "no_show";
            paginationOpts: PaginationOptions;
        };
        user: Doc<"users">;
    }): Promise<PaginationResult<BookingWithDetails>> => {
        // Map status to our schema (confirmed/waitlisted both map to "pending" in our schema)
        let dbStatus: "pending" | "completed" | "cancelled" | "no_show";
        if (args.status === "confirmed" || args.status === "waitlisted") {
            dbStatus = "pending";
        } else {
            dbStatus = args.status;
        }

        const result = await ctx.db
            .query("bookings")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                q.eq(q.field("status"), dbStatus)
            ))
            .order("desc")
            .paginate(args.paginationOpts);

        // For confirmed/waitlisted distinction, we would need to check class instance capacity
        // This is a simplified implementation - you may want to add capacity checking logic here

        // Enrich with related data
        const enrichedBookings: BookingWithDetails[] = [];

        for (const booking of result.page) {
            const enrichedBooking: BookingWithDetails = { ...booking };

            if (booking.classInstanceId) {
                enrichedBooking.classInstance = await ctx.db.get(booking.classInstanceId) || undefined;

                if (enrichedBooking.classInstance?.templateId) {
                    enrichedBooking.classTemplate = await ctx.db.get(enrichedBooking.classInstance.templateId) || undefined;
                }

                if (enrichedBooking.classInstance?.venueId) {
                    enrichedBooking.venue = await ctx.db.get(enrichedBooking.classInstance.venueId) || undefined;
                }
            }

            enrichedBookings.push(enrichedBooking);
        }

        return {
            ...result,
            page: enrichedBookings
        };
    },

    /***************************************************************
     * Get User Booking for Class Instance Handler
     * Returns user's booking for a specific class instance if it exists
     ***************************************************************/
    getUserBookingForClassInstance: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {
            classInstanceId: Id<"classInstances">;
        };
        user: Doc<"users">;
    }): Promise<BookingWithDetails | null> => {
        // Query for booking by user and class instance
        const booking = await ctx.db
            .query("bookings")
            .withIndex("by_user_class", q =>
                q.eq("userId", user._id)
                    .eq("classInstanceId", args.classInstanceId)
            )
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                q.eq(q.field("status"), "pending") // Only active bookings
            ))
            .first();

        if (!booking) {
            return null;
        }

        // Enrich with related data
        const enrichedBooking: BookingWithDetails = { ...booking };

        if (booking.classInstanceId) {
            enrichedBooking.classInstance = await ctx.db.get(booking.classInstanceId) || undefined;

            if (enrichedBooking.classInstance?.templateId) {
                enrichedBooking.classTemplate = await ctx.db.get(enrichedBooking.classInstance.templateId) || undefined;
            }

            if (enrichedBooking.classInstance?.venueId) {
                enrichedBooking.venue = await ctx.db.get(enrichedBooking.classInstance.venueId) || undefined;
            }
        }

        return enrichedBooking;
    },

    /***************************************************************
     * Book Class Handler
     * Handles the complete booking flow with discount calculation and credit processing
     ***************************************************************/
    bookClass: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            classInstanceId: Id<"classInstances">;
            idempotencyKey?: string;
            description?: string;
        };
        user: Doc<"users">;
    }): Promise<{ bookingId: Id<"bookings">; transactionId: string }> => {
        const now = Date.now();

        // Load instance and template
        const instance = await ctx.db.get(args.classInstanceId);
        if (!instance) {
            throw new ConvexError({
                message: "Class instance not found",
                field: "classInstanceId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }
        // Only block cancelled or completed classes; scheduled is allowed
        if (instance.status === 'cancelled') {
            throw new ConvexError({
                message: "Class instance has been cancelled",
                field: "status",
                code: ERROR_CODES.CLASS_CANCELLED,
            });
        }
        if (instance.status === 'completed') {
            throw new ConvexError({
                message: "Class instance already completed",
                field: "status",
                code: ERROR_CODES.CLASS_COMPLETED,
            });
        }

        const template = await ctx.db.get(instance.templateId);
        if (!template) {
            throw new ConvexError({
                message: "Class template not found",
                field: "templateId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Enforce booking window: current time must be between [start - maxHours, start - minHours]
        const effectiveBookingWindow = instance.bookingWindow ?? template.bookingWindow;
        const timeUntilStartMs = instance.startTime - now;
        if (timeUntilStartMs <= 0) {
            throw new ConvexError({
                message: "Class has already started",
                field: "startTime",
                code: ERROR_CODES.CLASS_STARTED,
            });
        }
        if (effectiveBookingWindow) {
            const hoursUntilStart = timeUntilStartMs / (1000 * 60 * 60);
            if (hoursUntilStart < effectiveBookingWindow.minHours) {
                throw new ConvexError({
                    message: `Too late to book. Minimum advance is ${effectiveBookingWindow.minHours}h`,
                    field: "bookingWindow",
                    code: ERROR_CODES.TOO_LATE,
                });
            }
            if (hoursUntilStart > effectiveBookingWindow.maxHours) {
                throw new ConvexError({
                    message: `Too early to book. Maximum advance is ${effectiveBookingWindow.maxHours}h`,
                    field: "bookingWindow",
                    code: ERROR_CODES.TOO_EARLY,
                });
            }
        }

        // Ensure capacity
        const effectiveCapacity = (instance.capacity ?? template.capacity);
        if (typeof effectiveCapacity === "number") {
            if (instance.bookedCount >= effectiveCapacity) {
                throw new ConvexError({
                    message: "Class is full",
                    field: "capacity",
                    code: ERROR_CODES.CLASS_FULL,
                });
            }
        }

        // Prevent duplicate booking for same user+class (best-effort)
        // Only check for active bookings (not cancelled, completed, or no_show)
        const existing = await ctx.db
            .query("bookings")
            .withIndex("by_user_class", (q: any) => q.eq("userId", user._id).eq("classInstanceId", args.classInstanceId))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                q.eq(q.field("status"), 'pending')
            ))
            .first();

        if (existing) {
            // If called again, treat idempotently and do not double-charge
            return { bookingId: existing._id, transactionId: existing.creditTransactionId || `${existing._id}` };
        }

        // Calculate best available discount
        const discountResult = calculateBestDiscount(instance, template, { bookingTime: now });
        const { originalPrice, finalPrice, appliedDiscount } = discountResult;

        if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
            throw new ConvexError({
                message: "Invalid original price for class",
                field: "originalPrice",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }

        // Create booking row first with user metadata for business owners
        const bookingId = await ctx.db.insert("bookings", {
            businessId: instance.businessId,
            userId: user._id,
            classInstanceId: args.classInstanceId,
            status: "pending",
            originalPrice,
            finalPrice,
            creditsUsed: finalPrice,
            creditTransactionId: "", // Will be updated after credit transaction
            appliedDiscount: appliedDiscount || undefined,
            // Populate user metadata for business owners to see customer details
            userSnapshot: {
                name: user.name || undefined,
                email: user.email || undefined,
                phone: user.phone || undefined,
            },
            bookedAt: now,
            createdAt: now,
            createdBy: user._id,
        });

        // Spend credits using credit service
        const { newBalance, transactionId } = await creditService.spendCredits(ctx, {
            userId: user._id,
            amount: finalPrice,
            description: args.description ?? `Booking for ${template.name}`,
            businessId: instance.businessId,
            venueId: instance.venueId,
            classTemplateId: instance.templateId,
            classInstanceId: args.classInstanceId,
            bookingId: bookingId,
        });

        // Update booking with credit transaction ID
        await ctx.db.patch(bookingId, {
            creditTransactionId: transactionId.toString(),
            updatedAt: now,
            updatedBy: user._id,
        });

        // Increment instance booked count
        await ctx.db.patch(args.classInstanceId, {
            bookedCount: instance.bookedCount + 1,
            updatedAt: now,
            updatedBy: user._id,
        });

        return { bookingId, transactionId };
    },

    /***************************************************************
     * Complete Booking Handler
     * Marks a booking as completed
     ***************************************************************/
    completeBooking: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            bookingId: Id<"bookings">;
        };
        user: Doc<"users">;
    }): Promise<{ success: boolean }> => {
        const now = Date.now();

        const booking = await ctx.db.get(args.bookingId);
        if (!booking) {
            throw new ConvexError({
                message: "Booking not found",
                field: "bookingId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        if (booking.status !== "pending") {
            throw new ConvexError({
                message: `Cannot complete booking with status: ${booking.status}`,
                field: "status",
                code: ERROR_CODES.ACTION_NOT_ALLOWED,
            });
        }

        // Update booking status
        await ctx.db.patch(args.bookingId, {
            status: "completed",
            completedAt: now,
            updatedAt: now,
            updatedBy: user._id,
        });

        return { success: true };
    },

    /***************************************************************
     * Cancel Booking Handler
     * Handles booking cancellation with refund logic
     ***************************************************************/
    cancelBooking: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            bookingId: Id<"bookings">;
            reason?: string;
        };
        user: Doc<"users">;
    }): Promise<{ success: boolean }> => {
        const now = Date.now();

        const booking = await ctx.db.get(args.bookingId);
        if (!booking) {
            throw new ConvexError({
                message: "Booking not found",
                field: "bookingId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        if (booking.userId !== user._id) {
            throw new ConvexError({
                message: "You are not authorized to cancel this booking",
                field: "userId",
                code: ERROR_CODES.UNAUTHORIZED,
            });
        }

        if (booking.status !== "pending") {
            throw new ConvexError({
                message: `Cannot cancel booking with status: ${booking.status}`,
                field: "status",
                code: ERROR_CODES.ACTION_NOT_ALLOWED,
            });
        }

        // Get class instance to check cancellation window
        const instance = await ctx.db.get(booking.classInstanceId);
        if (!instance) {
            throw new ConvexError({
                message: "Class instance not found",
                field: "classInstanceId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }


        // Get template for cancellation rules
        const template = await ctx.db.get(instance.templateId);
        if (!template) {
            throw new ConvexError({
                message: "Class template not found",
                field: "templateId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Get user's current credit balance for logging
        const bookedUser = await ctx.db.get(booking.userId);
        const currentUserCredits = bookedUser?.credits ?? 0;

        // Check if cancellation is allowed (simplified - can be enhanced later)
        const cancellationWindowHours = instance.cancellationWindowHours ?? template.cancellationWindowHours ?? 0;
        const cancellationCutoff = instance.startTime - cancellationWindowHours * 60 * 60 * 1000;

        const timeUntilClass = instance.startTime - now;
        const hoursUntilClass = timeUntilClass / (1000 * 60 * 60);

        const isLateCancellation = now > cancellationCutoff;

        // Update booking status
        await ctx.db.patch(args.bookingId, {
            status: "cancelled",
            cancelledAt: now,
            updatedAt: now,
            updatedBy: user._id,
        });

        // Decrease booked count
        await ctx.db.patch(booking.classInstanceId, {
            bookedCount: Math.max(0, instance.bookedCount - 1),
            updatedAt: now,
            updatedBy: user._id,
        });


        // 💰 REFUND CALCULATION AND PROCESSING
        const refundMultiplier = isLateCancellation ? 0.5 : 1;
        const refundAmount = booking.creditsUsed * refundMultiplier; // 50% refund if late, full refund otherwise

        if (refundAmount > 0) {

            // Process refund through credit service for proper transaction tracking
            const refundReason = isLateCancellation ? "user_cancellation" : "user_cancellation";
            const refundDescription = `Refund for cancelled booking: ${template.name} (${refundMultiplier * 100}% refund)`;

            const { newBalance } = await creditService.addCredits(ctx, {
                userId: booking.userId,
                amount: refundAmount,
                type: "refund",
                reason: refundReason,
                description: refundDescription,
                businessId: booking.businessId,
                venueId: instance.venueId,
                classTemplateId: instance.templateId,
                classInstanceId: booking.classInstanceId,
                bookingId: booking._id,
            });

        } else {
            console.log(`ℹ️ NO REFUND NEEDED - RefundAmount: ${refundAmount}`);
        }

        console.log(`✅ CANCEL BOOKING COMPLETED - BookingId: ${args.bookingId}, RefundGiven: ${refundAmount > 0 ? `${refundAmount} credits` : 'None'}, Status: cancelled`);

        return { success: true };
    },

    /***************************************************************
     * Mark No Show Handler
     * Marks a booking as no-show (no refund)
     ***************************************************************/
    markNoShow: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            bookingId: Id<"bookings">;
        };
        user: Doc<"users">;
    }): Promise<{ success: boolean }> => {
        const now = Date.now();

        const booking = await ctx.db.get(args.bookingId);
        if (!booking) {
            throw new ConvexError({
                message: "Booking not found",
                field: "bookingId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        if (booking.status !== "pending") {
            throw new ConvexError({
                message: `Cannot mark no-show for booking with status: ${booking.status}`,
                field: "status",
                code: ERROR_CODES.ACTION_NOT_ALLOWED,
            });
        }

        // Update booking status
        await ctx.db.patch(args.bookingId, {
            status: "no_show",
            updatedAt: now,
            updatedBy: user._id,
        });

        return { success: true };
    },
};