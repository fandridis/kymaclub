import type {
    Question,
    QuestionAnswer,
    Questionnaire,
    QuestionnaireAnswers,
} from "../types/questionnaire";

/***************************************************************
 * Fee Calculation Operations
 ***************************************************************/

/**
 * Calculate the fee for a single question answer
 * Returns the fee in cents (0 if no fee applies)
 */
export function calculateQuestionFee(
    question: Question,
    answer: QuestionAnswer
): number {
    switch (question.type) {
        case "boolean": {
            // Fee applies only if answered true and feeOnTrue is set
            if (answer.booleanAnswer === true && question.booleanConfig?.feeOnTrue) {
                return question.booleanConfig.feeOnTrue;
            }
            return 0;
        }

        case "single_select": {
            // Find the selected option and return its fee
            if (answer.singleSelectAnswer && question.options) {
                const selectedOption = question.options.find(
                    (opt) => opt.id === answer.singleSelectAnswer
                );
                return selectedOption?.fee ?? 0;
            }
            return 0;
        }

        case "multi_select": {
            // Sum fees of all selected options
            if (answer.multiSelectAnswer && question.options) {
                return answer.multiSelectAnswer.reduce((total, selectedId) => {
                    const option = question.options?.find((opt) => opt.id === selectedId);
                    return total + (option?.fee ?? 0);
                }, 0);
            }
            return 0;
        }

        case "number": {
            // Fee applies if any number is provided and fee is configured
            if (answer.numberAnswer !== undefined && question.numberConfig?.fee) {
                return question.numberConfig.fee;
            }
            return 0;
        }

        case "text": {
            // Fee applies if any text is provided and fee is configured
            if (answer.textAnswer && answer.textAnswer.length > 0 && question.textConfig?.fee) {
                return question.textConfig.fee;
            }
            return 0;
        }

        default:
            return 0;
    }
}

/**
 * Calculate total fees for all questionnaire answers
 * Returns the total fee in cents
 */
export function calculateTotalQuestionnaireFees(
    questionnaire: Questionnaire,
    answers: QuestionAnswer[]
): number {
    return answers.reduce((total, answer) => {
        const question = questionnaire.find((q) => q.id === answer.questionId);
        if (!question) return total;
        return total + calculateQuestionFee(question, answer);
    }, 0);
}

/**
 * Build QuestionnaireAnswers object with calculated fees
 * This is used when storing answers with a booking
 */
export function buildQuestionnaireAnswersWithFees(
    questionnaire: Questionnaire,
    rawAnswers: Omit<QuestionAnswer, "feeApplied">[]
): QuestionnaireAnswers {
    const answersWithFees: QuestionAnswer[] = rawAnswers.map((rawAnswer) => {
        const question = questionnaire.find((q) => q.id === rawAnswer.questionId);
        const feeApplied = question
            ? calculateQuestionFee(question, { ...rawAnswer, feeApplied: 0 })
            : 0;

        return {
            ...rawAnswer,
            feeApplied,
        };
    });

    const totalFees = answersWithFees.reduce(
        (sum, answer) => sum + answer.feeApplied,
        0
    );

    return {
        questionnaire, // Snapshot of questions at booking time
        answers: answersWithFees,
        totalFees,
    };
}

/***************************************************************
 * Type Validation Operations
 ***************************************************************/

/**
 * Check if an answer has the correct value type for its question type
 * Returns true if the answer matches the expected type
 */
export function validateAnswerMatchesType(
    question: Question,
    answer: QuestionAnswer
): boolean {
    switch (question.type) {
        case "boolean":
            return answer.booleanAnswer !== undefined;

        case "single_select":
            return answer.singleSelectAnswer !== undefined;

        case "multi_select":
            return answer.multiSelectAnswer !== undefined;

        case "number":
            return answer.numberAnswer !== undefined;

        case "text":
            return answer.textAnswer !== undefined;

        default:
            return false;
    }
}

/**
 * Check if an answer has any value (for required field validation)
 */
export function hasAnswerValue(answer: QuestionAnswer): boolean {
    if (answer.booleanAnswer !== undefined) return true;
    if (answer.singleSelectAnswer !== undefined) return true;
    if (answer.multiSelectAnswer !== undefined && answer.multiSelectAnswer.length > 0) return true;
    if (answer.numberAnswer !== undefined) return true;
    if (answer.textAnswer !== undefined && answer.textAnswer.length > 0) return true;
    return false;
}

/***************************************************************
 * Questionnaire Resolution
 ***************************************************************/

/**
 * Get the effective questionnaire for a class instance
 * Instance questionnaire overrides template questionnaire if set
 */
export function getEffectiveQuestionnaire(
    templateQuestionnaire: Questionnaire | undefined,
    instanceQuestionnaire: Questionnaire | undefined
): Questionnaire | undefined {
    // Instance questionnaire takes precedence if defined
    if (instanceQuestionnaire && instanceQuestionnaire.length > 0) {
        return instanceQuestionnaire;
    }
    return templateQuestionnaire;
}

/**
 * Generate a unique question ID
 */
export function generateQuestionId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique option ID
 */
export function generateOptionId(): string {
    return `opt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

