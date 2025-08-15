import { Doc, Id } from "./_generated/dataModel";

/**
 * These are used for domain-related tests.
 * They are not used for integration tests, as they are not compatible.
 */

export const user = {
    name: "Test User",
    email: "test@example.com",
    businessRole: "admin",
    role: "admin",
    hasBusinessOnboarded: true,
} satisfies Omit<Doc<"users">, "_id" | "_creationTime">;

export const business = {
    name: "Test Gym",
    timezone: "Europe/Athens",
    email: "test@example.com",
    address: {
        street: "123 Test St",
        city: "Athens",
        state: "AT",
        zipCode: "12345",
        country: "Greece",
    },
    currency: "EUR",
    isActive: true,
    createdAt: Date.now(),
    onboardingCompleted: false,
    feeStructure: {
        payoutFrequency: "monthly",
        minimumPayout: 50,
    },
} satisfies Omit<Doc<"businesses">, "_id" | "_creationTime" | "createdBy">;

export const venue = {
    name: "Test Venue",
    description: "A test venue for classes",
    capacity: 30,
    email: "venue@example.com",
    equipment: ["mirrors", "sound system"],
    address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA',
    },
    isActive: true,
    primaryCategory: "wellness_center",
    createdAt: Date.now(),
} satisfies Omit<Doc<"venues">, "_id" | "_creationTime" | "businessId" | "createdBy">;

export const classTemplate = {
    name: "Yoga Class",
    instructor: "John Doe",
    duration: 60,
    capacity: 20,
    baseCredits: 10,
    allowWaitlist: true,
    isActive: true,
    tags: ["yoga", "wellness"],
    color: "#FF5733",
    bookingWindow: {
        minHours: 2,
        maxHours: 168
    },
    cancellationWindowHours: 24,
    createdAt: Date.now(),
    deleted: false,
} satisfies Omit<Doc<"classTemplates">, "_id" | "_creationTime" | "businessId" | "venueId" | "createdBy">;

export const classInstance = {
    timezone: "Europe/Athens",
    startTime: Date.now() + 86400000, // Tomorrow
    endTime: Date.now() + 90000000, // Tomorrow + 1 hour
    status: "scheduled",
    timePattern: "10:00-11:00",
    dayOfWeek: 1,
    name: "Yoga Class",
    instructor: "John Doe",
    capacity: 20,
    baseCredits: 10,
    bookedCount: 0,
    waitlistCount: 0,
    templateSnapshot: {
        name: "Yoga Class",
        instructor: "John Doe",
        description: "A test description",
        imageStorageIds: []
    },
    venueSnapshot: {
        name: "Test Venue",
        address: {
            street: "123 Test St",
            city: "Athens",
            zipCode: "12345",
            country: "Greece",
            state: "AT",
        },
    },
    createdAt: Date.now(),
} satisfies Omit<Doc<"classInstances">, "_id" | "_creationTime" | "businessId" | "templateId" | "venueId" | "createdBy">;


export const createTestUser = (overrides?: Partial<Doc<"users">>): Doc<"users"> => ({
    ...user,
    _id: "user1" as Id<"users">,
    businessId: "business1" as Id<"businesses">,
    ...overrides
} as Doc<"users">);

export const createTestBusiness = (overrides?: Partial<Doc<"businesses">>): Doc<"businesses"> => ({
    ...business,
    _id: "business1" as Id<"businesses">,
    ...overrides
} as Doc<"businesses">);

export const createTestTemplate = (overrides?: Partial<Doc<"classTemplates">>): Doc<"classTemplates"> => ({
    ...classTemplate,
    _id: "template1" as Id<"classTemplates">,
    businessId: "business1" as Id<"businesses">,
    venueId: "venue1" as Id<"venues">,
    ...overrides
} as Doc<"classTemplates">);

export const createTestInstance = (overrides?: Partial<Doc<"classInstances">>): Doc<"classInstances"> => ({
    ...classInstance,
    _id: "instance1" as Id<"classInstances">,
    businessId: "business1" as Id<"businesses">,
    templateId: "template1" as Id<"classTemplates">,
    ...overrides
} as Doc<"classInstances">);

// Helper to create test venue
export const createTestVenue = (overrides?: Partial<Doc<"venues">>): Doc<"venues"> => {
    return {
        ...venue,
        _id: 'venue1' as Id<'venues'>,
        businessId: 'business1' as Id<'businesses'>,
        ...overrides
    } as Doc<"venues">;
}

export const testResources = {
    docs: {
        user,
        business,
        venue,
        classTemplate,
        classInstance,
    },
    actions: {
        createTestUser,
        createTestBusiness,
        createTestTemplate,
        createTestInstance,
        createTestVenue,
    }
}