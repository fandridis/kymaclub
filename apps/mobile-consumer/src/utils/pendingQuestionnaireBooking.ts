import type { QuestionAnswer } from "@repo/api/types/questionnaire";

type PendingQuestionnaireBooking = {
    classInstanceId: string;
    answers: QuestionAnswer[];
    totalPriceInCents: number;
};

// In-memory handoff between Questionnaire modal -> ClassDetails modal.
// We avoid passing functions through navigation params and keep it local to the JS runtime.
const pendingByClassInstanceId = new Map<string, PendingQuestionnaireBooking>();

export function setPendingQuestionnaireBooking(input: PendingQuestionnaireBooking) {
    pendingByClassInstanceId.set(input.classInstanceId, input);
}

export function consumePendingQuestionnaireBooking(classInstanceId: string) {
    const pending = pendingByClassInstanceId.get(classInstanceId);
    if (!pending) return null;
    pendingByClassInstanceId.delete(classInstanceId);
    return pending;
}


