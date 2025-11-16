import { ValidationResult } from "../types/core";
import { normalizeCityInput, type CitySlug } from "@repo/utils/constants";

export const validateBusinessName = (name: string): ValidationResult<string> => {
    const trimmed = name.trim();
    if (!trimmed) {
        return { success: false, error: "Business name is required" };
    }
    if (trimmed.length > 100) {
        return { success: false, error: "Business name cannot exceed 100 characters" };
    }
    return { success: true, value: trimmed };
};

export const validateEmail = (email: string): ValidationResult<string> => {
    const trimmed = email.trim();
    if (!trimmed) {
        return { success: false, error: "Email address is required" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
        return { success: false, error: "Please enter a valid email address (e.g., user@example.com)" };
    }

    if (trimmed.length > 100) {
        return { success: false, error: "Email address must be 100 characters or less" };
    }

    return { success: true, value: trimmed };
};

export const validatePhone = (phone: string): ValidationResult<string> => {
    const trimmed = phone.trim();
    if (trimmed.length > 20) {
        return { success: false, error: "Phone number cannot exceed 20 characters" };
    }
    return { success: true, value: trimmed };
};

export const validateWebsite = (website: string): ValidationResult<string> => {
    const trimmed = website.trim();
    if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return { success: false, error: "Website URL must start with http:// or https:// (e.g., https://example.com)" };
    }
    if (trimmed.length > 200) {
        return { success: false, error: "Website URL must be 200 characters or less" };
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

export const validateStreet = (street: string): ValidationResult<string> => {
    const trimmed = street.trim();
    if (!trimmed) {
        return { success: false, error: "Street is required" };
    }

    if (trimmed.length > 100) {
        return { success: false, error: "Street must be 100 characters or less" };
    }

    return { success: true, value: trimmed };
};

export const validateCity = (city: string): ValidationResult<string> => {
    const trimmed = city.trim();
    if (!trimmed) {
        return { success: false, error: "City is required" };
    }

    if (trimmed.length > 100) {
        return { success: false, error: "City must be 100 characters or less" };
    }

    return { success: true, value: trimmed };
};

export const validateCitySelection = (citySlug: string): ValidationResult<CitySlug> => {
    const normalizedSlug = normalizeCityInput(citySlug);

    if (!normalizedSlug) {
        return { success: false, error: "City is not supported yet" };
    }

    return { success: true, value: normalizedSlug };
};

export const validateArea = (area: string | undefined): ValidationResult<string | undefined> => {
    if (area === undefined) {
        return { success: true, value: undefined };
    }

    const trimmed = area.trim();
    if (!trimmed) {
        return { success: true, value: undefined };
    }

    if (trimmed.length > 100) {
        return { success: false, error: "Area must be 100 characters or less" };
    }

    return { success: true, value: trimmed };
};

export const validateZipCode = (zipCode: string): ValidationResult<string> => {
    const trimmed = zipCode.trim();
    if (!trimmed) {
        return { success: false, error: "Zip code is required" };
    }

    if (trimmed.length > 100) {
        return { success: false, error: "Zip code must be 100 characters or less" };
    }

    return { success: true, value: trimmed };
};

export const validateCountry = (country: string): ValidationResult<string> => {
    const trimmed = country.trim();
    if (!trimmed) {
        return { success: false, error: "Country is required" };
    }

    if (trimmed.length > 100) {
        return { success: false, error: "Country must be 100 characters or less" };
    }

    return { success: true, value: trimmed };
};

export const validateState = (state: string | undefined): ValidationResult<string | undefined> => {
    if (state) {
        const trimmed = state.trim();

        if (trimmed.length > 100) {
            return { success: false, error: "State must be 100 characters or less" };
        }
    }

    return { success: true, value: state };
};


export const coreValidations = {
    validateBusinessName,
    validateEmail,
    validatePhone,
    validateWebsite,
    validateDescription,
    validateStreet,
    validateCity,
    validateCitySelection,
    validateArea,
    validateZipCode,
    validateCountry,
    validateState,
}