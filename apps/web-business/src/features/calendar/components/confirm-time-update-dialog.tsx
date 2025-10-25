import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Doc } from "@repo/api/convex/_generated/dataModel";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import { dbTimestampToBusinessDate } from "@/lib/timezone-utils";

interface ConfirmTimeUpdateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirmSingle: () => void;
    onConfirmMultiple: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
    originalInstance: Doc<"classInstances">;
    newStartTime: number;
    newEndTime: number;
    dayChanged?: boolean; // Add this prop to control whether multiple updates are allowed
    businessTimezone: string; // Add business timezone prop
}

export default function ConfirmTimeUpdateDialog({
    open,
    onOpenChange,
    onConfirmSingle,
    onConfirmMultiple,
    onCancel,
    isSubmitting,
    originalInstance,
    newStartTime,
    dayChanged,
    businessTimezone
}: ConfirmTimeUpdateDialogProps) {
    const [applyToAll, setApplyToAll] = useState(false);

    // Query for similar instances - only run when dialog is open and day hasn't changed
    const similarInstances = useQuery(
        api.queries.classInstances.getSimilarClassInstances,
        open && !dayChanged ? { instanceId: originalInstance._id } : "skip"
    );

    const hasSimilarInstances = similarInstances && similarInstances.length > 0;

    // Helper function to format date and time nicely - convert UTC to business timezone first
    const formatDateTime = (timestamp: number) => {
        const dateInBusinessTz = dbTimestampToBusinessDate(timestamp, businessTimezone);
        return format(dateInBusinessTz, "EEE, MMM d 'at' h:mm a");
    };

    // Calculate button text and handler based on toggle state
    const totalEvents = hasSimilarInstances ? similarInstances.length + 1 : 1;
    const buttonText = applyToAll && hasSimilarInstances ? `Update ${totalEvents} events` : "Update";
    const handleConfirm = applyToAll && hasSimilarInstances ? onConfirmMultiple : onConfirmSingle;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Update Class Time</AlertDialogTitle>
                    <AlertDialogDescription>
                        You are moving <strong>"{originalInstance.name}"</strong> to <strong>{formatDateTime(newStartTime)}</strong>.
                        <br />
                        If this class has bookings, users will be notified and be allowed to cancel their booking for free.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4 space-y-4">
                    {dayChanged && (
                        <Alert>
                            <AlertDescription>
                                <p className="font-medium text-orange-600">
                                    Moving to a different day - only this instance will be updated.
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    When moving classes to different days, we don't update similar classes to avoid scheduling conflicts.
                                </p>
                            </AlertDescription>
                        </Alert>
                    )}

                    {!dayChanged && (
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="apply-to-all"
                                checked={applyToAll}
                                onCheckedChange={setApplyToAll}
                                disabled={isSubmitting}
                            />
                            <Label htmlFor="apply-to-all" className="text-sm font-medium">
                                Apply to all future events
                            </Label>
                        </div>
                    )}

                    {applyToAll && hasSimilarInstances && !dayChanged && (
                        <Alert>
                            <AlertDescription>
                                <div className="space-y-3">
                                    <p className="font-medium">
                                        Found {similarInstances.length} similar classes with the same pattern:
                                    </p>
                                    <div className="max-h-32 overflow-y-auto">
                                        <ul className="space-y-1">
                                            {similarInstances
                                                .sort((a, b) => a.startTime - b.startTime)
                                                .slice(0, 5) // Show only first 5
                                                .map((instance) => (
                                                    <li key={instance._id} className="text-sm">
                                                        • {formatDateTime(instance.startTime)}
                                                    </li>
                                                ))}
                                        </ul>
                                        {similarInstances.length > 5 && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                ...and {similarInstances.length - 5} more
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {applyToAll && !hasSimilarInstances && !dayChanged && similarInstances !== undefined && (
                        <Alert>
                            <AlertDescription>
                                <p className="text-sm text-gray-600">
                                    No similar future events found.
                                </p>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button className="w-full sm:w-auto order-3 sm:order-1" variant='ghost' onClick={onCancel} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button className="w-full sm:w-auto order-1 sm:order-2" variant='default' onClick={handleConfirm} disabled={isSubmitting}>
                            {buttonText}
                        </Button>
                    </div>

                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 