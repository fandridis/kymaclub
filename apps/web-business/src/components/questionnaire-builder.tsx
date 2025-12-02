import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, GripVertical, Euro, HelpCircle, List, Hash, Type, ToggleLeft, CheckSquare } from "lucide-react"
import { useTypedTranslation } from "@/lib/typed"
import type { Question, QuestionOption, QuestionType } from "@repo/api/types/questionnaire"
import { generateQuestionId, generateOptionId } from "@repo/api/operations/questionnaire"

interface QuestionnaireBuilderProps {
    questions?: Question[]
    onChange: (questions: Question[]) => void
    currency?: string
}

const QUESTION_TYPE_ICONS: Record<QuestionType, React.ReactNode> = {
    boolean: <ToggleLeft className="h-4 w-4" />,
    single_select: <List className="h-4 w-4" />,
    multi_select: <CheckSquare className="h-4 w-4" />,
    number: <Hash className="h-4 w-4" />,
    text: <Type className="h-4 w-4" />,
}

export function QuestionnaireBuilder({
    questions = [],
    onChange,
    currency = "EUR",
}: QuestionnaireBuilderProps) {
    const { t } = useTypedTranslation();
    const [localQuestions, setLocalQuestions] = useState<Question[]>(questions)

    const getQuestionTypeName = (type: QuestionType) => {
        switch (type) {
            case "boolean":
                return t('questionnaire.types.boolean')
            case "single_select":
                return t('questionnaire.types.singleSelect')
            case "multi_select":
                return t('questionnaire.types.multiSelect')
            case "number":
                return t('questionnaire.types.number')
            case "text":
                return t('questionnaire.types.text')
            default:
                return type
        }
    }

    const getQuestionTypeLabel = (type: QuestionType) => {
        switch (type) {
            case "boolean":
                return "Yes/No"
            case "single_select":
                return "Single Choice"
            case "multi_select":
                return "Multiple Choice"
            case "number":
                return "Number"
            case "text":
                return "Text"
            default:
                return type
        }
    }

    const addQuestion = () => {
        const newQuestion: Question = {
            id: generateQuestionId(),
            question: "",
            type: "boolean",
            required: false,
        }
        const updated = [...localQuestions, newQuestion]
        setLocalQuestions(updated)
        onChange(updated)
    }

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        const updated = localQuestions.map((q) =>
            q.id === id ? { ...q, ...updates } : q
        )
        setLocalQuestions(updated)
        onChange(updated)
    }

    const removeQuestion = (id: string) => {
        const updated = localQuestions.filter((q) => q.id !== id)
        setLocalQuestions(updated)
        onChange(updated)
    }

    const addOption = (questionId: string) => {
        const question = localQuestions.find(q => q.id === questionId)
        if (!question) return
        const newOption: QuestionOption = {
            id: generateOptionId(),
            label: "",
            fee: undefined,
        }
        const options = [...(question.options || []), newOption]
        updateQuestion(questionId, { options })
    }

    const updateOption = (questionId: string, optionId: string, updates: Partial<QuestionOption>) => {
        const question = localQuestions.find(q => q.id === questionId)
        if (!question) return
        const options = (question.options || []).map((opt) =>
            opt.id === optionId ? { ...opt, ...updates } : opt
        )
        updateQuestion(questionId, { options })
    }

    const removeOption = (questionId: string, optionId: string) => {
        const question = localQuestions.find(q => q.id === questionId)
        if (!question) return
        const options = (question.options || []).filter((o) => o.id !== optionId)
        updateQuestion(questionId, { options })
    }

    const handleTypeChange = (id: string, newType: QuestionType) => {
        const question = localQuestions.find(q => q.id === id)
        if (!question) return

        const updates: Partial<Question> = { type: newType }

        // Reset type-specific configs when changing type
        if (newType === "boolean") {
            updates.options = undefined
            updates.numberConfig = undefined
            updates.textConfig = undefined
            if (!question.booleanConfig) {
                updates.booleanConfig = { feeOnTrue: undefined }
            }
        } else if (newType === "single_select" || newType === "multi_select") {
            updates.booleanConfig = undefined
            updates.numberConfig = undefined
            updates.textConfig = undefined
            if (!question.options || question.options.length === 0) {
                updates.options = [{ id: generateOptionId(), label: "", fee: undefined }]
            }
        } else if (newType === "number") {
            updates.options = undefined
            updates.booleanConfig = undefined
            updates.textConfig = undefined
            if (!question.numberConfig) {
                updates.numberConfig = { min: undefined, max: undefined, integer: false, fee: undefined }
            }
        } else if (newType === "text") {
            updates.options = undefined
            updates.booleanConfig = undefined
            updates.numberConfig = undefined
            if (!question.textConfig) {
                updates.textConfig = { maxLength: undefined, fee: undefined }
            }
        }

        updateQuestion(id, updates)
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">{t('questionnaire.title')}</Label>
                </div>
                <Button onClick={addQuestion} variant="outline" size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    {t('questionnaire.addQuestion')}
                </Button>
            </div>

            {localQuestions.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                    <p className="text-sm">{t('questionnaire.noQuestionsConfigured')}</p>
                    <p className="text-xs mt-1">{t('questionnaire.noQuestionsDescription')}</p>
                </div>
            ) : (
                <Accordion
                    type="single"
                    collapsible
                    className="w-full space-y-2"
                    defaultValue={localQuestions.length > 0 ? localQuestions[0]?.id : undefined}
                >
                    {localQuestions.map((question, index) => (
                        <AccordionItem
                            key={question.id}
                            value={question.id}
                            className="border border-border rounded-lg overflow-hidden"
                        >
                            <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 [&[data-state=open]]:bg-muted/50 hover:no-underline">
                                <div className="flex items-center gap-3 text-left w-full">
                                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">
                                            Q{index + 1}: {question.question || t('questionnaire.untitled')}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                            {QUESTION_TYPE_ICONS[question.type]}
                                            <span>{getQuestionTypeLabel(question.type)}</span>
                                            {question.required && (
                                                <span className="text-amber-600 font-medium">• {t('questionnaire.required')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-0">
                                <div className="space-y-4 px-4 pt-2 pb-4">
                                    {/* Question Text and Required Toggle */}
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                                {t('questionnaire.questionText')}
                                            </Label>
                                            <Input
                                                value={question.question}
                                                onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                                                placeholder={t('questionnaire.questionPlaceholder')}
                                                className="text-sm"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 pb-0.5">
                                            <Switch
                                                checked={question.required}
                                                onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
                                            />
                                            <Label className="text-xs font-medium whitespace-nowrap">
                                                {t('questionnaire.required')}
                                            </Label>
                                        </div>
                                    </div>

                                    {/* Answer Type */}
                                    <div>
                                        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                            {t('questionnaire.answerType')}
                                        </Label>
                                        <Select
                                            value={question.type}
                                            onValueChange={(value: QuestionType) => handleTypeChange(question.id, value)}
                                        >
                                            <SelectTrigger className="text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(["boolean", "single_select", "multi_select", "number", "text"] as QuestionType[]).map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        <div className="flex items-center gap-2">
                                                            {QUESTION_TYPE_ICONS[type]}
                                                            {getQuestionTypeName(type)}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Boolean Config */}
                                    {question.type === "boolean" && (
                                        <div>
                                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                                                {t('questionnaire.feeIfYes')}
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <div className="relative w-28">
                                                    <Euro className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        placeholder="0"
                                                        value={question.booleanConfig?.feeOnTrue ? Math.floor(question.booleanConfig.feeOnTrue / 100) : ""}
                                                        onChange={(e) => {
                                                            const value = e.target.value ? Number.parseInt(e.target.value) * 100 : undefined
                                                            updateQuestion(question.id, {
                                                                booleanConfig: { ...question.booleanConfig, feeOnTrue: value }
                                                            })
                                                        }}
                                                        className="pl-8 text-sm"
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground">{t('questionnaire.additionalFee')}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Options Table (for single/multi select) */}
                                    {(question.type === "single_select" || question.type === "multi_select") && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <Label className="text-xs font-medium text-muted-foreground">
                                                    {t('questionnaire.options')}
                                                </Label>
                                                <Button
                                                    onClick={() => addOption(question.id)}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 px-2 text-xs gap-1"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                    {t('questionnaire.addOption')}
                                                </Button>
                                            </div>
                                            <div className="border border-border rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                                            <TableHead className="h-9 text-xs font-medium py-2 px-3">
                                                                {t('questionnaire.optionLabel')}
                                                            </TableHead>
                                                            <TableHead className="h-9 text-xs font-medium py-2 px-3 w-24">
                                                                {t('questionnaire.fee')}
                                                            </TableHead>
                                                            <TableHead className="h-9 w-10 py-2 px-3"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {(question.options || []).length > 0 ? (
                                                            (question.options || []).map((option) => (
                                                                <TableRow key={option.id} className="hover:bg-muted/30">
                                                                    <TableCell className="py-2 px-3">
                                                                        <Input
                                                                            value={option.label}
                                                                            onChange={(e) => updateOption(question.id, option.id, { label: e.target.value })}
                                                                            placeholder={t('questionnaire.optionPlaceholder')}
                                                                            className="text-sm h-8"
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell className="py-2 px-3">
                                                                        <div className="relative">
                                                                            <Euro className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                step="1"
                                                                                value={option.fee ? Math.floor(option.fee / 100) : ""}
                                                                                onChange={(e) => {
                                                                                    const value = e.target.value ? Number.parseInt(e.target.value) * 100 : undefined
                                                                                    updateOption(question.id, option.id, { fee: value })
                                                                                }}
                                                                                placeholder="0"
                                                                                className="text-sm h-8 pl-6 w-20"
                                                                            />
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="py-2 px-3">
                                                                        <Button
                                                                            onClick={() => removeOption(question.id, option.id)}
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-7 w-7 p-0"
                                                                            disabled={(question.options?.length || 0) <= 1}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        ) : (
                                                            <TableRow>
                                                                <TableCell colSpan={3} className="py-4 px-3 text-center text-xs text-muted-foreground">
                                                                    {t('questionnaire.noOptions')}
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Number Settings */}
                                    {question.type === "number" && (
                                        <div>
                                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                                                {t('questionnaire.numberConfig')}
                                            </Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <Label className="text-xs text-muted-foreground mb-1 block">{t('questionnaire.min')}</Label>
                                                    <Input
                                                        type="number"
                                                        value={question.numberConfig?.min ?? ""}
                                                        onChange={(e) => {
                                                            const value = e.target.value ? Number.parseFloat(e.target.value) : undefined
                                                            updateQuestion(question.id, {
                                                                numberConfig: { ...question.numberConfig, min: value }
                                                            })
                                                        }}
                                                        placeholder="0"
                                                        className="text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground mb-1 block">{t('questionnaire.max')}</Label>
                                                    <Input
                                                        type="number"
                                                        value={question.numberConfig?.max ?? ""}
                                                        onChange={(e) => {
                                                            const value = e.target.value ? Number.parseFloat(e.target.value) : undefined
                                                            updateQuestion(question.id, {
                                                                numberConfig: { ...question.numberConfig, max: value }
                                                            })
                                                        }}
                                                        placeholder="100"
                                                        className="text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground mb-1 block">{t('questionnaire.fee')}</Label>
                                                    <div className="relative">
                                                        <Euro className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={question.numberConfig?.fee ? Math.floor(question.numberConfig.fee / 100) : ""}
                                                            onChange={(e) => {
                                                                const value = e.target.value ? Number.parseInt(e.target.value) * 100 : undefined
                                                                updateQuestion(question.id, {
                                                                    numberConfig: { ...question.numberConfig, fee: value }
                                                                })
                                                            }}
                                                            placeholder="0"
                                                            className="text-sm pl-8"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-3">
                                                <Switch
                                                    checked={question.numberConfig?.integer ?? false}
                                                    onCheckedChange={(checked) => updateQuestion(question.id, {
                                                        numberConfig: { ...question.numberConfig, integer: checked }
                                                    })}
                                                />
                                                <Label className="text-xs font-medium">{t('questionnaire.integerOnly')}</Label>
                                            </div>
                                        </div>
                                    )}

                                    {/* Text Settings */}
                                    {question.type === "text" && (
                                        <div>
                                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                                                {t('questionnaire.textConfig')}
                                            </Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs text-muted-foreground mb-1 block">{t('questionnaire.maxLength')}</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={question.textConfig?.maxLength ?? ""}
                                                        onChange={(e) => {
                                                            const value = e.target.value ? Number.parseInt(e.target.value) : undefined
                                                            updateQuestion(question.id, {
                                                                textConfig: { ...question.textConfig, maxLength: value }
                                                            })
                                                        }}
                                                        placeholder="500"
                                                        className="text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-muted-foreground mb-1 block">{t('questionnaire.fee')}</Label>
                                                    <div className="relative">
                                                        <Euro className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={question.textConfig?.fee ? Math.floor(question.textConfig.fee / 100) : ""}
                                                            onChange={(e) => {
                                                                const value = e.target.value ? Number.parseInt(e.target.value) * 100 : undefined
                                                                updateQuestion(question.id, {
                                                                    textConfig: { ...question.textConfig, fee: value }
                                                                })
                                                            }}
                                                            placeholder="0"
                                                            className="text-sm pl-8"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Delete Button */}
                                    <div className="flex justify-end pt-2 border-t border-border/50">
                                        <Button
                                            onClick={() => removeQuestion(question.id)}
                                            size="sm"
                                            variant="destructive"
                                            className="gap-1.5"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            {t('questionnaire.deleteQuestion')}
                                        </Button>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    )
}
