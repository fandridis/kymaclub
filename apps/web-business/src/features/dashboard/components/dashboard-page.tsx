import { useState } from "react";

import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Activity,
    CalendarCheck,
    CreditCard,
    LineChart,
    Star,
} from "lucide-react";
import { ClassBookingsDialog } from "@/features/bookings/components/class-bookings-dialog";
import type { Doc } from "@repo/api/convex/_generated/dataModel";
import { UpcomingClasses } from "./upcoming-classes";
import { MinimalStatCard } from "./minimal-stat-card";
import { MinimalSection } from "./minimal-section";
import { AISuggestionsModal } from "@/components/ai-suggestions-modal";
import { useDashboardMetrics } from "../hooks/use-dashboard-metrics";

const occupancyInsights = [
    {
        label: "Check-ins on time",
        value: 92,
        helper: "Members scanning before class start",
    },
    {
        label: "Late cancellations",
        value: 8,
        helper: "Recorded in the last 7 days",
    },
];

const memberFeedback = [
    {
        id: 1,
        member: "Eleni P.",
        className: "Morning Flow",
        rating: 5,
        comment: "Loved the adjustments today!",
        submitted: "1 hour ago",
    },
    {
        id: 2,
        member: "Giorgos M.",
        className: "Power Cycle",
        rating: 4,
        comment: "Great energy, could use cooler air earlier.",
        submitted: "Yesterday",
    },
    {
        id: 3,
        member: "Nadia T.",
        className: "Reformer Foundations",
        rating: 5,
        comment: "Instructor explained every move clearly.",
        submitted: "2 days ago",
    },
];

export default function DashboardPage() {
    const [bookingsDialog, setBookingsDialog] = useState<{
        open: boolean;
        classInstance: Doc<"classInstances"> | null;
        bookings: Doc<"bookings">[]
    } | null>(null);

    const { metrics, isLoading } = useDashboardMetrics();

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
    if (isLoading) {
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
                    title="Earnings overview"
                    description="Track your monthly and all-time revenue"
                    className="max-h-[70vh] overflow-y-auto"
                >
                    <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {metrics && (
                                <>
                                    <div className="rounded-lg border border-muted shadow-sm p-4">
                                        <p className="text-sm text-muted-foreground">Monthly earnings</p>
                                        <p className="text-2xl font-semibold mt-1">€{(metrics.monthlyRevenue.net / 100).toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Your revenue this month</p>
                                    </div>
                                    <div className="rounded-lg border border-muted shadow-sm p-4">
                                        <p className="text-sm text-muted-foreground">All-time earnings</p>
                                        <p className="text-2xl font-semibold mt-1">€{(metrics.allTimeEarnings.net / 100).toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Total lifetime revenue</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <Separator className="opacity-50" />

                        <div className="space-y-5">
                            {metrics && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <span>Attendance rate</span>
                                        <span>{metrics.attendanceRate.percentage}%</span>
                                    </div>
                                    <Progress value={metrics.attendanceRate.percentage} className="h-1.5" aria-label="Attendance rate" />
                                    <p className="text-xs text-muted-foreground">
                                        {metrics.attendanceRate.attended} attended out of {metrics.attendanceRate.capacity} capacity
                                    </p>
                                </div>
                            )}
                            {occupancyInsights.slice(1).map((insight) => (
                                <div key={insight.label} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <span>{insight.label}</span>
                                        <span>{insight.value}%</span>
                                    </div>
                                    <Progress value={insight.value} className="h-1.5" aria-label={insight.label} />
                                    <p className="text-xs text-muted-foreground">{insight.helper}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </MinimalSection>
            </div>

            <MinimalSection
                title="Member feedback"
                description="Celebrate wins and discover improvement opportunities"
                headerAction={<AISuggestionsModal size="sm" text="AI Insights" />}
            >
                <div className="space-y-4">
                    {memberFeedback.map((feedback) => (
                        <div key={feedback.id} className="rounded-lg border border-muted shadow-sm p-4 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between text-sm font-medium">
                                <span>{feedback.member}</span>
                                <span className="text-muted-foreground text-xs">{feedback.submitted}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{feedback.className}</p>
                            <div className="mt-2 flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Star
                                        key={index}
                                        className={`h-3.5 w-3.5 ${index < feedback.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
                                        aria-hidden="true"
                                    />
                                ))}
                            </div>
                            <p className="mt-2 text-sm">{feedback.comment}</p>
                        </div>
                    ))}
                </div>
            </MinimalSection>

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