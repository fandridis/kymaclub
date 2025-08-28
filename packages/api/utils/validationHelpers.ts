/**
 * Shared validation utility functions
 * 
 * These utilities reduce code duplication across validation files
 * and provide consistent patterns for common validation scenarios.
 */

import type { ValidationResult } from '../types/core';

/**
 * Validates string length with automatic trimming
 * @param value - String to validate
 * @param options - Validation options
 * @returns ValidationResult with trimmed string
 */
export const validateStringLength = (
  value: string,
  options: {
    fieldName: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  }
): ValidationResult<string> => {
  const trimmed = value.trim();

  if (options.required && !trimmed) {
    return { 
      success: false, 
      error: `${options.fieldName} is required` 
    };
  }

  if (options.minLength && trimmed.length < options.minLength) {
    return { 
      success: false, 
      error: `${options.fieldName} must be at least ${options.minLength} characters` 
    };
  }

  if (options.maxLength && trimmed.length > options.maxLength) {
    return { 
      success: false, 
      error: `${options.fieldName} must be ${options.maxLength} characters or less` 
    };
  }

  return { success: true, value: trimmed };
};

/**
 * Validates numeric ranges
 * @param value - Number to validate
 * @param options - Validation options
 * @returns ValidationResult with validated number
 */
export const validateNumericRange = (
  value: number,
  options: {
    fieldName: string;
    integer?: boolean;
    min?: number;
    max?: number;
    allowZero?: boolean;
  }
): ValidationResult<number> => {
  if (options.integer && !Number.isInteger(value)) {
    return { 
      success: false, 
      error: `${options.fieldName} must be a whole number` 
    };
  }

  if (!Number.isFinite(value)) {
    return { 
      success: false, 
      error: `${options.fieldName} must be a valid number` 
    };
  }

  if (!options.allowZero && value <= 0) {
    return { 
      success: false, 
      error: `${options.fieldName} must be greater than zero` 
    };
  }

  if (options.allowZero === false && value < 0) {
    return { 
      success: false, 
      error: `${options.fieldName} cannot be negative` 
    };
  }

  if (options.min !== undefined && value < options.min) {
    return { 
      success: false, 
      error: `${options.fieldName} must be at least ${options.min}` 
    };
  }

  if (options.max !== undefined && value > options.max) {
    return { 
      success: false, 
      error: `${options.fieldName} cannot exceed ${options.max}` 
    };
  }

  return { success: true, value };
};

/**
 * Validates array length and content
 * @param value - Array to validate
 * @param options - Validation options
 * @returns ValidationResult with validated array
 */
export const validateArrayLength = <T>(
  value: T[],
  options: {
    fieldName: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
  }
): ValidationResult<T[]> => {
  if (!Array.isArray(value)) {
    return { 
      success: false, 
      error: `${options.fieldName} must be a list` 
    };
  }

  if (options.required && value.length === 0) {
    return { 
      success: false, 
      error: `${options.fieldName} is required and cannot be empty` 
    };
  }

  if (options.minLength && value.length < options.minLength) {
    return { 
      success: false, 
      error: `${options.fieldName} must have at least ${options.minLength} item${options.minLength === 1 ? '' : 's'}` 
    };
  }

  if (options.maxLength && value.length > options.maxLength) {
    return { 
      success: false, 
      error: `${options.fieldName} cannot have more than ${options.maxLength} item${options.maxLength === 1 ? '' : 's'}` 
    };
  }

  return { success: true, value };
};

/**
 * Validates string array with trimming and empty removal
 * @param value - String array to validate
 * @param options - Validation options
 * @returns ValidationResult with cleaned string array
 */
export const validateStringArray = (
  value: string[],
  options: {
    fieldName: string;
    required?: boolean;
    maxLength?: number;
    allowEmpty?: boolean;
  }
): ValidationResult<string[]> => {
  const arrayValidation = validateArrayLength(value, {
    fieldName: options.fieldName,
    required: options.required,
    maxLength: options.maxLength,
  });

  if (!arrayValidation.success) {
    return arrayValidation;
  }

  const trimmed = value.map(item => item.trim());

  if (!options.allowEmpty && trimmed.some(item => !item)) {
    return { 
      success: false, 
      error: `${options.fieldName} items cannot be empty` 
    };
  }

  return { success: true, value: trimmed };
};

/**
 * Validates day of week array (0-6 range)
 * @param value - Array of day numbers
 * @param options - Validation options
 * @returns ValidationResult with validated and deduplicated array
 */
export const validateDaysOfWeek = (
  value: number[],
  options: {
    fieldName: string;
    required?: boolean;
  }
): ValidationResult<number[]> => {
  const arrayValidation = validateArrayLength(value, {
    fieldName: options.fieldName,
    required: options.required,
    maxLength: 7,
  });

  if (!arrayValidation.success) {
    return arrayValidation;
  }

  const invalidDays = value.filter(day => !Number.isInteger(day) || day < 0 || day > 6);
  if (invalidDays.length > 0) {
    return { 
      success: false, 
      error: `${options.fieldName} must contain valid day numbers (0=Sunday, 1=Monday, ..., 6=Saturday)` 
    };
  }

  // Remove duplicates and sort
  const deduplicated = [...new Set(value)].sort();

  return { success: true, value: deduplicated };
};

/**
 * Creates a successful validation result
 * @param value - The validated value
 * @returns Success ValidationResult
 */
export const success = <T>(value: T): ValidationResult<T> => ({
  success: true,
  value,
});

/**
 * Creates a failed validation result
 * @param error - Error message
 * @returns Failed ValidationResult
 */
export const failure = <T>(error: string): ValidationResult<T> => ({
  success: false,
  error,
});

/**
 * Chains multiple validation functions for the same value
 * @param value - Value to validate
 * @param validators - Array of validation functions
 * @returns ValidationResult from the first failing validator or success with final value
 */
export const chainValidations = <T>(
  value: T,
  validators: Array<(value: T) => ValidationResult<T>>
): ValidationResult<T> => {
  for (const validator of validators) {
    const result = validator(value);
    if (!result.success) {
      return result;
    }
    // Use the validated/transformed value for the next validator
    value = result.value!;
  }
  return success(value);
};