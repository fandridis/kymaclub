"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { FeedbackCard, type FeedbackCardData } from "./feedback-card";

interface FeedbackCarouselProps {
    title: string;
    reviews: FeedbackCardData[];
    className?: string;
    emptyMessage?: string;
    emptyAction?: React.ReactNode;
    onReviewClick?: (review: FeedbackCardData) => void;
    headerAction?: React.ReactNode;
}

export function FeedbackCarousel({
    title,
    reviews,
    className,
    emptyMessage = "No reviews yet",
    emptyAction,
    onReviewClick,
    headerAction,
}: FeedbackCarouselProps) {
    if (reviews.length === 0) {
        return (
            <div className={cn("space-y-1", className)}>
                <div className="flex items-center gap-3 px-3 md:px-4">
                    <h2 className="text-xl md:text-2xl font-semibold">
                        {title}
                    </h2>
                    {headerAction}
                </div>
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
            <div className="flex items-center gap-3 px-3 md:px-4">
                <h2 className="text-xl md:text-2xl font-semibold">
                    {title}
                </h2>
                {headerAction}
            </div>
            <div className="overflow-x-auto scrollbar-hide -mx-3 md:-mx-4 px-3 md:px-4">
                <div className="flex gap-3 md:gap-4 pb-2">
                    {reviews.map((review) => {
                        // Calculate card height based on whether there's a comment
                        const hasComment = Boolean(review.comment);
                        const cardHeight = hasComment ? "h-[200px]" : "h-[140px]";

                        return (
                            <div
                                key={review._id}
                                className={cn("flex-shrink-0 w-[280px] md:w-[320px]", cardHeight)}
                            >
                                <FeedbackCard
                                    review={review}
                                    onClick={onReviewClick ? () => onReviewClick(review) : undefined}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

