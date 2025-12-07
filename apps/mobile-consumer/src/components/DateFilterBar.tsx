import React, { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import {
  format,
  startOfWeek,
  addWeeks,
  addDays,
  isBefore,
  startOfDay,
  isSameDay,
  parseISO,
  differenceInWeeks,
} from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { el } from 'date-fns/locale/el';
import { useTypedTranslation } from '../i18n/typed';
import i18n from '../i18n';

export interface DateFilterOptions {
  selectedDate: string; // Format: YYYY-MM-DD
}

interface DateFilterBarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  /** Map of date string (YYYY-MM-DD) to number of classes on that date */
  classCountsByDate?: Record<string, number>;
  /** Show month-year header above the date picker */
  showMonthYear?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const WEEKS_AHEAD = 4; // Show 4 weeks
const CAROUSEL_HEIGHT = 80;
const HORIZONTAL_PADDING = 12;

// Map i18next language codes to date-fns locales
const getDateFnsLocale = (language: string) => {
  switch (language) {
    case 'el':
      return el;
    case 'en':
    default:
      return enUS;
  }
};

interface DayItem {
  dateStr: string;
  dayName: string;
  dayNumber: number;
  isPast: boolean;
  isToday: boolean;
}

interface WeekData {
  weekIndex: number;
  days: DayItem[];
  weekStart: Date;
  weekEnd: Date;
}

export const DateFilterBar = memo<DateFilterBarProps>(({ selectedDate, onDateChange, classCountsByDate, showMonthYear }) => {
  const { t } = useTypedTranslation();
  const carouselRef = useRef<ICarouselInstance>(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  // Generate weeks data (4 weeks starting from current week's Monday)
  const { weeks, initialWeekIndex } = useMemo(() => {
    const currentLanguage = i18n.language || 'en';
    const dateFnsLocale = getDateFnsLocale(currentLanguage);
    const today = new Date();
    const todayStart = startOfDay(today);

    // Get Monday of current week (weekStartsOn: 1 = Monday)
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });

    const weeksData: WeekData[] = Array.from({ length: WEEKS_AHEAD }, (_, weekIndex) => {
      const weekStart = addWeeks(currentWeekStart, weekIndex);
      const weekEnd = addDays(weekStart, 6); // Sunday

      const days: DayItem[] = Array.from({ length: 7 }, (_, dayIndex) => {
        const date = addDays(weekStart, dayIndex);
        const dateStr = format(date, 'yyyy-MM-dd');
        const isToday = isSameDay(date, today);
        const isPast = isBefore(date, todayStart) && !isToday;

        return {
          dateStr,
          dayName: isToday
            ? t('common.today')
            : format(date, 'EEE', { locale: dateFnsLocale }),
          dayNumber: date.getDate(),
          isPast,
          isToday,
        };
      });

      return {
        weekIndex,
        days,
        weekStart,
        weekEnd,
      };
    });

    // Calculate initial week index based on selected date
    let initialIdx = 0;
    if (selectedDate) {
      const selectedParsed = parseISO(selectedDate);
      const weeksDiff = differenceInWeeks(selectedParsed, currentWeekStart);
      if (weeksDiff >= 0 && weeksDiff < WEEKS_AHEAD) {
        initialIdx = weeksDiff;
      }
    }

    return { weeks: weeksData, initialWeekIndex: initialIdx };
  }, [t, selectedDate]);

  // Initialize currentWeekIndex when component mounts or initialWeekIndex changes
  useEffect(() => {
    setCurrentWeekIndex(initialWeekIndex);
  }, [initialWeekIndex]);

  // Format month-year header for the current week
  const monthYearHeader = useMemo(() => {
    if (!showMonthYear || weeks.length === 0) return null;

    const currentLanguage = i18n.language || 'en';
    const dateFnsLocale = getDateFnsLocale(currentLanguage);
    const currentWeek = weeks[currentWeekIndex];
    if (!currentWeek) return null;

    return format(currentWeek.weekStart, 'MMMM yyyy', { locale: dateFnsLocale });
  }, [showMonthYear, weeks, currentWeekIndex]);

  const handleSnapToItem = useCallback((index: number) => {
    setCurrentWeekIndex(index);
  }, []);

  const handleDatePress = useCallback((dateStr: string, isPast: boolean) => {
    // Don't allow selecting past dates
    if (isPast) return;
    onDateChange(dateStr);
  }, [onDateChange]);

  // Render dots based on class count (1 dot = 1 class, 2 dots = 2 classes, 3 dots = 3+ classes)
  const renderClassDots = useCallback((dateStr: string, isSelected: boolean, isPast: boolean) => {
    const count = classCountsByDate?.[dateStr] ?? 0;
    if (count === 0) return null;

    const dotCount = Math.min(count, 3);
    const dots = Array.from({ length: dotCount }, (_, i) => (
      <View
        key={i}
        style={[
          styles.classDot,
          isSelected && styles.classDotActive,
          isPast && !isSelected && styles.classDotPast,
        ]}
      />
    ));

    return <View style={styles.dotsContainer}>{dots}</View>;
  }, [classCountsByDate]);

  const renderWeek = useCallback(({ item }: { item: WeekData }) => {
    return (
      <View style={styles.weekContainer}>
        {/* Days Row */}
        <View style={styles.daysRow}>
          {item.days.map((day) => {
            const isSelected = selectedDate === day.dateStr;

            return (
              <Pressable
                key={day.dateStr}
                style={[
                  styles.dateItem,
                  isSelected && styles.dateItemActive,
                  day.isPast && styles.dateItemPast,
                ]}
                onPress={() => handleDatePress(day.dateStr, day.isPast)}
                disabled={day.isPast}
              >
                <View style={styles.dateContent}>
                  <Text
                    style={[
                      styles.dayName,
                      isSelected && styles.dayNameActive,
                      day.isPast && !isSelected && styles.dayNamePast,
                    ]}
                  >
                    {day.dayName}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected && styles.dayNumberActive,
                      day.isPast && !isSelected && styles.dayNumberPast,
                    ]}
                  >
                    {day.dayNumber}
                  </Text>
                </View>
                {/* Footer with class count dots */}
                <View style={styles.dateFooter}>
                  {renderClassDots(day.dateStr, isSelected, day.isPast)}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }, [selectedDate, handleDatePress, renderClassDots]);

  return (
    <View style={styles.container}>
      {showMonthYear && monthYearHeader && (
        <View style={styles.monthYearContainer}>
          <Text style={styles.monthYearText}>{monthYearHeader}</Text>
        </View>
      )}
      <Carousel
        ref={carouselRef}
        width={screenWidth}
        height={CAROUSEL_HEIGHT}
        data={weeks}
        renderItem={renderWeek}
        defaultIndex={initialWeekIndex}
        loop={false}
        onSnapToItem={handleSnapToItem}
      />
    </View>
  );
});

DateFilterBar.displayName = 'DateFilterBar';

// Calculate day item width (7 items with gaps and padding)
const DAY_ITEM_GAP = 6;
const TOTAL_GAPS = 6 * DAY_ITEM_GAP; // 6 gaps between 7 items
const AVAILABLE_WIDTH = screenWidth - (HORIZONTAL_PADDING * 2) - TOTAL_GAPS;
const DAY_ITEM_WIDTH = Math.floor(AVAILABLE_WIDTH / 7);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthYearContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 8,
    paddingBottom: 4,
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  weekContainer: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    justifyContent: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: DAY_ITEM_GAP,
  },
  dateItem: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    width: DAY_ITEM_WIDTH,
    height: 62,
  },
  dateItemActive: {
    backgroundColor: '#ff4747',
  },
  dateItemPast: {
    backgroundColor: '#fafafa',
    opacity: 0.6,
  },
  dateContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  dayName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  dayNameActive: {
    color: 'white',
  },
  dayNamePast: {
    color: '#bbb',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dayNumberActive: {
    color: 'white',
  },
  dayNumberPast: {
    color: '#bbb',
  },
  dateFooter: {
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  classDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#666',
  },
  classDotActive: {
    backgroundColor: 'white',
  },
  classDotPast: {
    backgroundColor: '#ccc',
  },
});
