import { create } from 'zustand';
import { ExploreCategoryId } from '@repo/utils/exploreFilters';

export interface FilterOptions {
  searchQuery: string;
  categories: ExploreCategoryId[];
  priceRange: { min: number; max: number };
  rating: number;
}

export const DEFAULT_FILTERS: FilterOptions = {
  searchQuery: '',
  categories: [],
  priceRange: { min: 0, max: 100 },
  rating: 0,
};

interface ExploreFiltersState {
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  setCategories: (categories: ExploreCategoryId[]) => void;
  resetFilters: () => void;
}

export const useExploreFiltersStore = create<ExploreFiltersState>((set) => ({
  filters: { ...DEFAULT_FILTERS },
  setFilters: (filters) =>
    set({
      filters: {
        ...filters,
        categories: [...filters.categories],
      },
    }),
  setCategories: (categories) =>
    set((state) => ({
      filters: {
        ...state.filters,
        categories: [...categories],
      },
    })),
  resetFilters: () =>
    set({
      filters: {
        ...DEFAULT_FILTERS,
        categories: [...DEFAULT_FILTERS.categories],
      },
    }),
}));

export function countActiveFilters(filters: FilterOptions): number {
  return filters.categories.length;
}
