import { useState } from "react";

import {
    Activity,
    CalendarCheck,
    CreditCard,
    LineChart,
    Star,
    Eye,
} from "lucide-react";
import { ClassBookingsDialog } from "@/features/bookings/components/class-bookings-dialog";
import type { Doc } from "@repo/api/convex/_generated/dataModel";
import { UpcomingClasses } from "./upcoming-classes";
import { MinimalStatCard } from "./minimal-stat-card";
import { MinimalSection } from "./minimal-section";
import { AISuggestionsModal } from "@/components/ai-suggestions-modal";
import { useDashboardMetrics } from "../hooks/use-dashboard-metrics";
import { useBusinessReviews } from "@/hooks/use-business-reviews";
import { useAuthStore } from "@/components/stores/auth";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";


export default function DashboardPage() {
    const [bookingsDialog, setBookingsDialog] = useState<{
        open: boolean;
        classInstance: Doc<"classInstances"> | null;
        bookings: Doc<"bookings">[]
    } | null>(null);

    const { user } = useAuthStore();
    const businessId = user?.businessId || null;

    const { metrics, isLoading } = useDashboardMetrics();
    const { reviews, isLoading: reviewsLoading } = useBusinessReviews(businessId, 10);

    // Create stat cards from real metrics data
    const statCards = metrics ? [
        {
            title: "Check-ins today",
            value: metrics.checkInsToday.count.toString(),
            change: `${metrics.checkInsToday.isPositive ? '+' : ''}${metrics.checkInsToday.change}%`,
            changeTone: metrics.checkInsToday.isPositive ? "positive" as const : "negative" as const,
            helper: "vs yesterday",
            icon: <CalendarCheck />,
        },
        {
            title: "Monthly visits",
            value: metrics.monthlyVisits.count.toString(),
            change: `${metrics.monthlyVisits.isPositive ? '+' : ''}${metrics.monthlyVisits.change}%`,
            changeTone: metrics.monthlyVisits.isPositive ? "positive" as const : "negative" as const,
            helper: "vs last month",
            icon: <LineChart />,
        },
        {
            title: "Monthly revenue",
            value: `€${(metrics.monthlyRevenue.net / 100).toFixed(2)}`,
            change: `${metrics.monthlyRevenue.isPositive ? '+' : ''}${metrics.monthlyRevenue.change}%`,
            changeTone: metrics.monthlyRevenue.isPositive ? "positive" as const : "negative" as const,
            helper: "vs last month",
            icon: <CreditCard />,
        },
        {
            title: "Attendance rate",
            value: `${metrics.attendanceRate.percentage}%`,
            change: `${metrics.attendanceRate.isPositive ? '+' : ''}${metrics.attendanceRate.change}%`,
            changeTone: metrics.attendanceRate.isPositive ? "positive" as const : "negative" as const,
            helper: "last 100 classes",
            icon: <Activity />,
        },
    ] : [];

    // Show loading skeleton when loading
    if (isLoading || reviewsLoading) {
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
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((stat) => (
                    <MinimalStatCard
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        change={stat.change}
                        changeTone={stat.changeTone}
                        helper={stat.helper}
                        icon={stat.icon}
                    />
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <MinimalSection
                    title="Classes overview"
                    description="Monitor demand and occupancy for upcoming classes"
                    className="max-h-[70vh] overflow-y-auto"
                >
                    <UpcomingClasses />
                </MinimalSection>

                <MinimalSection
                    title="Member feedback"
                    description="Celebrate wins and discover improvement opportunities"
                    headerAction={
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => {/* TODO: Open reviews modal */ }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View All
                            </Button>
                            <AISuggestionsModal size="sm" text="Insights" />
                        </div>
                    }
                    className="max-h-[70vh] overflow-y-auto"
                >
                    <div className="space-y-4">
                        {reviews.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No reviews yet</p>
                                <p className="text-sm">Reviews will appear here once customers start rating your venues</p>
                            </div>
                        ) : (
                            reviews.map((review) => (
                                <div key={review._id} className="rounded-lg border border-muted shadow-sm p-4 hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <span>{review.userSnapshot.name || 'Anonymous'}</span>
                                        <span className="text-muted-foreground text-xs">
                                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{review.venueSnapshot.name}</p>
                                    <div className="mt-2 flex items-center gap-1">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <Star
                                                key={index}
                                                className={`h-3.5 w-3.5 ${index < review.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
                                                aria-hidden="true"
                                            />
                                        ))}
                                    </div>
                                    {review.comment && (
                                        <p className="mt-2 text-sm">{review.comment}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </MinimalSection>
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
        </div>
    );
}