import React, { memo, ReactNode, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SlidersHorizontalIcon, MapIcon } from 'lucide-react-native';

import { useTypedTranslation } from '../i18n/typed';

interface FilterBarProps {
  leading?: ReactNode;
  onPressFilters: () => void;
  activeFilterCount?: number;
  showMapToggle?: boolean;
  isMapView?: boolean;
  onMapToggle?: () => void;
}

export const FilterBar = memo<FilterBarProps>(({
  leading,
  onPressFilters,
  activeFilterCount = 0,
  showMapToggle = false,
  isMapView = false,
  onMapToggle,
}) => {
  const { t } = useTypedTranslation();

  const isFilterActive = activeFilterCount > 0;

  const filterLabel = useMemo(() => {
    if (!isFilterActive) {
      return t('explore.filters');
    }

    return `${t('explore.filters')} (${activeFilterCount})`;
  }, [activeFilterCount, isFilterActive, t]);

  return (
    <View style={styles.container}>
      <View style={[styles.toolbar, !leading && styles.toolbarNoLeading]}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.filterButton, isFilterActive && styles.filterButtonActive]}
            onPress={onPressFilters}
            accessibilityRole="button"
            accessibilityLabel={filterLabel}
          >
            <SlidersHorizontalIcon
              size={16}
              color={isFilterActive ? '#ffffff' : '#1f2937'}
            />
            <Text
              style={[styles.filterButtonLabel, isFilterActive && styles.filterButtonLabelActive]}
            >
              {filterLabel}
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
    </View>
  );
});

FilterBar.displayName = 'FilterBar';

const styles = StyleSheet.create({
  container: {},
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
});
