import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
    Activity,
    ArrowUpRight,
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    CreditCard,
    MessageSquare,
    Sparkles,
    Users,
} from "lucide-react";
import { UpcomingClasses } from "./upcoming-classes";

const statCards = [
    {
        title: "Check-ins today",
        value: "18",
        change: "+12%",
        changeTone: "positive" as const,
        helper: "vs yesterday",
        icon: CalendarClock,
    },
    {
        title: "Active members",
        value: "142",
        change: "+9",
        changeTone: "positive" as const,
        helper: "joined in the last 30 days",
        icon: Users,
    },
    {
        title: "This week's revenue",
        value: "€2,480",
        change: "+6%",
        changeTone: "positive" as const,
        helper: "projected payout on Sep 28",
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

const todaysClasses = [
    {
        id: 1,
        name: "Morning Flow",
        time: "08:30 – 09:15",
        instructor: "Maria K.",
        bookings: 11,
        capacity: 14,
        status: "Filling fast",
    },
    {
        id: 2,
        name: "Pilates Reformer",
        time: "11:00 – 11:50",
        instructor: "Apostolos T.",
        bookings: 7,
        capacity: 10,
        status: "Waitlist at 2",
    },
    {
        id: 3,
        name: "Lunch Express HIIT",
        time: "13:30 – 14:00",
        instructor: "Konstantina P.",
        bookings: 5,
        capacity: 12,
        status: "Room to grow",
    },
    {
        id: 4,
        name: "Sunset Yin Yoga",
        time: "19:30 – 20:20",
        instructor: "Nikos L.",
        bookings: 12,
        capacity: 14,
        status: "Great retention",
    },
];

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

const quickActions = [
    {
        id: 1,
        label: "Create last-minute drop-in",
        description: "Fill empty spots in tonight's schedule",
        icon: Sparkles,
    },
    {
        id: 2,
        label: "Send check-in reminder",
        description: "Nudge members registered for Pilates Reformer",
        icon: MessageSquare,
    },
    {
        id: 3,
        label: "Review waitlisted members",
        description: "See who is next in line for Morning Flow",
        icon: ClipboardList,
    },
];

const revenueHighlights = [
    {
        label: "Projected payout",
        value: "€1,240",
        helper: "Scheduled for Sep 28",
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

const focusAreas = [
    {
        id: 1,
        title: "Publish October schedule",
        description: "Finalize templates and notify recurring members",
    },
    {
        id: 2,
        title: "Reply to partnership inquiry",
        description: "CrossFit Kallithea awaiting response",
    },
    {
        id: 3,
        title: "Review instructor hours",
        description: "Confirm payroll for week 38",
    },
];

export default function DashboardPage() {
    const todaysWeekday = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "Europe/Athens",
    }).format(new Date());

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
                        <Sparkles className="h-4 w-4" />
                        New class
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
                        <CardTitle>Today's classes</CardTitle>
                        <CardDescription>Snapshot of member demand for {todaysWeekday}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {todaysClasses.map((item) => {
                            const percent = Math.round((item.bookings / item.capacity) * 100);

                            return (
                                <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-dashed border-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-medium text-sm sm:text-base">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {item.time} • {item.instructor}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-start gap-2 sm:items-end">
                                        <p className="text-sm font-medium">
                                            {item.bookings}/{item.capacity} booked
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24">
                                                <Progress value={percent} aria-label={`${item.name} occupancy`} />
                                            </div>
                                            <span className="text-xs text-muted-foreground">{percent}%</span>
                                        </div>
                                        <Badge variant="secondary">{item.status}</Badge>
                                    </div>
                                </div>
                            );
                        })}
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
                        <CardTitle>Quick actions</CardTitle>
                        <CardDescription>Keep operations running smoothly</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-3">
                            {quickActions.map((action) => {
                                const Icon = action.icon;

                                return (
                                    <Button key={action.id} variant="outline" size="sm" className="w-full justify-start text-left">
                                        <Icon className="h-4 w-4" aria-hidden="true" />
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium text-sm">{action.label}</span>
                                            <span className="text-xs text-muted-foreground">{action.description}</span>
                                        </div>
                                    </Button>
                                );
                            })}
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-sm">Focus areas</p>
                                    <p className="text-xs text-muted-foreground">Suggested priorities for this week</p>
                                </div>
                                <Badge variant="outline">{focusAreas.length}</Badge>
                            </div>
                            <div className="space-y-2">
                                {focusAreas.map((task) => (
                                    <div key={task.id} className="flex items-start gap-3 rounded-lg border border-dashed border-muted px-3 py-2 text-sm">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                                        <div>
                                            <p className="font-medium leading-tight">{task.title}</p>
                                            <p className="text-xs text-muted-foreground">{task.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming week</CardTitle>
                    <CardDescription>Classes for the next 7 days (live data preview)</CardDescription>
                </CardHeader>
                <CardContent>
                    <UpcomingClasses className="space-y-4" />
                </CardContent>
            </Card>
        </div>
    );
}