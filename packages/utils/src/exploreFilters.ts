export const EXPLORE_CATEGORY_FILTERS = [
  { id: 'fitness', label: 'Fitness', tag: 'fitness' },
  { id: 'yoga', label: 'Yoga', tag: 'yoga' },
  { id: 'dance', label: 'Dance', tag: 'dance' },
  { id: 'martial_arts', label: 'Martial Arts', tag: 'martial arts' },
  { id: 'swimming', label: 'Swimming', tag: 'swimming' },
] as const;

export type ExploreCategoryFilter = (typeof EXPLORE_CATEGORY_FILTERS)[number];
export type ExploreCategoryId = ExploreCategoryFilter['id'];

const CATEGORY_MAP: Record<ExploreCategoryId, ExploreCategoryFilter> = EXPLORE_CATEGORY_FILTERS.reduce(
  (acc, category) => {
    acc[category.id] = category;
    return acc;
  },
  {} as Record<ExploreCategoryId, ExploreCategoryFilter>
);

export const EXPLORE_CATEGORY_IDS: ExploreCategoryId[] = Object.keys(CATEGORY_MAP) as ExploreCategoryId[];

export function getExploreCategoryLabel(id: ExploreCategoryId): string {
  return CATEGORY_MAP[id]?.label ?? id;
}

export function getExploreCategoryTag(id: ExploreCategoryId): string {
  return CATEGORY_MAP[id]?.tag ?? id;
}

export function isExploreCategoryId(value: string): value is ExploreCategoryId {
  return Boolean(value && value in CATEGORY_MAP);
}
