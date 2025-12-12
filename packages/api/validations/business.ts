import { v } from "convex/values";
import type { ValidationResult } from "../types/core";

/**
 * Allowed fee rate values (as decimals)
 * 0 = 0%, 0.05 = 5%, 0.10 = 10%, etc.
 */
export const ALLOWED_FEE_RATES = [0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30] as const;

/**
 * Fee rate type derived from allowed values
 */
export type AllowedFeeRate = (typeof ALLOWED_FEE_RATES)[number];

/**
 * Convex validator for fee rate - ensures only allowed values
 */
export const feeRateValidator = v.union(
  v.literal(0),
  v.literal(0.05),
  v.literal(0.1),
  v.literal(0.15),
  v.literal(0.2),
  v.literal(0.25),
  v.literal(0.3)
);

/**
 * Fee rate options for frontend dropdown
 * Maps decimal values to display labels
 */
export const FEE_RATE_OPTIONS = ALLOWED_FEE_RATES.map((rate) => ({
  value: rate,
  label: `${Math.round(rate * 100)}%`,
}));

/**
 * Validate that a fee rate is one of the allowed values
 */
export const validateFeeRate = (rate: number): ValidationResult<AllowedFeeRate> => {
  if (!ALLOWED_FEE_RATES.includes(rate as AllowedFeeRate)) {
    return {
      success: false,
      error: `Fee rate must be one of: ${ALLOWED_FEE_RATES.map((r) => `${Math.round(r * 100)}%`).join(", ")}`,
    };
  }
  return { success: true, value: rate as AllowedFeeRate };
};

/**
 * Validate that a reason is provided and not empty
 */
export const validateReason = (reason: string): ValidationResult<string> => {
  const trimmed = reason.trim();
  if (!trimmed) {
    return { success: false, error: "Reason is required" };
  }
  if (trimmed.length < 3) {
    return { success: false, error: "Reason must be at least 3 characters" };
  }
  if (trimmed.length > 500) {
    return { success: false, error: "Reason cannot exceed 500 characters" };
  }
  return { success: true, value: trimmed };
};
