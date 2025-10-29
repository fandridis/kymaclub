"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Clock, MapPin, Users, MoreVertical, Edit } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RenderContent = () => React.ReactNode;

type TitleProps =
    | { title: string; renderTitle?: RenderContent }
    | { title?: string; renderTitle: RenderContent };

type SubtitleProps = {
    subtitle?: string;
    renderSubtitle?: RenderContent;
};

type SharedProps = {
    imageUrl?: string | null;
    renderTopLeft?: RenderContent;
    renderTopRight?: RenderContent;
    renderFooter?: RenderContent;
    onClick?: () => void;
    onViewBookings?: () => void;
    onEdit?: () => void;
    className?: string;
    testID?: string;
};

export type ClassCardProps = TitleProps & SubtitleProps & SharedProps;

export function ClassCard({
    title,
    renderTitle,
    subtitle,
    renderSubtitle,
    imageUrl,
    renderTopLeft,
    renderTopRight,
    renderFooter,
    onClick,
    onViewBookings,
    onEdit,
    className,
    testID,
}: ClassCardProps) {
    const titleContent = renderTitle ? renderTitle() : title ? (
        <h3 className="text-base font-bold text-zinc-900 truncate">
            {title}
        </h3>
    ) : null;

    const subtitleContent = renderSubtitle ? renderSubtitle() : subtitle ? (
        <p className="text-sm text-muted-foreground truncate">
            {subtitle}
        </p>
    ) : null;

    return (
        <div
            className={cn(
                "w-full h-full pt-1.5 pb-2 pr-2",
                className
            )}
            data-testid={testID}
        >
            <div className="h-full w-full rounded-2xl shadow-sm bg-card border border-border overflow-hidden flex flex-col">
                {/* Image Section */}
                <div className="relative flex-1 min-h-0">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title || "Class image"}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-xs font-medium text-muted-foreground">
                                No image
                            </span>
                        </div>
                    )}

                    {renderTopLeft && (
                        <div className="absolute top-2 left-2">
                            {renderTopLeft()}
                        </div>
                    )}

                    {renderTopRight && (
                        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1.5">
                            {renderTopRight()}
                        </div>
                    )}

                    {/* 3-dots menu in top-right corner */}
                    {/* Positioned above renderTopRight badges with higher z-index */}
                    {(onViewBookings || onEdit) && (
                        <div className="absolute top-2 right-2 z-20">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="opacity-80 hover:opacity-100 transition-opacity p-1.5 hover:bg-white/30 rounded-full bg-white/90 backdrop-blur-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                    >
                                        <MoreVertical className="h-4 w-4 text-zinc-900" />
                                        <span className="sr-only">Open menu</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" sideOffset={4}>
                                    {onViewBookings && (
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onViewBookings();
                                            }}
                                            className="text-gray-700 focus:text-gray-700"
                                        >
                                            <Users className="h-4 w-4 mr-2" />
                                            See bookings
                                        </DropdownMenuItem>
                                    )}
                                    {onEdit && (
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit();
                                            }}
                                            className="text-gray-700 focus:text-gray-700"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Class
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                {/* Bottom Section */}
                <div className={cn(
                    "bg-card px-3 py-2 flex flex-col",
                    renderFooter ? "justify-between" : "justify-center",
                    renderFooter ? "min-h-[92px]" : "min-h-[60px]"
                )}>
                    <div className="flex flex-col gap-1">
                        {titleContent}
                        {subtitleContent}
                    </div>

                    {renderFooter && (
                        <>
                            <div className="h-px my-2.5 bg-zinc-200" />
                            <div className="flex-shrink-0">
                                {renderFooter()}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper components for common footer metrics
export function ClassCardFooterMetrics({
    time,
    booked,
    capacity,
    venueCity
}: {
    time?: string;
    booked?: number;
    capacity?: number;
    venueCity?: string;
}) {
    return (
        <div className="flex items-center gap-2.5 flex-wrap">
            {time && (
                <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-zinc-700" strokeWidth={2} />
                    <span className="text-xs text-zinc-700 truncate">{time}</span>
                </div>
            )}
            {booked !== undefined && capacity !== undefined && (
                <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-zinc-700" strokeWidth={2} />
                    <span className="text-xs text-zinc-700 truncate">
                        {booked}/{capacity}
                    </span>
                </div>
            )}
            {venueCity && (
                <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-zinc-600" strokeWidth={2} />
                    <span className="text-xs text-zinc-700 truncate">{venueCity}</span>
                </div>
            )}
        </div>
    );
}

