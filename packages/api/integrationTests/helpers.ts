import { convexTest, TestConvexForDataModel } from "convex-test";
import { GenericDataModel } from "convex/server";
import { Id } from "../convex/_generated/dataModel";
import schema from "../convex/schema";
import { modules } from "../convex/test.setup";
import { api, internal } from "../convex/_generated/api";

export const testT = convexTest(schema, modules);

// Helper functions for setup
export async function createTestUser() {
    return await testT.mutation(internal.testFunctions.createTestUser, {
        user: {
            name: "Test User",
            email: "test@example.com",
            role: "admin",
            hasBusinessOnboarded: true,
        }
    });
}

export async function createTestBusiness(userId: Id<"users">) {
    return await testT.mutation(internal.testFunctions.createTestBusiness, {
        userId,
        business: { name: "Test Business" }
    });
}

export async function attachUserToBusiness(userId: Id<"users">, businessId: Id<"businesses">) {
    return await testT.mutation(internal.testFunctions.attachUserToBusiness, {
        userId,
        businessId,
        role: "admin"
    });
}

export async function createTestVenue(t: TestConvexForDataModel<GenericDataModel>, name: string = 'Test Studio') {
    return await t.mutation(internal.testFunctions.createTestVenue, {
        venue: {
            name,
            email: 'venue@example.com',
            address: {
                street: '123 Main St',
                city: 'Anytown',
                state: 'CA',
                zipCode: '12345',
                country: 'USA'
            },
            primaryCategory: 'wellness_center'
        }
    });
}

export async function createTestClassTemplate(
    t: TestConvexForDataModel<GenericDataModel>,
    userId: Id<"users">,
    businessId: Id<"businesses">,
    venueId: Id<"venues">,
    template: {
        name?: string;
        description?: string;
        instructor?: Id<"users">;
        duration?: number;
        capacity?: number;
        baseCredits?: number;
        tags?: string[];
        color?: string;
    } = {}
) {
    return await t.mutation(internal.testFunctions.createTestClassTemplate, {
        userId,
        businessId,
        template: {
            name: template.name || "Test Class",
            description: template.description || "A test class template",
            businessId,
            venueId,
            instructor: template.instructor || userId,
            duration: template.duration || 60,
            capacity: template.capacity || 20,
            baseCredits: template.baseCredits || 1,
            tags: template.tags || ["test", "fitness"],
            color: template.color || "#3B82F6",
        }
    });
}

export async function createTestClassInstance(
    t: TestConvexForDataModel<GenericDataModel>,
    templateId: Id<"classTemplates">,
    startTime: number,
    endTime: number,
    timezone: string = "UTC"
) {
    return await t.mutation(internal.testFunctions.createTestClassInstance, {
        templateId,
        startTime,
        endTime,
        timezone,
    });
}

export async function setupClassForBooking(asUser: TestConvexForDataModel<GenericDataModel>, businessId: Id<"businesses">, userId: Id<"users">) {
    // Create venue
    const venueId = await createTestVenue(asUser, "Test Yoga Studio");

    // Create class template
    const templateId = await createTestClassTemplate(asUser, userId, businessId, venueId, {
        name: "Morning Yoga",
        description: "A peaceful morning yoga class",
        duration: 60,
        capacity: 20,
        baseCredits: 10,
    });

    // Create class instance (2 hours from now)
    const startTime = Date.now() + (14 * 60 * 60 * 1000);
    const endTime = startTime + (60 * 60 * 1000);

    const instanceId = await createTestClassInstance(asUser, templateId, startTime, endTime, "UTC");

    return { venueId, templateId, instanceId, startTime, endTime };
}

export async function initAuth() {
    const userId = await createTestUser();
    const businessId = await createTestBusiness(userId);
    await attachUserToBusiness(userId, businessId);

    return { userId, businessId };
}

// Notification test helpers
export async function createTestNotification(
    t: TestConvexForDataModel<GenericDataModel>,
    args: {
        businessId: Id<"businesses">;
        recipientType: "business" | "consumer";
        recipientUserId?: Id<"users">;
        type: "booking_created" | "booking_cancelled_by_consumer" | "class_cancelled" | "payment_received" | "booking_confirmation" | "booking_reminder" | "booking_cancelled_by_business" | "payment_receipt";
        title: string;
        message: string;
        metadata?: {
            className?: string;
            userEmail?: string;
            userName?: string;
            amount?: number;
        };
        relatedBookingId?: Id<"bookings">;
        relatedClassInstanceId?: Id<"classInstances">;
    }
) {
    return await t.mutation(internal.testFunctions.createTestNotification, {
        notification: {
            businessId: args.businessId,
            recipientType: args.recipientType,
            recipientUserId: args.recipientUserId,
            type: args.type,
            title: args.title,
            message: args.message,
            metadata: args.metadata,
            relatedBookingId: args.relatedBookingId,
            relatedClassInstanceId: args.relatedClassInstanceId,
            deliveryStatus: "sent",
            seen: false,
            createdAt: Date.now(),
        }
    });
}

export async function createTestUserNotificationSettings(
    t: TestConvexForDataModel<GenericDataModel>,
    userId: Id<"users">,
    settings: {
        globalOptOut?: boolean;
    } = {}
) {
    return await t.mutation(internal.testFunctions.createTestUserNotificationSettings, {
        userId,
        settings: {
            globalOptOut: settings.globalOptOut ?? false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }
    });
}

export async function createTestBusinessNotificationSettings(
    t: TestConvexForDataModel<GenericDataModel>,
    businessId: Id<"businesses">,
    settings: {} = {}
) {
    return await t.mutation(internal.testFunctions.createTestBusinessNotificationSettings, {
        businessId,
        settings: {
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }
    });
}

export async function setupCompleteBookingScenario(
    asUser: TestConvexForDataModel<GenericDataModel>,
    businessId: Id<"businesses">,
    userId: Id<"users">,
    options: {
        className?: string;
        venueName?: string;
        credits?: number;
        baseCredits?: number;
        hoursFromNow?: number;
    } = {}
) {
    const {
        className = "Test Class",
        venueName = "Test Venue",
        credits = 50,
        baseCredits = 15,
        hoursFromNow = 24
    } = options;

    // Give user credits
    await asUser.mutation(api.mutations.credits.giftCredits, {
        userId: userId,
        amount: credits
    });

    // Create venue and template
    const venueId = await createTestVenue(asUser, venueName);
    const templateId = await createTestClassTemplate(asUser, userId, businessId, venueId, {
        name: className,
        description: `A test ${className.toLowerCase()}`,
        duration: 60,
        capacity: 20,
        baseCredits: baseCredits,
    });

    // Create class instance
    const startTime = Date.now() + (hoursFromNow * 60 * 60 * 1000);
    const endTime = startTime + (60 * 60 * 1000);
    const instanceId = await createTestClassInstance(asUser, templateId, startTime, endTime, "UTC");

    return { venueId, templateId, instanceId, startTime, endTime };
}
