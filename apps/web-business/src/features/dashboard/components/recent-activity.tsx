import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, XCircle } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

// Initial mock data for recent activities, with an 'isSeen' property
const initialRecentActivities = [
    {
        id: "act-1",
        customerName: "Sarah M.",
        action: "booked",
        className: "Spin Class",
        classTime: "Today 6PM",
        timestamp: "2 min ago",
        isSeen: false,
    },
    {
        id: "act-2",
        customerName: "Mike R.",
        action: "booked",
        className: "Vinyasa Yoga",
        classTime: "Today 9AM",
        timestamp: "45 min ago",
        isSeen: false,
    },
    {
        id: "act-3",
        customerName: "Lisa K.",
        action: "booked",
        className: "Hot Yoga",
        classTime: "Next Mon 7AM",
        timestamp: "2 hours ago",
        isSeen: false,
    },
    {
        id: "act-4",
        customerName: "Tom P.",
        action: "cancelled",
        className: "HIIT Training",
        classTime: "Today 11AM",
        timestamp: "3 hours ago",
        isSeen: true, // Mark as seen for demonstration
    },
    {
        id: "act-5",
        customerName: "Emily S.",
        action: "booked",
        className: "Zumba",
        classTime: "Tomorrow 10AM",
        timestamp: "5 hours ago",
        isSeen: false,
    },
    {
        id: "act-6",
        customerName: "David L.",
        action: "booked",
        className: "Vinyasa Yoga",
        classTime: "Today 9AM",
        timestamp: "6 hours ago",
        isSeen: true,
    },
    {
        id: "act-7",
        customerName: "Olivia B.",
        action: "booked",
        className: "Spin Class",
        classTime: "Today 6PM",
        timestamp: "8 hours ago",
        isSeen: false,
    },
    {
        id: "act-8",
        customerName: "David L.",
        action: "booked",
        className: "Vinyasa Yoga",
        classTime: "Today 9AM",
        timestamp: "6 hours ago",
        isSeen: true,
    },
    {
        id: "act-9",
        customerName: "David L.",
        action: "booked",
        className: "Vinyasa Yoga",
        classTime: "Today 9AM",
        timestamp: "6 hours ago",
        isSeen: true,
    },
    {
        id: "act-10",
        customerName: "David L.",
        action: "booked",
        className: "Vinyasa Yoga",
        classTime: "Today 9AM",
        timestamp: "6 hours ago",
        isSeen: true,
    },
    {
        id: "act-11",
        customerName: "David L.",
        action: "booked",
        className: "Vinyasa Yoga",
        classTime: "Today 9AM",
        timestamp: "6 hours ago",
        isSeen: true,
    },
    {
        id: "act-12",
        customerName: "David L.",
        action: "booked",
        className: "Vinyasa Yoga",
        classTime: "Today 9AM",
        timestamp: "6 hours ago",
        isSeen: true,
    },
    {
        id: "act-13",
        customerName: "David L.",
        action: "booked",
        className: "Vinyasa Yoga",
        classTime: "Today 9AM",
        timestamp: "6 hours ago",
        isSeen: true,
    }
    // ... up to 100 activities would be here in a real application
].slice(0, 100) // Conceptual limit to the last 100 actions

interface RecentActivityProps {
    className?: string;
}

export function RecentActivity({ className }: RecentActivityProps) {
    const [recentActivities, setRecentActivities] = useState(initialRecentActivities)

    const handleClearActivity = () => {
        setRecentActivities([])
    }

    const markAsSeen = (id: string) => {
        setRecentActivities((prevActivities) =>
            prevActivities.map((activity) => (activity.id === id ? { ...activity, isSeen: true } : activity)),
        )
    }

    return (
        <Card className={cn("h-[80vh] md:h-[60vh] flex flex-col gap-2", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ArrowRight className="w-5 h-5" />
                    <h2 className="text-xl font-semibold">Recent Activity</h2>
                </CardTitle>
                <CardDescription>Latest bookings and cancellations.</CardDescription>
            </CardHeader>
            <CardContent className="mt-2 p-0 flex-1 overflow-y-auto">
                <ScrollArea className="h-full px-3">
                    <div className="grid gap-0">
                        {recentActivities.length > 0 ? (
                            recentActivities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className={`p-2 flex items-start gap-3 border-b border-muted cursor-pointer transition-colors hover:bg-muted/50`}
                                    onClick={() => markAsSeen(activity.id)}
                                >
                                    <div
                                        className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${activity.action === "booked" ? "bg-green-500" : "bg-red-500"}`}
                                    />
                                    <div>
                                        <p className="text-sm font-medium">
                                            <span className="font-bold">{activity.customerName}</span> {activity.action}{" "}
                                            <span className="font-semibold">{activity.className}</span> - {activity.classTime}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground italic text-center py-4">No recent activity.</p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full bg-transparent">
                    <Link to="/bookings" className="flex items-center justify-center gap-2">
                        View all recent bookings <ArrowRight className="w-4 h-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}