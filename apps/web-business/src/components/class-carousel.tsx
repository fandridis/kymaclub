"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ClassCard, ClassCardFooterMetrics } from "./class-card";
import type { Id } from "@repo/api/convex/_generated/dataModel";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

/**
 * Type for class instance data from the query
 */
type ClassInstanceForCarousel = {
    _id: Id<"classInstances">;
    startTime: number;
    endTime?: number;
    name: string;
    instructor?: string;
    venueName: string;
    venueCity: string;
    templateImageId?: Id<"_storage">;
    venueImageId?: Id<"_storage">;
    capacity: number;
    bookedCount: number;
};

interface ClassCarouselProps {
    title: string;
    classes: ClassInstanceForCarousel[];
    imageUrlMap: Map<Id<"_storage">, string | null>;
    onClassClick?: (classInstance: ClassInstanceForCarousel) => void;
    onViewBookings?: (classInstance: ClassInstanceForCarousel) => void;
    onEdit?: (classInstance: ClassInstanceForCarousel) => void;
    className?: string;
    emptyMessage?: string;
    emptyAction?: React.ReactNode;
}

export function ClassCarousel({
    title,
    classes,
    imageUrlMap,
    onClassClick,
    onViewBookings,
    onEdit,
    className,
    emptyMessage = "No classes found",
    emptyAction,
}: ClassCarouselProps) {
    const getImageUrl = (instance: ClassInstanceForCarousel): string | null => {
        if (instance.templateImageId) {
            const url = imageUrlMap.get(instance.templateImageId);
            if (url) return url;
        }
        if (instance.venueImageId) {
            const url = imageUrlMap.get(instance.venueImageId);
            if (url) return url;
        }
        return null;
    };

    const formatTime = (timestamp: number): string => {
        return format(new Date(timestamp), "h:mm a");
    };

    const getStartsInText = (startTime: number): string | null => {
        const now = Date.now();
        const msUntilStart = startTime - now;

        if (msUntilStart < 0) {
            return "Started";
        }

        const hoursUntilStart = msUntilStart / (1000 * 60 * 60);

        if (hoursUntilStart < 1) {
            const minutesUntilStart = Math.floor(msUntilStart / (1000 * 60));
            return minutesUntilStart <= 0 ? "Starting now" : `in ${minutesUntilStart}m`;
        } else if (hoursUntilStart < 24) {
            return `in ${Math.floor(hoursUntilStart)}h`;
        }

        return null; // Not showing for future days
    };

    if (classes.length === 0) {
        return (
            <div className={cn("space-y-4", className)}>
                <h2 className="text-xl md:text-2xl font-semibold px-3 md:px-4">
                    {title}
                </h2>
                <div className="px-3 md:px-4 py-12 text-center border-2 border-dashed border-muted rounded-lg">
                    <p className="text-muted-foreground text-lg font-medium mb-2">
                        {emptyMessage}
                    </p>
                    {emptyAction}
                </div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-1", className)}>
            <h2 className="text-xl md:text-2xl font-semibold px-3 md:px-4">
                {title}
            </h2>
            <div className="overflow-x-auto scrollbar-hide -mx-3 md:-mx-4 px-3 md:px-4">
                <div className="flex gap-3 md:gap-4 pb-2">
                    {classes.map((instance) => {
                        const imageUrl = getImageUrl(instance);
                        const timeStr = formatTime(instance.startTime);
                        const startsInText = getStartsInText(instance.startTime);
                        const subtitle = instance.instructor
                            ? `with ${instance.instructor}`
                            : instance.venueName;
                        const availabilityPercent = instance.capacity > 0
                            ? Math.round((instance.bookedCount / instance.capacity) * 100)
                            : 0;

                        return (
                            <div
                                key={instance._id}
                                className="flex-shrink-0 w-[280px] md:w-[380px] h-[260px]"
                            >
                                <ClassCard
                                    title={instance.name}
                                    subtitle={subtitle}
                                    imageUrl={imageUrl}
                                    renderTopLeft={() => {
                                        if (!startsInText) return null;
                                        return (
                                            <Badge
                                                variant="secondary"
                                                className="bg-white/90 text-zinc-900 backdrop-blur-sm"
                                            >
                                                {startsInText}
                                            </Badge>
                                        );
                                    }}
                                    renderTopRight={() => {
                                        // Show availability badge if over 80% booked
                                        // Positioned slightly lower (top-10) to leave space for menu button
                                        if (availabilityPercent >= 80 && availabilityPercent < 100) {
                                            return (
                                                <div className="mt-8">
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-amber-500/90 text-white backdrop-blur-sm"
                                                    >
                                                        {instance.bookedCount}/{instance.capacity}
                                                    </Badge>
                                                </div>
                                            );
                                        }
                                        // Show sold out badge if 100% booked
                                        if (availabilityPercent >= 100) {
                                            return (
                                                <div className="mt-8">
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-rose-500/90 text-white backdrop-blur-sm"
                                                    >
                                                        Full
                                                    </Badge>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                    onViewBookings={onViewBookings ? () => onViewBookings(instance) : undefined}
                                    onEdit={onEdit ? () => onEdit(instance) : undefined}
                                    renderFooter={() => (
                                        <ClassCardFooterMetrics
                                            time={timeStr}
                                            booked={instance.bookedCount}
                                            capacity={instance.capacity}
                                            venueCity={instance.venueCity}
                                        />
                                    )}
                                    onClick={onClassClick ? () => onClassClick(instance) : undefined}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

