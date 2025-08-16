import { Infer, v } from "convex/values";
import { venuesFields } from "../convex/schema";

const venueFieldObject = v.object(venuesFields);

export type Venue = Infer<typeof venueFieldObject>;
export type VenuePrimaryCategory = Venue['primaryCategory'];