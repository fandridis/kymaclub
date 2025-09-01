import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { appStorage } from '../utils/storage';
import en from '../locales/en/translation.json';
import el from '../locales/el/translation.json';
import lt from '../locales/lt/translation.json';

const resources = {
    en: { translation: en },
    el: { translation: el },
    lt: { translation: lt }
};

// Language detector using expo-localization
const languageDetector = {
    type: 'languageDetector' as const,
    async: true,
    detect: (callback: (language: string) => void) => {
        try {
            const savedLanguage = appStorage.getAppValue('userLanguage');
            if (savedLanguage) {
                return callback(savedLanguage);
            }

            // Use expo-localization to get device language
            const phoneLanguage = Localization.getLocales()[0].languageCode ?? 'en';
            callback(phoneLanguage);
        } catch (error) {
            callback('en');
        }
    },
    init: () => { },
    cacheUserLanguage: (language: string) => {
        try {
            appStorage.setAppValue('userLanguage', language);
        } catch (error) {
        }
    }
};

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v4',
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        },
        react: {
            useSuspense: false
        }
    });

export default i18n;