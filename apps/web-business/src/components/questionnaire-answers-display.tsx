import { useState } from "react";
import { ChevronDown, ChevronUp, ClipboardList, Check, X, Hash, Type, ListChecks, Euro } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatEuros } from "@repo/utils/credits";
import type { QuestionnaireAnswers, Question, QuestionAnswer } from "@repo/api/types/questionnaire";
import { useTypedTranslation } from "@/lib/typed";

interface QuestionnaireAnswersDisplayProps {
  questionnaireAnswers: QuestionnaireAnswers;
  className?: string;
  defaultOpen?: boolean;
}

function getQuestionIcon(type: Question['type']) {
  switch (type) {
    case 'boolean':
      return Check;
    case 'single_select':
      return ListChecks;
    case 'multi_select':
      return ListChecks;
    case 'number':
      return Hash;
    case 'text':
      return Type;
    default:
      return ClipboardList;
  }
}

function formatAnswer(question: Question, answer: QuestionAnswer): string {
  switch (question.type) {
    case 'boolean':
      return answer.booleanAnswer ? 'Yes' : 'No';

    case 'single_select':
      if (!answer.singleSelectAnswer || !question.options) return '—';
      const selectedOption = question.options.find(opt => opt.id === answer.singleSelectAnswer);
      return selectedOption?.label || answer.singleSelectAnswer;

    case 'multi_select':
      if (!answer.multiSelectAnswer || !question.options || answer.multiSelectAnswer.length === 0) return '—';
      return answer.multiSelectAnswer
        .map(optId => {
          const opt = question.options?.find(o => o.id === optId);
          return opt?.label || optId;
        })
        .join(', ');

    case 'number':
      return answer.numberAnswer !== undefined ? String(answer.numberAnswer) : '—';

    case 'text':
      return answer.textAnswer || '—';

    default:
      return '—';
  }
}

export function QuestionnaireAnswersDisplay({
  questionnaireAnswers,
  className,
  defaultOpen = false,
}: QuestionnaireAnswersDisplayProps) {
  const { t } = useTypedTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const { questionnaire, answers, totalFees } = questionnaireAnswers;

  if (!questionnaire || questionnaire.length === 0 || !answers || answers.length === 0) {
    return null;
  }

  // Map answers by questionId for easy lookup
  const answerMap = new Map(answers.map(a => [a.questionId, a]));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("w-full", className)}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between px-3 py-2 h-auto hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {t('routes.bookings.questionnaire.title')}
            </span>
            <Badge variant="secondary" className="text-xs">
              {answers.length} {answers.length === 1
                ? t('routes.bookings.questionnaire.answer')
                : t('routes.bookings.questionnaire.answers')}
            </Badge>
            {totalFees > 0 && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">
                <Euro className="h-3 w-3 mr-1" />
                +{formatEuros(totalFees / 100)}
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-3 pb-3">
        <div className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
          {questionnaire.map((question) => {
            const answer = answerMap.get(question.id);
            if (!answer) return null;

            const QuestionIcon = getQuestionIcon(question.type);
            const formattedAnswer = formatAnswer(question, answer);
            const hasFee = answer.feeApplied > 0;

            return (
              <div
                key={question.id}
                className="flex flex-col gap-1.5 text-sm"
              >
                <div className="flex items-start gap-2">
                  <QuestionIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {question.question}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {question.type === 'multi_select' && answer.multiSelectAnswer && answer.multiSelectAnswer.length > 0 ? (
                        // Display multi-select as individual badges
                        <div className="flex flex-wrap gap-1.5">
                          {answer.multiSelectAnswer.map((optId) => {
                            const opt = question.options?.find(o => o.id === optId);
                            const label = opt?.label || optId;
                            const optFee = opt?.fee;
                            return (
                              <Badge
                                key={optId}
                                variant="secondary"
                                className="text-xs font-normal"
                              >
                                {label}
                                {optFee !== undefined && optFee > 0 && (
                                  <span className="ml-1 text-amber-600">
                                    +{formatEuros(optFee / 100)}
                                  </span>
                                )}
                              </Badge>
                            );
                          })}
                        </div>
                      ) : question.type === 'boolean' ? (
                        // Boolean answer with icon
                        <div className="flex items-center gap-1.5">
                          {answer.booleanAnswer ? (
                            <Badge variant="default" className="text-xs bg-emerald-500 hover:bg-emerald-600">
                              <Check className="h-3 w-3 mr-1" />
                              {t('common.yes')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <X className="h-3 w-3 mr-1" />
                              {t('common.no')}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        // Other answer types as text
                        <p className="font-medium text-foreground">
                          {formattedAnswer}
                        </p>
                      )}

                      {/* Show fee if applicable (for non-multi-select) */}
                      {hasFee && question.type !== 'multi_select' && (
                        <Badge
                          variant="outline"
                          className="text-xs text-amber-600 border-amber-200 bg-amber-50"
                        >
                          +{formatEuros(answer.feeApplied / 100)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Total fees summary */}
          {totalFees > 0 && (
            <div className="pt-2 mt-2 border-t border-dashed flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t('routes.bookings.questionnaire.totalAdditionalFees')}
              </span>
              <Badge variant="outline" className="text-xs font-medium text-amber-600 border-amber-300 bg-amber-50">
                <Euro className="h-3 w-3 mr-1" />
                {formatEuros(totalFees / 100)}
              </Badge>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}


