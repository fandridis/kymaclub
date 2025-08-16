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

