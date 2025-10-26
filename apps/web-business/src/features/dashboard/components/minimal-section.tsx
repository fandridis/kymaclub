import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MinimalSectionProps {
    title?: string
    description?: string
    children: ReactNode
    className?: string
    headerAction?: ReactNode
}

export function MinimalSection({ title, description, children, className, headerAction }: MinimalSectionProps) {
    return (
        <div className={cn("flex flex-col rounded-lg border bg-card border-border shadow-sm", className)}>
            {(title || description || headerAction) && (
                <div className="space-y-1 p-6 pb-4 flex-shrink-0">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                            {title && <h3 className="text-lg font-semibold">{title}</h3>}
                            {description && <p className="text-sm text-muted-foreground">{description}</p>}
                        </div>
                        {headerAction && (
                            <div className="sm:ml-4 flex-shrink-0">
                                {headerAction}
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="flex-1 overflow-auto px-6 pb-6">
                {children}
            </div>
        </div>
    )
}
