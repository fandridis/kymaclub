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