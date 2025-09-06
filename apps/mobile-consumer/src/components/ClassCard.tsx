import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ClockIcon, DiamondIcon, UserIcon } from 'lucide-react-native';
import { useTypedTranslation } from '../i18n/typed';
import type { ClassInstance } from '../hooks/use-class-instances';
import { centsToCredits } from '@repo/utils/credits';
import { theme } from '../theme';

// Discount rule type based on schema
type ClassDiscountRule = {
  id: string;
  name: string;
  condition: {
    type: "hours_before_min" | "hours_before_max" | "always";
    hours?: number;
  };
  discount: {
    type: "fixed_amount";
    value: number;
  };
};

// Discount calculation result
type DiscountCalculationResult = {
  originalPrice: number;
  finalPrice: number;
  appliedDiscount: {
    discountValue: number;
    creditsSaved: number;
    ruleName: string;
  } | null;
};

// Helper functions for discount calculation
function doesRuleApply(rule: ClassDiscountRule, hoursUntilClass: number): boolean {
  switch (rule.condition.type) {
    case "hours_before_min":
      // Early bird: discount if booked at least X hours before class
      return rule.condition.hours !== undefined && hoursUntilClass >= rule.condition.hours;
    case "hours_before_max":
      // Last minute: discount if booked at most X hours before class
      return rule.condition.hours !== undefined && hoursUntilClass <= rule.condition.hours && hoursUntilClass >= 0;
    case "always":
      // Always applies
      return true;
    default:
      return false;
  }
}

function findBestDiscountRule(rules: ClassDiscountRule[], hoursUntilClass: number): { rule: ClassDiscountRule; ruleName: string } | null {
  let bestRule: ClassDiscountRule | null = null;
  let bestDiscount = 0;

  for (const rule of rules) {
    if (doesRuleApply(rule, hoursUntilClass) && rule.discount.value > bestDiscount) {
      bestRule = rule;
      bestDiscount = rule.discount.value;
    }
  }

  return bestRule ? { rule: bestRule, ruleName: bestRule.name } : null;
}

// Helper functions for discount display
function getDiscountBadgeText(discountResult: DiscountCalculationResult): string {
  if (!discountResult.appliedDiscount) return '';

  const percentage = Math.floor((discountResult.appliedDiscount.creditsSaved / discountResult.originalPrice) * 10) / 10;
  const ruleName = discountResult.appliedDiscount.ruleName;

  if (ruleName.toLowerCase().includes('early')) {
    return `Early Bird: -${percentage.toFixed(1)}%`;
  } else if (ruleName.toLowerCase().includes('last') || ruleName.toLowerCase().includes('minute')) {
    return `Last minute: -${percentage.toFixed(1)}%`;
  } else {
    return `Discount: -${percentage.toFixed(1)}%`;
  }
}

function getDiscountTimingText(discountResult: DiscountCalculationResult, classInstance: ClassInstance): string {
  if (!discountResult.appliedDiscount) return '';

  // Get discount rules to check the rule type
  const discountRules: ClassDiscountRule[] =
    classInstance.discountRules ||
    classInstance.templateSnapshot?.discountRules ||
    [];

  // Find the applied rule by name
  const appliedRule = discountRules.find(rule => rule.name === discountResult.appliedDiscount?.ruleName);
  
  // Don't show timing text for "always" type discounts
  if (appliedRule?.condition.type === 'always') {
    return '';
  }

  const now = Date.now();
  const hoursUntilClass = Math.max(0, (classInstance.startTime - now) / (1000 * 60 * 60));
  const ruleName = discountResult.appliedDiscount.ruleName;

  if (ruleName.toLowerCase().includes('early')) {
    return `Early bird discount: ${Math.round(hoursUntilClass)}h left`;
  } else if (ruleName.toLowerCase().includes('last') || ruleName.toLowerCase().includes('minute')) {
    return `Last minute discount: ${Math.round(hoursUntilClass)}h left`;
  } else {
    return `Discount: ${Math.round(hoursUntilClass)}h left`;
  }
}

function calculateClassDiscount(classInstance: ClassInstance): DiscountCalculationResult {
  // Get the original price in cents
  const priceInCents = classInstance.price ?? 1000; // Default 10.00 in cents
  // Convert from currency cents to credits (1 credit = 50 cents)
  const originalPrice = priceInCents / 50;

  const now = Date.now();
  const hoursUntilClass = (classInstance.startTime - now) / (1000 * 60 * 60);

  // Get discount rules (instance-specific takes priority, then template rules)
  const discountRules: ClassDiscountRule[] =
    classInstance.discountRules ||
    classInstance.templateSnapshot?.discountRules ||
    [];

  if (discountRules.length === 0) {
    return {
      originalPrice,
      finalPrice: originalPrice,
      appliedDiscount: null,
    };
  }

  const bestRule = findBestDiscountRule(discountRules, hoursUntilClass);

  if (!bestRule) {
    return {
      originalPrice,
      finalPrice: originalPrice,
      appliedDiscount: null,
    };
  }

  // Convert discount value from cents to credits (1 credit = 50 cents)
  const discountValueInCredits = bestRule.rule.discount.value / 50;

  // Apply the discount (fixed amount in credits)
  const finalPrice = Math.max(0, originalPrice - discountValueInCredits);
  const creditsSaved = originalPrice - finalPrice;

  return {
    originalPrice,
    finalPrice,
    appliedDiscount: {
      discountValue: discountValueInCredits,
      creditsSaved,
      ruleName: bestRule.ruleName,
    },
  };
}

