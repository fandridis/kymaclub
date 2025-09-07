import { mutation as rawMutation, internalMutation as rawInternalMutation } from "../_generated/server";
import { DataModel } from "../_generated/dataModel";
import { Triggers } from "convex-helpers/server/triggers";
import { customCtx, customMutation } from "convex-helpers/server/customFunctions";
import { internal } from "../_generated/api";
import { classInstanceRules } from "../../rules/classInstance";
import { classInstanceOperations } from "../../operations/classInstance";
import { venueRules } from "../../rules/venue";
import { creditService } from "../../services/creditService";
import { notificationService } from "../../services/notificationService";
import { reviewsService } from "../../services/reviewsService";
import { format } from "date-fns";

const triggers = new Triggers<DataModel>();

// create wrappers that replace the built-in `mutation` and `internalMutation`
// the wrappers override `ctx` so that `ctx.db.insert`, `ctx.db.patch`, etc. run registered trigger functions
export const mutationWithTriggers = customMutation(rawMutation, customCtx(triggers.wrapDB));
export const internalMutationWithTriggers = customMutation(rawInternalMutation, customCtx(triggers.wrapDB));

/***************************************************************
 * VENUE TRIGGERS
 ***************************************************************/
triggers.register("venues", async (ctx, change) => {
    const { id, oldDoc, newDoc, operation } = change;

    if (!oldDoc || !newDoc) {
        return;
    }

    if (operation === "update") {
        if (classInstanceRules.venueChangesRequireInstanceUpdate({ existingVenue: oldDoc, updatedVenue: newDoc })) {
            const instancesToUpdate = await ctx.db
                .query("classInstances")
                .withIndex("by_venue", q => q.eq("venueId", id))
                .filter(q => q.eq(q.field("status"), "scheduled"))
                .collect();

            const instanceUpdates = classInstanceOperations.prepareInstanceUpdatesFromVenueChanges(
                instancesToUpdate,
                newDoc
            );

            for (const update of instanceUpdates) {
                await ctx.db.patch(update.instanceId, update.changes);
            }
        }

        if (venueRules.coordinatesNeedRecalculation({ oldVenue: oldDoc, newVenue: newDoc })) {
            await ctx.scheduler.runAfter(0, internal.actions.venue.generateVenueCoordinates, {
                venueId: id,
                fullAddress: newDoc.address?.street + ' ' + newDoc.address?.city + ' ' + newDoc.address?.state + ' ' + newDoc.address?.zipCode + ' ' + newDoc.address?.country,
            });
        }
    }
});

/***************************************************************
 * CLASS TEMPLATE TRIGGERS
 ***************************************************************/
triggers.register("classTemplates", async (ctx, change) => {
    const { id, oldDoc, newDoc, operation } = change;

    if (!oldDoc || !newDoc) {
        return;
    }

    if (operation === "update") {
        if (classInstanceRules.templateChangesRequireInstanceUpdate({ existingTemplate: oldDoc, updatedTemplate: newDoc })) {
            const instancesToUpdate = await ctx.db
                .query("classInstances")
                .withIndex("by_template", q => q.eq("templateId", id))
                .filter(q => q.eq(q.field("status"), "scheduled"))
                .collect();

            const instanceUpdates = classInstanceOperations.prepareInstanceUpdatesFromTemplateChanges(
                instancesToUpdate,
                newDoc
            );

            for (const update of instanceUpdates) {
                await ctx.db.patch(update.instanceId, update.changes);
            }
        }
    }
});

/***************************************************************
 * USER TRIGGERS
 ***************************************************************/
triggers.register("users", async (ctx, change) => {
    const { id, oldDoc, newDoc, operation } = change;

    if (!oldDoc || !newDoc) {
        return;
    }

    if (operation === "update" && !oldDoc.hasConsumerOnboarded && newDoc.hasConsumerOnboarded) {
        await creditService.addCredits(ctx, {
            userId: id,
            amount: 10,
            type: "gift",
            reason: "welcome_bonus",
            description: "Welcome bonus for new consumer",
        });
    }
});

/***************************************************************
 * BOOKING TRIGGERS
 ***************************************************************/
