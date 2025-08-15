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
    console.log('[Waitlist] Submission received:', {
      email: args.email,
      city: args.selectedCity,
      hasLocation: !!args.currentLocation,
      isManual: args.isManualEntry,
    });

    // For now, just log the waitlist submission
    // In a real implementation, you would:
    // 1. Store in a waitlist table
    // 2. Send confirmation email
    // 3. Notify admin team
    
    const timestamp = new Date().toISOString();
    console.log(`[Waitlist] ${timestamp} - New waitlist entry:`, {
      email: args.email,
      city: args.selectedCity,
      location: args.currentLocation,
      manual: args.isManualEntry,
    });

    // Simulate success response
    return {
      success: true,
      message: "Successfully joined the waitlist!",
      timestamp,
    };
  },
});