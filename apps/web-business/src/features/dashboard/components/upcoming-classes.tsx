import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import React, { useState } from "react"
import useUpcomingClassesWithBookings from "../hooks/use-upcoming-classes-with-bookings"
import type { Doc } from "@repo/api/convex/_generated/dataModel"
import { TEMPLATE_COLORS_MAP } from "@/utils/colors"
import type { TemplateColorType } from "@repo/utils/colors"
import { ClassBookingsDialog } from "@/features/bookings/components/class-bookings-dialog"

interface UpcomingClassesProps {
    className?: string;
}

interface Booking {
    id: string
    user: {
        name: string
        avatar?: string
    }
    status: string
}

interface ClassBookingRowProps {
    classInstance: Doc<"classInstances">
    instructor: string
    date: string
    time: string
    location: string
    bookings: Booking[]
    maxCapacity: number
}

export function ClassBookingRow({
    classInstance,
    instructor,
    date,
    time,
    bookings,
    maxCapacity,
}: ClassBookingRowProps) {
    const color = classInstance.color as TemplateColorType

    const cardBackground = TEMPLATE_COLORS_MAP[color]?.background || 'bg-white'
    const cardBorder = TEMPLATE_COLORS_MAP[color]?.border || 'border-gray-200'
    const cardText = TEMPLATE_COLORS_MAP[color]?.text || 'text-gray-950'

    // Filter only pending bookings for counting and display
    const pendingBookings = bookings.filter(booking => booking.status === 'pending')
    const pendingCount = pendingBookings.length

    // Create the spots grid
    const renderSpotsGrid = () => {
        return (
            <div className="flex flex-col gap-1">
                <div className="text-xs text-muted-foreground text-center">{pendingCount} out of {maxCapacity} booked</div>
                <div className="grid grid-cols-5 gap-y-[3px]">
                    {Array.from({ length: maxCapacity }, (_, index) => {
                        const isBooked = index < pendingCount

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "w-4 h-4 rounded border border-zinc-500",
                                    isBooked ? "bg-emerald-500" : "bg-zinc-100/20"
                                )}
                                title={isBooked ? "Booked" : "Available"}
                            />
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <Card className={cn("p-4 shadow-xs text-green-950 bg-green-50", cardBackground, cardBorder, cardText)}>
            <div className="flex gap-6">
                {/* Left Column - Prominent Date & Time */}
                <div className={cn("flex flex-col items-center justify-center min-w-[100px] text-center border-r-2 pr-6", cardBorder)}>
                    <div className="text-sm font-medium">{date}</div>
                    <div className="text-xl font-bold">{time}</div>
                </div>

                {/* Middle Column - Class Details */}
                <div className="flex-1 min-w-0">
                    <div className="mb-2">
                        <h3 className="font-semibold text-lg leading-tight">{classInstance.templateSnapshot?.name}</h3>
                        <p className="text-sm">with {instructor}</p>
                    </div>

                    {/* <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                         <div className="flex items-center gap-1">
                             <MapPin className="h-4 w-4" />
                             <span>{location}</span>
                         </div>
                     </div> */}


                    {/* Avatars - Show only pending bookings */}
                    <div className="flex -space-x-2">
                        {pendingBookings.slice(0, 4).map((booking) => (
                            <Avatar key={booking.id} className="h-8 w-8 border-2 border-background">
                                <AvatarImage src={booking.user.avatar || "/placeholder.svg"} alt={booking.user.name} />
                                <AvatarFallback className="text-xs">
                                    {booking.user.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        ))}
                        {pendingCount > 4 && (
                            <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                <span className="text-xs text-muted-foreground font-medium">+{pendingCount - 4}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Spots Grid */}
                <div className="flex items-start">
                    {renderSpotsGrid()}
                </div>
            </div>
        </Card >
    )
}

const now = Date.now()
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const sevenDaysFromNow = now + SEVEN_DAYS_MS

export function UpcomingClasses({ className }: UpcomingClassesProps) {
    const { data, loading } = useUpcomingClassesWithBookings({
        startDate: now,
        limit: 500,
    })
    const [bookingsDialog, setBookingsDialog] = useState<{ open: boolean; classInstance: Doc<"classInstances"> | null; bookings: Doc<"bookings">[] } | null>(null)

    // Filter to next 7 days and group classes by date
    const classesByDate = React.useMemo(() => {
        if (!data || data.length === 0) return {}

        const grouped: Record<string, typeof data> = {}

        data.forEach((item) => {
            const classInstance = item.classInstance
            const startTime = classInstance.startTime

            // Only include classes in the next 7 days
            if (startTime <= sevenDaysFromNow) {
                const date = new Date(startTime)
                const dateKey = getDateKey(date)

                if (!grouped[dateKey]) {
                    grouped[dateKey] = []
                }
                // At this point, grouped[dateKey] is guaranteed to be an array
                grouped[dateKey]!.push(item)
            }
        })

        // Sort dates and sort classes within each date by start time
        Object.keys(grouped).forEach(dateKey => {
            const classes = grouped[dateKey]
            if (classes) {
                classes.sort((a, b) =>
                    new Date(a.classInstance.startTime).getTime() - new Date(b.classInstance.startTime).getTime()
                )
            }
        })

        return grouped
    }, [data])

    const sections = React.useMemo(() => Object.entries(classesByDate), [classesByDate])

    if (loading) {
        return (
            <div className={cn("space-y-6", className)}>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="w-5 h-5" />
                    <p>Loading upcoming classes...</p>
                </div>
            </div>
        )
    }

    if (sections.length === 0) {
        return (
            <div className={cn("space-y-6", className)}>
                <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-muted rounded-lg">
                    <CalendarDays className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg font-medium">No upcoming classes scheduled</p>
                    <p className="text-muted-foreground text-sm mt-2">Classes scheduled for the next 7 days will appear here</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className={cn("space-y-8", className)}>
                {sections.map(([date, classes]) => (
                    <div key={date} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold tracking-tight">{date}</h2>
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-sm text-muted-foreground">{classes.length} {classes.length === 1 ? 'class' : 'classes'}</span>
                        </div>

                        <div className="grid gap-4">
                            {classes.map((item) => {
                                const { classInstance, bookings } = item
                                const instructor = classInstance.instructor || 'TBD'
                                const dateStr = formatDate(new Date(classInstance.startTime))
                                const timeStr = formatTime(classInstance.startTime)
                                const location = classInstance.venueSnapshot?.address ?
                                    `${classInstance.venueSnapshot.address.street}, ${classInstance.venueSnapshot.address.city}` :
                                    'Location TBD'
                                const maxCapacity = classInstance.capacity || 0

                                // Transform bookings to match the new interface
                                const transformedBookings: Booking[] = (bookings || []).map(booking => ({
                                    id: booking._id || Math.random().toString(),
                                    user: {
                                        name: booking.userSnapshot?.name || 'Unknown User',
                                        avatar: undefined // userSnapshot doesn't have avatar field
                                    },
                                    status: booking.status || 'pending'
                                }))

                                return (
                                    <div
                                        key={classInstance._id}
                                        className="cursor-pointer transition-opacity hover:opacity-80"
                                        onClick={() => setBookingsDialog({ open: true, classInstance, bookings: bookings || [] })}
                                    >
                                        <ClassBookingRow
                                            classInstance={classInstance}
                                            instructor={instructor}
                                            date={dateStr}
                                            time={timeStr}
                                            location={location}
                                            bookings={transformedBookings}
                                            maxCapacity={maxCapacity}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bookings Dialog */}
            {bookingsDialog && (
                <ClassBookingsDialog
                    open={bookingsDialog.open}
                    onOpenChange={(open: boolean) => setBookingsDialog(open ? bookingsDialog : null)}
                    classInstance={bookingsDialog.classInstance!}
                >
                    <div />
                </ClassBookingsDialog>
            )}
        </>
    )
}

// Helper function to get a readable date key
function getDateKey(date: Date): string {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (dateOnly.getTime() === today.getTime()) {
        return 'Today'
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
        return 'Tomorrow'
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })
    }
}

// Helper function to format date
function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    })
}

// Helper function to format time
function formatTime(timestamp: number | string): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })
}
