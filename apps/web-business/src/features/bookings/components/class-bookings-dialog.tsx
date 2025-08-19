import type * as React from "react"
import { useState } from "react"
import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerFooter,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
    DialogOrDrawerTrigger,
} from "@/components/ui/dialog-or-drawer"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, MapPin, Users, AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import type { Doc } from "@repo/api/convex/_generated/dataModel"
import type { BookingWithDetails } from "@repo/api/types/booking"
import { ClassBookingsItem } from "./class-bookings-item"
import { toast } from "sonner"

interface ClassBookingsDialogProps {
    classInstance: Doc<"classInstances">
    classTemplate?: Doc<"classTemplates">
    venue?: Doc<"venues">
    bookings: BookingWithDetails[]
    onCancelClass?: (classInstanceId: string) => void
    children: React.ReactNode
}

export function ClassBookingsDialog({
    classInstance,
    classTemplate,
    venue,
    bookings,
    onCancelClass,
    children,
}: ClassBookingsDialogProps) {
    const [isOpen, setIsOpen] = useState(false)

    const handleViewCustomer = (booking: BookingWithDetails) => {
        // TODO: Implement customer details view
        toast.info("Customer details view not implemented yet")
    }

    const handleCancelBooking = (booking: BookingWithDetails) => {
        // TODO: Implement booking cancellation
        toast.info("Booking cancellation not implemented yet")
    }

    const handleMarkCompleted = (booking: BookingWithDetails) => {
        // TODO: Implement mark as completed
        toast.info("Mark completed not implemented yet")
    }

    const handleMarkNoShow = (booking: BookingWithDetails) => {
        // TODO: Implement mark as no-show
        toast.info("Mark no-show not implemented yet")
    }

    const formatDateTime = (startTime: number, endTime: number) => {
        const start = new Date(startTime)
        const end = new Date(endTime)
        return {
            date: format(start, "EEEE, MMMM d, yyyy"),
            time: `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`
        }
    }

    const { date, time } = formatDateTime(classInstance.startTime, classInstance.endTime ?? 0)
    const capacity = classInstance.capacity ?? classTemplate?.capacity ?? 0
    const className = classTemplate?.name ?? classInstance.name ?? "Class"
    console.log('bookings', bookings)

    return (
        <DialogOrDrawer open={isOpen} onOpenChange={setIsOpen}>
            <DialogOrDrawerTrigger asChild>{children}</DialogOrDrawerTrigger>
            <DialogOrDrawerContent className="px-2 md:px-6 w-full sm:max-w-2xl">
                <div className="flex flex-col max-h-[75vh]">
                    <DialogOrDrawerHeader>
                        <DialogOrDrawerTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {className} Bookings
                        </DialogOrDrawerTitle>
                    </DialogOrDrawerHeader>
                    <div className="h-full grid gap-4 py-4 overflow-y-auto">
                        {/* Class Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Date:</span>
                                <span className="text-muted-foreground">{date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Time:</span>
                                <span className="text-muted-foreground">{time}</span>
                            </div>
                            {venue && (
                                <div className="flex items-center gap-2 text-sm sm:col-span-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Venue:</span>
                                    <span className="text-muted-foreground">{venue.name}</span>
                                </div>
                            )}
                        </div>

                        <Separator className="my-2" />

                        {/* Bookings List */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">
                                Current Bookings - {bookings.length} / {capacity}
                            </h3>

                            <ScrollArea className="max-h-96">
                                {bookings.length > 0 ? (
                                    <div className="space-y-0">
                                        {bookings.map((booking, index) => (
                                            <div key={booking._id}>
                                                <ClassBookingsItem
                                                    booking={booking}
                                                />
                                                {index < bookings.length - 1 && (
                                                    <Separator className="ml-13" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <Users className="h-12 w-12 text-muted-foreground mb-3" />
                                        <p className="text-sm text-muted-foreground mb-1">
                                            No bookings yet
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Customers haven't booked this class yet
                                        </p>
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                    <DialogOrDrawerFooter className="flex flex-col sm:flex-row sm:justify-end sm:space-x-2 pt-4">
                        {onCancelClass && (
                            <Button
                                variant="destructive"
                                onClick={() => onCancelClass(classInstance._id)}
                            >
                                Cancel Class
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Close
                        </Button>
                    </DialogOrDrawerFooter>
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    )
}
