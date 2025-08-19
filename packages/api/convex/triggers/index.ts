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

    console.log(`🔥 🔥 🔥 🔥 🔥 🔥 VENUES TRIGGER ${operation} 🔥 🔥 🔥 🔥 🔥 🔥`)

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


    console.log(`🔥 🔥 🔥 🔥 🔥 🔥 CLASS TEMPLATE TRIGGER ${operation} 🔥 🔥 🔥 🔥 🔥 🔥`)

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


    console.log(`🔥 🔥 🔥 🔥 🔥 🔥 USER TRIGGER ${operation} 🔥 🔥 🔥 🔥 🔥 🔥`)

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

    console.log(`🔥 🔥 🔥 🔥 🔥 🔥 BOOKINGS TRIGGER ${operation} 🔥 🔥 🔥 🔥 🔥 🔥`)

    if (operation === 'insert') {
        notificationService.handleNewClassBookingEvent({
            ctx,
            payload: {
                bookingId: id,
                userId: newDoc.userId,
                classInstanceId: newDoc.classInstanceId,
                businessId: newDoc.businessId,
                creditsPaid: newDoc.creditsUsed,
            },
        });
    }

    if (operation === 'update' && newDoc.status === 'cancelled') {
        console.log('----- [triggers/bookings] cancelled -----');
        if (newDoc.cancelledBy === "consumer") {
            // await ctx.scheduler.runAfter(0, internal.mutations.notifications.handleUserCancelledBookingEvent, {
            //     payload: {
            //         bookingId: id,
            //         userId: newDoc.userId,
            //         classInstanceId: newDoc.classInstanceId,
            //         businessId: newDoc.businessId,
            //         creditsPaid: newDoc.creditsUsed,
            //     },
            // });
            notificationService.handleUserCancelledBookingEvent({
                ctx,
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
            notificationService.handleBusinessCancelledBookingEvent({
                ctx,
                payload: {
                    bookingId: id,
                    userId: newDoc.userId,
                    classInstanceId: newDoc.classInstanceId,
                    businessId: newDoc.businessId,
                    creditsPaid: newDoc.creditsUsed,
                },
            });
            // await ctx.scheduler.runAfter(0, internal.mutations.notifications.handleBusinessCancelledBookingEvent, {
            //     payload: {
            //         bookingId: id,
            //         userId: newDoc.userId,
            //         classInstanceId: newDoc.classInstanceId,
            //         businessId: newDoc.businessId,
            //         creditsPaid: newDoc.creditsUsed,
            //     },
            // });
        }
    }
});