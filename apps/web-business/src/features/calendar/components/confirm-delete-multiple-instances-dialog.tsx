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
import { AlertTriangle } from "lucide-react";
import type { Doc } from "@repo/api/convex/_generated/dataModel";
import { dbTimestampToBusinessDate } from "@/lib/timezone-utils";

interface ConfirmDeleteInstancesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
    similarInstances: Doc<"classInstances">[];
    businessTimezone: string;
}

export default function ConfirmDeleteInstancesDialog({
    open,
    onOpenChange,
    onConfirm,
    onCancel,
    isDeleting,
    similarInstances,
    businessTimezone
}: ConfirmDeleteInstancesDialogProps) {
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
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Multiple Classes
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete all similar classes in your schedule that have the same recurring pattern.
                        This action cannot be undone. Are you sure you want to proceed?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4">
                    {similarInstances.length > 0 ? (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription>
                                <div className="space-y-3">
                                    <p className="font-medium text-red-800">
                                        This will also delete the future instances below:
                                    </p>
                                    <div className="max-h-48 overflow-y-auto">
                                        <ul className="space-y-1">
                                            {similarInstances
                                                .sort((a, b) => a.startTime - b.startTime)
                                                .map((instance) => (
                                                    <li key={instance._id} className="text-sm text-red-700">
                                                        • {formatDate(instance.startTime)} {formatTime(instance.startTime)} {instance.name} - {instance.instructor}
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert className="border-gray-200">
                            <AlertDescription>
                                No similar classes found to delete.
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
                        disabled={isDeleting || instanceCount === 0}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete all'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 