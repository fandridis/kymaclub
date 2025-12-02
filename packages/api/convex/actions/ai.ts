"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { reviewsService } from "../../services/reviewsService";
import { uploadService } from "../../services/uploadService";
import { GoogleGenAI, Type } from "@google/genai";
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_STUDIO_API_KEY });


interface ValidationResult {
    probabilityToBeBad: number; // 0.0 to 1.0
    summary: string;
}

interface ModerationResult {
    score: number;
    reason?: string;
    status: "auto_approved" | "flagged" | "auto_rejected";
}

/**
 * Type-safe response from Google GenAI validation
 * Matches the responseSchema defined in validateWithAI and validateImageWithAI
 */
type ValidationResponse = {
    probabilityToBeBad: number;
    summary: string;
};

/**
 * Validates and types the parsed JSON response from Google GenAI
 */
function validateAndTypeResponse(json: unknown): ValidationResponse {
    if (
        typeof json !== 'object' ||
        json === null ||
        !('probabilityToBeBad' in json) ||
        !('summary' in json)
    ) {
        throw new Error('Invalid response format: missing required fields');
    }

    const response = json as Record<string, unknown>;

    if (
        typeof response.probabilityToBeBad !== 'number' ||
        typeof response.summary !== 'string' ||
        response.probabilityToBeBad < 0 ||
        response.probabilityToBeBad > 1
    ) {
        throw new Error('Invalid response format: invalid field types or values');
    }

    return {
        probabilityToBeBad: response.probabilityToBeBad,
        summary: response.summary,
    };
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

/**
 * OLD IMPLEMENTATION - Using Vercel AI SDK with OpenAI
 * Kept as backup reference
 */
export const moderateVenueReviewOld = internalAction({
    args: {
        reviewText: v.string(),
        reviewId: v.id("venueReviews")
    },
    handler: async (ctx, args) => {
        try {
            const result = await validateWithAIOld(args.reviewText);
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

export const moderateProfileImage = internalAction({
    args: {
        imageStorageId: v.id("_storage"),
        userId: v.id("users")
    },
    handler: async (ctx, args) => {

        try {
            // Get the image URL for analysis
            const imageUrl = await ctx.storage.getUrl(args.imageStorageId);

            if (!imageUrl) {
                throw new Error("Image not found in storage");
            }

            const result = await validateImageWithAI(imageUrl);

            // Convert probability to score (0-100)
            const score = Math.round(result.probabilityToBeBad * 100);
            let status: "auto_approved" | "flagged" | "auto_rejected";

            // Same thresholds as review moderation (0.4 / 0.8)
            if (result.probabilityToBeBad < 0.4) {
                status = "auto_approved";
            } else if (result.probabilityToBeBad < 0.8) {
                status = "flagged";
            } else {
                status = "auto_rejected";
            }

            const moderationResult = {
                score,
                reason: result.summary,
                status
            };

            // Process the moderation result via service
            await uploadService.processProfileImageModerationFromAction({
                ctx,
                userId: args.userId,
                imageStorageId: args.imageStorageId,
                moderationResult
            });

        } catch (error) {
            console.error('Profile image moderation error:', args.userId, error);

            // If AI fails, flag for manual review (don't auto-reject)
            await uploadService.processProfileImageModerationFromAction({
                ctx,
                userId: args.userId,
                imageStorageId: args.imageStorageId,
                moderationResult: {
                    score: 0,
                    reason: 'AI moderation failed - flagged for manual review',
                    status: 'flagged'
                }
            });
        }
    }
});

const validateImageWithAI = async (imageUrl: string): Promise<ValidationResult> => {
    try {
        // Fetch the image and convert to base64
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

        const prompt = `You are a safety reviewer for a platform that connects users with classes, studios, and wellness experiences. Evaluate this profile image for inappropriate or unsafe content.
            RED FLAGS (increase probability):
            - Nudity, sexual content, explicit material
            - Revealing clothing with sexual intent
            - Sexual gestures or poses
            - Intimate body parts exposed
            - Unrelated spam like phone numbers, emails, or other contact information
            - Obvious spam or bot-generated content with unnatural patterns

            ACCEPTABLE (keep low):
            - Fitness/gym attire, professional headshots
            - Casual photos with appropriate clothing
            - Athletic wear in fitness context
            - Standard swimwear at beach/pool

            FITNESS CONTEXT: Athletic wear is acceptable in gym/fitness settings.
            When uncertain, flag for manual review (0.4-0.8 range).

            Analyze this profile image for inappropriate content.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: imageBase64
                            }
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        probabilityToBeBad: {
                            type: Type.NUMBER,
                            description: "Probability image is inappropriate (0-1), 0=safe, 0.5=uncertain, 1.0=inappropriate"
                        },
                        summary: {
                            type: Type.STRING,
                            description: "Brief explanation (max 50 words)"
                        }
                    },
                    required: ["probabilityToBeBad", "summary"]
                }
            }
        });

        const json = JSON.parse(response.text || '{}');
        const typedResponse = validateAndTypeResponse(json);

        return {
            probabilityToBeBad: typedResponse.probabilityToBeBad,
            summary: typedResponse.summary
        };

    } catch (error) {
        console.error('AI image validation error:', error);

        // Conservative fallback: flag for manual review
        return {
            probabilityToBeBad: 0.5,
            summary: 'Unable to validate image - flagged for manual review',
        };
    }
};

/**
 * OLD IMPLEMENTATION - Using Vercel AI SDK with OpenAI
 * Kept as backup reference
 */
const validateImageWithAIOld = async (imageUrl: string): Promise<ValidationResult> => {
    try {
        const { text } = await generateText({
            model: openai('gpt-4o-mini'), // Cost-effective vision model for moderation
            system: IMAGE_MODERATION_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            image: imageUrl
                        },
                        {
                            type: 'text',
                            text: 'Analyze this profile image for inappropriate content.'
                        }
                    ]
                }
            ],
            temperature: 0.0, // Zero temperature for consistent moderation decisions
        });

        // Parse JSON response (same pattern as text moderation)
        const cleanedText = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(cleanedText);

        // Validate response structure
        if (
            typeof parsed.probabilityToBeBad !== 'number' ||
            typeof parsed.summary !== 'string' ||
            parsed.probabilityToBeBad < 0 ||
            parsed.probabilityToBeBad > 1
        ) {
            throw new Error('Invalid AI response format');
        }

        return parsed as ValidationResult;

    } catch (error) {
        console.error('AI image validation error:', error);

        // Conservative fallback: flag for manual review
        return {
            probabilityToBeBad: 0.5,
            summary: 'Unable to validate image - flagged for manual review',
        };
    }
};

const IMAGE_MODERATION_SYSTEM_PROMPT = `You are a safety reviewer for a platform that connects users with classes, studios, and wellness experiences. Evaluate profile images for inappropriate or unsafe content.

Respond ONLY with JSON:
{
  "probabilityToBeBad": number,
  "summary": "string"
}

probabilityToBeBad: 0.0-1.0 (0=safe, 0.5=uncertain, 1.0=inappropriate)
summary: Brief explanation (max 50 words)

RED FLAGS (increase probability):
- Nudity, sexual content, explicit material
- Revealing clothing with sexual intent
- Sexual gestures or poses
- Intimate body parts exposed
- Unrelated spam like phone numbers, emails, or other contact information
- Obvious spam or bot-generated content with unnatural patterns

ACCEPTABLE (keep low):
- Fitness/gym attire, professional headshots
- Casual photos with appropriate clothing
- Athletic wear in fitness context
- Standard swimwear at beach/pool

FITNESS CONTEXT: Athletic wear is acceptable in gym/fitness settings.
When uncertain, flag for manual review (0.4-0.8 range).

Respond with ONLY the JSON object.`;

const validateWithAI = async (review: string): Promise<ValidationResult> => {
    try {
        const prompt = `You are a review authenticity analyzer. Evaluate this business review: "${review}".
            Determine the probability that it is bad (fake/scam/inappropriate) and provide a summary.
            
            probabilityToBeBad: 0.0 (safe) to 1.0 (bad).
            summary: Brief explanation.
            
            RED FLAGS: Excessive promotion, offensive, spam, unrelated.
            GREEN FLAGS: Specific details, balanced perspective, natural language.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        probabilityToBeBad: { type: Type.NUMBER, description: "Probability review is bad (0-1)" },
                        summary: { type: Type.STRING, description: "Reasoning" }
                    },
                    required: ["probabilityToBeBad", "summary"]
                }
            }
        });

        const json = JSON.parse(response.text || '{}');
        const typedResponse = validateAndTypeResponse(json);

        return {
            probabilityToBeBad: typedResponse.probabilityToBeBad,
            summary: typedResponse.summary
        };

    } catch (error) {
        console.error('AI validation error:', error);

        // Return a conservative default if AI fails (medium probability to flag for manual review)
        return {
            probabilityToBeBad: 0.5, // Flag for manual review when AI fails
            summary: 'Unable to validate review - flagged for manual review',
        };
    }
};

/**
 * OLD IMPLEMENTATION - Using Vercel AI SDK with OpenAI
 * Kept as backup reference
 */
const validateWithAIOld = async (review: string): Promise<ValidationResult> => {
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