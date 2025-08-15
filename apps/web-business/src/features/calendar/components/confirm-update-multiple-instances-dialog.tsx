import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Doc } from "@repo/api/convex/_generated/dataModel";
import { dbTimestampToBusinessDate } from "@/lib/timezone-utils";

interface ConfirmUpdateInstancesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
    similarInstances: Doc<"classInstances">[];
    businessTimezone: string;
}

export default function ConfirmUpdateInstancesDialog({
    open,
    onOpenChange,
    onConfirm,
    onCancel,
    isSubmitting,
    similarInstances,
    businessTimezone
}: ConfirmUpdateInstancesDialogProps) {
    const instanceCount = similarInstances.length;

    // Helper function to format date as dd/mm/yyyy in business timezone
    const formatDate = (timestamp: number) => {
        const date = dbTimestampToBusinessDate(timestamp, businessTimezone);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Helper function to format time as HH:mm in business timezone
    const formatTime = (timestamp: number) => {
        const date = dbTimestampToBusinessDate(timestamp, businessTimezone);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Update Multiple Classes</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will update all similar classes in your schedule that have the same recurring pattern.
                        This action cannot be undone. Are you sure you want to proceed?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4">
                    {similarInstances.length > 0 ? (
                        <Alert>
                            <AlertDescription>
                                <div className="space-y-3">
                                    <p className="font-medium">This will also update the future instances below:</p>
                                    <div className="max-h-48 overflow-y-auto">
                                        <ul className="space-y-1">
                                            {similarInstances
                                                .sort((a, b) => a.startTime - b.startTime)
                                                .map((instance) => (
                                                    <li key={instance._id} className="text-sm">
                                                        • {formatDate(instance.startTime)} {formatTime(instance.startTime)} {instance.name} - {instance.instructor}
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert>
                            <AlertDescription>
                                No similar classes found to update.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isSubmitting || instanceCount === 0}
                    >
                        {isSubmitting ? 'Updating...' : 'Yes, Update All'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog >
    );
}
