import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, XCircle } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { cn } from "@/lib/utils"
import { useBusinessNotifications } from "../hooks/use-business-notifications"
import { api } from "@repo/api/convex/_generated/api"
import { useMutation } from "convex/react"


interface RecentActivityProps {
    className?: string;
}

export function RecentActivity({ className }: RecentActivityProps) {
    // Real notifications from API
    const { results: notifications, loadMore, status } = useBusinessNotifications(20);
    const markNotificationSeen = useMutation(api.mutations.notifications.markNotificationSeen);


    console.log('notifications: ', notifications)

    const markAsSeen = async (notificationId: string) => {
        try {
            await markNotificationSeen({ notificationId: notificationId as any });
        } catch (error) {
            console.error("Failed to mark notification as seen:", error);
        }
    }

    // Helper function to format notification for display
    const formatNotification = (notification: NonNullable<typeof notifications>[number]) => {
        const getActionFromType = (type: string) => {
            switch (type) {
                case "booking_created":
                    return "booked";
                case "booking_cancelled":
                    return "cancelled";
                case "payment_received":
                    return "paid for";
                default:
                    return "updated";
            }
        };

        const getTimestamp = (createdAt: number) => {
            const now = Date.now();
            const diff = now - createdAt;
            const minutes = Math.floor(diff / (1000 * 60));
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));

            if (minutes < 1) return "Just now";
            if (minutes < 60) return `${minutes} min ago`;
            if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            return `${days} day${days > 1 ? 's' : ''} ago`;
        };

        return {
            id: notification._id,
            customerName: notification.metadata?.userName || "Customer",
            action: getActionFromType(notification.type),
            className: notification.metadata?.className || "Class",
            classTime: "Time TBD", // Could be enhanced with class instance data
            timestamp: getTimestamp(notification.createdAt),
            isSeen: notification.seen,
            isNotification: true,
        };
    }

    // Use real notifications if available, fallback to mock data
    const displayActivities = notifications.map(formatNotification)


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
                        {displayActivities.length > 0 ? (
                            displayActivities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className={`p-2 flex items-start gap-3 border-b border-muted cursor-pointer transition-colors hover:bg-muted/50 ${!activity.isSeen ? "bg-blue-50/50" : ""
                                        }`}
                                    onClick={() => {
                                        if ('isNotification' in activity && activity.isNotification) {
                                            markAsSeen(activity.id);
                                        }
                                    }}
                                >
                                    <div
                                        className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${activity.action === "booked" || activity.action === "paid for"
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                            }`}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            <span className="font-bold">{activity.customerName}</span> {activity.action}{" "}
                                            <span className="font-semibold">{activity.className}</span>
                                            {activity.classTime !== "Time TBD" && ` - ${activity.classTime}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                                    </div>
                                    {!activity.isSeen && (
                                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground italic">No recent activity.</p>
                                {status === "LoadingFirstPage" && (
                                    <p className="text-xs text-muted-foreground mt-2">Loading notifications...</p>
                                )}
                            </div>
                        )}
                        {status === "CanLoadMore" && (
                            <div className="p-4 text-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => loadMore(10)}
                                    disabled={status !== 'CanLoadMore'}
                                >
                                    {status === 'CanLoadMore' ? "Loading..." : "Load more"}
                                </Button>
                            </div>
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