import React from 'react';
import { Skeleton } from './Skeleton';

export function CreditsBadgeSkeleton() {
  // Matches CreditsBadge dimensions:
  // - borderRadius: 22 (pill shape)
  // - paddingVertical: 8, paddingHorizontal: 10
  // - Content: icon (20) + gap (3) + text (~30) = ~53 + padding (20) = ~73
  // - Height: icon height (20) + vertical padding (16) = ~36
  return (
    <Skeleton
      width={70}
      height={36}
      borderRadius={22}
    />
  );
}
