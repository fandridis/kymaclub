import { type Infer, v } from "convex/values";
import { bookingsFields } from "../convex/schema";

const bookingFieldObject = v.object(bookingsFields);

export type Booking = Infer<typeof bookingFieldObject>;
export type BookingStatus = Booking['status'];

export type userSnapshot = {
    name?: string;
    email?: string;
    phone?: string;
};

// gg1
// export type BookingWithDetails = Doc<"bookings"> & {
//     classInstance?: Doc<"classInstances">;
//     classTemplate?: Doc<"classTemplates">;
//     venue?: Doc<"venues">;
// };