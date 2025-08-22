import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreVertical,
    Mail,
    Phone,
    User,
    Calendar,
    CreditCard,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import { toast } from "sonner";
import type { BookingWithDetails } from "@repo/api/types/booking";
import { CancelBookingDialog } from "./cancel-booking-dialog";
import { Badge } from "@/components/ui/badge";

interface ClassBookingsItemProps {
    booking: BookingWithDetails;
    className?: string;
    onCancelBooking?: (booking: BookingWithDetails) => void;
    onDeleteBooking?: (bookingId: any) => Promise<void>;
}

export function ClassBookingsItem({
    booking,
    onCancelBooking,
    className,
    onDeleteBooking,
}: ClassBookingsItemProps) {
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const cancelBooking = useMutation(api.mutations.bookings.cancelBooking);

    const customerName = booking.userSnapshot?.name;

    const handleCancelBooking = async (reason?: string) => {
        if (isCancelling) return;

        try {
            setIsCancelling(true);

            await cancelBooking({
                bookingId: booking._id,
                reason: reason || "Cancelled by business",
                cancelledBy: "business"
            });

            toast.success(`Cancelled booking for ${customerName}`);

            // Call parent callback if provided
            if (onCancelBooking) {
                onCancelBooking(booking);
            }

            // Close the dialog
            setShowCancelDialog(false);
        } catch (error) {
            console.error('Failed to cancel booking:', error);
            toast.error('Failed to cancel booking. Please try again.');
        } finally {
            setIsCancelling(false);
        }
    };

    const formatBookingTime = (timestamp: number) => {
        return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
    };

    const formatCredits = (credits: number) => {
        return `${credits} credits`;
    };

    // Calculate discount savings if discount was applied
    const discountSavings = booking.appliedDiscount
        ? booking.originalPrice - booking.finalPrice
        : 0;

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'pending':
                return 'default';
            case 'completed':
                return 'secondary';
            case 'cancelled_by_consumer':
            case 'cancelled_by_business':
                return 'destructive';
            case 'no_show':
                return 'outline';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'completed':
                return 'Completed';
            case 'cancelled_by_consumer':
                return 'Cancelled (User)';
            case 'cancelled_by_business':
                return 'Cancelled (Business)';
            case 'no_show':
                return 'No Show';
            default:
                return status;
        }
    };

    return (
        <>
            <div className={cn("flex items-center justify-between py-3 px-3", className)}>
                <div className="flex items-center gap-3 flex-1">
                    {/* Customer Avatar/Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {/* Customer Details */}
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium leading-none">{customerName}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{booking.userSnapshot?.email}</span>
                            </div>
                            {booking.userSnapshot?.phone && (
                                <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{booking.userSnapshot.phone}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Booked: {formatBookingTime(booking.bookedAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                <span>{formatCredits(booking.creditsUsed)}</span>
                            </div>
                        </div>
                        {booking.appliedDiscount && (
                            <div className="text-xs text-green-600">
                                Discount applied: {booking.appliedDiscount.ruleName} (-{discountSavings} credits)
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    <Badge
                        variant={getStatusVariant(booking.status)}
                        className="text-xs"
                    >
                        {getStatusLabel(booking.status)}
                    </Badge>

                    {/* More Actions Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <MoreVertical className="h-4 w-4" />
                                )}
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {/* Only show Cancel Booking for non-cancelled bookings */}
                            {booking.status !== 'cancelled_by_consumer' &&
                                booking.status !== 'cancelled_by_business' && (
                                    <DropdownMenuItem
                                        onClick={() => setShowCancelDialog(true)}
                                        disabled={isCancelling}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        Cancel Booking
                                    </DropdownMenuItem>
                                )}

                            {/* Only show Remove Booking for cancelled bookings */}
                            {(booking.status === 'cancelled_by_consumer' ||
                                booking.status === 'cancelled_by_business') &&
                                onDeleteBooking && (
                                    <DropdownMenuItem
                                        onClick={() => onDeleteBooking(booking._id)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        Remove Booking
                                    </DropdownMenuItem>
                                )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Cancel Booking Confirmation Dialog */}
            <CancelBookingDialog
                isOpen={showCancelDialog}
                onClose={() => setShowCancelDialog(false)}
                onConfirm={handleCancelBooking}
                booking={booking}
                isCancelling={isCancelling}
            />
        </>
    );
}