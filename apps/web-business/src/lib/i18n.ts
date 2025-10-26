import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

export const AVAILABLE_LANGUAGES = ['en', 'el', 'lt'];

const DEFAULT_LANGUAGE = 'en';

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: DEFAULT_LANGUAGE,
        // defaultNS: 'dashboard',

        backend: {
            loadPath: import.meta.env.PROD
                ? '/locales/{{lng}}.json'
                : '/src/locales/{{lng}}.json',
        },

        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
        },

        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;