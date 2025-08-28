import type { ValidationResult } from "../types/core";
import { validateStringLength, validateNumericRange, validateStringArray, validateDaysOfWeek } from "../utils/validationHelpers";

const validateStartTime = (startTime: number): ValidationResult<number> => {
    if (!Number.isInteger(startTime) || startTime <= 0) {
        return { success: false, error: "Start time must be a valid timestamp" };
    }

    const now = Date.now();
    const maxFutureTime = now + (365 * 24 * 60 * 60 * 1000); // 1 year from now

    if (startTime > maxFutureTime) {
        return { success: false, error: "Start time cannot be more than 1 year in the future" };
    }

    return { success: true, value: startTime };
};

const validateEndTime = (endTime: number, startTime: number): ValidationResult<number> => {
    if (!Number.isInteger(endTime) || endTime <= 0) {
        return { success: false, error: "End time must be a valid timestamp" };
    }

    if (endTime <= startTime) {
        return { success: false, error: "End time must be after start time" };
    }

    const duration = endTime - startTime;
    const maxDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

    if (duration > maxDuration) {
        return { success: false, error: "Instance duration cannot exceed 8 hours" };
    }

    return { success: true, value: endTime };
};

const validateName = (name: string): ValidationResult<string> => {
    return validateStringLength(name, {
        fieldName: "Class name",
        required: true,
        maxLength: 100
    });
};

const validateInstructor = (instructor: string): ValidationResult<string> => {
    return validateStringLength(instructor, {
        fieldName: "Instructor name",
        required: true,
        maxLength: 100
    });
};

const validateDescription = (description: string): ValidationResult<string> => {
    return validateStringLength(description, {
        fieldName: "Description",
        required: false,
        maxLength: 2000
    });
};

const validateTags = (tags: string[]): ValidationResult<string[]> => {
    return validateStringArray(tags, {
        fieldName: "Tags",
        required: false,
        maxLength: 10,
        allowEmpty: false
    });
};

const validateCapacity = (capacity: number): ValidationResult<number> => {
    return validateNumericRange(capacity, {
        fieldName: "Capacity",
        integer: true,
        min: 1,
        max: 100
    });
};

const validateBaseCredits = (credits: number): ValidationResult<number> => {
    return validateNumericRange(credits, {
        fieldName: "Credits",
        integer: false,
        min: 0,
        max: 100,
        allowZero: true
    });
};

const validateBookingWindow = (window: { minHours: number; maxHours: number }): ValidationResult<{ minHours: number; maxHours: number }> => {
    if (window.minHours < 0) {
        return { success: false, error: "Minimum booking hours cannot be negative" };
    }
    if (window.maxHours < window.minHours) {
        return { success: false, error: "Maximum hours must be greater than or equal to minimum hours" };
    }
    if (window.maxHours > 720) { // 30 days
        return { success: false, error: "Maximum booking window cannot exceed 30 days" };
    }
    return { success: true, value: window };
};

const validateCancellationWindowHours = (hours: number): ValidationResult<number> => {
    if (hours < 0) {
        return { success: false, error: "Cancellation window cannot be negative" };
    }
    if (hours > 168) { // 7 days
        return { success: false, error: "Cancellation window cannot exceed 7 days" };
    }
    return { success: true, value: hours };
};

const validateFrequency = (frequency: string): ValidationResult<"daily" | "weekly"> => {
    if (!["daily", "weekly"].includes(frequency)) {
        return { success: false, error: "Frequency must be either 'daily' or 'weekly'" };
    }
    return { success: true, value: frequency as "daily" | "weekly" };
};

const validateCount = (count: number): ValidationResult<number> => {
    if (!Number.isInteger(count) || count <= 0) {
        return { success: false, error: "Count must be a positive integer" };
    }
    if (count > 100) {
        return { success: false, error: "Cannot create more than 100 instances at once" };
    }
    return { success: true, value: count };
};

const validateSelectedDaysOfWeek = (days: number[]): ValidationResult<number[]> => {
    return validateDaysOfWeek(days, {
        fieldName: "Selected days",
        required: true
    });
};

const validateDuration = (duration: number): ValidationResult<number> => {
    if (!Number.isInteger(duration) || duration <= 0) {
        return { success: false, error: "Duration must be a positive number" };
    }
    if (duration > 480) {
        return { success: false, error: "Duration cannot exceed 8 hours (480 minutes)" };
    }
    return { success: true, value: duration };
};

const validateWaitlistCapacity = (capacity: number): ValidationResult<number> => {
    if (!Number.isInteger(capacity) || capacity < 0) {
        return { success: false, error: "Waitlist capacity must be a non-negative integer" };
    }
    return { success: true, value: capacity };
};

const validatePrice = (priceInCents: number): ValidationResult<number> => {
    if (!Number.isInteger(priceInCents) || priceInCents < 100) {
        return { success: false, error: "Price must be at least 1.00 in business currency (100 cents)" };
    }
    if (priceInCents > 10000) {
        return { success: false, error: "Price cannot exceed 100.00 in business currency (10000 cents)" };
    }
    return { success: true, value: priceInCents };
};

const validateDiscountRules = (rules: any[]): ValidationResult<any[]> => {
    if (!Array.isArray(rules)) {
        return { success: false, error: "Discount rules must be an array" };
    }

    if (rules.length > 10) {
        return { success: false, error: "Cannot have more than 10 discount rules" };
    }

    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];

        // Validate rule structure
        if (!rule.id || typeof rule.id !== 'string') {
            return { success: false, error: `Discount rule ${i + 1}: ID is required and must be a string` };
        }

        if (!rule.name || typeof rule.name !== 'string' || rule.name.trim().length === 0) {
            return { success: false, error: `Discount rule ${i + 1}: Name is required` };
        }

        if (rule.name.trim().length > 100) {
            return { success: false, error: `Discount rule ${i + 1}: Name cannot exceed 100 characters` };
        }

        // Validate condition
        if (!rule.condition || typeof rule.condition !== 'object') {
            return { success: false, error: `Discount rule ${i + 1}: Condition is required` };
        }

        const validTypes = ['hours_before_min', 'hours_before_max', 'always'];
        if (!validTypes.includes(rule.condition.type)) {
            return { success: false, error: `Discount rule ${i + 1}: Invalid condition type` };
        }

        // Validate hours for time-based conditions
        if (rule.condition.type !== 'always') {
            if (typeof rule.condition.hours !== 'number' || rule.condition.hours < 0 || rule.condition.hours > 8760) { // 1 year in hours
                return { success: false, error: `Discount rule ${i + 1}: Hours must be between 0 and 8760 (1 year)` };
            }
        }

        // Validate discount
        if (!rule.discount || typeof rule.discount !== 'object') {
            return { success: false, error: `Discount rule ${i + 1}: Discount is required` };
        }

        if (rule.discount.type !== 'fixed_amount') {
            return { success: false, error: `Discount rule ${i + 1}: Only fixed_amount discount type is supported` };
        }

        if (typeof rule.discount.value !== 'number' || rule.discount.value < 0 || rule.discount.value > 10000) {
            return { success: false, error: `Discount rule ${i + 1}: Discount value must be between 0 and 10000 cents` };
        }
    }

    return { success: true, value: rules };
};

export const classValidations = {
    validateStartTime,
    validateEndTime,
    validateName,
    validateInstructor,
    validateDescription,
    validateTags,
    validateCapacity,
    validatePrice,
    validateBookingWindow,
    validateCancellationWindowHours,
    validateFrequency,
    validateCount,
    validateSelectedDaysOfWeek,
    validateDuration,
    validateWaitlistCapacity,
    validateDiscountRules,
}