import React, { useMemo } from 'react';
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
import { calculateDistance, sortByDistance } from '../utils/location';
import { useCurrentUser } from '../hooks/useCurrentUser';

interface ClassesListProps {
  selectedDate: string;
  searchFilters: {
    searchQuery: string;
    categories: ExploreCategoryId[];
  };
  userLocation: Location.LocationObject | null;
}

export function ClassesList({ selectedDate, searchFilters, userLocation }: ClassesListProps) {
  const { t } = useTypedTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user } = useCurrentUser();
  const userCity = user?.activeCitySlug;
  type ClassWithDistance = ClassInstance & { distance: number };

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
    cityFilter: userCity,
  });

  // Apply filters and calculate distances
  const filteredAndSortedClasses = useMemo<ClassWithDistance[]>(() => {
    const { searchQuery, categories } = searchFilters;

    // Filter by search query and categories
    let filtered = classInstances.filter((instance) => {
      const name = instance.name?.toLowerCase() ?? '';
      const business = instance.venueSnapshot?.name?.toLowerCase() ?? '';
      const tags = (instance.tags ?? []).map((t) => t.toLowerCase());

      const q = (searchQuery ?? '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || business.includes(q) || tags.some((t) => t.includes(q));

      // Filter by primaryCategory similar to VenuesSection
      const matchesCategory = (() => {
        if (categories.length === 0) {
          return true;
        }

        const primaryCategory = instance.primaryCategory || instance.templateSnapshot?.primaryCategory;
        return (
          typeof primaryCategory === 'string' &&
          categories.includes(primaryCategory as ExploreCategoryId)
        );
      })();

      return matchesSearch && matchesCategory;
    });

    // Calculate distances if user location is available
    if (userLocation) {
      const withDistances: ClassWithDistance[] = filtered.map((instance) => {
        const venueAddress = instance.venueSnapshot?.address;
        const lat = typeof venueAddress?.latitude === 'number' ? venueAddress.latitude : null;
        const lng = typeof venueAddress?.longitude === 'number' ? venueAddress.longitude : null;

        if (lat !== null && lng !== null && isFinite(lat) && isFinite(lng)) {
          const distance = calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            lat,
            lng
          );
          return { ...instance, distance };
        }
        return { ...instance, distance: Infinity };
      });

      // Sort by distance (closest first)
      return sortByDistance(withDistances);
    }

    return sortByDistance(
      filtered.map((instance) => ({
        ...instance,
        distance: Infinity,
      })),
    );
  }, [classInstances, searchFilters, userLocation]);

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
      data={filteredAndSortedClasses}
      renderItem={({ item }) => (
        <ClassCard
          classInstance={item}
          distance={item.distance !== undefined && item.distance !== Infinity ? item.distance : undefined}
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.zinc[500],
    textAlign: 'center',
  },
});
