import React from "react"
import { cn } from "@/lib/utils"

interface MinimalStatCardProps {
    title: string
    value: string
    change: string
    changeTone: "positive" | "negative"
    helper: string
    icon: React.ReactElement
    className?: string
}

export function MinimalStatCard({
    title,
    value,
    change,
    changeTone,
    helper,
    icon,
    className
}: MinimalStatCardProps) {
    const changeToneClass = changeTone === "negative" ? "text-destructive" : "text-emerald-600"

    return (
        <div className={cn("flex items-center gap-4 p-4 rounded-lg border border-muted shadow-xl", className)}>
            <div className="flex-shrink-0">
                {React.cloneElement(icon, {
                    className: "h-5 w-5 text-muted-foreground",
                    "aria-hidden": "true"
                } as any)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-muted-foreground">{title}</div>
                <div className="text-2xl font-semibold mt-1">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">
                    <span className={changeToneClass}>{change}</span> {helper}
                </div>
            </div>
        </div>
    )
}
