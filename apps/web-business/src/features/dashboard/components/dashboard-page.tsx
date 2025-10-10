import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Activity,
    ArrowUpRight,
    CalendarCheck,
    CalendarClock,
    CreditCard,
    LineChart,
    MessageSquare,
    Star,
    Sparkles,
} from "lucide-react";
import { ClassBookingRow } from "@/components/class-booking-row";
import { ClassBookingsDialog } from "@/features/bookings/components/class-bookings-dialog";
import type { Doc } from "@repo/api/convex/_generated/dataModel";
import useDailyClassesWithBookings from "../hooks/use-daily-classes-with-bookings";

const statCards = [
    {
        title: "Check-ins today",
        value: "18",
        change: "+12%",
        changeTone: "positive" as const,
        helper: "vs yesterday",
        icon: CalendarCheck,
    },
    {
        title: "Monthly visits",
        value: "482",
        change: "+8%",
        changeTone: "positive" as const,
        helper: "compared to January",
        icon: LineChart,
    },
    {
        title: "Monthly revenue",
        value: "€12,940",
        change: "+4%",
        changeTone: "positive" as const,
        helper: "projected payout on Feb 29",
        icon: CreditCard,
    },
    {
        title: "Attendance rate",
        value: "86%",
        change: "-3%",
        changeTone: "negative" as const,
        helper: "compared to the rolling average",
        icon: Activity,
    },
];

interface Booking {
    id: string;
    user: {
        name: string;
        avatar?: string;
    };
    status: string;
}

const systemMessages = [
    {
        id: 1,
        title: "Waitlist automation is now live",
        description: "Members will automatically be promoted when a spot frees up.",
        timestamp: "2 hours ago",
        badge: { label: "Product update", variant: "secondary" as const },
    },
    {
        id: 2,
        title: "Confirm payout details",
        description: "Please verify your bank account before Friday to avoid delays.",
        timestamp: "Due in 2 days",
        badge: { label: "Action required", variant: "destructive" as const },
    },
    {
        id: 3,
        title: "New feedback received",
        description: "Eleni P. rated yesterday's Barre class 5★ with a quick note.",
        timestamp: "Yesterday",
        badge: { label: "Member love", variant: "outline" as const },
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

const aiSuggestions = [
    {
        id: 1,
        suggestion: "Consider adding more cooling options during Power Cycle classes",
        impact: "High impact",
        reasoning: "Based on recent feedback mentioning temperature concerns",
    },
    {
        id: 2,
        suggestion: "Expand instructor explanation techniques to other classes",
        impact: "Medium impact",
        reasoning: "Positive feedback on clear explanations in Reformer Foundations",
    },
];

function addDays(date: Date, amount: number) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + amount);
    return copy;
}

function formatDateKey(date: Date) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Athens",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

function formatTabLabel(date: Date, offset: number) {
    if (offset === 0) {
        return "Today";
    }

    if (offset === 1) {
        return "Tomorrow";
    }

    return new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Athens",
        month: "short",
        day: "numeric",
    }).format(date);
}

function getDayStartEnd(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return {
        start: startOfDay.getTime(),
        end: endOfDay.getTime()
    };
}

function createDayTabs(baseDate: Date, days: number) {
    const tabDefinitions: { key: string; label: string; dayStart: number; dayEnd: number }[] = [];

    for (let index = 0; index < days; index += 1) {
        const currentDate = addDays(baseDate, index);
        const key = formatDateKey(currentDate);
        const label = formatTabLabel(currentDate, index);
        const { start, end } = getDayStartEnd(currentDate);

        tabDefinitions.push({ key, label, dayStart: start, dayEnd: end });
    }

    return tabDefinitions;
}

