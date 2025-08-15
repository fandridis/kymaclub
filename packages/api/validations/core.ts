import { ValidationResult } from "../types/core";

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
        return { success: false, error: "Email is required" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
        return { success: false, error: "Please enter a valid email address" };
    }

    if (trimmed.length > 100) {
        return { success: false, error: "Email cannot exceed 100 characters" };
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
        return { success: false, error: "Website must start with http:// or https://" };
    }
    if (trimmed.length > 200) {
        return { success: false, error: "Website URL cannot exceed 200 characters" };
    }
    return { success: true, value: trimmed };
};

export const validateDescription = (description: string): ValidationResult<string> => {
    const trimmed = description.trim();
    if (trimmed.length > 500) {
        return { success: false, error: "Description cannot exceed 500 characters" };
    }
    return { success: true, value: trimmed };
};

export const validateStreet = (street: string): ValidationResult<string> => {
    const trimmed = street.trim();
    if (!trimmed) {
        return { success: false, error: "Street is required" };
    }

    if (trimmed.length > 100) {
        return { success: false, error: "Street must be less than 100 characters" };
    }

    return { success: true, value: trimmed };
};

export const validateCity = (city: string): ValidationResult<string> => {
    const trimmed = city.trim();
    if (!trimmed) {
        return { success: false, error: "City is required" };
    }

    if (trimmed.length > 100) {
        return { success: false, error: "City must be less than 100 characters" };
    }

    return { success: true, value: trimmed };
};

export const validateZipCode = (zipCode: string): ValidationResult<string> => {
    const trimmed = zipCode.trim();
    if (!trimmed) {
        return { success: false, error: "Zip code is required" };
    }

    if (trimmed.length > 100) {
        return { success: false, error: "Zip code must be less than 100 characters" };
    }

    return { success: true, value: trimmed };
};

export const validateCountry = (country: string): ValidationResult<string> => {
    const trimmed = country.trim();
    if (!trimmed) {
        return { success: false, error: "Country is required" };
    }

    if (trimmed.length > 100) {
        return { success: false, error: "Country must be less than 100 characters" };
    }

    return { success: true, value: trimmed };
};

export const validateState = (state: string | undefined): ValidationResult<string | undefined> => {
    if (state) {
        const trimmed = state.trim();

        if (trimmed.length > 100) {
            return { success: false, error: "State must be less than 10 characters" };
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
    validateZipCode,
    validateCountry,
    validateState,
}