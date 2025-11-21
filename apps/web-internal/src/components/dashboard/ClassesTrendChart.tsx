import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { SciFiCard, getSciFiColors } from "@/components/sci-fi-card";

interface TrendData {
    month: string;
    classes: number;
}

interface ClassesTrendChartProps {
    data: TrendData[];
    className?: string;
}

export function ClassesTrendChart({ data, className }: ClassesTrendChartProps) {
    const color = 'cyan';
    const styles = getSciFiColors(color);

    return (
        <SciFiCard color={color} className={cn("flex flex-col h-full", className)} hoverEffect={false}>
            <CardHeader className="pb-2 relative z-10">
                <CardTitle className={cn("text-sm font-mono tracking-wider uppercase opacity-80", styles.text)}>
                    {'>'} CLASS CREATION TREND (L12M)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1 relative z-10">
                <div className="w-full h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(6, 182, 212, 0.1)" vertical={false} />
                            <XAxis
                                dataKey="month"
                                stroke="rgba(6, 182, 212, 0.4)"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                fontFamily="monospace"
                            />
                            <YAxis
                                stroke="rgba(6, 182, 212, 0.4)"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                fontFamily="monospace"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(10, 10, 20, 0.9)',
                                    borderColor: 'rgba(6, 182, 212, 0.3)',
                                    borderRadius: '0px',
                                    borderWidth: '1px',
                                    color: '#fff',
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)'
                                }}
                                itemStyle={{ color: '#22d3ee' }}
                                cursor={{ stroke: 'rgba(6, 182, 212, 0.2)' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="classes"
                                stroke="#22d3ee"
                                strokeWidth={2}
                                dot={{ r: 3, fill: "#22d3ee", strokeWidth: 0 }}
                                activeDot={{ r: 6, stroke: "rgba(6, 182, 212, 0.5)", strokeWidth: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </SciFiCard>
    );
}
