import { Doc, Id } from "../convex/_generated/dataModel";

export type ClassInstance = Doc<"classInstances">;
export type ClassInstanceStatus = ClassInstance['status'];

/**
 * Minimal class instance data for "Happening Today/Tomorrow" sections
 * 
 * Contains only the fields needed for consumer-facing cards with pricing info.
 * Used by getHappeningClassInstances service method.
 */
export interface HappeningClassInstance {
    _id: Id<"classInstances">;
    startTime: number;
    name: string;
    instructor?: string;
    venueName: string;
    venueCity: string;
    templateImageId?: Id<"_storage">;
    venueImageId?: Id<"_storage">;
    pricing: {
        originalPrice: number;
        finalPrice: number;
        discountPercentage: number;
    };
}
