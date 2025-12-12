import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import { Id } from "@repo/api/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Percent, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Fee rate options - must match backend ALLOWED_FEE_RATES
 */
const FEE_RATE_OPTIONS = [
  { value: "0", label: "0%", decimal: 0 },
  { value: "0.05", label: "5%", decimal: 0.05 },
  { value: "0.1", label: "10%", decimal: 0.1 },
  { value: "0.15", label: "15%", decimal: 0.15 },
  { value: "0.2", label: "20%", decimal: 0.2 },
  { value: "0.25", label: "25%", decimal: 0.25 },
  { value: "0.3", label: "30%", decimal: 0.3 },
];

interface FeeRateEditorProps {
  businessId: Id<"businesses">;
  currentFeeRate: number | undefined;
  businessName: string;
}

export function FeeRateEditor({
  businessId,
  currentFeeRate,
  businessName,
}: FeeRateEditorProps) {
  // Default to 20% if not set
  const effectiveFeeRate = currentFeeRate ?? 0.2;
  const currentPercent = Math.round(effectiveFeeRate * 100);

  const [selectedRate, setSelectedRate] = useState<string>(
    effectiveFeeRate.toString()
  );
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateFeeRate = useMutation(
    api.internal.mutations.businesses.updateBusinessFeeRate
  );

  const selectedOption = FEE_RATE_OPTIONS.find(
    (opt) => opt.value === selectedRate
  );
  const hasChanges = parseFloat(selectedRate) !== effectiveFeeRate;
  const isReasonValid = reason.trim().length >= 3;
  const canSubmit = hasChanges && isReasonValid && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const result = await updateFeeRate({
        businessId,
        newFeeRate: parseFloat(selectedRate) as
          | 0
          | 0.05
          | 0.1
          | 0.15
          | 0.2
          | 0.25
          | 0.3,
        reason: reason.trim(),
      });

      if (result.success) {
        setSuccessMessage(result.message);
        setReason(""); // Clear reason after success
        // Update the selected rate to match the new value
        setSelectedRate(result.newFeeRate.toString());
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update fee rate"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-slate-800/30 border-slate-700/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-slate-100 flex items-center text-base">
          <Percent className="mr-2 h-4 w-4 text-cyan-500" />
          Platform Fee Rate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Rate Display */}
        <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
          <div className="text-sm text-slate-400">Current Rate:</div>
          <Badge
            variant="outline"
            className={cn(
              "text-sm font-mono",
              currentPercent === 0
                ? "text-amber-400 border-amber-500/50"
                : "text-cyan-400 border-cyan-500/50"
            )}
          >
            {currentPercent}%
          </Badge>
          {currentFeeRate === undefined && (
            <span className="text-xs text-slate-500">(default)</span>
          )}
        </div>

        {/* Rate Selector */}
        <div className="space-y-2">
          <Label htmlFor="fee-rate" className="text-slate-300">
            New Fee Rate
          </Label>
          <Select value={selectedRate} onValueChange={setSelectedRate}>
            <SelectTrigger className="w-full bg-slate-900/50 border-slate-700/50 text-slate-200">
              <SelectValue placeholder="Select fee rate" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {FEE_RATE_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-slate-200 focus:bg-slate-700 focus:text-cyan-400"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reason Field */}
        <div className="space-y-2">
          <Label htmlFor="reason" className="text-slate-300">
            Reason for Change <span className="text-red-400">*</span>
          </Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Partner agreement renewal, Volume discount applied..."
            className="bg-slate-900/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 min-h-[80px]"
            disabled={!hasChanges}
          />
          {hasChanges && reason.length > 0 && reason.trim().length < 3 && (
            <p className="text-xs text-amber-400">
              Reason must be at least 3 characters
            </p>
          )}
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400">{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "w-full",
            canSubmit
              ? "bg-cyan-600 hover:bg-cyan-700 text-white"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Fee Rate
            </>
          )}
        </Button>

        {!hasChanges && (
          <p className="text-xs text-slate-500 text-center">
            Select a different rate to enable saving
          </p>
        )}
      </CardContent>
    </Card>
  );
}
