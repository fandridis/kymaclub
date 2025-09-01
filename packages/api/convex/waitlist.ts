import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Simple waitlist mutation for mobile app location-based onboarding
export const submitToWaitlist = mutation({
  args: {
    email: v.string(),
    selectedCity: v.string(),
    currentLocation: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    isManualEntry: v.boolean(),
  },
  handler: async (ctx, args) => {
    // For now, just log the waitlist submission
    // In a real implementation, you would:
    // 1. Store in a waitlist table
    // 2. Send confirmation email
    // 3. Notify admin team

    const timestamp = new Date().toISOString();
    // Simulate success response
    return {
      success: true,
      message: "Successfully joined the waitlist!",
      timestamp,
    };
  },
});