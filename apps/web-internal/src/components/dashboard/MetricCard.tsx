import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { SciFiCard, SciFiColor, getSciFiColors } from "@/components/sci-fi-card";

interface MetricCardProps {
    label: string;
    value: number | string;
    diff?: number;
    className?: string;
    color?: SciFiColor;
}

export function MetricCard({ label, value, diff, className, color = 'purple' }: MetricCardProps) {
    const isPositive = diff !== undefined && diff > 0;
    const isNegative = diff !== undefined && diff < 0;
    const isNeutral = diff === 0;

    const styles = getSciFiColors(color);

    return (
        <SciFiCard color={color} className={className} hoverEffect={false}>
            <CardContent className="p-6">
                <div className={cn("text-xs font-mono mb-2 tracking-wider uppercase opacity-80", styles.text)}>
                    {'>'} {label}
                </div>

                <div className="flex items-baseline gap-4">
                    <div className={cn("text-4xl font-black tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]", styles.text)}>
                        {value}
                    </div>

                    {diff !== undefined && (
                        <div className={cn(
                            "flex items-center text-xs font-mono px-2 py-0.5 rounded-full border",
                            isPositive && "text-green-400 border-green-500/30 bg-green-500/10",
                            isNegative && "text-red-400 border-red-500/30 bg-red-500/10",
                            isNeutral && "text-gray-400 border-gray-500/30 bg-gray-500/10"
                        )}>
                            {isPositive && <TrendingUp className="w-3 h-3 mr-1" />}
                            {isNegative && <TrendingDown className="w-3 h-3 mr-1" />}
                            {isNeutral && <Minus className="w-3 h-3 mr-1" />}
                            {Math.abs(diff)}%
                        </div>
                    )}
                </div>
            </CardContent>
        </SciFiCard>
    );
}
