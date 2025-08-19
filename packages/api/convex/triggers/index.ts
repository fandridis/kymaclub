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

    // Handle new booking creation
    if (operation === "insert" && newDoc) {
        try {
            // Get related data for notification
            const user = await ctx.db.get(newDoc.userId);
            const classInstance = await ctx.db.get(newDoc.classInstanceId);
            const template = classInstance ? await ctx.db.get(classInstance.templateId) : null;
            const venue = classInstance ? await ctx.db.get(classInstance.venueId) : null;
            const business = await ctx.db.get(newDoc.businessId);

            if (!user || !classInstance || !template || !venue || !business) {
                console.error("Missing related data for booking notification:", {
                    userId: newDoc.userId,
                    classInstanceId: newDoc.classInstanceId,
                    templateId: classInstance?.templateId,
                    venueId: classInstance?.venueId,
                    businessId: newDoc.businessId
                });
                return;
            }

            // Format class time for display
            const classDate = new Date(classInstance.startTime);
            const classTime = classDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });

            // Create web notification for business
            await notificationService.createNotification({
                ctx,
                args: {
                    businessId: newDoc.businessId,
                    recipientType: "business",
                    type: "booking_created",
                    title: "New Booking",
                    message: `${user.name || user.email || "Customer"} booked ${template.name} at ${venue.name}`,
                    relatedBookingId: id,
                    relatedClassInstanceId: newDoc.classInstanceId,
                    metadata: {
                        className: template.name,
                        userEmail: user.email,
                        userName: user.name || user.email || "Customer",
                        amount: newDoc.finalPrice,
                    }
                },
                user: user // Using the booking user as the creator for audit trail
            });

            // Schedule email notification to business
            // iif node env is test ignore this trigger
            if (process.env.NODE_ENV === "production") {
                await ctx.scheduler.runAfter(0, internal.actions.email.sendBookingNotificationEmail, {
                    businessEmail: business.email,
                    businessName: business.name,
                    customerName: user.name || user.email || "Customer",
                    customerEmail: user.email,
                    className: template.name,
                    venueName: venue.name,
                    classTime: classTime,
                    bookingAmount: newDoc.finalPrice,
                    notificationType: "booking_created",
                });
            }

            console.log(`✅ Created booking notification for business ${newDoc.businessId}`);

        } catch (error) {
            console.error("Failed to create booking notification:", error);
            // Don't throw - we don't want to fail the booking if notification fails
        }
    }

    // Handle booking cancellation
    if (operation === "update" && oldDoc && newDoc) {
        if (oldDoc.status === "pending" && newDoc.status === "cancelled") {
            try {
                // Get related data for notification
                const user = await ctx.db.get(newDoc.userId);
                const classInstance = await ctx.db.get(newDoc.classInstanceId);
                const template = classInstance ? await ctx.db.get(classInstance.templateId) : null;
                const venue = classInstance ? await ctx.db.get(classInstance.venueId) : null;
                const business = await ctx.db.get(newDoc.businessId);

                if (!user || !classInstance || !template || !venue || !business) {
                    console.error("Missing related data for cancellation notification");
                    return;
                }

                // Format class time for display
                const classDate = new Date(classInstance.startTime);
                const classTime = classDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                });

                // Determine who should be notified based on who cancelled
                if (newDoc.cancelledBy === "consumer") {
                    // Consumer cancelled - notify business
                    await notificationService.createNotification({
                        ctx,
                        args: {
                            businessId: newDoc.businessId,
                            recipientType: "business",
                            type: "booking_cancelled",
                            title: "Booking Cancelled",
                            message: `${user.name || user.email || "Customer"} cancelled ${template.name} at ${venue.name} (${classTime})`,
                            relatedBookingId: id,
                            relatedClassInstanceId: newDoc.classInstanceId,
                            metadata: {
                                className: template.name,
                                userEmail: user.email,
                                userName: user.name || user.email || "Customer",
                                amount: newDoc.originalPrice,
                            }
                        },
                        user: user
                    });

                    // Schedule email notification to business about consumer cancellation
                    if (process.env.NODE_ENV === "production") {
                        await ctx.scheduler.runAfter(0, internal.actions.email.sendBookingNotificationEmail, {
                            businessEmail: business.email,
                            businessName: business.name,
                            customerName: user.name || user.email || "Customer",
                            customerEmail: user.email,
                            className: template.name,
                            venueName: venue.name,
                            classTime: classTime,
                            bookingAmount: newDoc.originalPrice,
                            notificationType: "booking_cancelled",
                        });
                    }

                    console.log(`✅ Created cancellation notification for business ${newDoc.businessId} (cancelled by consumer)`);

                } else if (newDoc.cancelledBy === "business") {
                    // Business cancelled - notify consumer
                    await notificationService.createNotification({
                        ctx,
                        args: {
                            businessId: newDoc.businessId,
                            recipientType: "consumer",
                            type: "booking_cancelled_by_business",
                            title: "Booking Cancelled",
                            message: `Your booking for ${template.name} at ${venue.name} (${classTime}) was cancelled by ${business.name}`,
                            relatedBookingId: id,
                            relatedClassInstanceId: newDoc.classInstanceId,
                            metadata: {
                                className: template.name,
                                businessName: business.name,
                                venueName: venue.name,
                                amount: newDoc.originalPrice,
                            }
                        },
                        user: user
                    });

                    // Schedule email notification to consumer about business cancellation
                    if (process.env.NODE_ENV === "production" && user.email) {
                        await ctx.scheduler.runAfter(0, internal.actions.email.sendBookingNotificationEmail, {
                            businessEmail: user.email, // Send to customer
                            businessName: business.name,
                            customerName: user.name || user.email || "Customer",
                            customerEmail: user.email,
                            className: template.name,
                            venueName: venue.name,
                            classTime: classTime,
                            bookingAmount: newDoc.originalPrice,
                            notificationType: "booking_cancelled_by_business",
                        });
                    }

                    console.log(`✅ Created cancellation notification for consumer ${user._id} (cancelled by business)`);
                } else {
                    // Fallback for legacy bookings without cancelledBy field - assume consumer cancelled
                    await notificationService.createNotification({
                        ctx,
                        args: {
                            businessId: newDoc.businessId,
                            recipientType: "business",
                            type: "booking_cancelled",
                            title: "Booking Cancelled",
                            message: `${user.name || user.email || "Customer"} cancelled ${template.name} at ${venue.name} (${classTime})`,
                            relatedBookingId: id,
                            relatedClassInstanceId: newDoc.classInstanceId,
                            metadata: {
                                className: template.name,
                                userEmail: user.email,
                                userName: user.name || user.email || "Customer",
                                amount: newDoc.originalPrice,
                            }
                        },
                        user: user
                    });

                    console.log(`✅ Created legacy cancellation notification for business ${newDoc.businessId}`);
                }

            } catch (error) {
                console.error("Failed to create cancellation notification:", error);
                // Don't throw - we don't want to fail the cancellation if notification fails
            }
        }
    }
});