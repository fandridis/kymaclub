import { UpcomingClasses } from "./upcoming-classes";

export default function DashboardPage() {
    return (
        <div className="space-y-6 pb-8">
            <div>
                {/* <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1> */}
                <p className="text-muted-foreground mt-2">
                    Overview of your upcoming classes for the next 7 days
                </p>
            </div>

            <UpcomingClasses />
        </div>
    );
}