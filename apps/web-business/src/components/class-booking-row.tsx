import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Doc } from "@repo/api/convex/_generated/dataModel"
import { TEMPLATE_COLORS_MAP } from "@/utils/colors"
import type { TemplateColorType } from "@repo/utils/colors"

interface Booking {
    id: string
    user: {
        name: string
    }
    status: string
}

interface ClassBookingRowProps {
    classInstance: Doc<"classInstances">
    instructor: string
    date?: string
    time: string
    bookings: Booking[]
    maxCapacity: number
    onClick?: () => void
}

export function ClassBookingRow({
    classInstance,
    instructor,
    date,
    time,
    bookings,
    maxCapacity,
    onClick,
}: ClassBookingRowProps) {
    const color = classInstance.color as TemplateColorType

    const cardBackground = TEMPLATE_COLORS_MAP[color]?.background || 'bg-white'
    const cardBorder = TEMPLATE_COLORS_MAP[color]?.border || 'border-gray-200'
    const cardText = TEMPLATE_COLORS_MAP[color]?.text || 'text-gray-950'

    // Filter only pending bookings for counting and display
    const pendingBookings = bookings.filter(booking => booking.status === 'pending')
    const pendingCount = pendingBookings.length

    // Create the spots grid
    const renderSpotsGrid = () => {
        return (
            <div className="flex flex-col gap-1">
                <div className="text-xs text-muted-foreground text-center">{pendingCount} out of {maxCapacity} booked</div>
                <div className="grid grid-cols-5 gap-y-[3px]">
                    {Array.from({ length: maxCapacity }, (_, index) => {
                        const isBooked = index < pendingCount

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "w-4 h-4 rounded border border-zinc-500",
                                    isBooked ? "bg-emerald-500" : "bg-zinc-100/20"
                                )}
                                title={isBooked ? "Booked" : "Available"}
                            />
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <Card
            className={cn(
                "p-4 shadow",
                cardBackground,
                cardBorder,
                cardText,
                onClick && "cursor-pointer transition-opacity hover:opacity-80"
            )}
            onClick={onClick}
        >
            <div className="flex gap-6">
                {/* Left Column - Compact Date & Time */}
                <div className={cn("flex flex-col items-center justify-center min-w-[60px] text-center border-r-2 pr-4", cardBorder)}>
                    <div className="text-xs font-medium">{date}</div>
                    <div className="text-lg font-bold">{time}</div>
                </div>

                {/* Middle Column - Class Details */}
                <div className="flex-1 min-w-0">
                    <div>
                        <h3 className="font-semibold text-lg leading-tight">{classInstance.templateSnapshot?.name}</h3>
                        <p className="text-sm">with {instructor}</p>
                    </div>
                </div>

                {/* Right Column - Spots Grid */}
                <div className="flex items-start">
                    {renderSpotsGrid()}
                </div>
            </div>
        </Card>
    )
}
