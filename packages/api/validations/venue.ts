import type { ValidationResult } from '../types/core';
import type { CreateVenueArgs } from '../convex/mutations/venues';

export const validateName = (name: string): ValidationResult<string> => {
    const trimmed = name.trim();
    if (!trimmed) {
        return { success: false, error: "Name is required" };
    }
    if (trimmed.length > 100) {
        return { success: false, error: "Name cannot exceed 100 characters" };
    }
    return { success: true, value: trimmed };
};

export const validateDescription = (description: string): ValidationResult<string> => {
    const trimmed = description.trim();
    if (trimmed.length > 2000) {
        return { success: false, error: "Description cannot exceed 2000 characters" };
    }
    return { success: true, value: trimmed };
};

export const validateShortDescription = (shortDescription: string): ValidationResult<string> => {
    const trimmed = shortDescription.trim();
    if (trimmed.length > 120) {
        return { success: false, error: "Short description cannot exceed 120 characters" };
    }
    return { success: true, value: trimmed };
};

export const validateCapacity = (capacity: number): ValidationResult<number> => {
    if (!Number.isInteger(capacity) || capacity <= 0) {
        return { success: false, error: "Capacity must be a positive integer" };
    }
    if (capacity > 2000) {
        return { success: false, error: "Capacity cannot exceed 2000" };
    }
    return { success: true, value: capacity };
};

export const validateEquipment = (equipment: string[]): ValidationResult<string[]> => {
    if (!Array.isArray(equipment)) {
        return { success: false, error: "Equipment must be an array" };
    }

    const trimmed = equipment.map(item => item.trim());

    if (trimmed.some(item => !item)) {
        return { success: false, error: "Equipment items cannot be empty" };
    }

    return { success: true, value: trimmed };
};

// Address validation moved to core.ts - use coreValidations for address fields

// validateAddress removed - use individual core validations instead

export const validateLatitude = (latitude: number): ValidationResult<number> => {
    if (latitude < -90 || latitude > 90) {
        return { success: false, error: "Latitude must be between -90 and 90" };
    }
    return { success: true, value: latitude };
};

export const validateLongitude = (longitude: number): ValidationResult<number> => {
    if (longitude < -180 || longitude > 180) {
        return { success: false, error: "Longitude must be between -180 and 180" };
    }
    return { success: true, value: longitude };
};

export const venueValidations = {
    validateName,
    validateDescription,
    validateShortDescription,
    validateCapacity,
    validateEquipment,
    validateLatitude,
    validateLongitude,
};