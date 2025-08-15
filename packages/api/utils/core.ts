import { ConvexError } from "convex/values";
import { ERROR_CODES } from "./errorCodes";
import { ValidationResult } from "../types/core";

export const throwIfError = <T>(result: ValidationResult<T>, field: string): T => {
    if (!result.success) {
        throw new ConvexError({
            message: result.error,
            field,
            code: ERROR_CODES.VALIDATION_ERROR
        });
    }
    return result.value!;
};

export const hasFieldChanged = <T>(existing: T, updated: T | undefined): boolean => {
    if (updated === undefined) return false;
    if (Array.isArray(existing) && Array.isArray(updated)) {
        if (existing.length !== updated.length) return true;
        for (let i = 0; i < existing.length; i++) {
            if (existing[i] !== updated[i]) return true;
        }
        return false;
    }
    return existing !== updated;
};

/**
 * Creates an update object containing only the fields that are defined (not undefined).
 * Useful for conditional updates where you only want to include fields that actually have values.
 * 
 * @example
 * // Instead of:
 * // ...(templateChanges.name && { name: templateChanges.name }),
 * // ...(templateChanges.instructor && { instructor: templateChanges.instructor }),
 * 
 * // You can use:
 * // ...updateIfExists({
 * //     name: templateChanges.name,
 * //     instructor: templateChanges.instructor
 * // })
 */
export const updateIfExists = <T extends Record<string, any>>(updates: T): Partial<T> => {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
            result[key as keyof T] = value;
        }
    }
    return result;
};
