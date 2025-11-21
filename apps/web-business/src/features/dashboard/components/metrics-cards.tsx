import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Calendar, Users } from "lucide-react"

const metrics = [
    {
        title: "Monthly Revenue",
        value: "$12,450",
        change: "+12.5%",
        trend: "up",
        icon: DollarSign,
        description: "vs last month",
    },
    {
        title: "Monthly Bookings",
        value: "1,247",
        change: "+8.2%",
        trend: "up",
        icon: Calendar,
        description: "vs last month",
    },
    {
        title: "New Visitors",
        value: "89",
        change: "+15.7%",
        trend: "up",
        icon: Users,
        description: "this month",
    },
]

export function MetricsCards() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metrics.map((metric) => (
                <Card key={metric.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                        <metric.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-4">
                            <div className="text-2xl font-bold text-card-foreground">{metric.value}</div>
                            <div className="flex flex-col">
                                <span className={`text-sm font-medium ${metric.trend === "up" ? "text-primary" : "text-destructive"}`}>
                                    {metric.change}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground opacity-70">
                                    VS LAST YEAR
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
