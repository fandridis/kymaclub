import { useState } from "react";

import {
    Activity,
    CalendarCheck,
    CreditCard,
    LineChart,
    Calendar,
} from "lucide-react";
import { ClassBookingsDialog } from "@/features/bookings/components/class-bookings-dialog";
import type { Doc, Id } from "@repo/api/convex/_generated/dataModel";
import { MinimalStatCard } from "./minimal-stat-card";
import { AISuggestionsModal } from "@/components/ai-suggestions-modal";
import { useDashboardMetrics } from "../hooks/use-dashboard-metrics";
import { useBusinessReviews } from "@/hooks/use-business-reviews";
import { useAuthStore } from "@/components/stores/auth";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useHappeningTodayClasses } from "../hooks/use-happening-today-classes";
import { useClassImages } from "../hooks/use-class-images";
import { ClassCarousel } from "@/components/class-carousel";
import { FeedbackCarousel } from "@/components/feedback-carousel";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@repo/api/convex/_generated/api";
import { Link } from "@tanstack/react-router";
import EditClassInstanceDialog from "@/features/calendar/components/edit-class-instance-dialog";


export default function DashboardPage() {
    const [bookingsDialog, setBookingsDialog] = useState<{
        open: boolean;
        classInstanceId: Id<"classInstances"> | null;
    } | null>(null);

    const [editDialog, setEditDialog] = useState<{
        open: boolean;
        classInstanceId: Id<"classInstances"> | null;
    } | null>(null);

    const { user, business } = useAuthStore();
    const businessId = user?.businessId || null;

    const { metrics, isLoading } = useDashboardMetrics();
    const { reviews, isLoading: reviewsLoading } = useBusinessReviews(businessId, 10);

    // Fetch today's classes and images
    const { classes: happeningTodayClasses, isLoading: happeningTodayLoading } = useHappeningTodayClasses();
    const { imageUrlMap } = useClassImages(happeningTodayClasses);

    // Fetch full class instance when dialog opens
    const fullClassInstance = useQuery(
        api.queries.classInstances.getClassInstanceById,
        bookingsDialog?.classInstanceId ? { instanceId: bookingsDialog.classInstanceId } : "skip"
    );

    const classInstanceForEdit = useQuery(
        api.queries.classInstances.getClassInstanceById,
        editDialog?.classInstanceId ? { instanceId: editDialog.classInstanceId } : "skip"
    );

    // Get business timezone from business data (available in auth store)
    const businessTimezone = business?.timezone || "Europe/Athens";

    // Create stat cards from real metrics data
    const statCards = metrics ? [
        {
            title: "Check-ins today",
            value: metrics.checkInsToday.count.toString(),
            change: `${metrics.checkInsToday.isPositive ? '+' : ''}${metrics.checkInsToday.change}%`,
            changeTone: metrics.checkInsToday.isPositive ? "positive" as const : "negative" as const,
            helper: "vs yesterday",
            icon: <CalendarCheck />,
            iconColor: "emerald" as const,
        },
        {
            title: "Monthly visits",
            value: metrics.monthlyVisits.count.toString(),
            change: `${metrics.monthlyVisits.isPositive ? '+' : ''}${metrics.monthlyVisits.change}%`,
            changeTone: metrics.monthlyVisits.isPositive ? "positive" as const : "negative" as const,
            helper: "vs last month",
            icon: <LineChart />,
            iconColor: "sky" as const,
        },
        {
            title: "Monthly revenue",
            value: `€${(metrics.monthlyRevenue.net / 100).toFixed(2)}`,
            change: `${metrics.monthlyRevenue.isPositive ? '+' : ''}${metrics.monthlyRevenue.change}%`,
            changeTone: metrics.monthlyRevenue.isPositive ? "positive" as const : "negative" as const,
            helper: "vs last month",
            icon: <CreditCard />,
            iconColor: "amber" as const,
        },
        {
            title: "Attendance rate",
            value: `${metrics.attendanceRate.percentage}%`,
            change: `${metrics.attendanceRate.isPositive ? '+' : ''}${metrics.attendanceRate.change}%`,
            changeTone: metrics.attendanceRate.isPositive ? "positive" as const : "negative" as const,
            helper: "last 100 classes",
            icon: <Activity />,
            iconColor: "sky" as const,
        },
    ] : [];

    // Show loading skeleton when loading
    if (isLoading || reviewsLoading || happeningTodayLoading) {
        return (
            <div className="space-y-8 pb-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-96 bg-muted animate-pulse rounded mt-2" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-8 w-40 bg-muted animate-pulse rounded" />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-muted">
                            <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                            <div className="flex-1">
                                <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
                                <div className="h-6 w-16 bg-muted animate-pulse rounded mb-1" />
                                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
                    <p className="text-muted-foreground mt-2">
                        Track your studio performance, act on today's priorities, and spot opportunities at a glance.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <MinimalStatCard
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        change={stat.change}
                        changeTone={stat.changeTone}
                        helper={stat.helper}
                        icon={stat.icon}
                        iconColor={stat.iconColor}
                    />
                ))}
            </div>

            {/* Happening Today Section */}
            <ClassCarousel
                title="Today's Classes"
                classes={happeningTodayClasses}
                imageUrlMap={imageUrlMap}
                onClassClick={(instance) => {
                    setBookingsDialog({
                        open: true,
                        classInstanceId: instance._id,
                    });
                }}
                onViewBookings={(instance) => {
                    setBookingsDialog({
                        open: true,
                        classInstanceId: instance._id,
                    });
                }}
                onEdit={(instance) => {
                    setEditDialog({
                        open: true,
                        classInstanceId: instance._id,
                    });
                }}
                emptyMessage="No classes scheduled for today"
                emptyAction={
                    <Link to="/calendar">
                        <Button variant="outline" size="sm" className="mt-2">
                            <Calendar className="h-4 w-4 mr-2" />
                            View Calendar
                        </Button>
                    </Link>
                }
            />

            {/* Latest Feedback Section */}
            <FeedbackCarousel
                title="User Feedback"
                reviews={reviews}
                emptyMessage="No reviews yet"
                emptyAction={
                    <p className="text-sm text-muted-foreground">
                        Reviews will appear here once customers start rating your venues
                    </p>
                }
                headerAction={<AISuggestionsModal size="sm" text="Insights" />}
            />

            {/* Bookings Dialog */}
            {bookingsDialog && fullClassInstance && (
                <ClassBookingsDialog
                    open={bookingsDialog.open}
                    onOpenChange={(open: boolean) => setBookingsDialog(open ? bookingsDialog : null)}
                    classInstance={fullClassInstance}
                >
                    <div />
                </ClassBookingsDialog>
            )}

            {/* Edit Class Dialog */}
            {editDialog && classInstanceForEdit && (
                <EditClassInstanceDialog
                    open={editDialog.open}
                    instance={classInstanceForEdit}
                    onClose={() => setEditDialog(null)}
                    businessTimezone={businessTimezone}
                />
            )}
        </div>
    );
}