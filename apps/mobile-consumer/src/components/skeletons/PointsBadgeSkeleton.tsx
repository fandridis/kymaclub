import React from 'react';
import { Skeleton } from './Skeleton';

export function PointsBadgeSkeleton() {
    // Matches PointsBadge dimensions:
    // - borderRadius: 22 (pill shape)
    // - paddingVertical: 8, paddingHorizontal: 12
    // - Content: icon (18) + gap (4) + text (~30) = ~52 + padding (24) = ~76
    // - Height: icon height (18) + vertical padding (16) = ~34
    return (
        <Skeleton
            width={76}
            height={36}
            borderRadius={22}
        />
    );
}

