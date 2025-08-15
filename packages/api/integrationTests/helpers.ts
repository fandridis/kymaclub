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

export async function initAuth() {
    const userId = await createTestUser();
    const businessId = await createTestBusiness(userId);
    await attachUserToBusiness(userId, businessId);

    return { userId, businessId };
}

