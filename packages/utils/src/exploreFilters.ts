import {
  VENUE_CATEGORIES,
  VenueCategory,
  getVenueCategoryTranslationKey,
} from './constants';

export type ExploreCategoryId = VenueCategory;

export const EXPLORE_CATEGORY_IDS: ExploreCategoryId[] = [...VENUE_CATEGORIES];

/**
 * Get the i18n translation key for an explore category
 * Use with t() from i18next: t(getExploreCategoryTranslationKey(id))
 */
export function getExploreCategoryTranslationKey(id: ExploreCategoryId): string {
  return getVenueCategoryTranslationKey(id);
}

export function isExploreCategoryId(value: string): value is ExploreCategoryId {
  return VENUE_CATEGORIES.includes(value as VenueCategory);
}
