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
// Using type assertion to avoid complex union type computation from ComponentProps
type TransProps = React.ComponentProps<typeof TransOriginal>;
export const TypedTrans = (
  props: {
    i18nKey: TranslationKeys;
  } & Omit<TransProps, 'i18nKey'>
) => <TransOriginal {...(props as TransProps)} />;

// Module augmentation for react-i18next to enable global type safety
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
  }
}   