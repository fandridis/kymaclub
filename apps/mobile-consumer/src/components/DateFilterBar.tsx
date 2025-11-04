import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { el } from 'date-fns/locale/el';
import { lt } from 'date-fns/locale/lt';
import { useTypedTranslation } from '../i18n/typed';
import i18n from '../i18n';

export interface DateFilterOptions {
  selectedDate: string; // Format: YYYY-MM-DD
}

interface DateFilterBarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const DAYS_AHEAD = 14; // Show today + 14 days ahead

// Map i18next language codes to date-fns locales
const getDateFnsLocale = (language: string) => {
  switch (language) {
    case 'el':
      return el;
    case 'lt':
      return lt;
    case 'en':
    default:
      return enUS;
  }
};

export const DateFilterBar = memo<DateFilterBarProps>(({ selectedDate, onDateChange }) => {
  const { t } = useTypedTranslation();

  // Generate dates for today + 14 days forward
  // Note: i18n.language is read inside useMemo to ensure it uses current value
  // Component will re-render when language changes due to react-i18next subscription
  const dates = useMemo(() => {
    const currentLanguage = i18n.language || 'en';
    const dateFnsLocale = getDateFnsLocale(currentLanguage);
    const today = new Date();
    const dateList = [];

    for (let i = 0; i <= DAYS_AHEAD; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const dayName = i === 0
        ? t('common.today')
        : format(date, 'EEE', { locale: dateFnsLocale });
      const dayNumber = date.getDate();

      dateList.push({
        dateStr,
        dayName,
        dayNumber,
        isToday: i === 0,
      });
    }

    return dateList;
  }, [t]); // t triggers re-render when language changes via react-i18next

  const handleDatePress = useCallback((dateStr: string) => {
    onDateChange(dateStr);
  }, [onDateChange]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map((date) => (
          <TouchableOpacity
            key={date.dateStr}
            style={[
              styles.dateItem,
              selectedDate === date.dateStr && styles.dateItemActive,
            ]}
            onPress={() => handleDatePress(date.dateStr)}
          >
            <Text
              style={[
                styles.dayName,
                selectedDate === date.dateStr && styles.dayNameActive,
              ]}
            >
              {date.dayName}
            </Text>
            <Text
              style={[
                styles.dayNumber,
                selectedDate === date.dateStr && styles.dayNumberActive,
              ]}
            >
              {date.dayNumber}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

DateFilterBar.displayName = 'DateFilterBar';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dateItem: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    minWidth: 56,
  },
  dateItemActive: {
    backgroundColor: '#ff4747',
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  dayNameActive: {
    color: 'white',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  dayNumberActive: {
    color: 'white',
  },
});