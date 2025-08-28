import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Clock, Euro, Zap } from "lucide-react"

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
    const [rules, setRules] = useState<DiscountRule[]>(discountRules)

    const getDiscountTypeName = (type: string, hours?: number) => {
        switch (type) {
            case "always":
                return "Always On"
            case "hours_before_min":
                return "Early Booking"
            case "hours_before_max":
                return "Last Minute"
            default:
                return "Discount"
        }
    }

    const addRule = () => {
        const newRule: DiscountRule = {
            id: `rule_${Date.now()}`,
            name: "Always On", // Default to always on type
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
                    <Label className="text-sm font-medium">Discount Rules</Label>
                </div>
                <Button onClick={addRule} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Rule
                </Button>
            </div>

            {rules.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                    <p className="text-sm">No discount rules configured</p>
                    <p className="text-xs mt-1">Add rules to offer early-bird or last-minute discounts</p>
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
                                        <Label className="text-xs">Type</Label>
                                        <Select
                                            value={rule.condition.type}
                                            onValueChange={(value: "always" | "hours_before_min" | "hours_before_max") => {
                                                const newCondition = { type: value, hours: rule.condition.hours || 24 }
                                                const newName = getDiscountTypeName(value, newCondition.hours)
                                                updateRule(index, { condition: newCondition, name: newName })
                                            }}
                                        >
                                            <SelectTrigger className="w-full h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="always">
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="h-3 w-3" />
                                                        Always On
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="hours_before_min">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3" />
                                                        Early Booking
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="hours_before_max">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3" />
                                                        Last Minute
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Discount Amount - Takes 1 column (1/3 of space) */}
                                    <div className="space-y-1 w-38">
                                        <Label className="text-xs">Amount ({currency})</Label>
                                        <div className="relative">
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
                                        <Label className="text-xs">
                                            {rule.condition.type === "hours_before_min" ? "Minimum Hours Before Class" : "Maximum Hours Before Class"}
                                        </Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="24"
                                            value={rule.condition.hours || ""}
                                            onChange={(e) => {
                                                const hours = Number.parseInt(e.target.value) || undefined
                                                updateRule(index, {
                                                    condition: { ...rule.condition, hours },
                                                })
                                            }}
                                            className="h-9"
                                        />
                                    </div>
                                )}

                                {/* Rule Description */}
                                {rule.discount.value > 0 && (
                                    <div className="mt-3 p-2 bg-muted/30 rounded-md">
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            {getConditionIcon(rule.condition.type)}
                                            <span className="font-medium">
                                                {rule.condition.type === "always" && (
                                                    `All classes get a ${currency} ${Math.floor(rule.discount.value / 100)} discount.`
                                                )}
                                                {rule.condition.type === "hours_before_min" && rule.condition.hours && (
                                                    `Classes booked ${rule.condition.hours}+ hours in advance get a ${currency} ${Math.floor(rule.discount.value / 100)} discount.`
                                                )}
                                                {rule.condition.type === "hours_before_max" && rule.condition.hours && (
                                                    `Classes that start in the next ${rule.condition.hours}h get a ${currency} ${Math.floor(rule.discount.value / 100)} discount.`
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
