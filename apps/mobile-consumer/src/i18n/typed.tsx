// src/i18n/typed.ts - Typed i18n setup for this app
import { createTypedI18n, type ExtractTranslationKeys } from './i18n-typed';
import { Trans as TransOriginal } from 'react-i18next';
import en from '../locales/en/translation.json';

// Create the typed hooks ONCE for this app
export const {
  useTypedTranslation,
  createTypedT,
  useTypedTranslationWithNS
} = createTypedI18n(en);

// Export the translation keys type for this app
export type TranslationKeys = ExtractTranslationKeys<typeof en>;

// Create typed Trans component locally in the app
export const TypedTrans = (props: Omit<React.ComponentProps<typeof TransOriginal>, 'i18nKey'> & {
  i18nKey: TranslationKeys
}) => <TransOriginal {...props} />;

// Module augmentation for react-i18next to enable global type safety
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
  }
}   