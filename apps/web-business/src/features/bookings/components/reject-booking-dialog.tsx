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
import { XCircle } from "lucide-react";
import type { Doc } from "@repo/api/convex/_generated/dataModel";

interface RejectBookingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason?: string) => void;
    booking: Doc<"bookings">;
    isRejecting?: boolean;
}

export function RejectBookingDialog({
    isOpen,
    onClose,
    onConfirm,
    booking,
    isRejecting = false,
}: RejectBookingDialogProps) {
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
                        <XCircle className="h-5 w-5" />
                        Reject Booking Request
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to reject the booking request from{" "}
                        <span className="font-medium">{customerName}</span>?
                        The customer will receive a full refund.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-sm font-medium">
                            Reason (Optional)
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="Enter a reason for rejecting this booking..."
                            value={reason}
                            onChange={(e) => {
                                if (e.target.value.length <= 250) {
                                    setReason(e.target.value);
                                }
                            }}
                            className="min-h-[80px]"
                            disabled={isRejecting}
                            maxLength={250}
                        />
                        <div className="flex justify-between items-start">
                            <p className="text-xs text-muted-foreground">
                                {reason.length}/250 characters
                            </p>
                            <p className="text-xs text-muted-foreground">
                                This will be shared with the customer
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isRejecting}
                        className="w-full sm:w-auto"
                    >
                        Close
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isRejecting}
                        className="w-full sm:w-auto"
                    >
                        {isRejecting ? "Rejecting..." : "Reject Booking"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

