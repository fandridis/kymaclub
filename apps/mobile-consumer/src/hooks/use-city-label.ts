import { useTypedTranslation } from '../i18n/typed';
import { getCityLabel } from '@repo/utils/constants';
import type { CitySlug } from '@repo/utils/constants';

/**
 * Hook to get translated city label from city slug
 * @param citySlug - The city slug (e.g., "athens")
 * @returns The translated city name or English fallback if translation not found
 */
export function useCityLabel(citySlug: CitySlug | undefined | null): string {
    const { t } = useTypedTranslation();

    if (!citySlug) return '';

    // Map city slug to translation key
    const translationKey = `cities.${citySlug}` as const;

    // Try to get translation
    const translated = t(translationKey);

    // If translation returns the key itself (not translated), fallback to English label
    if (translated === translationKey) {
        return getCityLabel(citySlug);
    }

    return translated;
}

