import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { SciFiCard, getSciFiColors } from "@/components/sci-fi-card";

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
    const color = 'green';
    const styles = getSciFiColors(color);

    return (
        <SciFiCard color={color} className={cn("flex flex-col h-full", className)} hoverEffect={false}>
            <CardHeader className="pb-2 relative z-10">
                <CardTitle className={cn("text-sm font-mono tracking-wider uppercase opacity-80", styles.text)}>
                    {'>'} BOOKINGS TREND (L12M)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1 relative z-10">
                <div className="w-full h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 197, 94, 0.1)" vertical={false} />
                            <XAxis
                                dataKey="month"
                                stroke="rgba(34, 197, 94, 0.4)"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                fontFamily="monospace"
                            />
                            <YAxis
                                stroke="rgba(34, 197, 94, 0.4)"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                fontFamily="monospace"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(10, 10, 20, 0.9)',
                                    borderColor: 'rgba(34, 197, 94, 0.3)',
                                    borderRadius: '0px',
                                    borderWidth: '1px',
                                    color: '#fff',
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    boxShadow: '0 0 10px rgba(34, 197, 94, 0.2)'
                                }}
                                itemStyle={{ color: '#22c55e' }}
                                cursor={{ stroke: 'rgba(34, 197, 94, 0.2)' }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
                                iconType="line"
                            />
                            <Line
                                type="monotone"
                                dataKey="completed"
                                stroke="#22d3ee"
                                strokeWidth={2}
                                dot={{ r: 3, fill: "#22d3ee", strokeWidth: 0 }}
                                activeDot={{ r: 6, stroke: "rgba(34, 211, 238, 0.5)", strokeWidth: 4 }}
                                name="Completed"
                            />
                            <Line
                                type="monotone"
                                dataKey="cancelled"
                                stroke="#fbbf24"
                                strokeWidth={2}
                                dot={{ r: 3, fill: "#fbbf24", strokeWidth: 0 }}
                                activeDot={{ r: 6, stroke: "rgba(251, 191, 36, 0.5)", strokeWidth: 4 }}
                                name="Cancelled"
                            />
                            <Line
                                type="monotone"
                                dataKey="noShows"
                                stroke="#ef4444"
                                strokeWidth={2}
                                dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                                activeDot={{ r: 6, stroke: "rgba(239, 68, 68, 0.5)", strokeWidth: 4 }}
                                name="No-Shows"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </SciFiCard>
    );
}

