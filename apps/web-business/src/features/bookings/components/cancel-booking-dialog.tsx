import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import type { BookingWithDetails } from "@repo/api/types/booking";

interface CancelBookingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason?: string) => void;
    booking: BookingWithDetails;
    isCancelling?: boolean;
}

export function CancelBookingDialog({
    isOpen,
    onClose,
    onConfirm,
    booking,
    isCancelling = false,
}: CancelBookingDialogProps) {
    const [reason, setReason] = useState("");

    const customerName = booking.userSnapshot?.name || "Customer";

    const handleConfirm = () => {
        onConfirm(reason.trim() || undefined);
    };

    const handleClose = () => {
        setReason("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Cancel Booking
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to cancel the booking for{" "}
                        <span className="font-medium">{customerName}</span>?
                        This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-sm font-medium">
                            Reason (Optional)
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="Enter a reason for cancellation..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[80px]"
                            disabled={isCancelling}
                        />
                        <p className="text-xs text-muted-foreground">
                            Providing a reason helps with customer communication and analytics.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isCancelling}
                        className="w-full sm:w-auto"
                    >
                        Close
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isCancelling}
                        className="w-full sm:w-auto"
                    >
                        {isCancelling ? "Cancelling..." : "Cancel Booking"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
