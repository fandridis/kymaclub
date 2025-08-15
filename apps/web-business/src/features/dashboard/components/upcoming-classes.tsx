import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, Users, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import React from "react"
import { Button } from "@/components/ui/button"
import { Link } from "@tanstack/react-router"
import { ClassDetailsDialog } from "@/features/bookings/components/class-bookings-dialog"

// Mock data for demonstration
const mockBookedUsers = [
    { id: "u1", name: "Alice Johnson", email: "alice@example.com" },
    { id: "u2", name: "Bob Smith", email: "bob@example.com" },
    { id: "u3", name: "Clara Lee", email: "clara@example.com" },
    { id: "u4", name: "Daniel Park", email: "daniel@example.com" },
    { id: "u5", name: "Eva Martinez", email: "eva@example.com" },
    { id: "u6", name: "Fiona Chen", email: "fiona@example.com" },
    { id: "u7", name: "George Kim", email: "george@example.com" },
    { id: "u8", name: "Hannah Lee", email: "hannah@example.com" },
    { id: "u9", name: "Isaac Park", email: "isaac@example.com" },
    { id: "u10", name: "Jenny Kim", email: "jenny@example.com" },
    { id: "u11", name: "Kevin Lee", email: "kevin@example.com" },
]

const upcomingClassesByDate = {
    Today: [
        {
            id: "yoga-9am",
            date: "Today",
            time: "9:00 AM",
            name: "Vinyasa Yoga",
            description: "A dynamic yoga session focusing on breath and movement.",
            instructor: "Alex Morgan",
            address: "123 Studio St, Springfield",
            currentEnrollment: 12,
            capacity: 15,
            newBookings: 3,
        },
        {
            id: "hiit-11am",
            date: "Today",
            time: "11:00 AM",
            name: "HIIT Training",
            description: "High intensity interval training for strength and cardio.",
            instructor: "Jamie Lee",
            address: "123 Studio St, Springfield",
            currentEnrollment: 8,
            capacity: 12,
            newBookings: 1,
        },
        {
            id: "spin-6pm",
            date: "Today",
            time: "6:00 PM",
            name: "Spin Class",
            description: "End your day with a motivating spin ride.",
            instructor: "Taylor Kim",
            address: "123 Studio St, Springfield",
            currentEnrollment: 15,
            capacity: 20,
            newBookings: 5,
        },
        {
            id: "yoga-9am-2",
            date: "Today",
            time: "9:00 AM",
            name: "Vinyasa Yoga",
            description: "Flow-based practice improving flexibility and balance.",
            instructor: "Jordan Smith",
            address: "123 Studio St, Springfield",
            currentEnrollment: 8,
            capacity: 12,
            newBookings: 1,
        },
        {
            id: "hiit-11am-2",
            date: "Today",
            time: "11:00 AM",
            name: "HIIT Training",
            description: "Full body HIIT with short recovery intervals.",
            instructor: "Sam Rivera",
            address: "123 Studio St, Springfield",
            currentEnrollment: 15,
            capacity: 20,
            newBookings: 5,
        },
    ],
    Tomorrow: [
        {
            id: "yoga-9am-tomorrow",
            date: "Tomorrow",
            time: "9:00 AM",
            name: "Vinyasa Yoga",
            description: "Gentle morning flow to start your day.",
            instructor: "Alex Morgan",
            address: "123 Studio St, Springfield",
            currentEnrollment: 5,
            capacity: 10,
            newBookings: 0,
        },
        {
            id: "zumba-10am",
            date: "Tomorrow",
            time: "10:00 AM",
            name: "Zumba Dance",
            description: "Fun dance workout set to energetic music.",
            instructor: "Jamie Lee",
            address: "123 Studio St, Springfield",
            currentEnrollment: 5,
            capacity: 10,
            newBookings: 0,
        },
    ],
    "Feb 21": [
        {
            id: "pilates-7pm",
            date: "Feb 21",
            time: "7:00 PM",
            name: "Pilates Core",
            description: "Core-strengthening pilates routine.",
            instructor: "Taylor Kim",
            address: "123 Studio St, Springfield",
            currentEnrollment: 10,
            capacity: 10,
            newBookings: 0,
        },
        {
            id: "yoga-9am-feb21",
            date: "Feb 21",
            time: "9:00 AM",
            name: "Vinyasa Yoga",
            description: "Breath-led flow suitable for all levels.",
            instructor: "Jordan Smith",
            address: "123 Studio St, Springfield",
            currentEnrollment: 10,
            capacity: 10,
            newBookings: 0,
        },
        {
            id: "hiit-11am-feb21",
            date: "Feb 21",
            time: "11:00 AM",
            name: "HIIT Training",
            description: "Interval training for endurance and power.",
            instructor: "Sam Rivera",
            address: "123 Studio St, Springfield",
            currentEnrollment: 10,
            capacity: 10,
            newBookings: 0,
        },
        {
            id: "yoga-12am",
            date: "Feb 21",
            time: "9:00 AM",
            name: "Vinyasa Yoga",
            description: "Mindful movement and deep stretching.",
            instructor: "Alex Morgan",
            address: "123 Studio St, Springfield",
            currentEnrollment: 10,
            capacity: 10,
            newBookings: 0,
        },
    ],
    "Feb 22": [], // No classes for this date
    "Feb 23": [
        {
            id: "barre-5pm",
            date: "Feb 23",
            time: "5:00 PM",
            name: "Barre Fitness",
            description: "Low-impact barre to tone and strengthen.",
            instructor: "Jamie Lee",
            address: "123 Studio St, Springfield",
            currentEnrollment: 7,
            capacity: 8,
            newBookings: 2,
        },
        {
            id: "yoga-9am-feb23",
            date: "Feb 23",
            time: "9:00 AM",
            name: "Vinyasa Yoga",
            description: "Energizing morning practice.",
            instructor: "Alex Morgan",
            address: "123 Studio St, Springfield",
            currentEnrollment: 7,
            capacity: 8,
            newBookings: 2,
        },
    ],
}

