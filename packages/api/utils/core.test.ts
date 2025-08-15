import { describe, it, expect } from "vitest";
import { updateIfExists, throwIfError, hasFieldChanged } from './core';
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "./errorCodes";

describe('helpers', () => {
    describe('updateIfExists', () => {
        it('should include only defined values', () => {
            const input = {
                name: "John",
                age: undefined,
                email: "john@example.com",
                phone: undefined
            };

            const result = updateIfExists(input);

            expect(result).toEqual({
                name: "John",
                email: "john@example.com"
            });
        });

        it('should return empty object when all values are undefined', () => {
            const input = {
                name: undefined,
                age: undefined,
                email: undefined
            };

            const result = updateIfExists(input);

            expect(result).toEqual({});
        });

        it('should return all values when none are undefined', () => {
            const input = {
                name: "John",
                age: 30,
                email: "john@example.com"
            };

            const result = updateIfExists(input);

            expect(result).toEqual({
                name: "John",
                age: 30,
                email: "john@example.com"
            });
        });

        it('should handle empty object', () => {
            const input = {};

            const result = updateIfExists(input);

            expect(result).toEqual({});
        });

        it('should preserve different data types', () => {
            const input = {
                string: "test",
                number: 42,
                boolean: true,
                nullValue: null,
                array: [1, 2, 3],
                object: { nested: "value" },
                zero: 0,
                emptyString: "",
                undefinedValue: undefined
            };

            const result = updateIfExists(input);

            expect(result).toEqual({
                string: "test",
                number: 42,
                boolean: true,
                nullValue: null,
                array: [1, 2, 3],
                object: { nested: "value" },
                zero: 0,
                emptyString: ""
            });
        });

        it('should handle falsy values that are not undefined', () => {
            const input = {
                falseBool: false,
                zeroNumber: 0,
                emptyString: "",
                nullValue: null,
                undefinedValue: undefined
            };

            const result = updateIfExists(input);

            expect(result).toEqual({
                falseBool: false,
                zeroNumber: 0,
                emptyString: "",
                nullValue: null
            });
        });

        it('should not mutate the original object', () => {
            const input = {
                name: "John",
                age: undefined,
                email: "john@example.com"
            };
            const originalInput = { ...input };

            const result = updateIfExists(input);

            expect(input).toEqual(originalInput);
            expect(result).not.toBe(input);
        });

        it('should work with complex nested objects', () => {
            const input = {
                user: {
                    name: "John",
                    details: {
                        age: 30
                    }
                },
                settings: undefined,
                preferences: {
                    theme: "dark"
                }
            };

            const result = updateIfExists(input);

            expect(result).toEqual({
                user: {
                    name: "John",
                    details: {
                        age: 30
                    }
                },
                preferences: {
                    theme: "dark"
                }
            });
        });
    });

    describe('throwIfError', () => {
        it('should return value when result is successful', () => {
            const successResult = { success: true, value: "test value" };

            const result = throwIfError(successResult, "testField");

            expect(result).toBe("test value");
        });

        it('should throw ConvexError when result is not successful', () => {
            const errorResult = { success: false, error: "Validation failed" };

            expect(() => {
                throwIfError(errorResult, "testField");
            }).toThrow(ConvexError);
        });

        it('should include correct error details in thrown ConvexError', () => {
            const errorResult = { success: false, error: "Validation failed" };

            expect(() => {
                throwIfError(errorResult, "testField");
            }).toThrow(new ConvexError({
                message: "Validation failed",
                field: "testField",
                code: ERROR_CODES.VALIDATION_ERROR
            }));
        });
    });

    describe('hasFieldChanged', () => {
        it('should return false when updated is undefined', () => {
            const result = hasFieldChanged("existing", undefined);
            expect(result).toBe(false);
        });

        it('should return false when values are the same', () => {
            const result = hasFieldChanged("value", "value");
            expect(result).toBe(false);
        });

        it('should return true when values are different', () => {
            const result = hasFieldChanged("old", "new");
            expect(result).toBe(true);
        });

        it('should work with different data types', () => {
            expect(hasFieldChanged(1, 2)).toBe(true);
            expect(hasFieldChanged(true, false)).toBe(true);
            expect(hasFieldChanged(null, "value")).toBe(true);
            expect(hasFieldChanged(42, 42)).toBe(false);
        });

        it('should handle null and undefined correctly', () => {
            expect(hasFieldChanged(null, undefined)).toBe(false);
            expect(hasFieldChanged("value", null)).toBe(true);
            expect(hasFieldChanged(null, null)).toBe(false);
        });
    });
}); 