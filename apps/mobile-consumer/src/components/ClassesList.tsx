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
import { ExploreCategoryId, getExploreCategoryTag } from '@repo/utils/exploreFilters';
import * as Location from 'expo-location';
import { calculateDistance } from '../utils/location';

interface ClassesListProps {
  selectedDate: string;
  searchFilters: {
    searchQuery: string;
    categories: ExploreCategoryId[];
    distanceKm: number;
  };
  userLocation: Location.LocationObject | null;
}

export function ClassesList({ selectedDate, searchFilters, userLocation }: ClassesListProps) {
  const { t } = useTypedTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [filteredClasses, setFilteredClasses] = useState<ClassInstance[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locationFilter = useMemo(() => {
    if (!userLocation || !searchFilters.distanceKm || searchFilters.distanceKm <= 0) {
      return undefined;
    }

    return {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
      maxDistanceKm: searchFilters.distanceKm,
    } as const;
  }, [userLocation, searchFilters.distanceKm]);

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
    locationFilter,
  });

  // Apply filters with debounce
  const applyFilters = useCallback(() => {
    const { searchQuery, categories, distanceKm } = searchFilters;
    const selectedCategoryTags = categories.map((categoryId) => getExploreCategoryTag(categoryId).toLowerCase());

    const filtered = classInstances.filter((instance) => {
      const name = instance.name?.toLowerCase() ?? '';
      const business = instance.venueSnapshot?.name?.toLowerCase() ?? '';
      const tags = (instance.tags ?? []).map((t) => t.toLowerCase());

      const q = (searchQuery ?? '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || business.includes(q) || tags.some((t) => t.includes(q));
      const matchesCategory = selectedCategoryTags.length === 0 || selectedCategoryTags.some((tag) => tags.includes(tag));

      const matchesDistance = (() => {
        if (!distanceKm || distanceKm <= 0 || !userLocation) {
          return true;
        }

        const venueAddress = instance.venueSnapshot?.address;
        const latitude = typeof venueAddress?.latitude === 'number' ? venueAddress.latitude : null;
        const longitude = typeof venueAddress?.longitude === 'number' ? venueAddress.longitude : null;

        if (latitude === null || longitude === null) {
          return true;
        }

        const distanceMeters = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          latitude,
          longitude
        );

        return distanceMeters <= distanceKm * 1000;
      })();

      return matchesSearch && matchesCategory && matchesDistance;
    });

    setFilteredClasses(filtered);
  }, [classInstances, searchFilters, userLocation]);

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
      renderItem={({ item }) => (
        <ClassCard
          classInstance={item}
          onPress={(classInstance) =>
            navigation.navigate('ClassDetailsModal', { classInstance })
          }
        />
      )}
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
    paddingHorizontal: 8,
    paddingTop: 8,
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
