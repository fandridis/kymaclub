import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";
import type {
    Question,
    QuestionAnswer,
    Questionnaire,
} from "../types/questionnaire";
import { validateAnswerMatchesType, hasAnswerValue } from "../operations/questionnaire";

/***************************************************************
 * Questionnaire Answer Validation Rules
 ***************************************************************/

/**
 * Validate that all required questions have answers
 * Throws ConvexError if a required question is not answered
 */
export function validateRequiredQuestions(
    questionnaire: Questionnaire,
    answers: QuestionAnswer[]
): void {
    const answerMap = new Map(answers.map((a) => [a.questionId, a]));

    for (const question of questionnaire) {
        if (!question.required) continue;

        const answer = answerMap.get(question.id);
        if (!answer || !hasAnswerValue(answer)) {
            throw new ConvexError({
                message: `Required question not answered: "${question.question}"`,
                field: "questionnaireAnswers",
                code: ERROR_CODES.VALIDATION_ERROR,
                questionId: question.id,
            });
        }
    }
}

/**
 * Validate that answers match their expected question types
 * Throws ConvexError if an answer has the wrong type
 */
export function validateAnswerTypes(
    questionnaire: Questionnaire,
    answers: QuestionAnswer[]
): void {
    const questionMap = new Map(questionnaire.map((q) => [q.id, q]));

    for (const answer of answers) {
        const question = questionMap.get(answer.questionId);
        if (!question) {
            throw new ConvexError({
                message: `Answer references unknown question: ${answer.questionId}`,
                field: "questionnaireAnswers",
                code: ERROR_CODES.VALIDATION_ERROR,
                questionId: answer.questionId,
            });
        }

        // Only validate if the answer has a value
        if (!hasAnswerValue(answer)) continue;

        if (!validateAnswerMatchesType(question, answer)) {
            throw new ConvexError({
                message: `Answer type mismatch for question: "${question.question}"`,
                field: "questionnaireAnswers",
                code: ERROR_CODES.VALIDATION_ERROR,
                questionId: question.id,
                expectedType: question.type,
            });
        }
    }
}

/**
 * Validate answer constraints (number min/max, text length, option validity)
 * Throws ConvexError if constraints are violated
 */
export function validateAnswerConstraints(
    question: Question,
    answer: QuestionAnswer
): void {
    switch (question.type) {
        case "number": {
            if (answer.numberAnswer === undefined) return;
            const value = answer.numberAnswer;
            const config = question.numberConfig;

            if (config?.min !== undefined && value < config.min) {
                throw new ConvexError({
                    message: `Number must be at least ${config.min}`,
                    field: "questionnaireAnswers",
                    code: ERROR_CODES.VALIDATION_ERROR,
                    questionId: question.id,
                });
            }

            if (config?.max !== undefined && value > config.max) {
                throw new ConvexError({
                    message: `Number must be at most ${config.max}`,
                    field: "questionnaireAnswers",
                    code: ERROR_CODES.VALIDATION_ERROR,
                    questionId: question.id,
                });
            }

            if (config?.integer && !Number.isInteger(value)) {
                throw new ConvexError({
                    message: "Number must be an integer",
                    field: "questionnaireAnswers",
                    code: ERROR_CODES.VALIDATION_ERROR,
                    questionId: question.id,
                });
            }
            break;
        }

        case "text": {
            if (!answer.textAnswer) return;
            const maxLength = question.textConfig?.maxLength;

            if (maxLength !== undefined && answer.textAnswer.length > maxLength) {
                throw new ConvexError({
                    message: `Text must be at most ${maxLength} characters`,
                    field: "questionnaireAnswers",
                    code: ERROR_CODES.VALIDATION_ERROR,
                    questionId: question.id,
                });
            }
            break;
        }

        case "single_select": {
            if (!answer.singleSelectAnswer) return;
            const validOptions = question.options?.map((o) => o.id) ?? [];

            if (!validOptions.includes(answer.singleSelectAnswer)) {
                throw new ConvexError({
                    message: "Invalid option selected",
                    field: "questionnaireAnswers",
                    code: ERROR_CODES.VALIDATION_ERROR,
                    questionId: question.id,
                });
            }
            break;
        }

        case "multi_select": {
            if (!answer.multiSelectAnswer || answer.multiSelectAnswer.length === 0) return;
            const validOptions = question.options?.map((o) => o.id) ?? [];

            for (const selectedId of answer.multiSelectAnswer) {
                if (!validOptions.includes(selectedId)) {
                    throw new ConvexError({
                        message: "Invalid option selected",
                        field: "questionnaireAnswers",
                        code: ERROR_CODES.VALIDATION_ERROR,
                        questionId: question.id,
                    });
                }
            }
            break;
        }
    }
}

