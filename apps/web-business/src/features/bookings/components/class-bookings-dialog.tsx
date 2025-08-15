import type * as React from "react"
import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerFooter,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
    DialogOrDrawerTrigger,
} from "@/components/ui/dialog-or-drawer"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, MapPin, User, Mail } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BookedUser {
    id: string
    name: string
    email: string
}

interface ClassDetails {
    id: string
    name: string
    description: string
    instructor: string
    address: string
    date: string
    time: string
    capacity: number
    currentBookings: number
    bookedUsers: BookedUser[]
}

interface ClassDetailsDialogProps {
    classDetails: ClassDetails
    onRemoveBooking: (bookingId: string, userId: string) => void
    onCancelClass: (classId: string) => void
    children: React.ReactNode
}

export function ClassDetailsDialog({
    classDetails,
    onRemoveBooking,
    onCancelClass,
    children,
}: ClassDetailsDialogProps) {
    const { id, name, instructor, address, date, time, capacity, currentBookings, bookedUsers } =
        classDetails

    return (
        <DialogOrDrawer>
            <DialogOrDrawerTrigger asChild>{children}</DialogOrDrawerTrigger>
            <DialogOrDrawerContent className="px-2 md:px-6 w-full sm:max-w-2xl">
                <div className="flex flex-col max-h-[75vh]">
                    <DialogOrDrawerHeader>
                        <DialogOrDrawerTitle>{name}</DialogOrDrawerTitle>
                    </DialogOrDrawerHeader>
                    <div className="h-full grid gap-4 py-4 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>Instructor: {instructor}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>Address: {address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                <span>Date: {date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Time: {time}</span>
                            </div>
                        </div>

                        <Separator className="my-2" />

                        <div className="">
                            <h3 className="text-lg font-semibold mb-2">
                                Booked Users ({currentBookings}/{capacity})
                            </h3>
                            <div className="">
                                <ScrollArea className="h-full px-3">
                                    {bookedUsers.length > 0 ? (
                                        <div className="grid gap-0">
                                            {bookedUsers.map((user, index) => (
                                                <div
                                                    key={user.id}
                                                    className={cn(
                                                        "flex items-center justify-between py-3 px-3",
                                                        index < bookedUsers.length - 1 ? "border-b" : "",
                                                    )}
                                                >
                                                    <div className="grid gap-0.5">
                                                        <p className="text-sm font-medium">{user.name}</p>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Mail className="h-3 w-3" /> {user.email}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => onRemoveBooking(id, user.id)}
                                                        className="ml-auto"
                                                    >
                                                        Remove Booking
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No users have booked this class yet.</p>
                                    )}
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                    <DialogOrDrawerFooter className="flex flex-col sm:flex-row sm:justify-end sm:space-x-2 pt-4">
                        <Button variant="destructive" onClick={() => onCancelClass(id)}>
                            Cancel Class
                        </Button>
                        <Button variant="outline">Close</Button>
                    </DialogOrDrawerFooter>
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    )
}
