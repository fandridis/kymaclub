/**
 * Integration tests for Pre-Booking Questionnaire feature
 * 
 * Tests:
 * - Questionnaire fee calculation
 * - Questionnaire answer validation
 * - Booking with questionnaire answers
 * - Questionnaire snapshot preservation
 * - Instance override of template questionnaire
 */

import { describe, expect, test } from "vitest";
import { api } from "../convex/_generated/api";
import { initAuth, testT, createTestVenue, createTestClassTemplate, createTestClassInstance } from "./helpers";
import type { Id } from "../convex/_generated/dataModel";
import type { Question, QuestionAnswer, Questionnaire } from "../types/questionnaire";
import {
    calculateQuestionFee,
    calculateTotalQuestionnaireFees,
    buildQuestionnaireAnswersWithFees,
    validateAnswerMatchesType,
    hasAnswerValue,
    getEffectiveQuestionnaire,
} from "../operations/questionnaire";
import {
    validateRequiredQuestions,
    validateAnswerTypes,
    validateAnswerConstraints,
    validateQuestionnaireAnswers,
    validateQuestionnaireDefinition,
} from "../rules/questionnaire";
import { ConvexError } from "convex/values";

/***************************************************************
 * Helper Functions
 ***************************************************************/

function createBooleanQuestion(options: {
    id?: string;
    question?: string;
    required?: boolean;
    feeOnTrue?: number;
}): Question {
    return {
        id: options.id ?? "q_bool_1",
        question: options.question ?? "Do you need equipment?",
        type: "boolean",
        required: options.required ?? false,
        booleanConfig: options.feeOnTrue !== undefined ? { feeOnTrue: options.feeOnTrue } : undefined,
    };
}

function createSingleSelectQuestion(options: {
    id?: string;
    question?: string;
    required?: boolean;
    options?: Array<{ id: string; label: string; fee?: number }>;
}): Question {
    return {
        id: options.id ?? "q_single_1",
        question: options.question ?? "What's your experience level?",
        type: "single_select",
        required: options.required ?? false,
        options: options.options ?? [
            { id: "opt_beginner", label: "Beginner", fee: 0 },
            { id: "opt_intermediate", label: "Intermediate", fee: 0 },
            { id: "opt_advanced", label: "Advanced", fee: 0 },
        ],
    };
}

function createMultiSelectQuestion(options: {
    id?: string;
    question?: string;
    required?: boolean;
    options?: Array<{ id: string; label: string; fee?: number }>;
}): Question {
    return {
        id: options.id ?? "q_multi_1",
        question: options.question ?? "What equipment do you need?",
        type: "multi_select",
        required: options.required ?? false,
        options: options.options ?? [
            { id: "opt_mat", label: "Yoga Mat", fee: 200 },
            { id: "opt_blocks", label: "Blocks", fee: 100 },
            { id: "opt_strap", label: "Strap", fee: 50 },
        ],
    };
}

function createNumberQuestion(options: {
    id?: string;
    question?: string;
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
    fee?: number;
}): Question {
    return {
        id: options.id ?? "q_number_1",
        question: options.question ?? "How many guests?",
        type: "number",
        required: options.required ?? false,
        numberConfig: {
            min: options.min,
            max: options.max,
            integer: options.integer,
            fee: options.fee,
        },
    };
}

function createTextQuestion(options: {
    id?: string;
    question?: string;
    required?: boolean;
    maxLength?: number;
    fee?: number;
}): Question {
    return {
        id: options.id ?? "q_text_1",
        question: options.question ?? "Any special requests?",
        type: "text",
        required: options.required ?? false,
        textConfig: {
            maxLength: options.maxLength,
            fee: options.fee,
        },
    };
}

