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
        <div className={cn("flex flex-col rounded-lg border border-muted shadow-xl", className)}>
            {(title || description || headerAction) && (
                <div className="space-y-1 p-6 pb-4 flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            {title && <h3 className="text-lg font-semibold">{title}</h3>}
                            {description && <p className="text-sm text-muted-foreground">{description}</p>}
                        </div>
                        {headerAction && (
                            <div className="ml-4 flex-shrink-0">
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
