import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { tz } from '@date-fns/tz';
import { DiamondIcon, UserIcon, ClockIcon, LockIcon } from 'lucide-react-native';

import { useTypedTranslation } from '../i18n/typed';
import type { ClassInstance } from '../hooks/use-class-instances';
import { centsToCredits } from '@repo/utils/credits';
import { theme } from '../theme';
import { formatDistance } from '../utils/location';
import { MapPinIcon } from 'lucide-react-native';

// Discount rule type based on schema
type ClassDiscountRule = {
  id: string;
  name: string;
  condition: {
    type: 'hours_before_min' | 'hours_before_max' | 'always';
    hours?: number;
  };
  discount: {
    type: 'fixed_amount';
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

const ATHENS_TZ = 'Europe/Athens';

// Helper functions for discount calculation
function doesRuleApply(rule: ClassDiscountRule, hoursUntilClass: number): boolean {
  switch (rule.condition.type) {
    case 'hours_before_min':
      // Early bird: discount if booked at least X hours before class
      return rule.condition.hours !== undefined && hoursUntilClass >= rule.condition.hours;
    case 'hours_before_max':
      // Last minute: discount if booked at most X hours before class
      return rule.condition.hours !== undefined && hoursUntilClass <= rule.condition.hours && hoursUntilClass >= 0;
    case 'always':
      // Always applies
      return true;
    default:
      return false;
  }
}

function findBestDiscountRule(
  rules: ClassDiscountRule[],
  hoursUntilClass: number
): { rule: ClassDiscountRule; ruleName: string } | null {
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

// Helper functions for booking window display
interface BookingWindowStatus {
  status: 'open' | 'closed' | 'not_yet_open';
  message: string;
  isDisabled: boolean;
  showClockIcon: boolean;
  showLockIcon: boolean;
  iconColor: string;
}

function formatTimeUnits(
  days: number,
  hours: number,
  minutes: number,
  timeUnitDays: string,
  timeUnitHours: string,
  timeUnitMinutes: string
): string {
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}${timeUnitDays}`);
  if (hours > 0 || days > 0) parts.push(`${hours}${timeUnitHours}`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}${timeUnitMinutes}`);
  return parts.join(' ');
}

function getBookingWindowStatus(
  classInstance: ClassInstance,
  bookingsClosed: string,
  opensInTemplate: string,
  closesInTemplate: string,
  timeUnitDays: string,
  timeUnitHours: string,
  timeUnitMinutes: string
): BookingWindowStatus {
  if (!classInstance.bookingWindow?.minHours) {
    return {
      status: 'open',
      message: '',
      isDisabled: false,
      showClockIcon: false,
      showLockIcon: false,
      iconColor: theme.colors.zinc[600]
    };
  }

  const now = Date.now();
  const classStartTime = classInstance.startTime;
  const bookingEndTime = classStartTime - classInstance.bookingWindow.minHours * 60 * 60 * 1000;
  const timeUntilBookingEnds = bookingEndTime - now;

  // If booking window has passed, show "Bookings closed"
  if (timeUntilBookingEnds <= 0) {
    return {
      status: 'closed',
      message: bookingsClosed,
      isDisabled: true,
      showClockIcon: false,
      showLockIcon: true,
      iconColor: theme.colors.rose[600]
    };
  }

  // Check if booking window has maxHours (booking opens later)
  if (classInstance.bookingWindow.maxHours) {
    const bookingStartTime = classStartTime - classInstance.bookingWindow.maxHours * 60 * 60 * 1000;
    const timeUntilBookingOpens = bookingStartTime - now;

    // If booking window hasn't opened yet
    if (timeUntilBookingOpens > 0) {
      const totalMinutes = Math.floor(timeUntilBookingOpens / (1000 * 60));
      const days = Math.floor(totalMinutes / (60 * 24));
      const remainingMinutesAfterDays = totalMinutes % (60 * 24);
      const hours = Math.floor(remainingMinutesAfterDays / 60);
      const minutes = remainingMinutesAfterDays % 60;

      const timeString = formatTimeUnits(days, hours, minutes, timeUnitDays, timeUnitHours, timeUnitMinutes);
      return {
        status: 'not_yet_open',
        message: opensInTemplate.replace('{{time}}', timeString),
        isDisabled: true,
        showClockIcon: true,
        showLockIcon: false,
        iconColor: theme.colors.rose[600]
      };
    }
  }

  const totalMinutes = Math.floor(timeUntilBookingEnds / (1000 * 60));

  // Only show booking window text if it closes in less than 24 hours (1440 minutes)
  if (totalMinutes >= 1440) {
    return {
      status: 'open',
      message: '',
      isDisabled: false,
      showClockIcon: false,
      showLockIcon: false,
      iconColor: theme.colors.zinc[600]
    };
  }

  const days = Math.floor(totalMinutes / (60 * 24));
  const remainingMinutesAfterDays = totalMinutes % (60 * 24);
  const hours = Math.floor(remainingMinutesAfterDays / 60);
  const minutes = remainingMinutesAfterDays % 60;

  const timeString = formatTimeUnits(days, hours, minutes, timeUnitDays, timeUnitHours, timeUnitMinutes);
  return {
    status: 'open',
    message: closesInTemplate.replace('{{time}}', timeString),
    isDisabled: false,
    showClockIcon: true,
    showLockIcon: false,
    iconColor: theme.colors.rose[600]
  };
}

function calculateClassDiscount(classInstance: ClassInstance): DiscountCalculationResult {
  const priceInCents = classInstance.price ?? 1000; // Default 10.00 in cents
  const originalPrice = centsToCredits(priceInCents);

  const now = Date.now();
  const hoursUntilClass = (classInstance.startTime - now) / (1000 * 60 * 60);

  const discountRules: ClassDiscountRule[] =
    classInstance.discountRules || classInstance.templateSnapshot?.discountRules || [];

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

  const discountValueInCredits = centsToCredits(bestRule.rule.discount.value);
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
  distance?: number; // Distance in meters
  onPress?: (classInstance: ClassInstance) => void;
}

export const ClassCard = memo<ClassCardProps>(({ classInstance, distance, onPress }) => {
  const { t } = useTypedTranslation();

  const businessName = classInstance.venueSnapshot?.name ?? 'Unknown Venue';
  const startTime = new Date(classInstance.startTime);
  const startTimeLabel = format(startTime, 'HH:mm', { in: tz(ATHENS_TZ) });
  const duration = Math.max(0, Math.round((classInstance.endTime - classInstance.startTime) / (1000 * 60)));
  const durationLabel = `${duration} min`;
  const price = classInstance.price;
  const spotsLeft = Math.max(0, (classInstance.capacity ?? 0) - (classInstance.bookedCount ?? 0));
  const isSoldOut = spotsLeft === 0;
  const isBookingsDisabled = Boolean(classInstance.disableBookings);
  const isBookedByUser = 'isBookedByUser' in classInstance ? Boolean(classInstance.isBookedByUser) : false;

  // Memoize translated strings
  const timeUnitDays = t('explore.timeUnitDays');
  const timeUnitHours = t('explore.timeUnitHours');
  const timeUnitMinutes = t('explore.timeUnitMinutes');
  const bookingsClosed = t('explore.bookingsClosed');
  const opensInTemplate = useMemo(() => {
    const templateMarker = '__TIME_PLACEHOLDER__';
    return t('explore.opensIn', { time: templateMarker }).replace(templateMarker, '{{time}}');
  }, [t]);
  const closesInTemplate = useMemo(() => {
    const templateMarker = '__TIME_PLACEHOLDER__';
    return t('explore.closesIn', { time: templateMarker }).replace(templateMarker, '{{time}}');
  }, [t]);

  const discountResult = useMemo(() => calculateClassDiscount(classInstance), [classInstance]);
  const bookingWindowStatus = useMemo(
    () => getBookingWindowStatus(
      classInstance,
      bookingsClosed,
      opensInTemplate,
      closesInTemplate,
      timeUnitDays,
      timeUnitHours,
      timeUnitMinutes
    ),
    [classInstance, bookingsClosed, opensInTemplate, closesInTemplate, timeUnitDays, timeUnitHours, timeUnitMinutes]
  );
  const bookingWindowText = bookingWindowStatus.message;

  // Determine if card should be disabled
  const isCardDisabled = isSoldOut || isBookingsDisabled || bookingWindowStatus.isDisabled;

  const metaLine = useMemo(() => {
    const instructor = classInstance.instructor ?? '';

    if (businessName && instructor) {
      return `${businessName} · ${instructor}`;
    }

    return businessName || instructor || '';
  }, [businessName, classInstance.instructor]);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCardDisabled && styles.cardDisabled,
      ]}
      onPress={() => onPress?.(classInstance)}
      activeOpacity={0.85}
      disabled={isCardDisabled}
    >
      {isBookedByUser && (
        <View style={styles.attendingBadge}>
          <Text style={styles.attendingBadgeText}>Booked</Text>
        </View>
      )}
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{startTimeLabel}</Text>
        <Text style={styles.durationText}>{durationLabel}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.contentColumn}>
        <View style={styles.headerRow}>
          <Text style={styles.className} numberOfLines={1}>
            {classInstance.name}
          </Text>

          <View style={styles.priceContainer}>
            {discountResult.appliedDiscount ? (
              <View style={styles.priceStack}>
                <View style={styles.priceRow}>
                  <DiamondIcon size={12} color={theme.colors.zinc[400]} />
                  <Text style={styles.originalPriceText}>{discountResult.originalPrice}</Text>
                </View>
                <View style={styles.priceRow}>
                  <DiamondIcon size={16} color={theme.colors.zinc[900]} />
                  <Text style={styles.discountedPriceText}>{discountResult.finalPrice}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.priceRow}>
                <DiamondIcon size={16} color={theme.colors.zinc[900]} />
                <Text style={styles.priceText}>{centsToCredits(price ?? 0)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.metaRow}>
          {!!metaLine && (
            <Text style={styles.metaText} numberOfLines={1}>
              {metaLine}
            </Text>
          )}
          {distance !== undefined && (
            <View style={styles.distanceBadge}>
              <MapPinIcon size={12} color={theme.colors.zinc[500]} />
              <Text style={styles.distanceText}>
                {formatDistance(distance)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <UserIcon size={14} color={isSoldOut ? theme.colors.rose[700] : theme.colors.emerald[700]} />
            <Text style={[styles.infoText, styles.spotsInfoText]}>
              {isSoldOut ? t('explore.soldOut') : t('explore.spotsLeft', { count: spotsLeft })}
            </Text>
          </View>

          {/* Show booking window info or bookings closed */}
          {(bookingWindowText || bookingWindowStatus.showLockIcon || isBookingsDisabled) ? (
            <>
              <View style={styles.infoSeparator} />

              <View style={styles.infoItem}>
                {isBookingsDisabled ? (
                  <LockIcon size={14} color={theme.colors.rose[600]} />
                ) : bookingWindowStatus.showClockIcon ? (
                  <ClockIcon size={14} color={bookingWindowStatus.iconColor} />
                ) : bookingWindowStatus.showLockIcon ? (
                  <LockIcon size={14} color={theme.colors.rose[600]} />
                ) : null}
                <Text style={[styles.infoText, styles.closesInfoText]}>
                  {isBookingsDisabled ? t('explore.bookingsClosed') : bookingWindowText || t('explore.bookingsClosed')}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        {/* <View style={styles.badgesRow}>
          {discountResult.appliedDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{discountResult.appliedDiscount.ruleName}</Text>
            </View>
          )}
          {isBookedByUser && (
            <View style={styles.bookedBadge}>
              <CheckCircleIcon size={14} color={theme.colors.emerald[900]} strokeWidth={2} />
              <Text style={styles.bookedText}>Already Booked</Text>
            </View>
          )}
        </View> */}
      </View>
    </TouchableOpacity>
  );
});

ClassCard.displayName = 'ClassCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
  },
  cardDisabled: {
    opacity: 0.55,
  },
  timeColumn: {
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.zinc[900],
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: theme.colors.zinc[500],
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.zinc[200],
    opacity: 0.8,
  },
  contentColumn: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  className: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.zinc[900],
  },
  priceContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priceStack: {
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.zinc[900],
  },
  originalPriceText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.zinc[400],
    textDecorationLine: 'line-through',
  },
  discountedPriceText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.zinc[900],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: theme.colors.zinc[500],
    flex: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: theme.colors.zinc[500],
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.zinc[200],
    opacity: 0.7,
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoSeparator: {
    width: 1,
    height: 18,
    backgroundColor: theme.colors.zinc[200],
    opacity: 0.6,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.zinc[600],
  },
  spotsInfoText: {
    color: theme.colors.emerald[600],
  },
  closesInfoText: {
    color: theme.colors.rose[600],
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  discountBadge: {
    backgroundColor: theme.colors.amber[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.amber[800],
  },
  bookedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.emerald[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bookedText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.emerald[900],
  },
  soldOutText: {
    color: theme.colors.rose[500],
  },
  attendingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: theme.colors.emerald[500],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  attendingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.zinc[50],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