async function setupClassWithQuestionnaire(
    asUser: any,
    businessId: Id<"businesses">,
    userId: Id<"users">,
    options: {
        templateQuestionnaire?: Question[];
        instanceQuestionnaire?: Question[];
        classPrice?: number;
        startTime?: number;
    } = {}
) {
    const venueId = await createTestVenue(asUser, "Test Yoga Studio");

    // Create template
    const templateId = await createTestClassTemplate(asUser, userId, businessId, venueId, {
        name: "Yoga with Questionnaire",
        description: "A yoga class with pre-booking questions",
        duration: 60,
        capacity: 20,
        price: options.classPrice ?? 1000, // €10 = 1000 cents = 10 credits
    });

    // Add questionnaire to template if provided
    if (options.templateQuestionnaire) {
        await asUser.mutation(api.mutations.classTemplates.updateClassTemplate, {
            templateId,
            template: {
                questionnaire: options.templateQuestionnaire,
            },
        });
    }

    const startTime = options.startTime ?? Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now

    // Create instance
    const createResult = await asUser.mutation(api.mutations.classInstances.createClassInstance, {
        templateId,
        startTime,
    });

    const instanceId = createResult.createdInstanceId;

    // Add instance questionnaire override if provided
    if (options.instanceQuestionnaire) {
        await asUser.mutation(api.mutations.classInstances.updateSingleInstance, {
            instanceId,
            instance: {
                questionnaire: options.instanceQuestionnaire,
            },
        });
    }

    return { venueId, templateId, instanceId, startTime };
}

/***************************************************************
 * Unit Tests: Fee Calculation Operations
 ***************************************************************/

describe("Questionnaire Fee Calculation Operations", () => {
    describe("calculateQuestionFee", () => {
        test("should calculate boolean fee when true and feeOnTrue is set", () => {
            const question = createBooleanQuestion({ feeOnTrue: 500 });
            const answer: QuestionAnswer = { questionId: "q_bool_1", booleanAnswer: true, feeApplied: 0 };

            expect(calculateQuestionFee(question, answer)).toBe(500);
        });

        test("should return 0 for boolean when false", () => {
            const question = createBooleanQuestion({ feeOnTrue: 500 });
            const answer: QuestionAnswer = { questionId: "q_bool_1", booleanAnswer: false, feeApplied: 0 };

            expect(calculateQuestionFee(question, answer)).toBe(0);
        });

        test("should return 0 for boolean when feeOnTrue not set", () => {
            const question = createBooleanQuestion({});
            const answer: QuestionAnswer = { questionId: "q_bool_1", booleanAnswer: true, feeApplied: 0 };

            expect(calculateQuestionFee(question, answer)).toBe(0);
        });

        test("should calculate single select fee for selected option", () => {
            const question = createSingleSelectQuestion({
                options: [
                    { id: "opt_1", label: "Basic", fee: 0 },
                    { id: "opt_2", label: "Premium", fee: 300 },
                ],
            });
            const answer: QuestionAnswer = { questionId: "q_single_1", singleSelectAnswer: "opt_2", feeApplied: 0 };

            expect(calculateQuestionFee(question, answer)).toBe(300);
        });

        test("should calculate multi select fee by summing selected options", () => {
            const question = createMultiSelectQuestion({
                options: [
                    { id: "opt_mat", label: "Yoga Mat", fee: 200 },
                    { id: "opt_blocks", label: "Blocks", fee: 100 },
                    { id: "opt_strap", label: "Strap", fee: 50 },
                ],
            });
            const answer: QuestionAnswer = {
                questionId: "q_multi_1",
                multiSelectAnswer: ["opt_mat", "opt_strap"],
                feeApplied: 0,
            };

            expect(calculateQuestionFee(question, answer)).toBe(250); // 200 + 50
        });

        test("should calculate number fee when value provided and fee set", () => {
            const question = createNumberQuestion({ fee: 100 });
            const answer: QuestionAnswer = { questionId: "q_number_1", numberAnswer: 5, feeApplied: 0 };

            expect(calculateQuestionFee(question, answer)).toBe(100);
        });

        test("should return 0 for number when no fee set", () => {
            const question = createNumberQuestion({});
            const answer: QuestionAnswer = { questionId: "q_number_1", numberAnswer: 5, feeApplied: 0 };

            expect(calculateQuestionFee(question, answer)).toBe(0);
        });

        test("should calculate text fee when value provided and fee set", () => {
            const question = createTextQuestion({ fee: 150 });
            const answer: QuestionAnswer = { questionId: "q_text_1", textAnswer: "Special request", feeApplied: 0 };

            expect(calculateQuestionFee(question, answer)).toBe(150);
        });

        test("should return 0 for text when empty string", () => {
            const question = createTextQuestion({ fee: 150 });
            const answer: QuestionAnswer = { questionId: "q_text_1", textAnswer: "", feeApplied: 0 };

            expect(calculateQuestionFee(question, answer)).toBe(0);
        });
    });

    describe("calculateTotalQuestionnaireFees", () => {
        test("should sum fees from all answers", () => {
            const questionnaire: Questionnaire = [
                createBooleanQuestion({ id: "q1", feeOnTrue: 200 }),
                createMultiSelectQuestion({
                    id: "q2",
                    options: [
                        { id: "opt_1", label: "A", fee: 100 },
                        { id: "opt_2", label: "B", fee: 150 },
                    ],
                }),
            ];

            const answers: QuestionAnswer[] = [
                { questionId: "q1", booleanAnswer: true, feeApplied: 0 },
                { questionId: "q2", multiSelectAnswer: ["opt_1", "opt_2"], feeApplied: 0 },
            ];

            expect(calculateTotalQuestionnaireFees(questionnaire, answers)).toBe(450); // 200 + 100 + 150
        });

        test("should handle missing questions gracefully", () => {
            const questionnaire: Questionnaire = [createBooleanQuestion({ id: "q1", feeOnTrue: 200 })];

            const answers: QuestionAnswer[] = [
                { questionId: "q1", booleanAnswer: true, feeApplied: 0 },
                { questionId: "q_unknown", booleanAnswer: true, feeApplied: 0 },
            ];

            expect(calculateTotalQuestionnaireFees(questionnaire, answers)).toBe(200); // Only q1 fee
        });
    });

    describe("buildQuestionnaireAnswersWithFees", () => {
        test("should build complete QuestionnaireAnswers object", () => {
            const questionnaire: Questionnaire = [
                createBooleanQuestion({ id: "q1", feeOnTrue: 300 }),
                createSingleSelectQuestion({
                    id: "q2",
                    options: [{ id: "opt_1", label: "Premium", fee: 200 }],
                }),
            ];

            const rawAnswers = [
                { questionId: "q1", booleanAnswer: true },
                { questionId: "q2", singleSelectAnswer: "opt_1" },
            ];

            const result = buildQuestionnaireAnswersWithFees(questionnaire, rawAnswers);

            expect(result.questionnaire).toEqual(questionnaire);
            expect(result.answers).toHaveLength(2);
            expect(result.answers[0].feeApplied).toBe(300);
            expect(result.answers[1].feeApplied).toBe(200);
            expect(result.totalFees).toBe(500);
        });
    });
});

