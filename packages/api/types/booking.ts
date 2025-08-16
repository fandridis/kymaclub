import { Infer, v } from "convex/values";
import { bookingsFields } from "../convex/schema";
import { Doc } from "../convex/_generated/dataModel";

const bookingFieldObject = v.object(bookingsFields);

export type Booking = Infer<typeof bookingFieldObject>;
export type BookingStatus = Booking['status'];

export type BookingWithDetails = Doc<"bookings"> & {
    classInstance?: Doc<"classInstances">;
    classTemplate?: Doc<"classTemplates">;
    venue?: Doc<"venues">;
};