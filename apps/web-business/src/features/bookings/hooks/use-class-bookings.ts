import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@repo/api/convex/_generated/api";
import type { Id } from "@repo/api/convex/_generated/dataModel";

export function useClassBookings(
    classInstanceId: Id<"classInstances"> | null,
    options?: { skip?: boolean }
) {
    const shouldSkip = options?.skip ?? false;

    const bookings = useQuery(
        api.queries.bookings.getBookingsForClassInstance,
        shouldSkip || !classInstanceId ? "skip" : { classInstanceId }
    );

    return {
        bookings: bookings ?? [],
        isLoading: !shouldSkip && bookings === undefined,
        isSkipped: shouldSkip || !classInstanceId,
    };
}