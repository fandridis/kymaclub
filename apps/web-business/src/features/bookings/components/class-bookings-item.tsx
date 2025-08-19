import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    Clock,
    CreditCard,
    AlertCircle,
    CheckCircle,
    XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingWithDetails } from "@repo/api/types/booking";

interface ClassBookingsItemProps {
    booking: BookingWithDetails;
    onViewCustomer?: (booking: BookingWithDetails) => void;
    onCancelBooking?: (booking: BookingWithDetails) => void;
    onMarkCompleted?: (booking: BookingWithDetails) => void;
    onMarkNoShow?: (booking: BookingWithDetails) => void;
    className?: string;
}

export function ClassBookingsItem({
    booking,
    onViewCustomer,
    onCancelBooking,
    onMarkCompleted,
    onMarkNoShow,
    className,
}: ClassBookingsItemProps) {
    const customerName = booking.userSnapshot?.name;
    const customerEmail = booking.userSnapshot?.email;
    const customerPhone = booking.userSnapshot?.phone;

    const handleCancelBooking = () => {
        console.log('cancel booking', booking);
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

    return (
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
                            <span>{customerEmail}</span>
                        </div>
                        {customerPhone && (
                            <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{customerPhone}</span>
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
                {/* More Actions Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={handleCancelBooking}
                            className="text-destructive focus:text-destructive"
                        >
                            Cancel Booking
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}