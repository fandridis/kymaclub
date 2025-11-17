import { useMemo } from 'react';
import { useTypedTranslation } from '../i18n/typed';
import { getCityOptions } from '@repo/utils/constants';
import type { CitySlug } from '@repo/utils/constants';

/**
 * Hook to get city options with translated labels
 * @returns Array of city options with translated labels
 */
export function useCityOptions(): Array<{ value: CitySlug; label: string }> {
  const { t } = useTypedTranslation();
  
  return useMemo(() => {
    const options = getCityOptions();
    return options.map((option) => ({
      value: option.value,
      label: t(`cities.${option.value}` as const) || option.label,
    }));
  }, [t]);
}