export default function DashboardPage() {
    const memoized = useMemo(() => {
        const now = new Date();
        const daysToShow = 9;

        return {
            dayTabs: createDayTabs(now, daysToShow),
        };
    }, []);

    const { dayTabs } = memoized;
    const [activeDay, setActiveDay] = useState(() => dayTabs[0]?.key ?? "");
    const [bookingsDialog, setBookingsDialog] = useState<{
        open: boolean;
        classInstance: Doc<"classInstances"> | null;
        bookings: Doc<"bookings">[]
    } | null>(null);

    const activeTab = dayTabs.find((day) => day.key === activeDay);

    // Transform bookings to match the ClassBookingRow interface
    const transformBookings = (bookings: Doc<"bookings">[]): Booking[] => {
        return bookings.map(booking => ({
            id: booking._id,
            user: {
                name: booking.userSnapshot?.name || 'Unknown User',
                avatar: undefined // userSnapshot doesn't have avatar field
            },
            status: booking.status || 'pending'
        }));
    };

    return (
        <div className="space-y-6 pb-8">
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
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    const changeTone = stat.changeTone === "negative" ? "text-destructive" : "text-emerald-600";

                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-semibold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    <span className={changeTone}>{stat.change}</span> {stat.helper}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader className="pb-4">
                        <CardTitle>Classes overview</CardTitle>
                        <CardDescription>
                            Monitor demand and occupancy for {activeTab?.label?.toLowerCase() ?? "upcoming days"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeDay} onValueChange={setActiveDay} className="w-full">
                            <TabsList className="overflow-x-auto flex w-full">
                                {dayTabs.map((day) => (
                                    <TabsTrigger
                                        key={day.key}
                                        value={day.key}
                                        className="flex-1"
                                    >
                                        {day.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {/* Classes content for each day */}
                            {dayTabs.map((day) => {
                                // Get data for this specific day
                                const { data: dayData, loading: dayLoading } = useDailyClassesWithBookings({
                                    dayStart: day.dayStart,
                                    dayEnd: day.dayEnd,
                                });

                                return (
                                    <TabsContent key={day.key} value={day.key} className="space-y-4">
                                        {dayLoading ? (
                                            <div className="rounded-lg border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
                                                Loading classes...
                                            </div>
                                        ) : dayData.length === 0 ? (
                                            <div className="rounded-lg border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
                                                No classes scheduled for {day.label.toLowerCase()} yet.
                                            </div>
                                        ) : (
                                            dayData.map((item) => {
                                                const { classInstance, bookings } = item;
                                                const instructor = classInstance.instructor || 'TBD';
                                                const location = classInstance.venueSnapshot?.address ?
                                                    `${classInstance.venueSnapshot.address.street}, ${classInstance.venueSnapshot.address.city}` :
                                                    'Location TBD';
                                                const maxCapacity = classInstance.capacity || 0;
                                                const transformedBookings = transformBookings(bookings);

                                                // Format start time
                                                const startTime = new Date(classInstance.startTime);
                                                const startTimeFormatted = startTime.toLocaleTimeString('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                });

                                                return (
                                                    <div
                                                        key={classInstance._id}
                                                        className="cursor-pointer transition-opacity hover:opacity-80"
                                                        onClick={() => setBookingsDialog({
                                                            open: true,
                                                            classInstance,
                                                            bookings: bookings || []
                                                        })}
                                                    >
                                                        <ClassBookingRow
                                                            classInstance={classInstance}
                                                            instructor={instructor}
                                                            time={startTimeFormatted}
                                                            location={location}
                                                            bookings={transformedBookings}
                                                            maxCapacity={maxCapacity}
                                                        />
                                                    </div>
                                                );
                                            })
                                        )}
                                    </TabsContent>
                                );
                            })}
                        </Tabs>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>System messages</CardTitle>
                        <CardDescription>Updates from KymaClub and your members</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {systemMessages.map((message) => (
                            <div key={message.id} className="space-y-2 rounded-lg border border-muted p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-medium text-sm sm:text-base">{message.title}</p>
                                    <Badge variant={message.badge.variant}>{message.badge.label}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{message.description}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                    <span>{message.timestamp}</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Revenue & capacity</CardTitle>
                        <CardDescription>Monitor cash flow and occupancy goals</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {revenueHighlights.map((highlight) => (
                                <div key={highlight.label} className="rounded-lg border border-dashed border-muted p-4">
                                    <p className="text-sm text-muted-foreground">{highlight.label}</p>
                                    <p className="text-2xl font-semibold mt-1">{highlight.value}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{highlight.helper}</p>
                                </div>
                            ))}
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            {occupancyInsights.map((insight) => (
                                <div key={insight.label} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <span>{insight.label}</span>
                                        <span>{insight.value}%</span>
                                    </div>
                                    <Progress value={insight.value} aria-label={insight.label} />
                                    <p className="text-xs text-muted-foreground">{insight.helper}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Member feedback & AI suggestions</CardTitle>
                        <CardDescription>Celebrate wins and discover improvement opportunities</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-3">
                            {memberFeedback.map((feedback) => (
                                <div key={feedback.id} className="rounded-lg border border-muted p-4">
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <span>{feedback.member}</span>
                                        <span className="text-muted-foreground">{feedback.submitted}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{feedback.className}</p>
                                    <div className="mt-2 flex items-center gap-1">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <Star
                                                key={index}
                                                className={`h-4 w-4 ${index < feedback.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
                                                aria-hidden="true"
                                            />
                                        ))}
                                    </div>
                                    <p className="mt-2 text-sm">{feedback.comment}</p>
                                </div>
                            ))}
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">AI suggestions</p>
                                    <p className="text-xs text-muted-foreground">Improvements based on recent feedback</p>
                                </div>
                                <Badge variant="outline">{aiSuggestions.length}</Badge>
                            </div>
                            <div className="space-y-2">
                                {aiSuggestions.map((suggestion) => (
                                    <div key={suggestion.id} className="rounded-lg border border-dashed border-muted p-3 text-sm">
                                        <div className="flex items-start gap-3">
                                            <Sparkles className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                                            <div className="flex-1 space-y-1">
                                                <p className="font-medium leading-tight">{suggestion.suggestion}</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant={suggestion.impact === "High impact" ? "default" : "secondary"}
                                                        className="text-xs"
                                                    >
                                                        {suggestion.impact}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
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
