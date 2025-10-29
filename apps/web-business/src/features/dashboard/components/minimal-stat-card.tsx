import React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface MinimalStatCardProps {
    title: string
    value: string
    change: string
    changeTone: "positive" | "negative"
    helper: string
    icon: React.ReactElement
    iconColor?: "emerald" | "sky" | "amber" | "rose"
    className?: string
}

export function MinimalStatCard({
    title,
    value,
    change,
    changeTone,
    helper,
    icon,
    iconColor = "sky",
    className
}: MinimalStatCardProps) {
    const changeToneClass = changeTone === "negative" ? "text-rose-600" : "text-emerald-600"

    // Icon background colors
    const iconBgClasses = {
        emerald: "bg-emerald-100 text-emerald-600",
        sky: "bg-sky-100 text-sky-600",
        amber: "bg-amber-100 text-amber-600",
        rose: "bg-rose-100 text-rose-600",
    }

    return (
        <div className={cn(
            "p-6 rounded-2xl border bg-card border-border shadow-sm hover:shadow-md transition-shadow",
            className
        )}>
            {/* Title/Label - Most Prominent */}
            <div className="flex items-center gap-3 mb-6">
                <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
                    iconBgClasses[iconColor]
                )}>
                    {React.cloneElement(icon, {
                        className: "h-5 w-5",
                        "aria-hidden": "true"
                    } as any)}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-foreground leading-tight">
                        {title}
                    </h3>
                </div>
            </div>

            {/* Value - Large but Secondary */}
            <div className="mb-4">
                <div className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
                    {value}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                    {helper}
                </div>
            </div>

            {/* Change indicator - Bottom */}
            <div className={cn(
                "flex items-center gap-1.5 text-xs font-semibold pt-3 border-t border-border",
                changeToneClass
            )}>
                {changeTone === "positive" ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>{change}</span>
            </div>
        </div>
    )
}
