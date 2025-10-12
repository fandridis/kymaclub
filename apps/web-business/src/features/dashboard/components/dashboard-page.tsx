import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Activity,
    CalendarCheck,
    CalendarClock,
    CreditCard,
    LineChart,
    MessageSquare,
    Star,
} from "lucide-react";
import { ClassBookingsDialog } from "@/features/bookings/components/class-bookings-dialog";
import type { Doc } from "@repo/api/convex/_generated/dataModel";
import { UpcomingClasses } from "./upcoming-classes";
import { MinimalStatCard } from "./minimal-stat-card";
import { MinimalSection } from "./minimal-section";
import { AISuggestionsModal } from "@/components/ai-suggestions-modal";

const statCards = [
    {
        title: "Check-ins today",
        value: "18",
        change: "+12%",
        changeTone: "positive" as const,
        helper: "vs yesterday",
        icon: <CalendarCheck />,
    },
    {
        title: "Monthly visits",
        value: "482",
        change: "+8%",
        changeTone: "positive" as const,
        helper: "compared to January",
        icon: <LineChart />,
    },
    {
        title: "Monthly revenue",
        value: "€12,940",
        change: "+4%",
        changeTone: "positive" as const,
        helper: "projected payout on Feb 29",
        icon: <CreditCard />,
    },
    {
        title: "Attendance rate",
        value: "86%",
        change: "-3%",
        changeTone: "negative" as const,
        helper: "compared to the rolling average",
        icon: <Activity />,
    },
];

const revenueHighlights = [
    {
        label: "Projected payout",
        value: "€1,240",
        helper: "Scheduled for Feb 29",
    },
    {
        label: "Avg. booking value",
        value: "€17.60",
        helper: "Across 42 bookings this week",
    },
];

const occupancyInsights = [
    {
        label: "Average occupancy",
        value: 86,
        helper: "Goal: 80%",
    },
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

    return (
        <div className="space-y-8 pb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
                    <p className="text-muted-foreground mt-2">
                        Track your studio performance, act on today's priorities, and spot opportunities at a glance.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                        <CalendarClock className="h-4 w-4" />
                        View calendar
                    </Button>
                    <Button size="sm">
                        <MessageSquare className="h-4 w-4" />
                        New announcement
                    </Button>
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
                    title="Revenue & capacity"
                    description="Monitor cash flow and occupancy goals"
                    className="max-h-[70vh] overflow-y-auto"
                >
                    <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {revenueHighlights.map((highlight) => (
                                <div key={highlight.label} className="rounded-lg border border-muted shadow-sm p-4">
                                    <p className="text-sm text-muted-foreground">{highlight.label}</p>
                                    <p className="text-2xl font-semibold mt-1">{highlight.value}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{highlight.helper}</p>
                                </div>
                            ))}
                        </div>

                        <Separator className="opacity-50" />

                        <div className="space-y-5">
                            {occupancyInsights.map((insight) => (
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