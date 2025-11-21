import { cn } from "@/lib/utils";
import { SciFiCard, SciFiColor, getSciFiColors } from "@/components/sci-fi-card";
import { LucideIcon } from "lucide-react";
import { useMemo, ReactNode } from "react";

interface SciFiMetricCardProps {
    mainMetric: string | number;
    mainMetricLabel: string;
    color: SciFiColor;
    // Optional props
    secondaryMetricValue?: number;
    secondaryMetricType?: 'number' | 'percentage';
    secondaryMetricLabel?: string;
    icon?: LucideIcon;
    dataTitle?: string; // For "Data: XXX" header
    renderFooter?: () => ReactNode; // Render prop for footer content
    className?: string;
    onClick?: () => void;
}

export function SciFiMetricCard({
    mainMetric,
    mainMetricLabel,
    color,
    secondaryMetricValue,
    secondaryMetricType,
    secondaryMetricLabel,
    icon: Icon,
    dataTitle,
    renderFooter,
    className,
    onClick,
}: SciFiMetricCardProps) {
    const colors = getSciFiColors(color);

    // Format main metric value
    const formattedMainValue = useMemo(() => {
        if (typeof mainMetric === 'number') {
            return mainMetric.toLocaleString();
        }
        return mainMetric;
    }, [mainMetric]);

    // Format the secondary metric value for display
    const formattedSecondaryValue = useMemo(() => {
        if (secondaryMetricValue === undefined) return null;
        const sign = secondaryMetricValue >= 0 ? '+' : '';
        const absValue = Math.abs(secondaryMetricValue);

        if (secondaryMetricType === 'percentage') {
            return `${sign}${absValue.toFixed(1)}%`;
        } else {
            return `${sign}${absValue.toLocaleString()}`;
        }
    }, [secondaryMetricValue, secondaryMetricType]);

    // Generate SVG path based on secondary metric
    const generateChartPath = useMemo(() => {
        if (secondaryMetricValue === undefined) {
            // Default flat line if no secondary metric
            return {
                linePath: "M0 80 L400 80",
                fillPath: "M0 100 L0 80 L400 80 L400 100 Z"
            };
        }

        const isPositive = secondaryMetricValue >= 0;
        const magnitude = Math.abs(secondaryMetricValue);

        // Normalize magnitude to a scale (0-50 for steepness)
        // Cap at reasonable max (e.g., 1000 for numbers, 100 for percentages)
        const maxValue = secondaryMetricType === 'percentage' ? 100 : 1000;
        const normalizedMagnitude = Math.min(magnitude / maxValue, 1) * 50;

        // Base Y position (middle of the chart area)
        const baseY = 80;
        // Steepness factor: larger magnitude = steeper slope
        const steepness = normalizedMagnitude;

        // Generate points across the width
        const pathPoints: string[] = [];
        const numPoints = 10;

        for (let i = 0; i <= numPoints; i++) {
            const x = (i / numPoints) * 400;
            // Create a wave that trends up (positive) or down (negative)
            // Add some variation to make it look more natural
            const progress = i / numPoints;
            const waveVariation = Math.sin(progress * Math.PI * 3) * 3; // Small wave variation

            // Positive: start at baseY, end higher (lower Y value = upward on screen)
            // Negative: start at baseY, end lower (higher Y value = downward on screen)
            const trend = isPositive
                ? -steepness * progress // Positive: goes up as we progress (Y decreases)
                : steepness * progress;  // Negative: goes down as we progress (Y increases)

            const y = Math.max(20, Math.min(90, baseY + trend + waveVariation)); // Clamp between 20 and 90

            if (i === 0) {
                pathPoints.push(`M${x} ${y}`);
            } else {
                pathPoints.push(`L${x} ${y}`);
            }
        }

        const linePath = pathPoints.join(' ');

        // Create fill path (line + bottom edge)
        const fillPath = `${linePath} L400 100 L0 100 Z`;

        return { linePath, fillPath };
    }, [secondaryMetricValue, secondaryMetricType]);

    const CardWrapper = onClick ? 'button' : 'div';

    return (
        <CardWrapper
            onClick={onClick}
            className={cn(
                "block w-full h-full text-left",
                onClick && "cursor-pointer"
            )}
        >
            <SciFiCard
                color={color}
                className={cn(
                    "relative w-full h-full overflow-hidden rounded-xl p-6",
                    className
                )}
                hoverEffect={!!onClick}
            >
                {/* SVG wave pattern at bottom - dynamic based on secondary metric */}
                <svg
                    className={cn("absolute bottom-0 left-0 right-0 h-24 w-full opacity-10", colors.text)}
                    viewBox="0 0 400 100"
                    preserveAspectRatio="none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d={generateChartPath.linePath}
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <path
                        d={generateChartPath.fillPath}
                        fill="currentColor"
                        opacity="0.2"
                    />
                </svg>

                {/* Icon in top right corner */}
                {Icon && (
                    <Icon className={cn("absolute top-4 right-4 w-10 h-10 z-20", colors.text, "opacity-40")} />
                )}

                {/* Content */}
                <div className={cn("relative z-10 flex flex-col", renderFooter ? "h-full" : "")}>
                    {/* Header - optional */}
                    {dataTitle && (
                        <div>
                            <h3 className={cn("text-sm font-medium", colors.text, "glow-text")}>
                                <span className={cn("text-xs font-mono uppercase tracking-wider opacity-70", colors.text)}>
                                    Data:
                                </span>{' '}
                                {dataTitle}
                            </h3>
                        </div>
                    )}

                    {/* Main metric */}
                    <div className={cn("space-y-2", dataTitle ? "mt-6" : "", renderFooter ? "flex-1" : "")}>
                        <p className={cn("text-xs font-mono uppercase tracking-wider", colors.text, "opacity-70")}>
                            {mainMetricLabel}
                        </p>
                        <div className="flex items-baseline gap-4">
                            <span className={cn(
                                "font-mono text-5xl font-bold tracking-tight text-foreground",
                                colors.text,
                                "glow-text"
                            )}>
                                {formattedMainValue}
                            </span>
                            {formattedSecondaryValue && secondaryMetricLabel && (
                                <div className="flex flex-col">
                                    <span className={cn("font-mono text-sm font-medium", colors.text)}>
                                        {formattedSecondaryValue}
                                    </span>
                                    <span className={cn("font-mono text-[10px] uppercase tracking-wider", colors.text, "opacity-70")}>
                                        {secondaryMetricLabel}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer section - optional */}
                    {renderFooter && (
                        <div className="mt-4 flex items-center justify-end">
                            {renderFooter()}
                        </div>
                    )}
                </div>
            </SciFiCard>
        </CardWrapper>
    );
}

