import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useClassInstances } from '../hooks/use-class-instances';
import { ClassCard } from './ClassCard';
import type { ClassInstance } from '../hooks/use-class-instances';
import { useTypedTranslation } from '../i18n/typed';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation';
import { theme } from '../theme';

interface ClassesListProps {
  selectedDate: string;
  searchFilters: {
    searchQuery: string;
    categories: string[];
  };
}

export function ClassesList({ selectedDate, searchFilters }: ClassesListProps) {
  const { t } = useTypedTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [filteredClasses, setFilteredClasses] = useState<ClassInstance[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get class instances for the selected date
  const selectedDateStart = useMemo(() => {
    const date = new Date(selectedDate);
    const now = new Date();

    // If selected date is today, use current time as start to filter out past classes
    if (date.toDateString() === now.toDateString()) {
      return now.getTime();
    }

    // For future dates, start from midnight
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, [selectedDate]);

  const selectedDateEnd = useMemo(() => {
    const date = new Date(selectedDate);
    date.setHours(23, 59, 59, 999);
    return date.getTime();
  }, [selectedDate]);

  const { classInstances, loading: classInstancesLoading } = useClassInstances({
    startDate: selectedDateStart,
    endDate: selectedDateEnd,
    includeBookingStatus: true, // Enable booking status for consumer app
  });

  // Apply filters with debounce
  const applyFilters = useCallback(() => {
    const { searchQuery, categories } = searchFilters;

    const filtered = classInstances.filter((instance) => {
      const name = instance.name?.toLowerCase() ?? '';
      const business = instance.venueSnapshot?.name?.toLowerCase() ?? '';
      const tags = (instance.tags ?? []).map((t) => t.toLowerCase());

      const q = (searchQuery ?? '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || business.includes(q) || tags.some((t) => t.includes(q));
      const matchesCategory = categories.length === 0 || categories.some((cat) => tags.includes(cat.toLowerCase()));

      return matchesSearch && matchesCategory;
    });

    setFilteredClasses(filtered);
  }, [classInstances, searchFilters]);

  // Debounced filtering
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [applyFilters]);

  // Initialize filtered classes when data first loads
  useEffect(() => {
    if (classInstances.length > 0 || (!classInstancesLoading && classInstances.length === 0)) {
      setFilteredClasses(classInstances);
    }
  }, [classInstances.length, classInstancesLoading, classInstances]);

  const renderClassItem = useCallback(({ item }: { item: ClassInstance }) => (
    <ClassCard
      classInstance={item}
      onPress={(classInstance) =>
        navigation.navigate('ClassDetailsModal', { classInstance })
      }
    />
  ), [navigation]);

  if (classInstancesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4747" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }


  return (
    <FlashList
      data={filteredClasses}
      renderItem={renderClassItem}
      keyExtractor={item => item._id}
      getItemType={() => 'class'}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('explore.noClasses')}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: theme.colors.zinc[500],
  },
  listContainer: {
    paddingHorizontal: 0,
    paddingBottom: 70,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.zinc[500],
    textAlign: 'center',
  },
});