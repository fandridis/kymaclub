import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Clock, Euro, Zap, GripVertical, Percent } from "lucide-react"
import { useTypedTranslation } from "@/lib/typed"

interface DiscountRule {
    id: string
    name: string
    condition: {
        type: "hours_before_min" | "hours_before_max" | "always"
        hours?: number
    }
    discount: {
        type: "fixed_amount"
        value: number
    }
    // These will be set on the server side
    createdAt?: number
    createdBy?: string
    updatedAt?: number
    updatedBy?: string
}

interface ClassDiscountRulesFormProps {
    discountRules?: DiscountRule[]
    onChange: (rules: DiscountRule[]) => void
    currency?: string
    price?: number // Price in cents to validate against
}

const CONDITION_ICONS = {
    always: <Zap className="h-4 w-4" />,
    hours_before_min: <Clock className="h-4 w-4" />,
    hours_before_max: <Clock className="h-4 w-4" />,
}

export function ClassDiscountRulesForm({
    discountRules = [],
    onChange,
    currency = "EUR",
    price,
}: ClassDiscountRulesFormProps) {
    const { t } = useTypedTranslation();
    const [rules, setRules] = useState<DiscountRule[]>(discountRules)

    const getDiscountTypeName = (type: string) => {
        switch (type) {
            case "always":
                return t('routes.templates.alwaysOn')
            case "hours_before_min":
                return t('routes.templates.earlyBooking')
            case "hours_before_max":
                return t('routes.templates.lastMinute')
            default:
                return t('routes.templates.discount')
        }
    }

    const getConditionSummary = (rule: DiscountRule) => {
        if (rule.condition.type === "always") {
            return t('routes.templates.discountRulesForm.appliesAlways')
        }
        if (rule.condition.type === "hours_before_min" && rule.condition.hours) {
            return t('routes.templates.discountRulesForm.earlyBookingSummary', { hours: rule.condition.hours })
        }
        if (rule.condition.type === "hours_before_max" && rule.condition.hours) {
            return t('routes.templates.discountRulesForm.lastMinuteSummary', { hours: rule.condition.hours })
        }
        return ""
    }

    const addRule = () => {
        const newRule: DiscountRule = {
            id: `rule_${Date.now()}`,
            name: t('routes.templates.alwaysOn'),
            condition: {
                type: "always",
            },
            discount: {
                type: "fixed_amount",
                value: 0,
            },
        }
        const updatedRules = [...rules, newRule]
        setRules(updatedRules)
        onChange(updatedRules)
    }

    const updateRule = (id: string, updates: Partial<DiscountRule>) => {
        const updatedRules = rules.map((rule) =>
            rule.id === id ? { ...rule, ...updates } : rule
        )
        setRules(updatedRules)
        onChange(updatedRules)
    }

    const removeRule = (id: string) => {
        const updatedRules = rules.filter((r) => r.id !== id)
        setRules(updatedRules)
        onChange(updatedRules)
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">{t('routes.templates.discountRulesForm.title')}</Label>
                </div>
                <Button onClick={addRule} variant="outline" size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    {t('routes.templates.discountRulesForm.addRule')}
                </Button>
            </div>

            {rules.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                    <p className="text-sm">{t('routes.templates.discountRulesForm.noRulesConfigured')}</p>
                    <p className="text-xs mt-1">{t('routes.templates.discountRulesForm.noRulesDescription')}</p>
                </div>
            ) : (
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {rules.map((rule, index) => (
                        <AccordionItem
                            key={rule.id}
                            value={rule.id}
                            className="border border-border rounded-lg overflow-hidden"
                        >
                            <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 [&[data-state=open]]:bg-muted/50 hover:no-underline">
                                <div className="flex items-center gap-3 text-left w-full">
                                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">
                                                {getDiscountTypeName(rule.condition.type)}
                                            </span>
                                            {rule.discount.value > 0 && (
                                                <Badge variant="secondary" className="text-xs font-medium text-emerald-700 bg-emerald-50 border-emerald-200">
                                                    <Euro className="h-3 w-3 mr-0.5" />
                                                    {Math.floor(rule.discount.value / 100)} {t('routes.templates.discountRulesForm.off')}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                            {CONDITION_ICONS[rule.condition.type]}
                                            <span>{getConditionSummary(rule)}</span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-0">
                                <div className="space-y-4 px-4 pt-2 pb-4">
                                    {/* Discount Type and Amount - Same Row */}
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1 min-w-0">
                                            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                                {t('routes.templates.discountRulesForm.type')}
                                            </Label>
                                            <Select
                                                value={rule.condition.type}
                                                onValueChange={(value: "always" | "hours_before_min" | "hours_before_max") => {
                                                    const newCondition = { type: value, hours: rule.condition.hours || 24 }
                                                    const newName = getDiscountTypeName(value)
                                                    updateRule(rule.id, { condition: newCondition, name: newName })
                                                }}
                                            >
                                                <SelectTrigger className="text-sm w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="always">
                                                        <div className="flex items-center gap-2">
                                                            <Zap className="h-4 w-4" />
                                                            {t('routes.templates.alwaysOn')}
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="hours_before_min">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4" />
                                                            {t('routes.templates.earlyBooking')}
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="hours_before_max">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4" />
                                                            {t('routes.templates.lastMinute')}
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="shrink-0">
                                            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                                {t('routes.templates.discountRulesForm.amount', { currency })}
                                            </Label>
                                            <div className="relative w-24">
                                                <Euro className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max={price ? Math.min(100, Math.floor(price / 100)) : 100}
                                                    step="1"
                                                    placeholder="5"
                                                    value={Math.floor(rule.discount.value / 100) || ""}
                                                    onChange={(e) => {
                                                        const inputValue = Number.parseInt(e.target.value) || 0
                                                        const maxValue = price ? Math.min(100, Math.floor(price / 100)) : 100
                                                        const value = Math.min(inputValue, maxValue) * 100
                                                        updateRule(rule.id, {
                                                            discount: { ...rule.discount, value },
                                                        })
                                                    }}
                                                    className="pl-8 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hours Condition */}
                                    {rule.condition.type !== "always" && (
                                        <div>
                                            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                                {rule.condition.type === "hours_before_min"
                                                    ? t('routes.templates.discountRulesForm.earlyBookingApplies')
                                                    : t('routes.templates.discountRulesForm.lastMinuteApplies')}
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder="24"
                                                    value={rule.condition.hours || ""}
                                                    onChange={(e) => {
                                                        const hours = Number.parseInt(e.target.value) || undefined
                                                        updateRule(rule.id, {
                                                            condition: { ...rule.condition, hours },
                                                        })
                                                    }}
                                                    className="w-20 text-sm"
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {rule.condition.type === "hours_before_min"
                                                        ? t('routes.templates.discountRulesForm.hoursOrMoreBefore')
                                                        : t('routes.templates.discountRulesForm.hoursOrLessBefore')}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rule Preview */}
                                    {rule.discount.value > 0 && (
                                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                                            <div className="text-xs text-emerald-700 flex items-center gap-1.5">
                                                {CONDITION_ICONS[rule.condition.type]}
                                                <span className="font-medium">
                                                    {rule.condition.type === "always" && (
                                                        t('routes.templates.discountRulesForm.allClassesDiscount', {
                                                            currency,
                                                            amount: Math.floor(rule.discount.value / 100)
                                                        })
                                                    )}
                                                    {rule.condition.type === "hours_before_min" && rule.condition.hours && (
                                                        t('routes.templates.discountRulesForm.earlyBookingDiscount', {
                                                            hours: rule.condition.hours,
                                                            currency,
                                                            amount: Math.floor(rule.discount.value / 100)
                                                        })
                                                    )}
                                                    {rule.condition.type === "hours_before_max" && rule.condition.hours && (
                                                        t('routes.templates.discountRulesForm.lastMinuteDiscount', {
                                                            hours: rule.condition.hours,
                                                            currency,
                                                            amount: Math.floor(rule.discount.value / 100)
                                                        })
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Delete Button */}
                                    <div className="flex justify-end pt-2 border-t border-border/50">
                                        <Button
                                            onClick={() => removeRule(rule.id)}
                                            size="sm"
                                            variant="destructive"
                                            className="gap-1.5"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            {t('routes.templates.discountRulesForm.deleteRule')}
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