/***************************************************************
 * Unit Tests: Type Validation Operations
 ***************************************************************/

describe("Questionnaire Type Validation Operations", () => {
    describe("validateAnswerMatchesType", () => {
        test("should return true for matching boolean answer", () => {
            const question = createBooleanQuestion({});
            const answer: QuestionAnswer = { questionId: "q1", booleanAnswer: true, feeApplied: 0 };

            expect(validateAnswerMatchesType(question, answer)).toBe(true);
        });

        test("should return false for mismatched boolean answer", () => {
            const question = createBooleanQuestion({});
            const answer: QuestionAnswer = { questionId: "q1", textAnswer: "wrong", feeApplied: 0 };

            expect(validateAnswerMatchesType(question, answer)).toBe(false);
        });

        test("should return true for matching single select answer", () => {
            const question = createSingleSelectQuestion({});
            const answer: QuestionAnswer = { questionId: "q1", singleSelectAnswer: "opt_1", feeApplied: 0 };

            expect(validateAnswerMatchesType(question, answer)).toBe(true);
        });

        test("should return true for matching multi select answer", () => {
            const question = createMultiSelectQuestion({});
            const answer: QuestionAnswer = { questionId: "q1", multiSelectAnswer: ["opt_1"], feeApplied: 0 };

            expect(validateAnswerMatchesType(question, answer)).toBe(true);
        });

        test("should return true for matching number answer", () => {
            const question = createNumberQuestion({});
            const answer: QuestionAnswer = { questionId: "q1", numberAnswer: 5, feeApplied: 0 };

            expect(validateAnswerMatchesType(question, answer)).toBe(true);
        });

        test("should return true for matching text answer", () => {
            const question = createTextQuestion({});
            const answer: QuestionAnswer = { questionId: "q1", textAnswer: "hello", feeApplied: 0 };

            expect(validateAnswerMatchesType(question, answer)).toBe(true);
        });
    });

    describe("hasAnswerValue", () => {
        test("should return true for boolean answer", () => {
            expect(hasAnswerValue({ questionId: "q1", booleanAnswer: true, feeApplied: 0 })).toBe(true);
            expect(hasAnswerValue({ questionId: "q1", booleanAnswer: false, feeApplied: 0 })).toBe(true);
        });

        test("should return true for single select answer", () => {
            expect(hasAnswerValue({ questionId: "q1", singleSelectAnswer: "opt_1", feeApplied: 0 })).toBe(true);
        });

        test("should return true for non-empty multi select answer", () => {
            expect(hasAnswerValue({ questionId: "q1", multiSelectAnswer: ["opt_1"], feeApplied: 0 })).toBe(true);
        });

        test("should return false for empty multi select answer", () => {
            expect(hasAnswerValue({ questionId: "q1", multiSelectAnswer: [], feeApplied: 0 })).toBe(false);
        });

        test("should return true for number answer", () => {
            expect(hasAnswerValue({ questionId: "q1", numberAnswer: 0, feeApplied: 0 })).toBe(true);
            expect(hasAnswerValue({ questionId: "q1", numberAnswer: 5, feeApplied: 0 })).toBe(true);
        });

        test("should return true for non-empty text answer", () => {
            expect(hasAnswerValue({ questionId: "q1", textAnswer: "hello", feeApplied: 0 })).toBe(true);
        });

        test("should return false for empty text answer", () => {
            expect(hasAnswerValue({ questionId: "q1", textAnswer: "", feeApplied: 0 })).toBe(false);
        });

        test("should return false for answer with no value", () => {
            expect(hasAnswerValue({ questionId: "q1", feeApplied: 0 })).toBe(false);
        });
    });

    describe("getEffectiveQuestionnaire", () => {
        test("should return instance questionnaire when set", () => {
            const templateQ: Questionnaire = [createBooleanQuestion({ id: "template_q" })];
            const instanceQ: Questionnaire = [createTextQuestion({ id: "instance_q" })];

            expect(getEffectiveQuestionnaire(templateQ, instanceQ)).toEqual(instanceQ);
        });

        test("should return template questionnaire when instance is undefined", () => {
            const templateQ: Questionnaire = [createBooleanQuestion({ id: "template_q" })];

            expect(getEffectiveQuestionnaire(templateQ, undefined)).toEqual(templateQ);
        });

        test("should return template questionnaire when instance is empty", () => {
            const templateQ: Questionnaire = [createBooleanQuestion({ id: "template_q" })];

            expect(getEffectiveQuestionnaire(templateQ, [])).toEqual(templateQ);
        });

        test("should return undefined when both are undefined", () => {
            expect(getEffectiveQuestionnaire(undefined, undefined)).toBeUndefined();
        });
    });
});

