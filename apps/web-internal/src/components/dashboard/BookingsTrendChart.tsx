import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface TrendData {
    month: string;
    completed: number;
    cancelled: number;
    noShows: number;
}

interface BookingsTrendChartProps {
    data: TrendData[];
    className?: string;
}

export function BookingsTrendChart({ data, className }: BookingsTrendChartProps) {
    return (
        <Card className={cn("bg-slate-800/30 border-slate-700/50 backdrop-blur-sm", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                    Bookings Trend (Last 12 Months)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="w-full h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" vertical={false} />
                            <XAxis
                                dataKey="month"
                                stroke="rgba(148, 163, 184, 0.5)"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                fontFamily="system-ui"
                            />
                            <YAxis
                                stroke="rgba(148, 163, 184, 0.5)"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                fontFamily="system-ui"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    borderColor: 'rgba(100, 116, 139, 0.3)',
                                    borderRadius: '8px',
                                    borderWidth: '1px',
                                    color: '#fff',
                                    fontSize: '12px',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                                }}
                                cursor={{ stroke: 'rgba(100, 116, 139, 0.3)' }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '11px' }}
                                iconType="line"
                            />
                            <Line
                                type="monotone"
                                dataKey="completed"
                                stroke="#22d3ee"
                                strokeWidth={2}
                                dot={{ r: 3, fill: "#22d3ee", strokeWidth: 0 }}
                                activeDot={{ r: 5, stroke: "rgba(34, 211, 238, 0.4)", strokeWidth: 3 }}
                                name="Completed"
                            />
                            <Line
                                type="monotone"
                                dataKey="cancelled"
                                stroke="#fbbf24"
                                strokeWidth={2}
                                dot={{ r: 3, fill: "#fbbf24", strokeWidth: 0 }}
                                activeDot={{ r: 5, stroke: "rgba(251, 191, 36, 0.4)", strokeWidth: 3 }}
                                name="Cancelled"
                            />
                            <Line
                                type="monotone"
                                dataKey="noShows"
                                stroke="#ef4444"
                                strokeWidth={2}
                                dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                                activeDot={{ r: 5, stroke: "rgba(239, 68, 68, 0.4)", strokeWidth: 3 }}
                                name="No-Shows"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
