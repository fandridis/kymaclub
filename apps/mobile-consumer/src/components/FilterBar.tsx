import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SearchIcon, SlidersHorizontalIcon, XIcon, MapIcon } from 'lucide-react-native';
import { useTypedTranslation } from '../i18n/typed';

export interface FilterOptions {
  searchQuery: string;
  categories: string[];
  priceRange: { min: number; max: number };
  rating: number;
}

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  showCategoryFilters?: boolean;
  showMapToggle?: boolean;
  isMapView?: boolean;
  onMapToggle?: () => void;
}

const { width } = Dimensions.get('window');

// Mock categories
const BUSINESS_CATEGORIES = ['Fitness', 'Yoga', 'Dance', 'Martial Arts', 'Swimming'];
const CLASS_CATEGORIES = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

export const FilterBar = memo<FilterBarProps>(({ 
  onFilterChange, 
  showCategoryFilters = true,
  showMapToggle = false,
  isMapView = false,
  onMapToggle 
}) => {
  const { t } = useTypedTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    onFilterChange({
      searchQuery: text,
      categories: selectedCategories,
      priceRange: { min: 0, max: 100 },
      rating: 0,
    });
  }, [selectedCategories, onFilterChange]);

  const handleCategoryToggle = useCallback((category: string) => {
    const updatedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(updatedCategories);
    onFilterChange({
      searchQuery,
      categories: updatedCategories,
      priceRange: { min: 0, max: 100 },
      rating: 0,
    });
  }, [searchQuery, selectedCategories, onFilterChange]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategories([]);
    onFilterChange({
      searchQuery: '',
      categories: [],
      priceRange: { min: 0, max: 100 },
      rating: 0,
    });
  }, [onFilterChange]);

  const hasActiveFilters = searchQuery.length > 0 || selectedCategories.length > 0;

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <SearchIcon size={16} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('explore.searchPlaceholder')}
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholderTextColor="#666"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleSearchChange('')}
            >
              <XIcon size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.toggleButtons}>
          <TouchableOpacity
            style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontalIcon size={16} color={showFilters ? 'white' : '#666'} />
          </TouchableOpacity>

          {showMapToggle && (
            <TouchableOpacity
              style={[styles.filterToggle, isMapView && styles.filterToggleActive]}
              onPress={onMapToggle}
            >
              <MapIcon size={16} color={isMapView ? 'white' : '#666'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Extended filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {showCategoryFilters && (
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>{t('explore.filters')}:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryContainer}>
                  {BUSINESS_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryFilter,
                        selectedCategories.includes(category) && styles.categoryFilterActive
                      ]}
                      onPress={() => handleCategoryToggle(category)}
                    >
                      <Text
                        style={[
                          styles.categoryFilterText,
                          selectedCategories.includes(category) && styles.categoryFilterTextActive
                        ]}
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
            <View style={styles.filterRow}>
              <TouchableOpacity style={styles.clearFilters} onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>Clear all filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

FilterBar.displayName = 'FilterBar';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterToggle: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  filterToggleActive: {
    backgroundColor: '#ff4747',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryFilterActive: {
    backgroundColor: '#ff4747',
    borderColor: '#ff4747',
  },
  categoryFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  categoryFilterTextActive: {
    color: 'white',
  },
  clearFilters: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#ff4747',
    fontWeight: '600',
  },
});