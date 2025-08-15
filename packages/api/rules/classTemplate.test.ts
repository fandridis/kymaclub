import { describe, it, expect } from "vitest";
import { ConvexError } from "convex/values";
import { classTemplateRules } from "./classTemplate";
import { createTestUser, createTestBusiness } from "../convex/testResources";
import { ERROR_CODES } from "../utils/errorCodes";
import type { Doc } from "../convex/_generated/dataModel";

describe('Class Template Rules', () => {
    const mockUser = createTestUser();
    const mockBusinessId = createTestBusiness()._id;
    
    const createMockTemplate = (overrides: Partial<Doc<"classTemplates">> = {}): Doc<"classTemplates"> => ({
        _id: "template123" as any,
        _creationTime: Date.now(),
        businessId: mockBusinessId,
        name: "Test Class",
        description: "Test Description",
        duration: 60,
        capacity: 20,
        price: 25,
        venueId: "venue123" as any,
        instructorId: "instructor123" as any,
        classTypeId: "classType123" as any,
        color: "#3B82F6",
        isActive: true,
        equipment: ["mat"],
        level: "beginner",
        tags: ["yoga"],
        bookingWindow: {
            openDays: 7,
            closeDays: 0
        },
        cancellationPolicy: {
            allowCancellation: true,
            cancelBeforeHours: 24,
            refundPercentage: 100
        },
        waitlistEnabled: true,
        recurrenceRule: undefined,
        imageStorageIds: [],
        createdAt: Date.now(),
        createdBy: mockUser._id,
        updatedAt: Date.now(),
        updatedBy: mockUser._id,
        ...overrides
    });

    describe('userMustBeTemplateOwner', () => {
        it('should allow template owner to access template', () => {
            const template = createMockTemplate();
            const user = { ...mockUser, businessId: mockBusinessId };

            expect(() => classTemplateRules.userMustBeTemplateOwner(template, user))
                .not.toThrow();
        });

        it('should throw error when user belongs to different business', () => {
            const template = createMockTemplate();
            const user = { ...mockUser, businessId: "different_business_id" as any };

            expect(() => classTemplateRules.userMustBeTemplateOwner(template, user))
                .toThrow(new ConvexError({
                    message: "You are not authorized to update this template",
                    field: "businessId",
                    code: ERROR_CODES.UNAUTHORIZED
                }));
        });

        it('should throw error when user has no business association', () => {
            const template = createMockTemplate();
            const user = { ...mockUser, businessId: undefined };

            expect(() => classTemplateRules.userMustBeTemplateOwner(template, user))
                .toThrow(new ConvexError({
                    message: "You are not authorized to update this template",
                    field: "businessId",
                    code: ERROR_CODES.UNAUTHORIZED
                }));
        });

        it('should allow access when business IDs match exactly', () => {
            const template = createMockTemplate({ businessId: "specific_business" as any });
            const user = { ...mockUser, businessId: "specific_business" as any };

            expect(() => classTemplateRules.userMustBeTemplateOwner(template, user))
                .not.toThrow();
        });
    });
});