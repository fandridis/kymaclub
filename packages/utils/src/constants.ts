/**
 * Venue category types and display utilities
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
  "rehabilitation_center"
] as const;

export type VenueCategory = typeof VENUE_CATEGORIES[number];

export const VENUE_CATEGORY_DISPLAY_NAMES: Record<VenueCategory, string> = {
  yoga_studio: 'Yoga Studio',
  fitness_center: 'Fitness Center',
  dance_studio: 'Dance Studio',
  pilates_studio: 'Pilates Studio',
  swimming_facility: 'Swimming Facility',
  martial_arts_studio: 'Martial Arts Studio',
  climbing_gym: 'Climbing Gym',
  crossfit_box: 'CrossFit Box',
  wellness_center: 'Wellness Center',
  outdoor_fitness: 'Outdoor Fitness',
  personal_training: 'Personal Training',
  rehabilitation_center: 'Rehabilitation Center'
} as const;

/**
 * Get display name for a venue category
 */
export function getVenueCategoryDisplay(category: VenueCategory | string): string {
  return VENUE_CATEGORY_DISPLAY_NAMES[category as VenueCategory] || 'Fitness Center';
}

/**
 * Get all venue categories with their display names for form selects
 */
export function getVenueCategoryOptions(): Array<{ value: VenueCategory; label: string }> {
  return VENUE_CATEGORIES.map(category => ({
    value: category,
    label: VENUE_CATEGORY_DISPLAY_NAMES[category]
  }));
}

/**
 * Check if a string is a valid venue category
 */
export function isValidVenueCategory(category: string): category is VenueCategory {
  return VENUE_CATEGORIES.includes(category as VenueCategory);
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