interface ClassCardProps {
  classInstance: ClassInstance;
  onPress?: (classInstance: ClassInstance) => void;
}

export const ClassCard = memo<ClassCardProps>(({ classInstance, onPress }) => {
  const { t } = useTypedTranslation();

  const businessName = classInstance.venueSnapshot?.name ?? 'Unknown Venue';
  const startTime = new Date(classInstance.startTime);
  const startTimeStr = startTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const duration = Math.round((classInstance.endTime - classInstance.startTime) / (1000 * 60));
  const price = classInstance.price;
  const spotsLeft = Math.max(0, (classInstance.capacity ?? 0) - (classInstance.bookedCount ?? 0));
  const isSoldOut = spotsLeft === 0;

  // Calculate discount pricing
  const discountResult = useMemo(() => {
    const result = calculateClassDiscount(classInstance);
    return result;
  }, [classInstance]);

  return (
    <TouchableOpacity
      style={[styles.container, isSoldOut && styles.soldOutContainer]}
      onPress={() => onPress?.(classInstance)}
      activeOpacity={0.7}
      disabled={isSoldOut}
    >
      {/* Left side - Time and Duration */}
      <View style={styles.timeSection}>
        <Text style={[styles.startTime, isSoldOut && styles.soldOutText]}>
          {startTimeStr}
        </Text>
        <View style={styles.durationContainer}>
          <ClockIcon size={10} color="#666" />
          <Text style={styles.durationText}>
            {duration}min
          </Text>
        </View>
      </View>

      {/* Right side - Class details */}
      <View style={styles.detailsSection}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, isSoldOut && styles.soldOutText]} numberOfLines={1}>
            {classInstance.name}
          </Text>
          <View style={styles.priceContainer}>
            {discountResult.appliedDiscount ? (
              <View style={styles.priceRowContainer}>
                <View style={styles.priceRow}>
                  <DiamondIcon size={12} color="#999" />
                  <Text style={styles.originalPriceText}>{discountResult.originalPrice}</Text>
                </View>
                <View style={styles.priceRow}>
                  <DiamondIcon size={16} color={theme.colors.zinc[950]} />
                  <Text style={styles.discountedPriceText}>{discountResult.finalPrice}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.priceRow}>
                <DiamondIcon size={16} color="#222" />
                <Text style={styles.priceText}>{centsToCredits(price ?? 0)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.businessRow}>
          <Text style={styles.businessName} numberOfLines={1}>
            {businessName}
          </Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.instructor} numberOfLines={1}>
            {classInstance.instructor}
          </Text>
        </View>

        <View style={styles.spotsRow}>
          <UserIcon size={12} color={isSoldOut ? '#ef4444' : '#16a34a'} />
          <Text style={[styles.spotsText, isSoldOut && styles.soldOutText]}>
            {isSoldOut
              ? t('explore.soldOut')
              : t('explore.spotsLeft', { count: spotsLeft })
            }
          </Text>
        </View>

        {/* Discount timing info */}
        {discountResult.appliedDiscount && (
          <View style={styles.discountTimingRow}>
            <Text style={styles.discountTimingText}>
              {getDiscountTimingText(discountResult, classInstance)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

ClassCard.displayName = 'ClassCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    padding: 12,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  soldOutContainer: {
    opacity: 0.6,
  },
  timeSection: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    paddingRight: 12,
  },
  startTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  detailsSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.zinc[950],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  priceRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountTimingRow: {
    marginTop: 4,
  },
  discountTimingText: {
    fontSize: 13,
    color: theme.colors.amber[500],
    fontWeight: '600',
  },
  originalPriceText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.zinc[400],
    textDecorationLine: 'line-through',
  },
  discountedPriceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.zinc[950], // Red color to highlight the discount
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flex: 1,
  },
  businessName: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    flexShrink: 1,
  },
  separator: {
    fontSize: 13,
    color: '#ccc',
    marginHorizontal: 6,
  },
  instructor: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
  },
  spotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spotsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
  },
  soldOutText: {
    color: '#ef4444',
  },
});