/***************************************************************
 * Unit Tests: Validation Rules
 ***************************************************************/

describe("Questionnaire Validation Rules", () => {
    describe("validateRequiredQuestions", () => {
        test("should pass when all required questions are answered", () => {
            const questionnaire: Questionnaire = [
                createBooleanQuestion({ id: "q1", required: true }),
                createTextQuestion({ id: "q2", required: false }),
            ];
            const answers: QuestionAnswer[] = [{ questionId: "q1", booleanAnswer: true, feeApplied: 0 }];

            expect(() => validateRequiredQuestions(questionnaire, answers)).not.toThrow();
        });

        test("should throw when required question is missing", () => {
            const questionnaire: Questionnaire = [createBooleanQuestion({ id: "q1", required: true })];
            const answers: QuestionAnswer[] = [];

            expect(() => validateRequiredQuestions(questionnaire, answers)).toThrow(ConvexError);
        });

        test("should throw when required question has empty answer", () => {
            const questionnaire: Questionnaire = [createTextQuestion({ id: "q1", required: true })];
            const answers: QuestionAnswer[] = [{ questionId: "q1", textAnswer: "", feeApplied: 0 }];

            expect(() => validateRequiredQuestions(questionnaire, answers)).toThrow(ConvexError);
        });
    });

    describe("validateAnswerTypes", () => {
        test("should pass for correct answer types", () => {
            const questionnaire: Questionnaire = [
                createBooleanQuestion({ id: "q1" }),
                createNumberQuestion({ id: "q2" }),
            ];
            const answers: QuestionAnswer[] = [
                { questionId: "q1", booleanAnswer: true, feeApplied: 0 },
                { questionId: "q2", numberAnswer: 5, feeApplied: 0 },
            ];

            expect(() => validateAnswerTypes(questionnaire, answers)).not.toThrow();
        });

        test("should throw for unknown question ID", () => {
            const questionnaire: Questionnaire = [createBooleanQuestion({ id: "q1" })];
            const answers: QuestionAnswer[] = [{ questionId: "unknown", booleanAnswer: true, feeApplied: 0 }];

            expect(() => validateAnswerTypes(questionnaire, answers)).toThrow(ConvexError);
        });

        test("should throw for mismatched answer type", () => {
            const questionnaire: Questionnaire = [createBooleanQuestion({ id: "q1" })];
            const answers: QuestionAnswer[] = [{ questionId: "q1", textAnswer: "wrong", feeApplied: 0 }];

            expect(() => validateAnswerTypes(questionnaire, answers)).toThrow(ConvexError);
        });
    });

    describe("validateAnswerConstraints", () => {
        test("should pass when number is within range", () => {
            const question = createNumberQuestion({ min: 0, max: 10 });
            const answer: QuestionAnswer = { questionId: "q1", numberAnswer: 5, feeApplied: 0 };

            expect(() => validateAnswerConstraints(question, answer)).not.toThrow();
        });

        test("should throw when number is below min", () => {
            const question = createNumberQuestion({ min: 5 });
            const answer: QuestionAnswer = { questionId: "q1", numberAnswer: 3, feeApplied: 0 };

            expect(() => validateAnswerConstraints(question, answer)).toThrow(ConvexError);
        });

        test("should throw when number is above max", () => {
            const question = createNumberQuestion({ max: 10 });
            const answer: QuestionAnswer = { questionId: "q1", numberAnswer: 15, feeApplied: 0 };

            expect(() => validateAnswerConstraints(question, answer)).toThrow(ConvexError);
        });

        test("should throw when non-integer provided for integer-only", () => {
            const question = createNumberQuestion({ integer: true });
            const answer: QuestionAnswer = { questionId: "q1", numberAnswer: 5.5, feeApplied: 0 };

            expect(() => validateAnswerConstraints(question, answer)).toThrow(ConvexError);
        });

        test("should throw when text exceeds max length", () => {
            const question = createTextQuestion({ maxLength: 10 });
            const answer: QuestionAnswer = { questionId: "q1", textAnswer: "This is too long", feeApplied: 0 };

            expect(() => validateAnswerConstraints(question, answer)).toThrow(ConvexError);
        });

        test("should throw for invalid single select option", () => {
            const question = createSingleSelectQuestion({
                options: [{ id: "opt_1", label: "Valid" }],
            });
            const answer: QuestionAnswer = { questionId: "q1", singleSelectAnswer: "invalid_opt", feeApplied: 0 };

            expect(() => validateAnswerConstraints(question, answer)).toThrow(ConvexError);
        });

        test("should throw for invalid multi select option", () => {
            const question = createMultiSelectQuestion({
                options: [{ id: "opt_1", label: "Valid" }],
            });
            const answer: QuestionAnswer = { questionId: "q1", multiSelectAnswer: ["opt_1", "invalid"], feeApplied: 0 };

            expect(() => validateAnswerConstraints(question, answer)).toThrow(ConvexError);
        });
    });

    describe("validateQuestionnaireDefinition", () => {
        test("should pass for valid questionnaire", () => {
            const questionnaire: Questionnaire = [
                createBooleanQuestion({ id: "q1" }),
                createSingleSelectQuestion({
                    id: "q2",
                    options: [{ id: "opt_1", label: "Option 1" }],
                }),
            ];

            expect(() => validateQuestionnaireDefinition(questionnaire)).not.toThrow();
        });

        test("should throw for duplicate question IDs", () => {
            const questionnaire: Questionnaire = [
                createBooleanQuestion({ id: "q1" }),
                createTextQuestion({ id: "q1" }), // Duplicate
            ];

            expect(() => validateQuestionnaireDefinition(questionnaire)).toThrow(ConvexError);
        });

        test("should throw for select question without options", () => {
            const questionnaire: Questionnaire = [
                {
                    id: "q1",
                    question: "No options",
                    type: "single_select",
                    required: false,
                    options: [],
                },
            ];

            expect(() => validateQuestionnaireDefinition(questionnaire)).toThrow(ConvexError);
        });

        test("should throw for duplicate option IDs", () => {
            const questionnaire: Questionnaire = [
                createSingleSelectQuestion({
                    id: "q1",
                    options: [
                        { id: "opt_1", label: "A" },
                        { id: "opt_1", label: "B" }, // Duplicate
                    ],
                }),
            ];

            expect(() => validateQuestionnaireDefinition(questionnaire)).toThrow(ConvexError);
        });

        test("should throw when number min > max", () => {
            const questionnaire: Questionnaire = [createNumberQuestion({ id: "q1", min: 10, max: 5 })];

            expect(() => validateQuestionnaireDefinition(questionnaire)).toThrow(ConvexError);
        });

        test("should throw for negative fees", () => {
            const questionnaire: Questionnaire = [createBooleanQuestion({ id: "q1", feeOnTrue: -100 })];

            expect(() => validateQuestionnaireDefinition(questionnaire)).toThrow(ConvexError);
        });
    });
});

