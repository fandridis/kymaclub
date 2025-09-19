import { create } from 'zustand';
import { ExploreCategoryId } from '@repo/utils/exploreFilters';

export interface FilterOptions {
  searchQuery: string;
  categories: ExploreCategoryId[];
  priceRange: { min: number; max: number };
  rating: number;
  distanceKm: number;
}

export const DEFAULT_FILTERS: FilterOptions = {
  searchQuery: '',
  categories: [],
  priceRange: { min: 0, max: 100 },
  rating: 0,
  distanceKm: 0,
};

interface ExploreFiltersState {
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  setCategories: (categories: ExploreCategoryId[]) => void;
  setDistanceKm: (distanceKm: number) => void;
  resetFilters: () => void;
}

export const useExploreFiltersStore = create<ExploreFiltersState>((set) => ({
  filters: { ...DEFAULT_FILTERS },
  setFilters: (filters) =>
    set({
      filters: {
        ...filters,
        categories: [...filters.categories],
        distanceKm: filters.distanceKm,
      },
    }),
  setCategories: (categories) =>
    set((state) => ({
      filters: {
        ...state.filters,
        categories: [...categories],
      },
    })),
  setDistanceKm: (distanceKm) =>
    set((state) => ({
      filters: {
        ...state.filters,
        distanceKm,
      },
    })),
  resetFilters: () =>
    set({
      filters: {
        ...DEFAULT_FILTERS,
        categories: [...DEFAULT_FILTERS.categories],
        distanceKm: DEFAULT_FILTERS.distanceKm,
      },
    }),
}));

export function countActiveFilters(filters: FilterOptions): number {
  let count = filters.categories.length;
  if (filters.distanceKm > 0) {
    count += 1;
  }
  return count;
}
