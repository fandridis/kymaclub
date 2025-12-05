/**
 * Venue category types (type of business/studio)
 */

export const VENUE_CATEGORIES = [
  "yoga_studio",
  "fitness_center",
  "dance_studio",
  "pilates_studio",
  "swimming_facility",
  "martial_arts_studio",
  "climbing_gym",
  "crossfit_box",
  "wellness_center",
  "outdoor_fitness",
  "personal_training",
  "rehabilitation_center",
  "creative_studio",
  "sport_facility"
] as const;

export type VenueCategory = typeof VENUE_CATEGORIES[number];

/**
 * Check if a string is a valid venue category
 */
export function isValidVenueCategory(category: string): category is VenueCategory {
  return VENUE_CATEGORIES.includes(category as VenueCategory);
}

/**
 * Get i18n translation key for a venue category
 */
export function getVenueCategoryTranslationKey(category: VenueCategory | string): string {
  return `venueCategories.${category}`;
}

/**
 * Class category types (type of activity/class)
 * These are different from venue categories - a yoga_studio (venue) offers yoga (class category)
 */
export const CLASS_CATEGORIES = [
  "yoga",
  "pilates",
  "strength",
  "cardio",
  "hiit",
  "dance",
  "martial_arts",
  "swimming",
  "cycling",
  "crossfit",
  "barre",
  "meditation",
  "breathwork",
  "climbing",
  "boxing",
  "functional_training",
  "stretching",
  "aqua_fitness",
  "running",
  "personal_training",
  "workshop",
  "art",
  "cooking",
  "rehabilitation",
  "other"
] as const;

export type ClassCategory = typeof CLASS_CATEGORIES[number];

/**
 * Check if a string is a valid class category
 */
export function isValidClassCategory(category: string): category is ClassCategory {
  return CLASS_CATEGORIES.includes(category as ClassCategory);
}

/**
 * Get i18n translation key for a class category
 */
export function getClassCategoryTranslationKey(category: ClassCategory | string): string {
  return `classCategories.${category}`;
}

/**
 * City options for venue and user location selection
 */
export const CITY_OPTIONS = [
  {
    slug: "athens",
    label: "Athens",
  },
] as const;

export type CitySlug = typeof CITY_OPTIONS[number]["slug"];

/**
 * Return all city options (value/label) for select inputs
 */
export function getCityOptions(): Array<{ value: CitySlug; label: string }> {
  return CITY_OPTIONS.map((option) => ({
    value: option.slug,
    label: option.label,
  }));
}

/**
 * Find the city option metadata by slug
 */
export function getCityOption(slug: string) {
  return CITY_OPTIONS.find(
    (option) => option.slug === slug.trim().toLowerCase(),
  );
}

/**
 * Get the human-friendly label for a city slug
 */
export function getCityLabel(slug: string | undefined | null) {
  if (!slug) return "";
  return getCityOption(slug)?.label ?? "";
}

/**
 * Normalize arbitrary user input into a supported city slug
 */
export function normalizeCityInput(input: string | undefined | null): CitySlug | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  for (const option of CITY_OPTIONS) {
    const labelLower = option.label.toLowerCase();
    if (
      trimmed === option.slug ||
      trimmed === labelLower ||
      trimmed.includes(option.slug) ||
      trimmed.includes(labelLower)
    ) {
      return option.slug;
    }
  }

  return null;
}