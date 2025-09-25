import {
  VENUE_CATEGORIES,
  VENUE_CATEGORY_DISPLAY_NAMES,
  VenueCategory,
} from './constants';

export type ExploreCategoryId = VenueCategory;

export interface ExploreCategoryFilter {
  id: ExploreCategoryId;
  label: string;
  tag: string;
}

export const EXPLORE_CATEGORY_FILTERS: ExploreCategoryFilter[] = VENUE_CATEGORIES.map((category) => ({
  id: category,
  label: VENUE_CATEGORY_DISPLAY_NAMES[category],
  tag: VENUE_CATEGORY_DISPLAY_NAMES[category].toLowerCase(),
}));

const CATEGORY_MAP: Record<ExploreCategoryId, ExploreCategoryFilter> = EXPLORE_CATEGORY_FILTERS.reduce(
  (acc, category) => {
    acc[category.id] = category;
    return acc;
  },
  {} as Record<ExploreCategoryId, ExploreCategoryFilter>
);

export const EXPLORE_CATEGORY_IDS: ExploreCategoryId[] = [...VENUE_CATEGORIES];

export function getExploreCategoryLabel(id: ExploreCategoryId): string {
  return CATEGORY_MAP[id]?.label ?? id;
}

export function getExploreCategoryTag(id: ExploreCategoryId): string {
  return CATEGORY_MAP[id]?.tag ?? id;
}

export function isExploreCategoryId(value: string): value is ExploreCategoryId {
  return VENUE_CATEGORIES.includes(value as VenueCategory);
}
