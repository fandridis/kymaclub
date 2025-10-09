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
} from "lucide-react";

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

type DashboardClass = {
    id: string;
    name: string;
    time: string;
    instructor: string;
    bookings: number;
    capacity: number;
    status: string;
};

const scheduleTemplates: Omit<DashboardClass, "id">[][] = [
    [
        {
            name: "Morning Flow",
            time: "08:30 – 09:15",
            instructor: "Maria K.",
            bookings: 11,
            capacity: 14,
            status: "Filling fast",
        },
        {
            name: "Pilates Reformer",
            time: "11:00 – 11:50",
            instructor: "Apostolos T.",
            bookings: 9,
            capacity: 10,
            status: "Waitlist at 2",
        },
        {
            name: "Lunch Express HIIT",
            time: "13:30 – 14:00",
            instructor: "Konstantina P.",
            bookings: 5,
            capacity: 12,
            status: "Room to grow",
        },
        {
            name: "Sunset Yin Yoga",
            time: "19:30 – 20:20",
            instructor: "Nikos L.",
            bookings: 12,
            capacity: 14,
            status: "Great retention",
        },
    ],
    [
        {
            name: "Sunrise Strength",
            time: "07:45 – 08:30",
            instructor: "Jenny S.",
            bookings: 10,
            capacity: 16,
            status: "Plenty of space",
        },
        {
            name: "Mobility Lab",
            time: "10:15 – 11:00",
            instructor: "Lefteris D.",
            bookings: 14,
            capacity: 18,
            status: "Steady",
        },
        {
            name: "Boxing Fundamentals",
            time: "18:00 – 18:50",
            instructor: "Spyros V.",
            bookings: 16,
            capacity: 18,
            status: "Last seats",
        },
    ],
    [
        {
            name: "Reformer Foundations",
            time: "09:00 – 09:45",
            instructor: "Katerina L.",
            bookings: 8,
            capacity: 10,
            status: "Waitlist open",
        },
        {
            name: "Power Cycle",
            time: "12:30 – 13:15",
            instructor: "Andreas P.",
            bookings: 13,
            capacity: 16,
            status: "Filling fast",
        },
        {
            name: "Evening Barre",
            time: "20:00 – 20:50",
            instructor: "Anna M.",
            bookings: 7,
            capacity: 12,
            status: "Growth opportunity",
        },
    ],
    [
        {
            name: "Strength & Sculpt",
            time: "08:15 – 09:00",
            instructor: "Ilias P.",
            bookings: 6,
            capacity: 14,
            status: "Needs promotion",
        },
        {
            name: "Lunch Stretch",
            time: "12:45 – 13:30",
            instructor: "Dimitra A.",
            bookings: 12,
            capacity: 14,
            status: "Great retention",
        },
        {
            name: "Cardio Blast",
            time: "18:30 – 19:15",
            instructor: "Lina R.",
            bookings: 15,
            capacity: 18,
            status: "Steady",
        },
    ],
    [
        {
            name: "Core Reset",
            time: "09:30 – 10:15",
            instructor: "Eva G.",
            bookings: 9,
            capacity: 12,
            status: "Nearly full",
        },
        {
            name: "Prenatal Yoga",
            time: "11:30 – 12:20",
            instructor: "Angeliki C.",
            bookings: 7,
            capacity: 10,
            status: "Great feedback",
        },
        {
            name: "Open Gym",
            time: "17:00 – 18:30",
            instructor: "Team",
            bookings: 18,
            capacity: 24,
            status: "Trending",
        },
    ],
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

const focusAreas = [
    {
        id: 1,
        title: "Publish March schedule",
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
        description: "Confirm payroll for week 09",
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

function createMockSchedule(baseDate: Date, days: number) {
    const schedule: Record<string, DashboardClass[]> = {};

    for (let index = 0; index < days; index += 1) {
        const currentDate = addDays(baseDate, index);
        const dateKey = formatDateKey(currentDate);
        const templateIndex = index % scheduleTemplates.length;
        const classes = scheduleTemplates[templateIndex] ?? [];

        schedule[dateKey] = classes.map((classItem, classIndex) => ({
            ...classItem,
            id: `${dateKey}-${classIndex}`,
        }));
    }

    return schedule;
}

function createDayTabs(baseDate: Date, days: number) {
    const tabDefinitions: { key: string; label: string }[] = [];

    for (let index = 0; index < days; index += 1) {
        const currentDate = addDays(baseDate, index);
        const key = formatDateKey(currentDate);
        const label = formatTabLabel(currentDate, index);

        tabDefinitions.push({ key, label });
    }

    return tabDefinitions;
}

export default function DashboardPage() {
    const memoized = useMemo(() => {
        const now = new Date();
        const daysToShow = 14;

        return {
            dayTabs: createDayTabs(now, daysToShow),
            schedule: createMockSchedule(now, daysToShow),
        };
    }, []);

    const { dayTabs, schedule } = memoized;
    const [activeDay, setActiveDay] = useState(() => dayTabs[0]?.key ?? "");

    const activeTab = dayTabs.find((day) => day.key === activeDay);
    const classesForActiveDay = schedule[activeDay] ?? [];

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
                            <TabsList className="mb-4 flex w-full justify-start gap-1 overflow-x-auto rounded-lg border bg-muted/50 p-1">
                                {dayTabs.map((day) => (
                                    <TabsTrigger key={day.key} value={day.key} className="px-3 py-1 text-sm">
                                        {day.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {dayTabs.map((day) => {
                                const classesForDay = schedule[day.key] ?? [];

                                return (
                                    <TabsContent key={day.key} value={day.key} className="space-y-4">
                                        {classesForDay.length === 0 ? (
                                            <div className="rounded-lg border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
                                                No classes scheduled for this day yet.
                                            </div>
                                        ) : (
                                            classesForDay.map((classItem) => {
                                                const percent = Math.round((classItem.bookings / classItem.capacity) * 100);

                                                return (
                                                    <div
                                                        key={classItem.id}
                                                        className="flex flex-col gap-3 rounded-lg border border-dashed border-muted p-4 sm:flex-row sm:items-center sm:justify-between"
                                                    >
                                                        <div className="space-y-1">
                                                            <p className="font-medium text-sm sm:text-base">{classItem.name}</p>
                                                            <p className="text-sm text-muted-foreground">with {classItem.instructor}</p>
                                                        </div>

                                                        <div className="flex flex-col items-start gap-2 sm:items-end">
                                                            <span className="text-sm font-medium text-muted-foreground">{classItem.time}</span>
                                                            <p className="text-sm font-medium">
                                                                {classItem.bookings}/{classItem.capacity} booked
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-24">
                                                                    <Progress value={percent} aria-label={`${classItem.name} occupancy`} />
                                                                </div>
                                                                <span className="text-xs text-muted-foreground">{percent}%</span>
                                                            </div>
                                                            <Badge variant="secondary">{classItem.status}</Badge>
                                                        </div>
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
                        <CardTitle>Member feedback & focus</CardTitle>
                        <CardDescription>Celebrate wins and follow up on next steps</CardDescription>
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
                                    <p className="font-medium text-sm">Focus areas</p>
                                    <p className="text-xs text-muted-foreground">Suggested priorities for this week</p>
                                </div>
                                <Badge variant="outline">{focusAreas.length}</Badge>
                            </div>
                            <div className="space-y-2">
                                {focusAreas.map((task) => (
                                    <div key={task.id} className="flex items-start gap-3 rounded-lg border border-dashed border-muted px-3 py-2 text-sm">
                                        <CalendarCheck className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
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
        </div>
    );
}
