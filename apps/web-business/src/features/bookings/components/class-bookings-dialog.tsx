import * as React from "react"
import {
    DialogOrDrawer,
    DialogOrDrawerContent,
    DialogOrDrawerFooter,
    DialogOrDrawerHeader,
    DialogOrDrawerTitle,
    DialogOrDrawerTrigger,
} from "@/components/ui/dialog-or-drawer"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, Users, X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import type { Doc } from "@repo/api/convex/_generated/dataModel"
import { useMutation } from "convex/react"
import { api } from "@repo/api/convex/_generated/api"
import { ClassBookingsItem } from "@/features/bookings/components/class-bookings-item"
import { useClassBookings } from "../hooks/use-class-bookings"
import { useTypedTranslation } from "@/lib/typed"

interface ClassBookingsDialogProps {
    classInstance: Doc<"classInstances">
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}

export function ClassBookingsDialog({
    classInstance,
    open,
    onOpenChange,
    children,
}: ClassBookingsDialogProps) {
    const { t } = useTypedTranslation();
    const { bookings, isLoading } = useClassBookings(classInstance._id)

    const deleteBooking = useMutation(api.mutations.bookings.deleteBooking)

    // Deduplicate bookings by userId, keeping only the newest booking for each user
    const deduplicatedBookings = React.useMemo(() => {
        if (!bookings) return []

        const latestByUser = new Map<string, Doc<'bookings'>>()

        bookings.forEach((booking) => {
            const userId = booking.userId
            if (!userId) return

            const existing = latestByUser.get(userId)
            if (!existing || booking.createdAt > existing.createdAt) {
                latestByUser.set(userId, booking)
            }
        })

        return Array.from(latestByUser.values())
    }, [bookings])

    const formatDateTime = (startTime: number, endTime: number) => {
        const start = new Date(startTime)
        const end = new Date(endTime)
        return {
            date: format(start, "EEEE, MMMM d, yyyy"),
            time: `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`
        }
    }

    const { date, time } = formatDateTime(classInstance.startTime, classInstance.endTime ?? 0)
    const capacity = classInstance.capacity ?? 0
    const className = classInstance.name ?? classInstance.templateSnapshot?.name ?? "Class"

    // Filter only pending bookings for the count (using deduplicated bookings)
    const pendingBookings = deduplicatedBookings?.filter(booking => booking.status === 'pending') || []

    const handleRemoveBooking = async (bookingId: any) => {
        try {
            await deleteBooking({ bookingId })
        } catch (error) {
            console.error('Failed to delete booking:', error)
        }
    }

    return (
        <DialogOrDrawer open={open} onOpenChange={onOpenChange}>
            <DialogOrDrawerTrigger asChild>{children}</DialogOrDrawerTrigger>
            <DialogOrDrawerContent className="px-2 md:px-6 w-full sm:max-w-2xl" showCloseButton={false}>
                <div className="flex flex-col max-h-[75vh]">
                    <DialogOrDrawerHeader>
                        <div className="flex items-center justify-between">
                            <DialogOrDrawerTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                {t('routes.bookings.viewDialog.title', { className })}
                            </DialogOrDrawerTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenChange(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogOrDrawerHeader>
                    <div className="h-full grid gap-4 py-4 overflow-y-auto">
                        {/* Class Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm">
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{t('routes.bookings.date')}</span>
                                <span className="text-muted-foreground">{date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{t('routes.bookings.time')}</span>
                                <span className="text-muted-foreground">{time}</span>
                            </div>
                        </div>

                        <Separator className="my-2" />

                        {/* Bookings List */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <span>{t('routes.bookings.viewDialog.currentBookings')} - </span>
                                        <Skeleton className="h-5 w-12 inline-block" />
                                        <span> / {capacity}</span>
                                    </div>
                                ) : (
                                    `${t('routes.bookings.viewDialog.currentBookings')} - ${pendingBookings.length} / ${capacity}`
                                )}
                            </h3>

                            <ScrollArea className="max-h-96">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        {/* Loading skeleton for bookings */}
                                        {Array.from({ length: 2 }).map((_, index) => (
                                            <div key={index} className="flex items-center space-x-3 p-3">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-2 flex-1">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                                <Skeleton className="h-8 w-20" />
                                            </div>
                                        ))}
                                    </div>
                                ) : deduplicatedBookings && deduplicatedBookings.length > 0 ? (
                                    <div className="space-y-0">
                                        {deduplicatedBookings.map((booking, index) => (
                                            <div key={booking._id}>
                                                <ClassBookingsItem
                                                    booking={booking}
                                                    onDeleteBooking={handleRemoveBooking}
                                                />
                                                {index < deduplicatedBookings.length - 1 && (
                                                    <Separator className="ml-13" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <Users className="h-12 w-12 text-muted-foreground mb-3" />
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {t('routes.bookings.viewDialog.noBookingsYet')}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {t('routes.bookings.viewDialog.noBookingsDescription')}
                                        </p>
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                    <DialogOrDrawerFooter className="flex flex-col sm:flex-row sm:justify-end sm:space-x-2 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            {t('common.close')}
                        </Button>
                    </DialogOrDrawerFooter>
                </div>
            </DialogOrDrawerContent>
        </DialogOrDrawer>
    )
}
