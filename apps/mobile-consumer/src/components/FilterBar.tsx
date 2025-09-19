import React, { memo, useState, useCallback, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SlidersHorizontalIcon, MapIcon } from 'lucide-react-native';
import { useTypedTranslation } from '../i18n/typed';

export interface FilterOptions {
  searchQuery: string;
  categories: string[];
  priceRange: { min: number; max: number };
  rating: number;
}

interface FilterBarProps {
  leading?: ReactNode;
  onFilterChange: (filters: FilterOptions) => void;
  showCategoryFilters?: boolean;
  showMapToggle?: boolean;
  isMapView?: boolean;
  onMapToggle?: () => void;
}

const BUSINESS_CATEGORIES = ['Fitness', 'Yoga', 'Dance', 'Martial Arts', 'Swimming'];

export const FilterBar = memo<FilterBarProps>(({
  leading,
  onFilterChange,
  showCategoryFilters = true,
  showMapToggle = false,
  isMapView = false,
  onMapToggle,
}) => {
  const { t } = useTypedTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleCategoryToggle = useCallback((category: string) => {
    setSelectedCategories(prev => {
      const updatedCategories = prev.includes(category)
        ? prev.filter(item => item !== category)
        : [...prev, category];

      onFilterChange({
        searchQuery: '',
        categories: updatedCategories,
        priceRange: { min: 0, max: 100 },
        rating: 0,
      });

      return updatedCategories;
    });
  }, [onFilterChange]);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    onFilterChange({
      searchQuery: '',
      categories: [],
      priceRange: { min: 0, max: 100 },
      rating: 0,
    });
  }, [onFilterChange]);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const hasActiveFilters = selectedCategories.length > 0;
  const isFilterActive = showFilters || hasActiveFilters;

  return (
    <View style={styles.container}>
      <View style={[styles.toolbar, !leading && styles.toolbarNoLeading]}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.filterButton, isFilterActive && styles.filterButtonActive]}
            onPress={toggleFilters}
            accessibilityRole="button"
            accessibilityLabel={t('explore.filters')}
          >
            <SlidersHorizontalIcon
              size={16}
              color={isFilterActive ? '#ffffff' : '#1f2937'}
            />
            <Text
              style={[styles.filterButtonLabel, isFilterActive && styles.filterButtonLabelActive]}
            >
              {t('explore.filters')}
            </Text>
          </TouchableOpacity>

          {showMapToggle && onMapToggle && (
            <TouchableOpacity
              style={[styles.mapButton, isMapView && styles.mapButtonActive]}
              onPress={onMapToggle}
              accessibilityRole="button"
              accessibilityLabel={isMapView ? t('explore.showList') : t('explore.showMap')}
            >
              <MapIcon size={16} color={isMapView ? '#ffffff' : '#1f2937'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          {showCategoryFilters && (
            <View style={styles.filterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryContainer}>
                  {BUSINESS_CATEGORIES.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[styles.categoryChip, selectedCategories.includes(category) && styles.categoryChipActive]}
                      onPress={() => handleCategoryToggle(category)}
                    >
                      <Text
                        style={[styles.categoryChipText, selectedCategories.includes(category) && styles.categoryChipTextActive]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearFilters} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear all filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

FilterBar.displayName = 'FilterBar';

const styles = StyleSheet.create({
  container: {
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  toolbarNoLeading: {
    justifyContent: 'flex-end',
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f4f4f5',
  },
  filterButtonActive: {
    backgroundColor: '#ff4747',
  },
  filterButtonLabel: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  filterButtonLabelActive: {
    color: '#ffffff',
  },
  mapButton: {
    padding: 8,
    borderRadius: 14,
    backgroundColor: '#f4f4f5',
  },
  mapButtonActive: {
    backgroundColor: '#ff4747',
  },
  filtersContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 10,
  },
  filterRow: {
    gap: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  categoryChipActive: {
    backgroundColor: '#ff4747',
    borderColor: '#ff4747',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4b5563',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  clearFilters: {
    alignSelf: 'flex-start',
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff4747',
  },
});
