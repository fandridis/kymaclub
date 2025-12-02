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
    Clock,
    Euro,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import { toast } from "sonner";
import { CancelBookingDialog } from "./cancel-booking-dialog";
import { Badge } from "@/components/ui/badge";
import type { Doc } from "@repo/api/convex/_generated/dataModel";
import { formatEuros } from "@repo/utils/credits";
import { QuestionnaireAnswersDisplay } from "@/components/questionnaire-answers-display";
import type { QuestionnaireAnswers } from "@repo/api/types/questionnaire";

interface ClassBookingsItemProps {
    booking: Doc<"bookings">;
    className?: string;
    onCancelBooking?: (booking: Doc<"bookings">) => void;
    onDeleteBooking?: (bookingId: any) => Promise<void>;
}

export function ClassBookingsItem({
    booking,
    onCancelBooking,
    className,
}: ClassBookingsItemProps) {
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isAllowingRebook, setIsAllowingRebook] = useState(false);
    const cancelBooking = useMutation(api.mutations.bookings.cancelBooking);
    const allowRebooking = useMutation(api.mutations.bookings.allowRebooking);

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

    const handleAllowRebooking = async () => {
        if (isAllowingRebook) return;

        try {
            setIsAllowingRebook(true);

            await allowRebooking({
                bookingId: booking._id,
            });

            toast.success(`Rebooking allowed for ${customerName}`);
        } catch (error) {
            console.error('Failed to allow rebooking:', error);
            toast.error('Failed to allow rebooking. Please try again.');
        } finally {
            setIsAllowingRebook(false);
        }
    };

    const formatBookingTime = (timestamp: number) => {
        return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
    };

    // Format class date and time from classInstanceSnapshot
    const formatClassDate = (timestamp: number) => {
        return format(new Date(timestamp), "MMM d, yyyy");
    };

    const formatClassTime = (startTime: number, endTime?: number) => {
        const start = format(new Date(startTime), "h:mm a");
        if (endTime) {
            const end = format(new Date(endTime), "h:mm a");
            return `${start} - ${end}`;
        }
        return start;
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'pending':
                return 'default';
            case 'completed':
                return 'secondary';
            case 'cancelled_by_consumer':
            case 'cancelled_by_business':
                return 'destructive';
            case 'cancelled_by_business_rebookable':
                return 'secondary'; // Yellow-ish variant for rebookable
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
            case 'cancelled_by_business_rebookable':
                return 'Rebookable';
            case 'no_show':
                return 'No Show';
            default:
                return status;
        }
    };

    // Cast questionnaireAnswers to the correct type
    const questionnaireAnswers = booking.questionnaireAnswers as QuestionnaireAnswers | undefined;
    const hasQuestionnaire = questionnaireAnswers &&
        questionnaireAnswers.answers &&
        questionnaireAnswers.answers.length > 0;

    return (
        <>
            <div className={cn("flex flex-col gap-3 py-3 px-3", className)}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                {booking.classInstanceSnapshot?.startTime && (
                                    <>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>{formatClassDate(booking.classInstanceSnapshot.startTime)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{formatClassTime(booking.classInstanceSnapshot.startTime, booking.classInstanceSnapshot.endTime)}</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex items-center gap-1">
                                    <Euro className="h-3 w-3" />
                                    <span className="font-medium">{formatEuros(booking.finalPrice / 100)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:shrink-0">
                        {/* Status Badge */}
                        <Badge
                            variant={getStatusVariant(booking.status)}
                            className="text-xs"
                        >
                            {getStatusLabel(booking.status)}
                        </Badge>

                        {/* More Actions Dropdown - Only show if there are actions */}
                        {(() => {
                            const hasActions =
                                (booking.status === 'pending') || // Can cancel
                                (booking.status === 'cancelled_by_business'); // Can allow rebooking

                            if (!hasActions) return null;

                            return (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            disabled={isCancelling || isAllowingRebook}
                                        >
                                            {(isCancelling || isAllowingRebook) ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <MoreVertical className="h-4 w-4" />
                                            )}
                                            <span className="sr-only">Open menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {/* Only show Cancel Booking for non-cancelled bookings */}
                                        {booking.status === 'pending' && (
                                            <DropdownMenuItem
                                                onClick={() => setShowCancelDialog(true)}
                                                disabled={isCancelling}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                Cancel Booking
                                            </DropdownMenuItem>
                                        )}

                                        {/* Show Allow Rebooking for business-cancelled bookings */}
                                        {booking.status === 'cancelled_by_business' && (
                                            <DropdownMenuItem
                                                onClick={handleAllowRebooking}
                                                disabled={isAllowingRebook}
                                                className="text-blue-600 focus:text-blue-600"
                                            >
                                                Allow Rebooking
                                            </DropdownMenuItem>
                                        )}

                                    </DropdownMenuContent>
                                </DropdownMenu>
                            );
                        })()}
                    </div>
                </div>

                {/* Questionnaire Answers - Collapsible section */}
                {hasQuestionnaire && (
                    <QuestionnaireAnswersDisplay
                        questionnaireAnswers={questionnaireAnswers}
                        className="ml-13"
                    />
                )}
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