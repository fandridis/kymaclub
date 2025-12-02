import type { Doc, Id } from "../convex/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import { widgetRules } from "../rules/widget";
import type {
    WidgetConfig,
    WidgetStatus,
    WidgetWithParticipants,
    WidgetParticipant,
    WalkIn,
    ClassInstanceWidget,
    TournamentAmericanoConfig,
    isAmericanoConfig,
} from "../types/widget";

// Widget display names by type
const WIDGET_DISPLAY_NAMES: Record<WidgetConfig["type"], string> = {
    tournament_americano: "Padel Americano Tournament",
    tournament_round_robin: "Round Robin Tournament",
    tournament_brackets: "Bracket Tournament",
};

/***************************************************************
 * Widget Service - Orchestration layer for widget operations
 * 
 * This service handles all widget-related database operations and
 * coordinates between the widget rules, operations, and type-specific
 * tournament services.
 ***************************************************************/
export const widgetService = {
    /***************************************************************
     * Attach Widget to Class Instance
     * Creates a new widget attachment for a class instance
     ***************************************************************/
    attachWidget: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            classInstanceId: Id<"classInstances">;
            widgetConfig: WidgetConfig;
        };
        user: Doc<"users">;
    }): Promise<{ widgetId: Id<"classInstanceWidgets"> }> => {
        // Get the class instance
        const instance = await ctx.db.get(args.classInstanceId);
        if (!instance) {
            throw new ConvexError({
                message: "Class instance not found",
                field: "classInstanceId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Authorization check
        widgetRules.userMustBeInstanceOwner(instance, user);

        // Business rule checks
        widgetRules.canAttachWidget(instance);

        // Check if widget already exists for this instance
        const existingWidget = await ctx.db
            .query("classInstanceWidgets")
            .withIndex("by_class_instance_deleted", q =>
                q.eq("classInstanceId", args.classInstanceId).eq("deleted", false)
            )
            .first();

        widgetRules.instanceMustNotHaveWidget(existingWidget);

        // Create the widget
        const now = Date.now();
        const widgetId = await ctx.db.insert("classInstanceWidgets", {
            classInstanceId: args.classInstanceId,
            businessId: instance.businessId,
            widgetConfig: args.widgetConfig,
            status: "setup",
            createdAt: now,
            createdBy: user._id,
        });

        // Add widget snapshot to the class instance
        const widgetSnapshot = {
            widgetId,
            type: args.widgetConfig.type,
            name: WIDGET_DISPLAY_NAMES[args.widgetConfig.type],
        };

        const existingSnapshots = instance.widgetSnapshots ?? [];
        await ctx.db.patch(args.classInstanceId, {
            widgetSnapshots: [...existingSnapshots, widgetSnapshot],
            updatedAt: now,
            updatedBy: user._id,
        });

        return { widgetId };
    },

    /***************************************************************
     * Detach Widget from Class Instance
     * Removes a widget from a class instance (soft delete)
     ***************************************************************/
    detachWidget: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            widgetId: Id<"classInstanceWidgets">;
        };
        user: Doc<"users">;
    }): Promise<void> => {
        const widget = await ctx.db.get(args.widgetId);
        if (!widget || widget.deleted) {
            throw new ConvexError({
                message: "Widget not found",
                field: "widgetId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Authorization check
        widgetRules.userMustBeWidgetOwner(widget, user);

        // Business rule check
        widgetRules.canDetachWidget(widget);

        // Soft delete the widget
        const now = Date.now();
        await ctx.db.patch(args.widgetId, {
            deleted: true,
            deletedAt: now,
            deletedBy: user._id,
        });

        // Remove widget snapshot from class instance
        const instance = await ctx.db.get(widget.classInstanceId);
        if (instance) {
            const updatedSnapshots = (instance.widgetSnapshots ?? []).filter(
                snapshot => snapshot.widgetId !== args.widgetId
            );
            await ctx.db.patch(widget.classInstanceId, {
                widgetSnapshots: updatedSnapshots.length > 0 ? updatedSnapshots : undefined,
                updatedAt: now,
                updatedBy: user._id,
            });
        }

        // Also delete all participants
        const participants = await ctx.db
            .query("widgetParticipants")
            .withIndex("by_widget", q => q.eq("widgetId", args.widgetId))
            .collect();

        for (const participant of participants) {
            await ctx.db.delete(participant._id);
        }
    },

    /***************************************************************
     * Get Widget for Class Instance
     * Returns the widget attached to a class instance (if any)
     ***************************************************************/
    getWidgetForInstance: async ({
        ctx,
        classInstanceId,
    }: {
        ctx: QueryCtx;
        classInstanceId: Id<"classInstances">;
    }): Promise<WidgetWithParticipants | null> => {
        console.log('[widgetService.getWidgetForInstance]--->', classInstanceId);
        const widget = await ctx.db
            .query("classInstanceWidgets")
            .withIndex("by_class_instance_deleted", q =>
                q.eq("classInstanceId", classInstanceId).eq("deleted", undefined)
            )
            .first();

        if (!widget) {
            return null;
        }

        // Get participants
        const participants = await ctx.db
            .query("widgetParticipants")
            .withIndex("by_widget", q => q.eq("widgetId", widget._id))
            .collect();

        return {
            ...widget,
            participants,
        };
    },

    /***************************************************************
     * Get Widget by ID
     * Returns a widget with all its participants
     ***************************************************************/
    getWidgetById: async ({
        ctx,
        widgetId,
    }: {
        ctx: QueryCtx;
        widgetId: Id<"classInstanceWidgets">;
    }): Promise<WidgetWithParticipants | null> => {
        const widget = await ctx.db.get(widgetId);
        if (!widget || widget.deleted) {
            return null;
        }

        // Get participants
        const participants = await ctx.db
            .query("widgetParticipants")
            .withIndex("by_widget", q => q.eq("widgetId", widgetId))
            .collect();

        return {
            ...widget,
            participants,
        };
    },

    /***************************************************************
     * Get Participants for Widget
     * Returns all participants for a widget
     ***************************************************************/
    getParticipants: async ({
        ctx,
        widgetId,
    }: {
        ctx: QueryCtx;
        widgetId: Id<"classInstanceWidgets">;
    }): Promise<WidgetParticipant[]> => {
        return await ctx.db
            .query("widgetParticipants")
            .withIndex("by_widget", q => q.eq("widgetId", widgetId))
            .collect();
    },

    /***************************************************************
     * Add Walk-In Participant
     * Adds a non-registered user as a participant
     ***************************************************************/
    addWalkInParticipant: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            widgetId: Id<"classInstanceWidgets">;
            walkIn: WalkIn;
        };
        user: Doc<"users">;
    }): Promise<{ participantId: Id<"widgetParticipants"> }> => {
        const widget = await ctx.db.get(args.widgetId);
        if (!widget || widget.deleted) {
            throw new ConvexError({
                message: "Widget not found",
                field: "widgetId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Authorization check
        widgetRules.userMustBeWidgetOwner(widget, user);

        // Business rule check
        widgetRules.canAddParticipant(widget);

        // Check for duplicate walk-in name
        const existingParticipants = await ctx.db
            .query("widgetParticipants")
            .withIndex("by_widget", q => q.eq("widgetId", args.widgetId))
            .collect();

        widgetRules.walkInNameMustBeUnique(existingParticipants, args.walkIn.name);

        // Create participant
        const now = Date.now();
        const participantId = await ctx.db.insert("widgetParticipants", {
            widgetId: args.widgetId,
            walkIn: args.walkIn,
            displayName: args.walkIn.name,
            createdAt: now,
            createdBy: user._id,
        });

        return { participantId };
    },

    /***************************************************************
     * Add Booking as Participant
     * Links a booking to the widget as a participant
     ***************************************************************/
    addBookingParticipant: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            widgetId: Id<"classInstanceWidgets">;
            bookingId: Id<"bookings">;
        };
        user: Doc<"users">;
    }): Promise<{ participantId: Id<"widgetParticipants"> }> => {
        const widget = await ctx.db.get(args.widgetId);
        if (!widget || widget.deleted) {
            throw new ConvexError({
                message: "Widget not found",
                field: "widgetId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Authorization check
        widgetRules.userMustBeWidgetOwner(widget, user);

        // Business rule check
        widgetRules.canAddParticipant(widget);

        // Get the booking
        const booking = await ctx.db.get(args.bookingId);
        if (!booking || booking.deleted) {
            throw new ConvexError({
                message: "Booking not found",
                field: "bookingId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Verify booking is for the same class instance
        if (booking.classInstanceId !== widget.classInstanceId) {
            throw new ConvexError({
                message: "Booking is not for this class",
                field: "bookingId",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }

        // Check if booking is already a participant
        const existingParticipant = await ctx.db
            .query("widgetParticipants")
            .withIndex("by_booking", q => q.eq("bookingId", args.bookingId))
            .first();

        widgetRules.bookingMustNotBeParticipant(existingParticipant);

        // Get user info for display name
        const bookingUser = await ctx.db.get(booking.userId);
        const displayName = booking.userSnapshot?.name
            || bookingUser?.name
            || booking.userSnapshot?.email
            || "Unknown User";

        // Create participant
        const now = Date.now();
        const participantId = await ctx.db.insert("widgetParticipants", {
            widgetId: args.widgetId,
            bookingId: args.bookingId,
            displayName,
            createdAt: now,
            createdBy: user._id,
        });

        return { participantId };
    },

    /***************************************************************
     * Remove Participant
     * Removes a participant from the widget
     ***************************************************************/
    removeParticipant: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            participantId: Id<"widgetParticipants">;
        };
        user: Doc<"users">;
    }): Promise<void> => {
        const participant = await ctx.db.get(args.participantId);
        if (!participant) {
            throw new ConvexError({
                message: "Participant not found",
                field: "participantId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        const widget = await ctx.db.get(participant.widgetId);
        if (!widget || widget.deleted) {
            throw new ConvexError({
                message: "Widget not found",
                field: "widgetId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Authorization check
        widgetRules.userMustBeWidgetOwner(widget, user);

        // Business rule check
        widgetRules.canRemoveParticipant(widget);

        // Delete participant
        await ctx.db.delete(args.participantId);
    },

    /***************************************************************
     * Sync Participants from Bookings
     * Auto-adds all confirmed bookings as participants
     ***************************************************************/
    syncParticipantsFromBookings: async ({
        ctx,
        widgetId,
        user,
    }: {
        ctx: MutationCtx;
        widgetId: Id<"classInstanceWidgets">;
        user: Doc<"users">;
    }): Promise<{ addedCount: number }> => {
        const widget = await ctx.db.get(widgetId);
        if (!widget || widget.deleted) {
            throw new ConvexError({
                message: "Widget not found",
                field: "widgetId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Authorization check
        widgetRules.userMustBeWidgetOwner(widget, user);

        // Business rule check
        widgetRules.canAddParticipant(widget);

        // Get all pending bookings for this class instance
        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_class_instance_status", q =>
                q.eq("classInstanceId", widget.classInstanceId).eq("status", "pending")
            )
            .collect();

        // Get existing participants (bookings)
        const existingParticipants = await ctx.db
            .query("widgetParticipants")
            .withIndex("by_widget", q => q.eq("widgetId", widgetId))
            .collect();

        const existingBookingIds = new Set(
            existingParticipants
                .filter(p => p.bookingId)
                .map(p => p.bookingId)
        );

        // Add new participants
        let addedCount = 0;
        const now = Date.now();

        for (const booking of bookings) {
            if (existingBookingIds.has(booking._id)) {
                continue; // Already a participant
            }

            // Get user info for display name
            const bookingUser = await ctx.db.get(booking.userId);
            const displayName = booking.userSnapshot?.name
                || bookingUser?.name
                || booking.userSnapshot?.email
                || "Unknown User";

            await ctx.db.insert("widgetParticipants", {
                widgetId,
                bookingId: booking._id,
                displayName,
                createdAt: now,
                createdBy: user._id,
            });

            addedCount++;
        }

        return { addedCount };
    },

    /***************************************************************
     * Update Widget Status
     * Transitions the widget to a new status
     ***************************************************************/
    updateStatus: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            widgetId: Id<"classInstanceWidgets">;
            newStatus: WidgetStatus;
        };
        user: Doc<"users">;
    }): Promise<void> => {
        const widget = await ctx.db.get(args.widgetId);
        if (!widget || widget.deleted) {
            throw new ConvexError({
                message: "Widget not found",
                field: "widgetId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Authorization check
        widgetRules.userMustBeWidgetOwner(widget, user);

        // Validate transition
        widgetRules.canTransitionStatus(
            widget.status as WidgetStatus,
            args.newStatus
        );

        // Update status
        await ctx.db.patch(args.widgetId, {
            status: args.newStatus,
            updatedAt: Date.now(),
            updatedBy: user._id,
        });
    },

    /***************************************************************
     * Get Widgets for Business
     * Returns all widgets for a business, optionally filtered
     ***************************************************************/
    getWidgetsForBusiness: async ({
        ctx,
        args,
    }: {
        ctx: QueryCtx;
        args: {
            businessId: Id<"businesses">;
            status?: WidgetStatus;
            limit?: number;
        };
    }): Promise<ClassInstanceWidget[]> => {
        let query = ctx.db
            .query("classInstanceWidgets")
            .withIndex("by_business", q => q.eq("businessId", args.businessId));

        const widgets = await query.collect();

        // Filter by status and deleted
        let filtered = widgets.filter(w => !w.deleted);

        if (args.status) {
            filtered = filtered.filter(w => w.status === args.status);
        }

        // Apply limit
        if (args.limit) {
            filtered = filtered.slice(0, args.limit);
        }

        return filtered;
    },

    /***************************************************************
     * Lock Widget
     * Prevents any modifications to the widget until unlocked
     ***************************************************************/
    lockWidget: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            widgetId: Id<"classInstanceWidgets">;
        };
        user: Doc<"users">;
    }): Promise<void> => {
        const widget = await ctx.db.get(args.widgetId);
        if (!widget || widget.deleted) {
            throw new ConvexError({
                message: "Widget not found",
                field: "widgetId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Authorization check
        widgetRules.userMustBeWidgetOwner(widget, user);

        // Update lock state
        await ctx.db.patch(args.widgetId, {
            isLocked: true,
            updatedAt: Date.now(),
            updatedBy: user._id,
        });
    },

    /***************************************************************
     * Unlock Widget
     * Allows modifications to the widget again
     ***************************************************************/
    unlockWidget: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            widgetId: Id<"classInstanceWidgets">;
        };
        user: Doc<"users">;
    }): Promise<void> => {
        const widget = await ctx.db.get(args.widgetId);
        if (!widget || widget.deleted) {
            throw new ConvexError({
                message: "Widget not found",
                field: "widgetId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Authorization check
        widgetRules.userMustBeWidgetOwner(widget, user);

        // Update lock state
        await ctx.db.patch(args.widgetId, {
            isLocked: false,
            updatedAt: Date.now(),
            updatedBy: user._id,
        });
    },
};
