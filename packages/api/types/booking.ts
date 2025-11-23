import { Doc } from "../convex/_generated/dataModel";

export type Booking = Doc<"bookings">;
export type BookingStatus = Booking['status'];

export type userSnapshot = {
    name?: string;
    email?: string;
    phone?: string;
};
