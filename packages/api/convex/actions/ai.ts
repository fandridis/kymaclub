"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { reviewsService } from "../../services/reviewsService";

interface ValidationResult {
    isOk: boolean;
    probability: number;
    summary: string;
}

interface ModerationResult {
    score: number;
    reason?: string;
    status: "auto_approved" | "flagged" | "auto_rejected";
}

export const validateUserVenueReview = internalAction({
    args: { reviewText: v.string() },
    handler: async (ctx, args) => {
        const result = await validateWithAI(args.reviewText);
        console.log('Validation result:', result);
        return result;
    },
});

/**
 * Test function to verify probability threshold logic
 */
export const testProbabilityThresholds = internalAction({
    args: {},
    handler: async (ctx, args) => {
        console.log("Testing probability threshold logic...");

        const testCases = [
            { isOk: true, probability: 0.9, expected: "auto_approved" },
            { isOk: true, probability: 0.5, expected: "auto_approved" },
            { isOk: true, probability: 0.3, expected: "flagged" },
            { isOk: false, probability: 0.9, expected: "auto_rejected" },
            { isOk: false, probability: 0.6, expected: "flagged" },
            { isOk: false, probability: 0.3, expected: "auto_approved" },
        ];

        for (const testCase of testCases) {
            const score = Math.round(testCase.probability * 100);
            let status: "auto_approved" | "flagged" | "auto_rejected";

            if (testCase.isOk) {
                if (score >= 40) {
                    status = "auto_approved";
                } else {
                    status = "flagged";
                }
            } else {
                if (score >= 80) {
                    status = "auto_rejected";
                } else if (score >= 40) {
                    status = "flagged";
                } else {
                    status = "auto_approved";
                }
            }

            const passed = status === testCase.expected;
            console.log(`Test: isOk=${testCase.isOk}, prob=${testCase.probability}, score=${score} -> ${status} (expected: ${testCase.expected}) ${passed ? '✅' : '❌'}`);
        }

        return { message: "Probability threshold tests completed" };
    },
});

export const moderateVenueReview = internalAction({
    args: {
        reviewText: v.string(),
        reviewId: v.id("venueReviews")
    },
    handler: async (ctx, args) => {
        try {
            const result = await validateWithAI(args.reviewText);
            console.log('AI moderation result:', result);

            // Convert AI result to moderation format using probability thresholds
            const score = Math.round(result.probability * 100); // Convert 0-1 to 0-100
            let status: "auto_approved" | "flagged" | "auto_rejected";

            console.log(`AI Analysis - isOk: ${result.isOk}, probability: ${result.probability}, score: ${score}`);

            if (result.isOk) {
                // AI says it's legitimate - check confidence level
                if (score >= 40) {
                    status = "auto_approved"; // High confidence it's legitimate
                    console.log("Decision: auto_approved (legitimate with high confidence)");
                } else {
                    status = "flagged"; // Low confidence, needs manual review
                    console.log("Decision: flagged (legitimate but low confidence)");
                }
            } else {
                // AI says it's bad - check confidence level
                if (score >= 80) {
                    status = "auto_rejected"; // Very high confidence it's bad
                    console.log("Decision: auto_rejected (bad with very high confidence)");
                } else if (score >= 40) {
                    status = "flagged"; // Medium confidence it's bad, needs manual review
                    console.log("Decision: flagged (bad with medium confidence)");
                } else {
                    status = "auto_approved"; // Low confidence it's bad, approve it
                    console.log("Decision: auto_approved (bad but low confidence)");
                }
            }

            const moderationResult: ModerationResult = {
                score,
                reason: result.summary,
                status
            };

            // Process the moderation result directly using the service
            await reviewsService.processAIModerationFromAction({
                ctx,
                reviewId: args.reviewId,
                moderationResult: moderationResult,
            });

        } catch (error) {
            console.error('AI moderation failed for review:', args.reviewId, error);
            // If AI moderation fails, flag the review for manual review
            await reviewsService.processAIModerationFromAction({
                ctx,
                reviewId: args.reviewId,
                moderationResult: {
                    score: 0,
                    reason: 'AI moderation failed - flagged for manual review',
                    status: 'flagged'
                },
            });
        }
    },
});

const validateWithAI = async (review: string): Promise<ValidationResult> => {
    try {
        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            system: SYSTEM_PROMPT,
            prompt: review,
            temperature: 0.1, // Lower temperature for consistent results
        });

        // Parse the JSON response
        const cleanedText = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(cleanedText);

        // Validate the response structure
        if (
            typeof parsed.isOk !== 'boolean' ||
            typeof parsed.probability !== 'number' ||
            typeof parsed.summary !== 'string'
        ) {
            throw new Error('Invalid response format');
        }

        return parsed as ValidationResult;

    } catch (error) {
        console.error('AI validation error:', error);

        // Return a conservative default if AI fails
        return {
            isOk: false,
            probability: 0,
            summary: 'Unable to validate review - flagged for manual review',
        };
    }
};

const SYSTEM_PROMPT = `You are a review authenticity analyzer. Your sole task is to evaluate business reviews (1-750 characters) for fitness centers, gyms, yoga studios, and workshops to determine if they are legitimate or fake/scam/inappropriate.

Your Task:
Analyze the provided review and respond ONLY with a JSON object in this exact format:
{
  "isOk": boolean,
  "probability": number,
  "summary": "string"
}

Field Definitions:
- isOk: true if the review appears legitimate, false if it seems fake/scam/inappropriate
- probability: confidence level (0.0 to 1.0) in your assessment
- summary: brief explanation of your decision (under 100 words)

Red Flags to Check:
- Generic language lacking specific details
- Excessive promotional content or suspicious links
- Inappropriate/offensive content
- Repetitive phrases or unnatural language patterns
- Extreme sentiment without substantiation
- Off-topic content unrelated to fitness services
- Contact information or solicitation attempts
- Multiple grammar/spelling errors suggesting bot generation

Green Flags:
- Specific details about classes, equipment, or instructors
- Balanced perspective (pros and cons)
- Natural, conversational language
- Relevant personal experience descriptions
- Appropriate length and detail level

Important: Respond with ONLY the JSON object, no additional text or formatting.`;