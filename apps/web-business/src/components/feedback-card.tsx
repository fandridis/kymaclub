"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Doc } from "@repo/api/convex/_generated/dataModel";

export type FeedbackCardData = Doc<"venueReviews">;

interface FeedbackCardProps {
    review: FeedbackCardData;
    className?: string;
    onClick?: () => void;
}

export function FeedbackCard({
    review,
    className,
    onClick,
}: FeedbackCardProps) {
    const userName = review.userSnapshot.name || "Anonymous";
    const venueName = review.venueSnapshot.name;
    const hasComment = Boolean(review.comment);
    const timeAgo = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });

    // Get initials for avatar
    const getInitials = (name: string): string => {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const initials = getInitials(userName);

    return (
        <div
            className={cn(
                "w-full h-full pt-1.5 pb-2 pr-2",
                className
            )}
            onClick={onClick}
        >
            <div className={cn(
                "h-full w-full rounded-2xl shadow-sm bg-card border border-border overflow-hidden flex flex-col",
                onClick && "cursor-pointer transition-opacity hover:opacity-90"
            )}>
                {/* Header Section with Avatar and Rating */}
                <div className="px-4 pt-4 pb-3">
                    <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                            {initials}
                        </div>

                        {/* User Info and Rating */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-bold text-zinc-900 truncate">
                                        {userName}
                                    </h3>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {venueName}
                                    </p>
                                </div>
                                {/* Stars */}
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <Star
                                            key={index}
                                            className={cn(
                                                "h-3.5 w-3.5",
                                                index < review.rating
                                                    ? "fill-amber-500 text-amber-500"
                                                    : "text-zinc-300"
                                            )}
                                            aria-hidden="true"
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{timeAgo}</p>
                        </div>
                    </div>
                </div>

                {/* Comment Section */}
                {hasComment && (
                    <div className="px-4 pb-4 flex-1 overflow-hidden">
                        <p className="text-sm text-zinc-700 line-clamp-3 leading-relaxed">
                            {review.comment}
                        </p>
                    </div>
                )}

                {/* Empty state if no comment */}
                {!hasComment && <div className="flex-1" />}
            </div>
        </div>
    );
}

