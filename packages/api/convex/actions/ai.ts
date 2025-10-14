"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { reviewsService } from "../../services/reviewsService";

interface ValidationResult {
    probabilityToBeBad: number; // 0.0 to 1.0
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
        const testCases = [
            { probabilityToBeBad: 0.1, expected: "auto_approved" },
            { probabilityToBeBad: 0.3, expected: "auto_approved" },
            { probabilityToBeBad: 0.4, expected: "flagged" },
            { probabilityToBeBad: 0.6, expected: "flagged" },
            { probabilityToBeBad: 0.8, expected: "auto_rejected" },
            { probabilityToBeBad: 0.9, expected: "auto_rejected" },
        ];

        for (const testCase of testCases) {
            const score = Math.round(testCase.probabilityToBeBad * 100);
            let status: "auto_approved" | "flagged" | "auto_rejected";

            if (testCase.probabilityToBeBad < 0.4) {
                status = "auto_approved";
            } else if (testCase.probabilityToBeBad < 0.8) {
                status = "flagged";
            } else {
                status = "auto_rejected";
            }

            const passed = status === testCase.expected;
            console.log(`Test: probabilityToBeBad=${testCase.probabilityToBeBad}, score=${score} -> ${status} (expected: ${testCase.expected}) ${passed ? '✅' : '❌'}`);
        }

        return { message: "Simplified probability threshold tests completed" };
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

            // Simplified logic based only on probabilityToBeBad
            const score = Math.round(result.probabilityToBeBad * 100); // Convert 0-1 to 0-100
            let status: "auto_approved" | "flagged" | "auto_rejected";

            console.log(`AI Analysis - probabilityToBeBad: ${result.probabilityToBeBad}, score: ${score}`);

            if (result.probabilityToBeBad < 0.4) {
                status = "auto_approved";
                console.log("Decision: auto_approved (low probability of being bad)");
            } else if (result.probabilityToBeBad < 0.8) {
                status = "flagged";
                console.log("Decision: flagged (medium probability of being bad)");
            } else {
                status = "auto_rejected";
                console.log("Decision: auto_rejected (high probability of being bad)");
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
            typeof parsed.probabilityToBeBad !== 'number' ||
            typeof parsed.summary !== 'string' ||
            parsed.probabilityToBeBad < 0 ||
            parsed.probabilityToBeBad > 1
        ) {
            throw new Error('Invalid response format');
        }

        return parsed as ValidationResult;

    } catch (error) {
        console.error('AI validation error:', error);

        // Return a conservative default if AI fails (medium probability to flag for manual review)
        return {
            probabilityToBeBad: 0.5, // Flag for manual review when AI fails
            summary: 'Unable to validate review - flagged for manual review',
        };
    }
};

const SYSTEM_PROMPT = `You are a review authenticity analyzer. Your sole task is to evaluate business reviews (1-750 characters) for fitness centers, gyms, yoga studios, and workshops to determine the probability that they are bad (fake/scam/inappropriate).

Your Task:
Analyze the provided review and respond ONLY with a JSON object in this exact format:
{
  "probabilityToBeBad": number,
  "summary": "string"
}

Field Definitions:
- probabilityToBeBad: probability from 0.0 to 1.0 that the review is bad (fake/scam/inappropriate)
  * 0.0 = definitely legitimate and appropriate
  * 0.5 = uncertain, could go either way
  * 1.0 = definitely fake/scam/inappropriate
- summary: brief explanation of your assessment (under 100 words)

IMPORTANT: Be lenient with short, simple reviews. Many genuine users leave brief positive reviews like "Great class!", "Love this gym!", or "Best instructor ever!" - these are normal human expressions and should be considered legitimate unless there are clear red flags.

Red Flags (increase probabilityToBeBad):
- Excessive promotional content or suspicious links
- Inappropriate/offensive content
- Contact information or solicitation attempts
- Off-topic content completely unrelated to fitness services
- Obvious spam or bot-generated content with unnatural patterns
- Reviews that seem designed to manipulate ratings maliciously

Neutral/Acceptable (keep probabilityToBeBad low):
- Short, enthusiastic reviews ("Best class ever!", "Amazing gym!")
- Generic but positive language without other red flags
- Simple expressions of satisfaction or dissatisfaction
- Brief reviews lacking detail but showing genuine sentiment

Green Flags (decrease probabilityToBeBad):
- Specific details about classes, equipment, or instructors
- Balanced perspective (pros and cons)
- Natural, conversational language
- Relevant personal experience descriptions
- Any review that feels like a genuine human expression, regardless of length

Remember: Err on the side of approving reviews unless there are clear indicators of spam, inappropriate content, or malicious intent. Short positive reviews are common and legitimate.

Important: Respond with ONLY the JSON object, no additional text or formatting.`;