import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBusinessNotifications, useUnreadBusinessNotifications } from "@/features/dashboard/hooks/use-business-notifications"
import { api } from "@repo/api/convex/_generated/api"
import { useMutation } from "convex/react"
import { useState } from "react"
import { useTypedTranslation } from "@/lib/typed"

export function NotificationsPopover() {
    const { t } = useTypedTranslation();
    const [isOpen, setIsOpen] = useState(false)

    // Get unread notifications for the bell badge count
    const { results: unreadNotifications } = useUnreadBusinessNotifications(50)

    // Get all notifications for the popover content
    const { results: notifications, loadMore, status } = useBusinessNotifications(20)

    const markNotificationSeen = useMutation(api.mutations.notifications.markNotificationSeen)

    const unreadCount = unreadNotifications?.length || 0

    const markAsSeen = async (notificationId: string) => {
        try {
            await markNotificationSeen({ notificationId: notificationId as any })
        } catch (error) {
            console.error("Failed to mark notification as seen:", error)
        }
    }

    // Helper function to format notification for display
    const formatNotification = (notification: NonNullable<typeof notifications>[number]) => {
        const getActionFromType = (type: string) => {
            switch (type) {
                case "booking_created":
                    return t('routes.notificationsPopover.actionBooked')
                case "booking_cancelled_by_consumer":
                    return t('routes.notificationsPopover.actionCancelled')
                case "booking_cancelled_by_business":
                    return t('routes.notificationsPopover.actionCancelled')
                case "payment_received":
                    return t('routes.notificationsPopover.actionPaidFor')
                case "review_received":
                    return t('routes.notificationsPopover.actionVenueReviewed')
                default:
                    return `Unhandled action: ${type}`
            }
        }

        const getTimestamp = (createdAt: number) => {
            const now = Date.now()
            const diff = now - createdAt
            const minutes = Math.floor(diff / (1000 * 60))
            const hours = Math.floor(diff / (1000 * 60 * 60))
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))

            if (minutes < 1) return t('routes.notificationsPopover.justNow')
            if (minutes < 60) return t('routes.notificationsPopover.minAgo', { count: minutes })
            if (hours < 24) {
                return hours === 1
                    ? t('routes.notificationsPopover.hourAgo', { count: hours })
                    : t('routes.notificationsPopover.hoursAgo', { count: hours })
            }
            return days === 1
                ? t('routes.notificationsPopover.dayAgo', { count: days })
                : t('routes.notificationsPopover.daysAgo', { count: days })
        }

        return {
            id: notification._id,
            customerName: notification.metadata?.userName || t('routes.notificationsPopover.customer'),
            action: getActionFromType(notification.type),
            className: notification.metadata?.className || t('routes.notificationsPopover.class'),
            classTime: t('routes.notificationsPopover.timeTbd'), // Could be enhanced with class instance data
            timestamp: getTimestamp(notification.createdAt),
            isSeen: notification.seen,
            isNotification: true,
        }
    }

    const displayActivities = notifications?.map(formatNotification) || []

    // Helper to check if notification type is positive (green) or negative (red)
    const isPositiveNotification = (notificationType: string) => {
        return notificationType === "booking_created" || notificationType === "payment_received"
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant='outline' size="icon" className="relative">
                    <Bell />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                <div className="p-4 border-b">
                    <h3 className="font-semibold text-sm">{t('routes.notificationsPopover.title')}</h3>
                    {unreadCount > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {unreadCount === 1
                                ? t('routes.notificationsPopover.unreadCount', { count: unreadCount })
                                : t('routes.notificationsPopover.unreadCountPlural', { count: unreadCount })
                            }
                        </p>
                    )}
                </div>
                <ScrollArea className="h-80">
                    <div className="p-0">
                        {displayActivities.length > 0 ? (
                            displayActivities.map((activity, index) => {
                                const originalNotification = notifications?.[index]
                                const isPositive = originalNotification ? isPositiveNotification(originalNotification.type) : false

                                return (
                                    <div
                                        key={activity.id}
                                        className={cn(
                                            "p-3 flex items-start gap-3 border-b border-muted cursor-pointer transition-colors hover:bg-muted/50",
                                            !activity.isSeen && "bg-blue-50/50"
                                        )}
                                        onClick={() => {
                                            if ('isNotification' in activity && activity.isNotification) {
                                                markAsSeen(activity.id)
                                            }
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                "flex-shrink-0 w-2 h-2 rounded-full mt-1.5",
                                                isPositive
                                                    ? "bg-green-500"
                                                    : "bg-red-500"
                                            )}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-tight">
                                                <span className="font-bold">{activity.customerName}</span> {activity.action}{" "}
                                                <span className="font-semibold">{activity.className}</span>
                                                {activity.classTime !== t('routes.notificationsPopover.timeTbd') && ` - ${activity.classTime}`}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                                        </div>
                                        {!activity.isSeen && (
                                            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                                        )}
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground italic text-sm">{t('routes.notificationsPopover.noNotifications')}</p>
                                {status === "LoadingFirstPage" && (
                                    <p className="text-xs text-muted-foreground mt-2">{t('routes.notificationsPopover.loadingNotifications')}</p>
                                )}
                            </div>
                        )}
                        {status === "CanLoadMore" && (
                            <div className="p-4 text-center border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => loadMore(10)}
                                    disabled={status !== 'CanLoadMore'}
                                >
                                    {t('routes.notificationsPopover.loadMore')}
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}