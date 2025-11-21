import { usePaginatedQuery } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";

type BookingStatus = "latest" | "cancelled_by_consumer" | "cancelled_by_business" | "no_show";

export const useBookings = (initialNumItems: number = 10, status: BookingStatus = "latest") => {
    return usePaginatedQuery(
        api.internal.queries.bookings.getAllBookings,
        { status },
        { initialNumItems }
    );
};

export type Booking = NonNullable<
    Awaited<ReturnType<typeof useBookings>>['results']
>[number];

