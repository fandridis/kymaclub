import { TFunction } from 'i18next';

/**
 * Get the translated label for a service/category
 * Special rule: "yoga" is kept as-is in all languages
 * All other services are translated
 */
export const getServiceLabel = (service: string, t: TFunction): string => {
    // Keep "yoga" as-is
    if (service === 'yoga' || service.toLowerCase() === 'yoga') {
        return 'Yoga';
    }

    // Translate all other services
    const serviceKey = `services.${service}` as const;
    return t(serviceKey, { defaultValue: service.charAt(0).toUpperCase() + service.slice(1) });
};