triggers.register("bookings", async (ctx, change) => {
    const { id, oldDoc, newDoc, operation } = change;

    if (operation === 'insert') {
        await ctx.scheduler.runAfter(100, internal.mutations.notifications.handleNewClassBookingEvent, {
            payload: {
                bookingId: id,
                userId: newDoc.userId,
                classInstanceId: newDoc.classInstanceId,
                businessId: newDoc.businessId,
                creditsPaid: newDoc.creditsUsed,
            },
        });
    }

    const becameCancelled = newDoc?.status === 'cancelled_by_consumer' || newDoc?.status === 'cancelled_by_business';
    const becameRebookable = oldDoc?.status !== 'cancelled_by_business_rebookable' && newDoc?.status === 'cancelled_by_business_rebookable';

    if (operation === 'update' && (becameCancelled)) {
        if (newDoc.cancelledBy === "consumer") {
            await ctx.scheduler.runAfter(100, internal.mutations.notifications.handleUserCancelledBookingEvent, {
                payload: {
                    bookingId: id,
                    userId: newDoc.userId,
                    classInstanceId: newDoc.classInstanceId,
                    businessId: newDoc.businessId,
                    creditsPaid: newDoc.creditsUsed,
                },
            });
        }
        if (newDoc.cancelledBy === "business") {
            await ctx.scheduler.runAfter(100, internal.mutations.notifications.handleBusinessCancelledBookingEvent, {
                payload: {
                    bookingId: id,
                    userId: newDoc.userId,
                    classInstanceId: newDoc.classInstanceId,
                    businessId: newDoc.businessId,
                    creditsPaid: newDoc.creditsUsed,
                },
            });
        }
    }

    if (operation === 'update' && becameRebookable) {
        await ctx.scheduler.runAfter(100, internal.mutations.notifications.handleRebookableBookingEvent, {
            payload: {
                bookingId: id,
                userId: newDoc.userId,
                classInstanceId: newDoc.classInstanceId,
                businessId: newDoc.businessId,
                creditsPaid: newDoc.creditsUsed,
            },
        });
    }
});

/***************************************************************
 * VENUE REVIEWS TRIGGERS
 ***************************************************************/
triggers.register("venueReviews", async (ctx, change) => {
    const { id, newDoc, operation } = change;

    if (operation === 'insert' && newDoc) {
        // Only process reviews that have comments (text to moderate)
        if (newDoc.comment && newDoc.comment.trim().length > 0) {
            // Schedule AI moderation
            await ctx.scheduler.runAfter(0, internal.actions.ai.moderateVenueReview, {
                reviewText: newDoc.comment,
                reviewId: id, // Pass reviewId to the action
            });
        } else {
            // No comment to moderate, auto-approve if it's just a rating
            const now = Date.now();
            await ctx.db.patch(id, {
                moderationStatus: "auto_approved",
                aiModerationScore: 0, // 0% probability of being bad for rating-only reviews
                aiModerationReason: "Rating-only review - auto-approved",
                aiModeratedAt: now,
                isVisible: true,
                updatedAt: now,
            });

            // Update venue rating stats since review is now visible
            await reviewsService._updateVenueRatingStats(ctx, newDoc.venueId);
        }
    }
});

/***************************************************************
 * SUBSCRIPTION EVENTS TRIGGERS
 ***************************************************************/
triggers.register("subscriptionEvents", async (ctx, change) => {
    const { id, oldDoc, newDoc, operation } = change;

    if (operation === 'insert' && newDoc && newDoc.creditsAllocated && newDoc.creditsAllocated > 0) {
        // Get subscription details to find user ID
        if (newDoc.subscriptionId) {
            const subscription = await ctx.db.get(newDoc.subscriptionId);
            if (subscription) {
                await ctx.scheduler.runAfter(100, internal.mutations.notifications.handleSubscriptionCreditsReceivedEvent, {
                    payload: {
                        subscriptionEventId: id,
                        subscriptionId: newDoc.subscriptionId,
                        userId: subscription.userId,
                        creditsAllocated: newDoc.creditsAllocated,
                        eventType: newDoc.eventType,
                        planName: subscription.planName
                    },
                });
            } else {
                console.warn('Subscription not found for subscription event', { subscriptionId: newDoc.subscriptionId });
            }
        } else {
            console.warn('No subscriptionId in subscription event', { subscriptionEventId: id });
        }
    }
});