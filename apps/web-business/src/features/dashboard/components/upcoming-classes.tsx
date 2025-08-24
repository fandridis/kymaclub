import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowRight, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link } from "@tanstack/react-router"
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
                                    "w-4 h-4 rounded",
                                    isBooked ? "bg-green-500" : "bg-zinc-200"
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

export function UpcomingClasses({ className }: UpcomingClassesProps) {
    const { data, loading } = useUpcomingClassesWithBookings({
        startDate: now,
        limit: 500,
    })
    const [bookingsDialog, setBookingsDialog] = useState<{ open: boolean; classInstance: Doc<"classInstances"> | null; bookings: Doc<"bookings">[] } | null>(null)

    // Group classes by date
    const classesByDate = React.useMemo(() => {
        if (!data || data.length === 0) return {}

        const grouped: Record<string, typeof data> = {}

        data.forEach((item) => {
            const classInstance = item.classInstance
            const date = new Date(classInstance.startTime)
            const dateKey = getDateKey(date)

            if (!grouped[dateKey]) {
                grouped[dateKey] = []
            }
            // At this point, grouped[dateKey] is guaranteed to be an array
            grouped[dateKey]!.push(item)
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
            <Card className={cn("h-[80vh] md:h-[60vh] flex flex-col shadow-sm gap-2", className)}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5" />
                        <h2 className="text-xl font-semibold">Upcoming Classes</h2>
                    </CardTitle>
                    <CardDescription>
                        Classes scheduled for today and future dates.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto">
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Loading upcoming classes...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card className={cn("h-[80vh] md:h-[60vh] flex flex-col shadow-sm gap-2", className)}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5" />
                        <h2 className="text-xl font-semibold">Upcoming Classes</h2>
                    </CardTitle>
                    <CardDescription>
                        Classes scheduled for today and future dates.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto">
                    <ScrollArea className="h-full px-3">
                        {sections.length > 0 ? (
                            sections.map(([date, classes]) => (
                                <div key={date} data-date-section className="flex flex-col gap-1">
                                    <h3 className="px-1 mt-3 sticky top-0 z-10 bg-background text-[11px] font-medium uppercase tracking-wide text-primary/70">
                                        {date}
                                    </h3>
                                    <div className="grid gap-2">
                                        {classes.map((item) => {
                                            const { classInstance, bookings } = item
                                            const classTitle = classInstance.templateSnapshot?.name || classInstance.name || 'Unnamed Class'
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
                                                <div key={classInstance._id}>
                                                    <div
                                                        className="cursor-pointer"
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
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground italic text-sm">
                                    No upcoming classes scheduled.
                                </p>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full bg-transparent">
                        <Link to="/calendar" className="flex items-center justify-center gap-2">
                            View calendar <ArrowRight className="w-4 h-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>

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
