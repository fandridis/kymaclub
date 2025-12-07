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
    price: 500, // 5.00 in business currency (5 credits * 100 cents/credit)
    allowWaitlist: true,
    isActive: true,
    tags: ["yoga", "wellness"],
    color: "#FF5733",
    primaryCategory: 'yoga',
    bookingWindow: {
        minHours: 2,
        maxHours: 168
    },
    cancellationWindowHours: 24,
    discountRules: [
        {
            id: "early_bird_001",
            name: "2-Day Early Bird",
            condition: {
                type: "hours_before_min",
                hours: 48, // 48 hours = 2 days
            },
            discount: {
                type: "fixed_amount",
                value: 2, // 2 credits off
            },
            createdAt: Date.now(),
            createdBy: "user1" as any,
        },
        {
            id: "early_bird_002",
            name: "12h Early Bird",
            condition: {
                type: "hours_before_min",
                hours: 12, // 12 hours
            },
            discount: {
                type: "fixed_amount",
                value: 1, // 1 credit off
            },
            createdAt: Date.now(),
            createdBy: "user1" as any,
        },
        {
            id: "last_minute_001",
            name: "Last Minute Rush",
            condition: {
                type: "hours_before_max",
                hours: 2, // 2 hours
            },
            discount: {
                type: "fixed_amount",
                value: 3, // 3 credits off
            },
            createdAt: Date.now(),
            createdBy: "user1" as any,
        },
    ],
    createdAt: Date.now(),
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
    price: 500, // 5.00 in business currency (5 credits * 100 cents/credit)
    primaryCategory: 'yoga',
    bookedCount: 0,
    waitlistCount: 0,
    discountRules: undefined, // No default instance discounts - tests will set this explicitly when needed
    templateSnapshot: {
        name: "Yoga Class",
        instructor: "John Doe",
        shortDescription: "A test short description",
        duration: 60,
        imageStorageIds: [],
        primaryCategory: 'yoga',
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
