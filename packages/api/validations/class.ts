import { ValidationResult } from "../types/core";

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
    const trimmed = name.trim();
    if (!trimmed) {
        return { success: false, error: "Name is required" };
    }
    if (trimmed.length > 100) {
        return { success: false, error: "Name cannot exceed 100 characters" };
    }
    return { success: true, value: trimmed };
};

const validateInstructor = (instructor: string): ValidationResult<string> => {
    const trimmed = instructor.trim();
    if (!trimmed) {
        return { success: false, error: "Instructor is required" };
    }
    if (trimmed.length > 100) {
        return { success: false, error: "Instructor must be less than 100 characters" };
    }
    return { success: true, value: trimmed };
};

const validateDescription = (description: string): ValidationResult<string> => {
    const trimmed = description.trim();
    if (trimmed.length > 2000) {
        return { success: false, error: "Description must be less than 2000 characters" };
    }
    return { success: true, value: trimmed };
};

const validateTags = (tags: string[]): ValidationResult<string[]> => {
    const trimmed = tags.map(tag => tag.trim());
    if (trimmed.length > 10) {
        return { success: false, error: "Tags must be less than 10" };
    }
    return { success: true, value: trimmed };
};

const validateCapacity = (capacity: number): ValidationResult<number> => {
    if (!Number.isInteger(capacity) || capacity <= 0) {
        return { success: false, error: "Capacity must be a positive integer" };
    }
    if (capacity > 100) {
        return { success: false, error: "Capacity cannot exceed 100" };
    }
    return { success: true, value: capacity };
};

const validateBaseCredits = (credits: number): ValidationResult<number> => {
    if (!Number.isFinite(credits) || credits < 0) {
        return { success: false, error: "Credits must be a non-negative number" };
    }
    if (credits > 100) {
        return { success: false, error: "Credits cannot exceed 100" };
    }
    return { success: true, value: credits };
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
    if (!Array.isArray(days)) {
        return { success: false, error: "Selected days must be an array" };
    }

    for (const day of days) {
        if (!Number.isInteger(day) || day < 0 || day > 6) {
            return { success: false, error: "Days of week must be integers between 0-6" };
        }
    }

    if (days.length === 0) {
        return { success: false, error: "At least one day must be selected" };
    }

    // Remove duplicates
    return { success: true, value: [...new Set(days)] };
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

export const classValidations = {
    validateStartTime,
    validateEndTime,
    validateName,
    validateInstructor,
    validateDescription,
    validateTags,
    validateCapacity,
    validateBaseCredits,
    validateBookingWindow,
    validateCancellationWindowHours,
    validateFrequency,
    validateCount,
    validateSelectedDaysOfWeek,
    validateDuration,
    validateWaitlistCapacity,
}