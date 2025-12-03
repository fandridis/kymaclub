import type { Doc, Id } from "../convex/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import { widgetRules } from "../rules/widget";
import type {
    WidgetConfig,
    WidgetStatus,
    WalkIn,
    WalkInEntry,
    SetupParticipant,
    ClassInstanceWidget,
} from "../types/widget";

// Widget display names by type
const WIDGET_DISPLAY_NAMES: Record<WidgetConfig["type"], string> = {
    tournament_americano: "Padel Americano Tournament",
    tournament_round_robin: "Round Robin Tournament",
    tournament_brackets: "Bracket Tournament",
};

// Generate a unique ID for walk-ins
const generateWalkInId = (): string => {
    return `walkin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/***************************************************************
 * Widget Service - Orchestration layer for widget operations
 * 
 * This service handles all widget-related database operations and
 * coordinates between the widget rules, operations, and type-specific
 * tournament services.
 * 
 * NEW PARTICIPANT MODEL:
 * - During setup: participants are derived from bookings + walkIns array
 * - When tournament starts: participants snapshot into widgetState.participants
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
                q.eq("classInstanceId", args.classInstanceId).eq("deleted", undefined)
            )
            .first();

        widgetRules.instanceMustNotHaveWidget(existingWidget);

        // Create the widget with empty walkIns array
        const now = Date.now();
        const widgetId = await ctx.db.insert("classInstanceWidgets", {
            classInstanceId: args.classInstanceId,
            businessId: instance.businessId,
            widgetConfig: args.widgetConfig,
            walkIns: [], // Initialize empty walk-ins array
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
        // Note: No need to delete participants - walkIns are embedded in widget
    },

    /***************************************************************
     * Update Widget Config
     * Updates the configuration of a widget (only allowed during setup)
     ***************************************************************/
    updateWidgetConfig: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            widgetId: Id<"classInstanceWidgets">;
            widgetConfig: WidgetConfig;
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

        // Can only update config during setup
        widgetRules.widgetMustBeInStatus(widget, ["setup"]);

        // Validate that the widget type matches
        if (widget.widgetConfig.type !== args.widgetConfig.type) {
            throw new ConvexError({
                message: "Cannot change widget type",
                field: "widgetConfig.type",
                code: ERROR_CODES.ACTION_NOT_ALLOWED,
            });
        }

        const now = Date.now();

        // Update the widget config
        await ctx.db.patch(args.widgetId, {
            widgetConfig: args.widgetConfig,
            updatedAt: now,
            updatedBy: user._id,
        });

        // Update the widget snapshot on the class instance
        const instance = await ctx.db.get(widget.classInstanceId);
        if (instance) {
            const displayName = WIDGET_DISPLAY_NAMES[args.widgetConfig.type];
            const updatedSnapshots = (instance.widgetSnapshots ?? []).map(snapshot =>
                snapshot.widgetId === args.widgetId
                    ? { ...snapshot, name: displayName }
                    : snapshot
            );
            await ctx.db.patch(widget.classInstanceId, {
                widgetSnapshots: updatedSnapshots,
                updatedAt: now,
                updatedBy: user._id,
            });
        }
    },

    /***************************************************************
     * Get Setup Participants
     * Derives participant list from pending bookings + walkIns array
     * Used during setup mode before tournament starts
     ***************************************************************/
    getSetupParticipants: async ({
        ctx,
        widget,
    }: {
        ctx: QueryCtx;
        widget: ClassInstanceWidget;
    }): Promise<SetupParticipant[]> => {
        const participants: SetupParticipant[] = [];

        // Get all pending bookings for this class instance
        const bookings = await ctx.db
            .query("bookings")
            .withIndex("by_class_instance_status", q =>
                q.eq("classInstanceId", widget.classInstanceId).eq("status", "pending")
            )
            .collect();

        // Add booking participants
        for (const booking of bookings) {
            const bookingUser = await ctx.db.get(booking.userId);
            const displayName = booking.userSnapshot?.name
                || bookingUser?.name
                || booking.userSnapshot?.email
                || "Unknown User";

            participants.push({
                id: `booking_${booking._id}`,
                displayName,
                isWalkIn: false,
                bookingId: booking._id,
                userId: booking.userId,
            });
        }

        // Add walk-in participants
        const walkIns = widget.walkIns ?? [];
        for (const walkIn of walkIns) {
            participants.push({
                id: `walkin_${walkIn.id}`,
                displayName: walkIn.name,
                isWalkIn: true,
                walkInId: walkIn.id,
                walkInPhone: walkIn.phone,
                walkInEmail: walkIn.email,
            });
        }

        return participants;
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
    }): Promise<(ClassInstanceWidget & { setupParticipants: SetupParticipant[] }) | null> => {
        const widget = await ctx.db
            .query("classInstanceWidgets")
            .withIndex("by_class_instance_deleted", q =>
                q.eq("classInstanceId", classInstanceId).eq("deleted", undefined)
            )
            .first();

        if (!widget) {
            return null;
        }

        // Get setup participants (derived from bookings + walkIns)
        const setupParticipants = await widgetService.getSetupParticipants({ ctx, widget });

        return {
            ...widget,
            setupParticipants,
        };
    },

    /***************************************************************
     * Get Widget by ID
     * Returns a widget with setup participants
     ***************************************************************/
    getWidgetById: async ({
        ctx,
        widgetId,
    }: {
        ctx: QueryCtx;
        widgetId: Id<"classInstanceWidgets">;
    }): Promise<(ClassInstanceWidget & { setupParticipants: SetupParticipant[] }) | null> => {
        const widget = await ctx.db.get(widgetId);
        if (!widget || widget.deleted) {
            return null;
        }

        // Get setup participants (derived from bookings + walkIns)
        const setupParticipants = await widgetService.getSetupParticipants({ ctx, widget });

        return {
            ...widget,
            setupParticipants,
        };
    },

    /***************************************************************
     * Add Walk-In
     * Adds a non-registered user to the widget's walkIns array
     ***************************************************************/
    addWalkIn: async ({
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
    }): Promise<{ walkInId: string }> => {
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
        const existingWalkIns = widget.walkIns ?? [];
        widgetRules.walkInNameMustBeUnique(existingWalkIns, args.walkIn.name);

        // Create walk-in entry with generated ID
        const walkInId = generateWalkInId();
        const walkInEntry: WalkInEntry = {
            id: walkInId,
            name: args.walkIn.name,
            phone: args.walkIn.phone,
            email: args.walkIn.email,
            createdAt: Date.now(),
        };

        // Add to walkIns array
        await ctx.db.patch(args.widgetId, {
            walkIns: [...existingWalkIns, walkInEntry],
            updatedAt: Date.now(),
            updatedBy: user._id,
        });

        return { walkInId };
    },

    /***************************************************************
     * Remove Walk-In
     * Removes a walk-in from the widget's walkIns array
     ***************************************************************/
    removeWalkIn: async ({
        ctx,
        args,
        user,
    }: {
        ctx: MutationCtx;
        args: {
            widgetId: Id<"classInstanceWidgets">;
            walkInId: string;
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
        widgetRules.canRemoveParticipant(widget);

        // Find and remove the walk-in
        const existingWalkIns = widget.walkIns ?? [];
        const walkInIndex = existingWalkIns.findIndex(w => w.id === args.walkInId);

        if (walkInIndex === -1) {
            throw new ConvexError({
                message: "Walk-in not found",
                field: "walkInId",
                code: ERROR_CODES.RESOURCE_NOT_FOUND,
            });
        }

        // Remove from array
        const updatedWalkIns = [
            ...existingWalkIns.slice(0, walkInIndex),
            ...existingWalkIns.slice(walkInIndex + 1),
        ];

        await ctx.db.patch(args.widgetId, {
            walkIns: updatedWalkIns,
            updatedAt: Date.now(),
            updatedBy: user._id,
        });
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
