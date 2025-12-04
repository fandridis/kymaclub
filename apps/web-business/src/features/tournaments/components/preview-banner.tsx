"use client"

import { AlertTriangle } from "lucide-react";

interface PreviewBannerProps {
    placeholderCount: number;
}

export function PreviewBanner({ placeholderCount }: PreviewBannerProps) {
    return (
        <div className="flex items-start gap-3 px-4 py-3 mb-6 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
                <p className="font-bold text-amber-800">Preview Mode</p>
                <p className="text-sm text-amber-700">
                    This schedule may change as players join or leave.
                    {placeholderCount > 0 && (
                        <span className="block mt-1">
                            {placeholderCount} placeholder player{placeholderCount !== 1 ? 's' : ''} shown as "TBD".
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}

