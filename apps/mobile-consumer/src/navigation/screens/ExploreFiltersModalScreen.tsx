import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { X, SlidersHorizontalIcon } from 'lucide-react-native';

import { useTypedTranslation } from '../../i18n/typed';
import { theme } from '../../theme';
import {
  EXPLORE_CATEGORY_FILTERS,
  ExploreCategoryId,
  isExploreCategoryId,
} from '@repo/utils/exploreFilters';
import { useExploreFiltersStore } from '../../stores/explore-filters-store';

function areCategoryArraysEqual(a: ExploreCategoryId[], b: ExploreCategoryId[]) {
  if (a.length !== b.length) {
    return false;
  }

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  return sortedA.every((value, index) => value === sortedB[index]);
}

export function ExploreFiltersModalScreen() {
  const navigation = useNavigation();
  const { t } = useTypedTranslation();

  const filters = useExploreFiltersStore((state) => state.filters);
  const setCategories = useExploreFiltersStore((state) => state.setCategories);
  const initialFiltersRef = useRef({
    categories: [...filters.categories],
  });

  const availableCategories = useMemo(
    () =>
      EXPLORE_CATEGORY_FILTERS.filter(({ id }) => isExploreCategoryId(id)).map(({ id, label }) => ({
        id,
        label,
      })),
    [],
  );

  const [selectedCategories, setSelectedCategories] = useState<ExploreCategoryId[]>(
    filters.categories.filter(isExploreCategoryId)
  );

  const closeModal = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleApply = useCallback(() => {
    setCategories(selectedCategories);
    navigation.goBack();
  }, [navigation, selectedCategories, setCategories]);

  const handleClear = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  const toggleCategory = useCallback((categoryId: ExploreCategoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  const hasSelectedCategories = selectedCategories.length > 0;
  const hasAppliedFilters = hasSelectedCategories;
  const hasChanges = useMemo(
    () => !areCategoryArraysEqual(selectedCategories, initialFiltersRef.current.categories),
    [selectedCategories]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <SlidersHorizontalIcon size={18} color={theme.colors.zinc[900]} />
          <Text style={styles.headerTitle}>{t('explore.filters')}</Text>
        </View>

        <View style={styles.headerActions}>
          {hasAppliedFilters && (
            <TouchableOpacity onPress={handleClear} accessibilityRole="button">
              <Text style={styles.clearText}>{t('common.clearAll')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={closeModal} accessibilityRole="button" style={styles.closeButton}>
            <X size={18} color={theme.colors.zinc[600]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('explore.categories')}</Text>
          <View style={styles.chipsContainer}>
            {availableCategories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleCategory(category.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.applyButton, !hasChanges && styles.applyButtonInactive]}
          onPress={handleApply}
          accessibilityRole="button"
          disabled={!hasChanges}
        >
          <Text style={styles.applyButtonLabel}>
            {hasSelectedCategories
              ? t('explore.applyFilters', { count: selectedCategories.length })
              : t('explore.applyFiltersNoCount')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.zinc[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.zinc[200],
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.zinc[900],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearText: {
    fontSize: 14,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.rose[500],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.zinc[200],
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.zinc[700],
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.zinc[200],
    backgroundColor: theme.colors.zinc[100],
  },
  chipSelected: {
    backgroundColor: theme.colors.emerald[500],
    borderColor: theme.colors.emerald[500],
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.zinc[600],
  },
  chipLabelSelected: {
    color: theme.colors.zinc[50],
  },
  footer: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.zinc[200],
  },
  applyButton: {
    backgroundColor: theme.colors.emerald[500],
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonInactive: {
    backgroundColor: theme.colors.zinc[300],
  },
  applyButtonLabel: {
    fontSize: 16,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.zinc[50],
  },
});
