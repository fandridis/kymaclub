import { Infer, v } from "convex/values";
import { bookingsFields } from "../convex/schema";

const bookingFieldObject = v.object(bookingsFields);

export type Booking = Infer<typeof bookingFieldObject>;
export type BookingStatus = Booking['status'];
