import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users } from "lucide-react"

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric) => (
                <Card key={metric.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                        <metric.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-card-foreground">{metric.value}</div>
                        <div className="flex items-center space-x-1 text-xs">
                            {metric.trend === "up" ? (
                                <TrendingUp className="h-3 w-3 text-primary" />
                            ) : (
                                <TrendingDown className="h-3 w-3 text-destructive" />
                            )}
                            <span className={metric.trend === "up" ? "text-primary" : "text-destructive"}>{metric.change}</span>
                            <span className="text-muted-foreground">{metric.description}</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
