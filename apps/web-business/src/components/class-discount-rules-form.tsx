import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Clock, Euro, Zap } from "lucide-react"
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

    const addRule = () => {
        const newRule: DiscountRule = {
            id: `rule_${Date.now()}`,
            name: t('routes.templates.alwaysOn'), // Default to always on type
            condition: {
                type: "always",
            },
            discount: {
                type: "fixed_amount",
                value: 0,
            },
            // Audit fields will be set on the server
        }
        const updatedRules = [...rules, newRule]
        setRules(updatedRules)
        onChange(updatedRules)
    }

    const updateRule = (index: number, updates: Partial<DiscountRule>) => {
        const updatedRules = rules.map((rule, i) =>
            i === index ? {
                ...rule,
                ...updates,
                // updatedAt and updatedBy will be set on the server
            } : rule
        )
        setRules(updatedRules)
        onChange(updatedRules)
    }

    const removeRule = (index: number) => {
        const updatedRules = rules.filter((_, i) => i !== index)
        setRules(updatedRules)
        onChange(updatedRules)
    }

    const getConditionIcon = (type: string) => {
        switch (type) {
            case "always":
                return <Zap className="h-4 w-4" />
            case "hours_before_min":
                return <Clock className="h-4 w-4" />
            case "hours_before_max":
                return <Clock className="h-4 w-4" />
            default:
                return null
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    <Label className="text-sm font-medium">{t('routes.templates.discountRulesForm.title')}</Label>
                </div>
                <Button onClick={addRule} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    {t('routes.templates.discountRulesForm.addRule')}
                </Button>
            </div>

            {rules.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                    <p className="text-sm">{t('routes.templates.discountRulesForm.noRulesConfigured')}</p>
                    <p className="text-xs mt-1">{t('routes.templates.discountRulesForm.noRulesDescription')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {rules.map((rule, index) => (
                        <Card key={rule.id} className="border border-border/50 relative">
                            <CardContent className="p-4 w-full">
                                {/* Remove Button - Absolute positioned in top right */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeRule(index)}
                                    className="absolute top-2 right-2 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>

                                {/* Main row: Type and Amount */}
                                <div className="flex flex-row gap-2">
                                    {/* Discount Type Selection - Takes 2 columns (2/3 of space) */}
                                    <div className="space-y-1 w-full">
                                        <Label htmlFor={`discount-type-${index}`} className="text-xs">{t('routes.templates.discountRulesForm.type')}</Label>
                                        <Select
                                            value={rule.condition.type}
                                            onValueChange={(value: "always" | "hours_before_min" | "hours_before_max") => {
                                                const newCondition = { type: value, hours: rule.condition.hours || 24 }
                                                const newName = getDiscountTypeName(value)
                                                updateRule(index, { condition: newCondition, name: newName })
                                            }}
                                        >
                                            <SelectTrigger id={`discount-type-${index}`} className="w-full h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="always">
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="h-3 w-3" />
                                                        {t('routes.templates.alwaysOn')}
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="hours_before_min">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3" />
                                                        {t('routes.templates.earlyBooking')}
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="hours_before_max">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3" />
                                                        {t('routes.templates.lastMinute')}
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Discount Amount - Takes 1 column (1/3 of space) */}
                                    <div className="space-y-1 w-38">
                                        <Label htmlFor={`discount-amount-${index}`} className="text-xs">{t('routes.templates.discountRulesForm.amount', { currency })}</Label>
                                        <div className="relative">
                                            <Input
                                                id={`discount-amount-${index}`}
                                                type="number"
                                                min="1"
                                                max={price ? Math.min(100, Math.floor(price / 100)) : 100}
                                                step="1"
                                                placeholder="5"
                                                name="discount.value"
                                                value={Math.floor(rule.discount.value / 100) || ""}
                                                onChange={(e) => {
                                                    const inputValue = Number.parseInt(e.target.value) || 0
                                                    const maxValue = price ? Math.min(100, Math.floor(price / 100)) : 100
                                                    const value = Math.min(inputValue, maxValue) * 100
                                                    updateRule(index, {
                                                        discount: { ...rule.discount, value },
                                                    })
                                                }}
                                                className="h-9 pl-7"
                                            />
                                            <Euro className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>

                                {/* Conditional Hours Input - New row below if needed */}
                                {rule.condition.type !== "always" && (
                                    <div className="mt-4 w-full">
                                        <Label htmlFor={`discount-hours-${index}`} className="text-xs">
                                            {rule.condition.type === "hours_before_min"
                                                ? t('routes.templates.discountRulesForm.earlyBookingApplies')
                                                : t('routes.templates.discountRulesForm.lastMinuteApplies')}
                                        </Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Input
                                                id={`discount-hours-${index}`}
                                                type="number"
                                                min="1"
                                                placeholder="24"
                                                name="condition.hours"
                                                value={rule.condition.hours || ""}
                                                onChange={(e) => {
                                                    const hours = Number.parseInt(e.target.value) || undefined
                                                    updateRule(index, {
                                                        condition: { ...rule.condition, hours },
                                                    })
                                                }}
                                                className="w-20"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {rule.condition.type === "hours_before_min"
                                                    ? t('routes.templates.discountRulesForm.hoursOrMoreBefore')
                                                    : t('routes.templates.discountRulesForm.hoursOrLessBefore')}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Rule Description */}
                                {rule.discount.value > 0 && (
                                    <div className="mt-3 p-2 bg-muted/30 rounded-md">
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            {getConditionIcon(rule.condition.type)}
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
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
