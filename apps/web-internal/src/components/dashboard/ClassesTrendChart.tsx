import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface TrendData {
    month: string;
    classes: number;
}

interface ClassesTrendChartProps {
    data: TrendData[];
    className?: string;
}

export function ClassesTrendChart({ data, className }: ClassesTrendChartProps) {
    return (
        <Card className={cn("bg-slate-800/30 border-slate-700/50 backdrop-blur-sm", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                    Class Creation Trend (Last 12 Months)
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
                            <Line
                                type="monotone"
                                dataKey="classes"
                                stroke="#a855f7"
                                strokeWidth={2}
                                dot={{ r: 3, fill: "#a855f7", strokeWidth: 0 }}
                                activeDot={{ r: 5, stroke: "rgba(168, 85, 247, 0.4)", strokeWidth: 3 }}
                                name="Classes"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