/**
 * Full validation of questionnaire answers
 * Validates required questions, answer types, and constraints
 * Throws ConvexError if any validation fails
 */
export function validateQuestionnaireAnswers(
    questionnaire: Questionnaire,
    answers: QuestionAnswer[]
): void {
    // First validate required questions
    validateRequiredQuestions(questionnaire, answers);

    // Then validate answer types
    validateAnswerTypes(questionnaire, answers);

    // Finally validate constraints for each answer
    const questionMap = new Map(questionnaire.map((q) => [q.id, q]));
    for (const answer of answers) {
        const question = questionMap.get(answer.questionId);
        if (question) {
            validateAnswerConstraints(question, answer);
        }
    }
}

/***************************************************************
 * Questionnaire Definition Validation Rules
 ***************************************************************/

/**
 * Validate a questionnaire definition (for template/instance creation)
 * Ensures questions have valid structure
 */
export function validateQuestionnaireDefinition(
    questionnaire: Questionnaire
): void {
    const questionIds = new Set<string>();

    for (const question of questionnaire) {
        // Check for duplicate question IDs
        if (questionIds.has(question.id)) {
            throw new ConvexError({
                message: `Duplicate question ID: ${question.id}`,
                field: "questionnaire",
                code: ERROR_CODES.VALIDATION_ERROR,
            });
        }
        questionIds.add(question.id);

        // Validate select questions have options
        if (
            (question.type === "single_select" || question.type === "multi_select") &&
            (!question.options || question.options.length === 0)
        ) {
            throw new ConvexError({
                message: `Select question "${question.question}" must have at least one option`,
                field: "questionnaire",
                code: ERROR_CODES.VALIDATION_ERROR,
                questionId: question.id,
            });
        }

        // Validate option IDs are unique within a question
        if (question.options) {
            const optionIds = new Set<string>();
            for (const option of question.options) {
                if (optionIds.has(option.id)) {
                    throw new ConvexError({
                        message: `Duplicate option ID in question "${question.question}"`,
                        field: "questionnaire",
                        code: ERROR_CODES.VALIDATION_ERROR,
                        questionId: question.id,
                    });
                }
                optionIds.add(option.id);
            }
        }

        // Validate number constraints are logical
        if (question.numberConfig) {
            const { min, max } = question.numberConfig;
            if (min !== undefined && max !== undefined && min > max) {
                throw new ConvexError({
                    message: `Number min (${min}) cannot be greater than max (${max})`,
                    field: "questionnaire",
                    code: ERROR_CODES.VALIDATION_ERROR,
                    questionId: question.id,
                });
            }
        }

        // Validate fees are non-negative
        if (question.booleanConfig?.feeOnTrue !== undefined && question.booleanConfig.feeOnTrue < 0) {
            throw new ConvexError({
                message: "Fee cannot be negative",
                field: "questionnaire",
                code: ERROR_CODES.VALIDATION_ERROR,
                questionId: question.id,
            });
        }

        if (question.numberConfig?.fee !== undefined && question.numberConfig.fee < 0) {
            throw new ConvexError({
                message: "Fee cannot be negative",
                field: "questionnaire",
                code: ERROR_CODES.VALIDATION_ERROR,
                questionId: question.id,
            });
        }

        if (question.textConfig?.fee !== undefined && question.textConfig.fee < 0) {
            throw new ConvexError({
                message: "Fee cannot be negative",
                field: "questionnaire",
                code: ERROR_CODES.VALIDATION_ERROR,
                questionId: question.id,
            });
        }

        if (question.options) {
            for (const option of question.options) {
                if (option.fee !== undefined && option.fee < 0) {
                    throw new ConvexError({
                        message: "Option fee cannot be negative",
                        field: "questionnaire",
                        code: ERROR_CODES.VALIDATION_ERROR,
                        questionId: question.id,
                        optionId: option.id,
                    });
                }
            }
        }
    }
}

export const questionnaireRules = {
    validateRequiredQuestions,
    validateAnswerTypes,
    validateAnswerConstraints,
    validateQuestionnaireAnswers,
    validateQuestionnaireDefinition,
};