/***************************************************************
 * Integration Tests: Booking with Questionnaire
 ***************************************************************/

describe("Booking with Questionnaire Integration Tests", () => {
    describe("Booking with Template Questionnaire", () => {
        test("should book class with questionnaire and calculate fees correctly", async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.internal.mutations.credits.giftCredits, {
                userId,
                amount: 50,
            });

            // Create class with questionnaire
            const { instanceId } = await setupClassWithQuestionnaire(asUser, businessId, userId, {
                templateQuestionnaire: [
                    createBooleanQuestion({
                        id: "q_mat",
                        question: "Do you need a yoga mat?",
                        required: false,
                        feeOnTrue: 200, // €2
                    }),
                    createMultiSelectQuestion({
                        id: "q_extras",
                        question: "What extras do you need?",
                        required: false,
                        options: [
                            { id: "opt_blocks", label: "Blocks", fee: 100 },
                            { id: "opt_strap", label: "Strap", fee: 50 },
                        ],
                    }),
                ],
                classPrice: 1000, // €10
            });

            // Book with questionnaire answers
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId,
                questionnaireAnswers: [
                    { questionId: "q_mat", booleanAnswer: true },
                    { questionId: "q_extras", multiSelectAnswer: ["opt_blocks", "opt_strap"] },
                ],
            });

            // Verify booking
            const booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId,
            });

            // Base price €10 + mat €2 + blocks €1 + strap €0.50 = €13.50 = 1350 cents
            expect(booking.originalPrice).toBe(1000);
            expect(booking.finalPrice).toBe(1350);
            expect(booking.questionnaireAnswers).toBeTruthy();
            expect(booking.questionnaireAnswers?.totalFees).toBe(350); // 200 + 100 + 50
            expect(booking.questionnaireAnswers?.answers).toHaveLength(2);

            // Verify credits deducted correctly (1350 cents = 13.5, rounds to 14 credits)
            const balance = await asUser.query(api.queries.credits.getUserBalance, {
                userId,
            });
            expect(balance.balance).toBeLessThan(50); // Credits were deducted
        });

        test("should book class without questionnaire answers when not required", async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.internal.mutations.credits.giftCredits, {
                userId,
                amount: 50,
            });

            // Create class with optional questionnaire
            const { instanceId } = await setupClassWithQuestionnaire(asUser, businessId, userId, {
                templateQuestionnaire: [
                    createBooleanQuestion({
                        id: "q1",
                        question: "Optional question?",
                        required: false,
                    }),
                ],
                classPrice: 1000,
            });

            // Book without providing questionnaire answers
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId,
            });

            // Verify booking
            const booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId,
            });

            expect(booking.originalPrice).toBe(1000);
            expect(booking.finalPrice).toBe(1000); // No questionnaire fees
        });

        test("should reject booking when required question not answered", async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.internal.mutations.credits.giftCredits, {
                userId,
                amount: 50,
            });

            // Create class with required questionnaire
            const { instanceId } = await setupClassWithQuestionnaire(asUser, businessId, userId, {
                templateQuestionnaire: [
                    createBooleanQuestion({
                        id: "q_required",
                        question: "This is required",
                        required: true,
                    }),
                ],
                classPrice: 1000,
            });

            // Try to book without answering required question
            await expect(
                asUser.mutation(api.mutations.bookings.bookClass, {
                    classInstanceId: instanceId,
                    questionnaireAnswers: [], // No answers
                })
            ).rejects.toThrow();
        });
    });

    describe("Instance Questionnaire Override", () => {
        test("should use instance questionnaire when set, not template", async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.internal.mutations.credits.giftCredits, {
                userId,
                amount: 50,
            });

            // Create class with template questionnaire
            const { instanceId } = await setupClassWithQuestionnaire(asUser, businessId, userId, {
                templateQuestionnaire: [
                    createBooleanQuestion({
                        id: "q_template",
                        question: "Template question",
                        required: true,
                        feeOnTrue: 100,
                    }),
                ],
                // Override with instance questionnaire
                instanceQuestionnaire: [
                    createBooleanQuestion({
                        id: "q_instance",
                        question: "Instance question",
                        required: false,
                        feeOnTrue: 500,
                    }),
                ],
                classPrice: 1000,
            });

            // Book using instance questionnaire question ID
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId,
                questionnaireAnswers: [
                    { questionId: "q_instance", booleanAnswer: true },
                ],
            });

            const booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId,
            });

            // Should have instance fee (500), not template fee (100)
            expect(booking.questionnaireAnswers?.totalFees).toBe(500);
            expect(booking.questionnaireAnswers?.questionnaire[0].id).toBe("q_instance");
        });
    });

    describe("Questionnaire Snapshot Preservation", () => {
        test("should preserve questionnaire snapshot in booking", async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.internal.mutations.credits.giftCredits, {
                userId,
                amount: 50,
            });

            const questionnaire: Question[] = [
                createSingleSelectQuestion({
                    id: "q_level",
                    question: "Experience level?",
                    required: true,
                    options: [
                        { id: "opt_beginner", label: "Beginner", fee: 0 },
                        { id: "opt_advanced", label: "Advanced", fee: 200 },
                    ],
                }),
            ];

            const { instanceId, templateId } = await setupClassWithQuestionnaire(asUser, businessId, userId, {
                templateQuestionnaire: questionnaire,
                classPrice: 1000,
            });

            // Book the class
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId,
                questionnaireAnswers: [{ questionId: "q_level", singleSelectAnswer: "opt_advanced" }],
            });

            // Get booking and verify snapshot
            const booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId,
            });

            // Questionnaire snapshot should be preserved
            expect(booking.questionnaireAnswers?.questionnaire).toBeTruthy();
            expect(booking.questionnaireAnswers?.questionnaire).toHaveLength(1);
            expect(booking.questionnaireAnswers?.questionnaire[0].question).toBe("Experience level?");
            expect(booking.questionnaireAnswers?.questionnaire[0].options).toHaveLength(2);

            // Now update the template questionnaire (simulate future change)
            await asUser.mutation(api.mutations.classTemplates.updateClassTemplate, {
                templateId,
                template: {
                    questionnaire: [
                        createTextQuestion({
                            id: "q_new",
                            question: "Completely different question",
                        }),
                    ],
                },
            });

            // Original booking should still have the old questionnaire snapshot
            const bookingAfterChange = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId,
            });

            expect(bookingAfterChange.questionnaireAnswers?.questionnaire[0].question).toBe("Experience level?");
        });

        test("should preserve answer with fee information in booking", async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.internal.mutations.credits.giftCredits, {
                userId,
                amount: 50,
            });

            const { instanceId } = await setupClassWithQuestionnaire(asUser, businessId, userId, {
                templateQuestionnaire: [
                    createMultiSelectQuestion({
                        id: "q_equipment",
                        question: "Equipment needed?",
                        options: [
                            { id: "opt_mat", label: "Mat", fee: 200 },
                            { id: "opt_towel", label: "Towel", fee: 100 },
                        ],
                    }),
                ],
                classPrice: 1000,
            });

            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: instanceId,
                questionnaireAnswers: [{ questionId: "q_equipment", multiSelectAnswer: ["opt_mat", "opt_towel"] }],
            });

            const booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId,
            });

            // Verify answer details are preserved
            const answer = booking.questionnaireAnswers?.answers[0];
            expect(answer?.questionId).toBe("q_equipment");
            expect(answer?.multiSelectAnswer).toContain("opt_mat");
            expect(answer?.multiSelectAnswer).toContain("opt_towel");
            expect(answer?.feeApplied).toBe(300); // 200 + 100
        });
    });

    describe("Questionnaire with Discounts", () => {
        test("should apply both questionnaire fees and discounts correctly", async () => {
            const { userId, businessId } = await initAuth();
            const asUser = testT.withIdentity({ subject: userId });

            // Give user credits
            await asUser.mutation(api.internal.mutations.credits.giftCredits, {
                userId,
                amount: 50,
            });

            const venueId = await createTestVenue(asUser, "Test Studio");

            // Create template with both discount and questionnaire
            const templateId = await createTestClassTemplate(asUser, userId, businessId, venueId, {
                name: "Discounted Class with Questions",
                price: 2000, // €20
            });

            // Add discount and questionnaire to template
            await asUser.mutation(api.mutations.classTemplates.updateClassTemplate, {
                templateId,
                template: {
                    discountRules: [
                        {
                            id: "early_bird",
                            name: "Early Bird €5 Off",
                            condition: { type: "always" as const },
                            discount: { type: "fixed_amount" as const, value: 500 },
                            createdAt: Date.now(),
                            createdBy: userId,
                        },
                    ],
                    questionnaire: [
                        createBooleanQuestion({
                            id: "q_premium",
                            question: "Premium experience?",
                            feeOnTrue: 300, // €3
                        }),
                    ],
                },
            });

            // Create instance
            const startTime = Date.now() + 48 * 60 * 60 * 1000;
            const createResult = await asUser.mutation(api.mutations.classInstances.createClassInstance, {
                templateId,
                startTime,
            });

            // Book with questionnaire answers
            const bookingResult = await asUser.mutation(api.mutations.bookings.bookClass, {
                classInstanceId: createResult.createdInstanceId,
                questionnaireAnswers: [{ questionId: "q_premium", booleanAnswer: true }],
            });

            const booking = await asUser.query(api.queries.bookings.getBookingDetails, {
                bookingId: bookingResult.bookingId,
            });

            // Original: €20 = 2000 cents
            // Discount: -€5 = -500 cents
            // Questionnaire fee: +€3 = +300 cents
            // Final: €18 = 1800 cents
            expect(booking.originalPrice).toBe(2000);
            expect(booking.questionnaireAnswers?.totalFees).toBe(300);
            expect(booking.finalPrice).toBe(1800); // 2000 - 500 + 300
            expect(booking.appliedDiscount?.creditsSaved).toBe(5); // €5 saved
        });
    });
});

