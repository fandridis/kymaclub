import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import { Id } from "@repo/api/convex/_generated/dataModel";

/**
 * Allowed fee rate values (must match backend ALLOWED_FEE_RATES)
 */
export type AllowedFeeRate = 0 | 0.05 | 0.1 | 0.15 | 0.2 | 0.25 | 0.3;

interface UpdateFeeRateResult {
  success: boolean;
  previousFeeRate: number;
  newFeeRate: number;
  message: string;
}

interface UseUpdateBusinessFeeReturn {
  updateFeeRate: (
    businessId: Id<"businesses">,
    newFeeRate: AllowedFeeRate,
    reason: string
  ) => Promise<UpdateFeeRateResult>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for updating a business's platform fee rate
 * Wraps the internal mutation with loading and error states
 */
export function useUpdateBusinessFee(): UseUpdateBusinessFeeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation(
    api.internal.mutations.businesses.updateBusinessFeeRate
  );

  const updateFeeRate = useCallback(
    async (
      businessId: Id<"businesses">,
      newFeeRate: AllowedFeeRate,
      reason: string
    ): Promise<UpdateFeeRateResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await mutation({
          businessId,
          newFeeRate,
          reason,
        });
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update fee rate";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [mutation]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateFeeRate,
    isLoading,
    error,
    clearError,
  };
}