interface UpcomingClassesProps {
    className?: string;
}

export function UpcomingClasses({ className }: UpcomingClassesProps) {
    const sections = React.useMemo(() => Object.entries(upcomingClassesByDate), [])

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
                <ScrollArea className="h-full px-3">
                    {sections.map(([date, classes]) => (
                        <div key={date} data-date-section className="flex flex-col gap-1">
                            <h3 className="px-1 mt-3 sticky top-0 z-10 bg-background text-[11px] font-medium uppercase tracking-wide text-primary/70">
                                {date}
                            </h3>
                            <Separator />
                            {classes.length > 0 ? (
                                <div className="grid">
                                    {classes.map((cls) => {
                                        const isFull = cls.currentEnrollment >= cls.capacity
                                        const occupancy = Math.round((cls.currentEnrollment / cls.capacity) * 100)

                                        return (
                                            <ClassDetailsDialog
                                                key={cls.id}
                                                classDetails={{
                                                    id: cls.id,
                                                    name: cls.name,
                                                    description: cls.description,
                                                    instructor: cls.instructor,
                                                    address: cls.address,
                                                    date: cls.date,
                                                    time: cls.time,
                                                    capacity: cls.capacity,
                                                    currentBookings: cls.currentEnrollment,
                                                    bookedUsers: mockBookedUsers.slice(0, Math.min(cls.currentEnrollment, mockBookedUsers.length)),
                                                }}
                                                onRemoveBooking={(classId, userId) =>
                                                    console.log("remove-booking", { classId, userId })
                                                }
                                                onCancelClass={(classId) =>
                                                    console.log("cancel-class", { classId })
                                                }
                                            >
                                                <div
                                                    className="px-0 md:px-2 py-3 group rounded-lg bg-card/50 transition-colors hover:bg-accent/40 cursor-pointer"
                                                >
                                                    <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                                                        <div className="flex items-start gap-3">
                                                            <div>
                                                                <h4 className="font-semibold text-base leading-tight">
                                                                    {cls.time} - {cls.name}
                                                                </h4>
                                                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                                    <Users className="inline-block w-4 h-4 align-text-bottom" />
                                                                    <Tooltip>
                                                                        <TooltipTrigger className="text-sm text-muted-foreground/90 underline-offset-2 hover:underline">
                                                                            {cls.currentEnrollment}/{cls.capacity} enrolled
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            {occupancy}% full
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {isFull && (
                                                                <Badge variant="destructive" className="px-2.5 py-1">
                                                                    Full
                                                                </Badge>
                                                            )}
                                                            {cls.newBookings > 0 && (
                                                                <Badge variant="outline" className="px-2.5 py-1">
                                                                    +{cls.newBookings} new
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </ClassDetailsDialog>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="pl-4 pt-3 pb-4 text-muted-foreground italic text-sm">
                                    No classes scheduled.
                                </p>
                            )}
                        </div>
                    ))}
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
    )
}
