import type { PaginationResult, PaginationOptions } from "convex/server";
import type { Doc, Id } from "../convex/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import { ERROR_CODES } from "../utils/errorCodes";
import { ConvexError } from "convex/values";
import { creditService } from "./creditService";
import { calculateBestDiscount } from "../utils/classDiscount";
import { validateActiveBookingsLimit } from "../rules/booking";
import { logger } from "../utils/logger";
import { centsToCredits } from "@repo/utils/credits";
import type { QuestionAnswer, QuestionnaireAnswers } from "../types/questionnaire";
import { buildQuestionnaireAnswersWithFees, getEffectiveQuestionnaire } from "../operations/questionnaire";
import { validateQuestionnaireAnswers } from "../rules/questionnaire";


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
    }): Promise<PaginationResult<Doc<"bookings">>> => {
        const { includeHistory = true } = args;

        // Build status filter
        let statusFilter;
        if (includeHistory) {
            // Include all booking statuses - check if classInstanceSnapshot exists
            statusFilter = (q: any) => q.neq(q.field("classInstanceSnapshot"), null);
        } else {
            // Only include active bookings (pending)
            statusFilter = (q: any) => q.eq(q.field("status"), "pending");
        }

        // Get paginated bookings for current user, ordered by start time (most recent first)
        const result = await ctx.db
            .query("bookings")
            .withIndex("by_user_start_time", q => q.eq("userId", user._id))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                statusFilter(q)
            ))
            .order("desc") // Most recent startTime first (upcoming classes at the top)
            .paginate(args.paginationOpts);

        return result;
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
    }): Promise<Doc<"bookings">> => {
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

        return booking;
    },

    /***************************************************************
     * Get Bookings by Class Instance ID Handler
     * Returns all pending bookings related to a class instance
     ***************************************************************/
    getBookingsByClassInstanceId: async ({
        ctx,
        args,
    }: {
        ctx: QueryCtx;
        args: {
            classInstanceId: Id<"classInstances">;
        };
    }): Promise<Doc<"bookings">[]> => {
        const bookings = await ctx.db.query("bookings")
            .withIndex("by_class_instance_status", q => q.eq("classInstanceId", args.classInstanceId))
            .filter(q => q.eq(q.field("status"), "pending"))
            .collect();

        return bookings;
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
    }): Promise<Doc<"bookings">[]> => {
        const daysAhead = args.daysAhead ?? 30; // Default 30 days
        const now = Date.now();
        const endDate = now + (daysAhead * 24 * 60 * 60 * 1000);

        // Get user's pending bookings
        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_user_class", q => q.eq("userId", user._id))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                q.eq(q.field("status"), "pending")
            ))
            .collect();

        // Sort by class start time (earliest first)
        return bookings.sort((a, b) => {
            const aStartTime = a.classInstanceSnapshot?.startTime ?? 0;
            const bStartTime = b.classInstanceSnapshot?.startTime ?? 0;
            return aStartTime - bStartTime;
        });
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
    }): Promise<PaginationResult<Doc<"bookings">>> => {
        // Map status to our schema (confirmed/waitlisted both map to "pending" in our schema)
        let dbStatus: "pending" | "completed" | "cancelled" | "no_show";
        if (args.status === "confirmed" || args.status === "waitlisted") {
            dbStatus = "pending";
        } else {
            dbStatus = args.status;
        }

        const result = await ctx.db
            .query("bookings")
            .withIndex("by_user_class", q => q.eq("userId", user._id))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                q.eq(q.field("status"), dbStatus)
            ))
            .order("desc")
            .paginate(args.paginationOpts);

        // For confirmed/waitlisted distinction, we would need to check class instance capacity
        // This is a simplified implementation - you may want to add capacity checking logic here

        return result;
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
    }): Promise<Doc<"bookings"> | null> => {
        // Query for booking by user and class instance - get the latest booking (most recent)
        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_user_class", q =>
                q.eq("userId", user._id)
                    .eq("classInstanceId", args.classInstanceId)
            )
            .filter(q => q.neq(q.field("deleted"), true))
            .collect();

        // Sort by creation time and get the most recent booking
        const booking = bookings.sort((a, b) => b.createdAt - a.createdAt)[0] || null;

        if (!booking) {
            return null;
        }

        return booking;
    },

    /***************************************************************
     * Get User Booking History for Class Instance Handler
     * Returns all user's bookings for a specific class instance (for booking history)
     ***************************************************************/
    getUserBookingHistoryForClassInstance: async ({
        ctx,
        args,
        user,
    }: {
        ctx: QueryCtx;
        args: {
            classInstanceId: Id<"classInstances">;
        };
        user: Doc<"users">;
    }): Promise<Doc<"bookings">[]> => {
        // Query for all bookings by user and class instance
        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_user_class", q =>
                q.eq("userId", user._id)
                    .eq("classInstanceId", args.classInstanceId)
            )
            .filter(q => q.neq(q.field("deleted"), true))
            .collect();

        // Sort by creation time (most recent first)
        const sortedBookings = bookings.sort((a, b) => b.createdAt - a.createdAt);

        return sortedBookings;
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
            // Pre-booking questionnaire answers (without feeApplied - will be calculated)
            questionnaireAnswers?: Omit<QuestionAnswer, "feeApplied">[];
        };
        user: Doc<"users">;
    }): Promise<{ bookingId: Id<"bookings">; transactionId: string }> => {
        const now = Date.now();

        // Load instance and template
        const instance = await ctx.db.get(args.classInstanceId);

        if (!instance || instance.deleted) {
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

        // Check if bookings are disabled for this class instance
        if (instance.disableBookings === true) {
            throw new ConvexError({
                message: "Bookings are disabled for this class",
                field: "disableBookings",
                code: ERROR_CODES.ACTION_NOT_ALLOWED,
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

        // Fetch business to get platform fee rate
        const business = await ctx.db.get(instance.businessId);
        if (!business) {
            throw new ConvexError({
                message: "Business not found",
                field: "businessId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Get platform fee rate from business settings, default to 0.20 (20%)
        const platformFeeRate = business.feeStructure.baseFeeRate ?? 0.20;

        // Process pre-booking questionnaire if applicable
        let questionnaireAnswersSnapshot: QuestionnaireAnswers | undefined;
        let questionnaireFees = 0;

        const effectiveQuestionnaire = getEffectiveQuestionnaire(
            template.questionnaire,
            instance.questionnaire
        );

        if (effectiveQuestionnaire && effectiveQuestionnaire.length > 0) {
            // If questionnaire exists, answers are required
            if (!args.questionnaireAnswers || args.questionnaireAnswers.length === 0) {
                // Check if there are any required questions
                const hasRequiredQuestions = effectiveQuestionnaire.some(q => q.required);
                if (hasRequiredQuestions) {
                    throw new ConvexError({
                        message: "Questionnaire must be answered",
                        field: "questionnaireAnswers",
                        code: ERROR_CODES.VALIDATION_ERROR,
                    });
                }
            }

            if (args.questionnaireAnswers && args.questionnaireAnswers.length > 0) {
                // Validate answers against questionnaire
                // First, create answers with placeholder fees for validation
                const answersForValidation: QuestionAnswer[] = args.questionnaireAnswers.map(a => ({
                    ...a,
                    feeApplied: 0,
                }));
                validateQuestionnaireAnswers(effectiveQuestionnaire, answersForValidation);

                // Build answers with calculated fees
                questionnaireAnswersSnapshot = buildQuestionnaireAnswersWithFees(
                    effectiveQuestionnaire,
                    args.questionnaireAnswers
                );
                questionnaireFees = questionnaireAnswersSnapshot.totalFees;
            }
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

        // BL-001: Validate maximum active bookings limit before allowing new booking
        // This prevents consumers from overbooking and reduces book/cancel churn behavior
        // Get user's current bookings to validate limits
        // First, check for duplicate booking to ensure idempotent behavior
        // Only check for active bookings (pending or awaiting_approval - not cancelled, completed, rejected, or no_show)
        const existing = await ctx.db
            .query("bookings")
            .withIndex("by_user_class", (q: any) => q.eq("userId", user._id).eq("classInstanceId", args.classInstanceId))
            .filter(q => q.and(
                q.neq(q.field("deleted"), true),
                q.or(
                    q.eq(q.field("status"), 'pending'),
                    q.eq(q.field("status"), 'awaiting_approval')
                )
            ))
            .first();

        if (existing) {
            // If called again, treat idempotently and do not double-charge
            return { bookingId: existing._id, transactionId: existing.creditTransactionId || `${existing._id}` };
        }

        // Only validate booking limits after confirming this is not a duplicate booking
        const userBookings = await ctx.db
            .query("bookings")
            .withIndex("by_user_class", q => q.eq("userId", user._id))
            .filter(q => q.neq(q.field("deleted"), true))
            .collect();

        logger.debug('userBookings', { userBookings, length: userBookings.length });
        validateActiveBookingsLimit(userBookings, now);

        const discountResult = calculateBestDiscount(instance, template, { bookingTime: now });
        const { originalPrice, appliedDiscount } = discountResult;

        // Add questionnaire fees to the final price (after discount)
        const finalPriceWithFees = discountResult.finalPrice + questionnaireFees;

        // originalPrice and finalPrice are now in cents (not credits!)
        // Calculate credits used for credit spending using utility function
        const creditsUsed = centsToCredits(finalPriceWithFees);

        if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
            throw new ConvexError({
                message: "Invalid original price for class",
                field: "originalPrice",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }

        if (!Number.isFinite(finalPriceWithFees) || finalPriceWithFees < 0) {
            throw new ConvexError({
                message: "Invalid final price after discount calculation",
                field: "finalPrice",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }

        // 🔒 IMPORTANT: Check credit balance BEFORE creating booking
        // This prevents triggers from firing on a booking that will fail due to insufficient credits.
        // The booking insert triggers notifications/reminders, so we must validate credits first.
        if (finalPriceWithFees > 0) {
            const currentBalance = user.credits ?? 0;
            if (currentBalance < creditsUsed) {
                throw new ConvexError({
                    message: "Insufficient credits",
                    field: "credits",
                    code: ERROR_CODES.INSUFFICIENT_CREDITS,
                });
            }
        }



        // Determine booking status based on requiresConfirmation
        // If the class requires confirmation, start in "awaiting_approval" status
        const requiresConfirmation = instance.requiresConfirmation ?? template.requiresConfirmation ?? false;
        const initialStatus = requiresConfirmation ? "awaiting_approval" : "pending";

        // Create booking row first with user metadata for business owners
        const bookingId = await ctx.db.insert("bookings", {
            businessId: instance.businessId,
            userId: user._id,
            classInstanceId: args.classInstanceId,
            status: initialStatus,
            originalPrice,  // Now stored in cents
            finalPrice: finalPriceWithFees,     // Now stored in cents including questionnaire fees (creditsUsed = finalPrice / 100)
            creditTransactionId: "", // Will be updated after credit transaction
            platformFeeRate, // Platform fee rate from business settings (default 0.20)
            refundAmount: undefined, // Will be set on cancellation if applicable
            appliedDiscount: appliedDiscount || undefined,
            // Pre-booking questionnaire answers snapshot
            questionnaireAnswers: questionnaireAnswersSnapshot,
            // Populate user metadata for business owners to see customer details
            userSnapshot: {
                name: user.name || undefined,
                email: user.email || undefined,
                phone: user.phone || undefined,
            },
            // Populate class instance snapshot for efficient querying and display
            classInstanceSnapshot: {
                startTime: instance.startTime,
                endTime: instance.endTime,
                name: template.name,
                status: instance.status,
                cancellationWindowHours: instance.cancellationWindowHours,
                instructor: instance.instructor,
            },
            venueSnapshot: {
                name: instance.venueSnapshot.name,
            },
            bookedAt: now,
            createdAt: now,
            createdBy: user._id,
        });

        // Handle credit spending - skip if class is free after discount
        let transactionId: string;
        let newBalance: number | undefined;



        if (finalPriceWithFees === 0) {
            // For free bookings, create a placeholder transaction ID
            transactionId = `free_booking_${bookingId}`;
            newBalance = undefined; // Credit balance unchanged
        } else {
            // Normal credit spending for paid bookings
            // Use creditsUsed (converted from cents) for credit spending
            const creditResult = await creditService.spendCredits(ctx, {
                userId: user._id,
                amount: creditsUsed, // Use credits, not cents
                description: args.description ?? `Booking for ${template.name}`,
                businessId: instance.businessId,
                venueId: instance.venueId,
                classTemplateId: instance.templateId,
                classInstanceId: args.classInstanceId,
                bookingId: bookingId,
            });
            transactionId = creditResult.transactionId;
            newBalance = creditResult.newBalance;
        }

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

        // Check if class is within the check-in window (30 min before to 3 hours after)
        const classStartTime = booking.classInstanceSnapshot?.startTime;
        if (!classStartTime) {
            throw new ConvexError({
                message: "Class start time not found",
                field: "classInstanceSnapshot",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }

        const thirtyMinutesInMs = 30 * 60 * 1000;
        const threeHoursInMs = 3 * 60 * 60 * 1000;
        const earliestCheckIn = classStartTime - thirtyMinutesInMs;
        const latestCheckIn = classStartTime + threeHoursInMs;

        if (now < earliestCheckIn) {
            throw new ConvexError({
                message: "Too early to check in. Check-in opens 30 minutes before class starts.",
                field: "startTime",
                code: ERROR_CODES.ACTION_NOT_ALLOWED,
            });
        }

        if (now > latestCheckIn) {
            throw new ConvexError({
                message: "Check-in window has closed. Check-in closes 3 hours after class starts.",
                field: "startTime",
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
            cancelledBy: "consumer" | "business";
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

        // Check if the user is the owner of the booking or the business owner
        if (booking.userId !== user._id && booking.businessId !== user.businessId) {
            throw new ConvexError({
                message: "You are not authorized to cancel this booking",
                field: "userId",
                code: ERROR_CODES.UNAUTHORIZED,
            });
        }

        // Get class instance first (needed for time-based checks)
        const instance = await ctx.db.get(booking.classInstanceId);
        if (!instance) {
            throw new ConvexError({
                message: "Class instance not found",
                field: "classInstanceId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Allow cancellation of pending or awaiting_approval bookings, or completed bookings within 30 minutes after class start
        const THIRTY_MINUTES_MS = 30 * 60 * 1000;
        const thirtyMinutesAfterStart = instance.startTime + THIRTY_MINUTES_MS;
        const isWithinGracePeriod = booking.status === "completed" && now <= thirtyMinutesAfterStart;
        const isActiveBooking = booking.status === "pending" || booking.status === "awaiting_approval";

        if (!isActiveBooking && !isWithinGracePeriod) {
            throw new ConvexError({
                message: `Cannot cancel booking with status: ${booking.status}`,
                field: "status",
                code: ERROR_CODES.ACTION_NOT_ALLOWED,
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

        // Check for free cancellation privilege (e.g., from class rescheduling)
        const hasFreeCancel = booking.hasFreeCancel
            && booking.freeCancelExpiresAt
            && now <= booking.freeCancelExpiresAt;

        // Late cancellation check - bypassed if free cancellation is active
        const isLateCancellation = hasFreeCancel ? false : now > cancellationCutoff;

        // 💰 REFUND CALCULATION AND PROCESSING
        // For business cancellations, always full refund
        // For consumer cancellations, check if late (50% refund) or early (100% refund)
        let refundAmountInCents: number;
        let refundAmountInCredits: number;

        if (args.cancelledBy === "business") {
            // Business cancellations: full refund
            refundAmountInCents = booking.finalPrice;
            refundAmountInCredits = centsToCredits(booking.finalPrice);
        } else {
            // Consumer cancellations: late = 50%, early = 100%
            const refundMultiplier = isLateCancellation ? 0.5 : 1;
            // Calculate credits from finalPrice, then apply refund multiplier
            // Always round up to nearest integer to ensure credits stay whole numbers
            const creditsUsed = centsToCredits(booking.finalPrice);
            refundAmountInCredits = Math.ceil(creditsUsed * refundMultiplier);
            // Convert to cents for storage (credits * 100)
            refundAmountInCents = refundAmountInCredits * 100;
        }

        // Update booking status and refund amount in a single patch
        await ctx.db.patch(args.bookingId, {
            status: args.cancelledBy === "consumer" ? "cancelled_by_consumer" : "cancelled_by_business",
            cancelledAt: now,
            cancelledBy: args.cancelledBy,
            // Only set cancelByBusinessReason if cancelled by business
            ...(args.cancelledBy === "business" && args.reason ? { cancelByBusinessReason: args.reason } : {}),
            refundAmount: refundAmountInCents,
            updatedAt: now,
            updatedBy: user._id,
        });

        // Decrease booked count
        await ctx.db.patch(booking.classInstanceId, {
            bookedCount: Math.max(0, instance.bookedCount - 1),
            updatedAt: now,
            updatedBy: user._id,
        });

        if (refundAmountInCredits > 0) {
            // Process refund through credit service for proper transaction tracking
            const refundReason = args.cancelledBy === "business" ? "business_cancellation" : "user_cancellation";
            const refundPercentage = args.cancelledBy === "business" ? 100 : (isLateCancellation ? 50 : 100);
            const refundDescription = `Refund for cancelled booking: ${template.name} (${refundPercentage}% refund)`;

            const { newBalance } = await creditService.addCredits(ctx, {
                userId: booking.userId,
                amount: refundAmountInCredits,
                type: "refund",
                reason: refundReason,
                description: refundDescription,
                businessId: booking.businessId,
                venueId: instance.venueId,
                classTemplateId: instance.templateId,
                classInstanceId: booking.classInstanceId,
                bookingId: booking._id,
            });
        }



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

    /***************************************************************
     * Delete Booking Handler
     * Deletes a booking
     ***************************************************************/
    deleteBooking: async ({
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

        // Update booking status
        await ctx.db.patch(args.bookingId, {
            deleted: true,
            deletedAt: now,
            deletedBy: user._id,
        });

        return { success: true };
    },

    /***************************************************************
     * Allow Rebooking Handler
     * Changes cancelled_by_business status to cancelled_by_business_rebookable
     ***************************************************************/
    allowRebooking: async ({
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

        // Check if user has permission to modify this booking
        if (booking.businessId !== user.businessId) {
            throw new ConvexError({
                message: "You are not authorized to modify this booking",
                field: "businessId",
                code: ERROR_CODES.UNAUTHORIZED,
            });
        }

        // Only allow rebooking for bookings cancelled or rejected by business
        if (booking.status !== "cancelled_by_business" && booking.status !== "rejected_by_business") {
            throw new ConvexError({
                message: "Only business-cancelled or rejected bookings can be made rebookable",
                field: "status",
                code: ERROR_CODES.ACTION_NOT_ALLOWED,
            });
        }

        // Update booking status to rebookable
        await ctx.db.patch(args.bookingId, {
            status: "cancelled_by_business_rebookable",
            updatedAt: now,
            updatedBy: user._id,
        });

        return { success: true };
    },

    /***************************************************************
     * Approve Booking Handler
     * Approves a booking that was awaiting business confirmation
     ***************************************************************/
    approveBooking: async ({
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

        // Check if user has permission to approve this booking (must be business owner/staff)
        if (booking.businessId !== user.businessId) {
            throw new ConvexError({
                message: "You are not authorized to approve this booking",
                field: "businessId",
                code: ERROR_CODES.UNAUTHORIZED,
            });
        }

        // Only allow approval of awaiting_approval bookings
        if (booking.status !== "awaiting_approval") {
            throw new ConvexError({
                message: `Cannot approve booking with status: ${booking.status}`,
                field: "status",
                code: ERROR_CODES.ACTION_NOT_ALLOWED,
            });
        }

        // Update booking status to pending (approved)
        await ctx.db.patch(args.bookingId, {
            status: "pending",
            approvedAt: now,
            approvedBy: user._id,
            updatedAt: now,
            updatedBy: user._id,
        });

        return { success: true };
    },

    /***************************************************************
     * Reject Booking Handler
     * Rejects a booking that was awaiting business confirmation
     * Issues full refund to the user
     ***************************************************************/
    rejectBooking: async ({
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

        // Check if user has permission to reject this booking (must be business owner/staff)
        if (booking.businessId !== user.businessId) {
            throw new ConvexError({
                message: "You are not authorized to reject this booking",
                field: "businessId",
                code: ERROR_CODES.UNAUTHORIZED,
            });
        }

        // Only allow rejection of awaiting_approval bookings
        if (booking.status !== "awaiting_approval") {
            throw new ConvexError({
                message: `Cannot reject booking with status: ${booking.status}`,
                field: "status",
                code: ERROR_CODES.ACTION_NOT_ALLOWED,
            });
        }

        // Get class instance to decrement booked count
        const instance = await ctx.db.get(booking.classInstanceId);
        if (!instance) {
            throw new ConvexError({
                message: "Class instance not found",
                field: "classInstanceId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Get template for refund description
        const template = await ctx.db.get(instance.templateId);

        // Calculate full refund (100% for rejections)
        const refundAmountInCents = booking.finalPrice;
        const refundAmountInCredits = centsToCredits(booking.finalPrice);

        // Update booking status to rejected
        await ctx.db.patch(args.bookingId, {
            status: "rejected_by_business",
            rejectedAt: now,
            rejectedBy: user._id,
            rejectByBusinessReason: args.reason,
            refundAmount: refundAmountInCents,
            updatedAt: now,
            updatedBy: user._id,
        });

        // Decrease booked count
        await ctx.db.patch(booking.classInstanceId, {
            bookedCount: Math.max(0, instance.bookedCount - 1),
            updatedAt: now,
            updatedBy: user._id,
        });

        // Process full refund if there was a charge
        if (refundAmountInCredits > 0) {
            const refundDescription = `Refund for rejected booking: ${template?.name ?? 'Class'} (100% refund)`;

            await creditService.addCredits(ctx, {
                userId: booking.userId,
                amount: refundAmountInCredits,
                type: "refund",
                reason: "business_cancellation", // Using business_cancellation as the closest reason
                description: refundDescription,
                businessId: booking.businessId,
                venueId: instance.venueId,
                classTemplateId: instance.templateId,
                classInstanceId: booking.classInstanceId,
                bookingId: booking._id,
            });
        }

        return { success: true };
    },

    /***************************************************************
     * Get Active Bookings Count Handler
     * Returns the current count of active bookings for a user
     ***************************************************************/
    getActiveBookingsCount: async ({
        ctx,
        user,
    }: {
        ctx: QueryCtx;
        user: Doc<"users">;
    }): Promise<{ count: number; limit: number }> => {
        const { countActiveBookings } = await import("../rules/booking");
        const { BOOKING_LIMITS } = await import("../utils/constants");

        // Get user's bookings
        const userBookings = await ctx.db
            .query("bookings")
            .withIndex("by_user_class", q => q.eq("userId", user._id))
            .filter(q => q.neq(q.field("deleted"), true))
            .collect();

        const count = countActiveBookings(userBookings);

        return {
            count,
            limit: BOOKING_LIMITS.MAX_ACTIVE_BOOKINGS_PER_USER
        };
    },

    /***************************************************************
     * Get Active Bookings Details Handler  
     * Returns detailed active bookings for UX display
     ***************************************************************/
    getActiveBookingsDetails: async ({
        ctx,
        user,
    }: {
        ctx: QueryCtx;
        user: Doc<"users">;
    }): Promise<import("../rules/booking").ActiveBookingSummary[]> => {
        const { getActiveBookingsDetails } = await import("../rules/booking");

        // Get user's bookings
        const userBookings = await ctx.db
            .query("bookings")
            .withIndex("by_user_class", q => q.eq("userId", user._id))
            .filter(q => q.neq(q.field("deleted"), true))
            .collect();

        return getActiveBookingsDetails(userBookings);
    },
};