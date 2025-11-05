import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

export const AVAILABLE_LANGUAGES = ['en', 'el'];

const DEFAULT_LANGUAGE = 'en';

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: DEFAULT_LANGUAGE,
        // defaultNS: 'dashboard',

        backend: {
            loadPath: '/locales/{{lng}}.json',
            // loadPath: '/public/locales/{{lng}}/{{ns}}.json',
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