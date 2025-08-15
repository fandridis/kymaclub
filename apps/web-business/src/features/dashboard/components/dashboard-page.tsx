import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UpcomingClasses } from "./upcoming-classes";
import { RecentActivity } from "./recent-activity";

export default function DashboardPage() {
    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {/* Top stats */}
            {["Total Revenue", "New Bookings", "Active Members", "Attendance"].map((label) => (
                <Card key={label}>
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-3 w-3/4" />
                    </CardContent>
                </Card>
            ))}

            {/* Main chart */}
            <UpcomingClasses className="col-span-1 sm:col-span-2 xl:col-span-2" />
            {/* <Card className="xl:col-span-3">
                <CardHeader>
                    <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card> */}

            {/* Side list */}
            <RecentActivity className="col-span-1 sm:col-span-2 xl:col-span-2" />

            {/* Activity list */}
            <Card className="col-span-1 sm:col-span-2 xl:col-span-2">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/5" />
                                <Skeleton className="h-3 w-2/5" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Table / large content */}
            <Card className="xl:col-span-2">
                <CardHeader>
                    <CardTitle>Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-80 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}