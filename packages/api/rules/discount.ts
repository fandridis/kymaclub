export interface DiscountRule {
    id: string;
    name: string;
    percentage: number;
    conditions: DiscountCondition[];
}

export interface DiscountCondition {
    type: "time_advance" | "capacity_utilization" | "user_tier" | "bulk_booking";
    operator: "gt" | "lt" | "eq" | "gte" | "lte";
    value: number;
}

const evaluateDiscountRules = (
    rules: DiscountRule[],
    context: {
        hoursUntilClass: number;
        capacityUtilization: number;
        userTier: string;
        bookingCount: number;
    }
): DiscountRule[] => {
    console.log("🏷️ PRICING_DOMAIN: evaluateDiscountRules - Evaluating discount rules");

    const applicableRules = rules.filter(rule => {
        console.log(`🏷️ PRICING_DOMAIN: Checking rule: ${rule.name}`);

        const conditionsMet = rule.conditions.every(condition => {
            return evaluateCondition(condition, context);
        });

        if (conditionsMet) {
            console.log(`✅ PRICING_DOMAIN: Rule ${rule.name} applies (${rule.percentage * 100}% discount)`);
        } else {
            console.log(`❌ PRICING_DOMAIN: Rule ${rule.name} does not apply`);
        }

        return conditionsMet;
    });

    console.log(`🏷️ PRICING_DOMAIN: ${applicableRules.length} discount rules applicable`);
    return applicableRules;
};

const evaluateCondition = (
    condition: DiscountCondition,
    context: any
): boolean => {
    let contextValue: number;

    switch (condition.type) {
        case "time_advance":
            contextValue = context.hoursUntilClass;
            break;
        case "capacity_utilization":
            contextValue = context.capacityUtilization;
            break;
        case "bulk_booking":
            contextValue = context.bookingCount;
            break;
        default:
            return false;
    }

    switch (condition.operator) {
        case "gt":
            return contextValue > condition.value;
        case "lt":
            return contextValue < condition.value;
        case "gte":
            return contextValue >= condition.value;
        case "lte":
            return contextValue <= condition.value;
        case "eq":
            return contextValue === condition.value;
        default:
            return false;
    }
};

export const discountRules = {
    evaluateDiscountRules,
};
