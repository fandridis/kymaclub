import { describe, it, expect } from "vitest";
import { ConvexError } from "convex/values";
import { canOnlyCreateBusinessOnce } from "./business";
import { createTestUser, createTestBusiness } from "../convex/testResources";
import { ERROR_CODES } from "../utils/errorCodes";
import type { Doc } from "../convex/_generated/dataModel";

describe('Business Rules', () => {
    describe('canOnlyCreateBusinessOnce', () => {
        it('should allow user without business to create one', () => {
            const user: Doc<"users"> = {
                ...createTestUser(),
                businessId: undefined
            };

            expect(() => canOnlyCreateBusinessOnce(user)).not.toThrow();
        });

        it('should throw error when user is not authenticated', () => {
            expect(() => canOnlyCreateBusinessOnce(null as any))
                .toThrow(new ConvexError({
                    message: "User not authenticated",
                    code: ERROR_CODES.UNAUTHORIZED
                }));
        });

        it('should throw error when user already belongs to a business', () => {
            const user: Doc<"users"> = {
                ...createTestUser(),
                businessId: createTestBusiness()._id
            };

            expect(() => canOnlyCreateBusinessOnce(user))
                .toThrow(new ConvexError({
                    message: "User already belongs to a business",
                    code: ERROR_CODES.USER_ALREADY_ASSOCIATED_WITH_BUSINESS
                }));
        });

        it('should throw error when user has any businessId value', () => {
            const user: Doc<"users"> = {
                ...createTestUser(),
                businessId: "any_business_id" as any
            };

            expect(() => canOnlyCreateBusinessOnce(user))
                .toThrow(new ConvexError({
                    message: "User already belongs to a business",
                    code: ERROR_CODES.USER_ALREADY_ASSOCIATED_WITH_BUSINESS
                }));
        });
    });
});