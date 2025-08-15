import { ValidationResult } from "../types/core";

/**
 * Domain validation functions for credit operations
 * Pure functions - no database or external dependencies
 */

export function validateTransferAmount(amount: number): ValidationResult<number> {
  if (amount <= 0) {
    return { success: false, error: "Transfer amount must be positive" };
  }
  
  if (!Number.isInteger(amount)) {
    return { success: false, error: "Transfer amount must be a whole number" };
  }

  return { success: true, value: amount };
}

export function validateGrantAmount(amount: number): ValidationResult<number> {
  if (amount <= 0) {
    return { success: false, error: "Grant amount must be positive" };
  }
  
  if (!Number.isFinite(amount)) {
    return { success: false, error: "Grant amount must be a finite number" };
  }
  
  if (amount > 10000) {
    return { success: false, error: "Grant amount exceeds maximum limit of 10,000" };
  }

  return { success: true, value: amount };
}

export const creditsValidations = {
    validateTransferAmount,
    validateGrantAmount,
};