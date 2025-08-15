// packages/utils/src/i18n-typed.ts - Type-safe i18next wrapper with full autocomplete support

import { useTranslation as useTranslationOriginal, type UseTranslationResponse } from 'react-i18next';

// Advanced type to extract all possible dot-notation paths from nested object
type DotNotationPaths<T, Path extends string = ''> = T extends object
    ? {
        [K in keyof T]: K extends string
        ? T[K] extends object
        ? DotNotationPaths<T[K], Path extends '' ? K : `${Path}.${K}`>
        : Path extends ''
        ? K
        : `${Path}.${K}`
        : never;
    }[keyof T]
    : never;

// Export the type utility for apps to use
export type ExtractTranslationKeys<T> = DotNotationPaths<T>;

// Factory function that creates typed hooks for any translation object
export function createTypedI18n<T extends Record<string, any>>(translations: T) {
    type TranslationKeys = DotNotationPaths<T>;

    // Create a strongly typed translation function type
    type TypedTFunction = {
        (key: TranslationKeys, options?: any): string;
        // Support for interpolation
        <O extends Record<string, any>>(key: TranslationKeys, options?: O): string;
    };

    // Create the typed hook with all react-i18next features preserved
    function useTypedTranslation(): Omit<UseTranslationResponse<'translation', undefined>, 't'> & {
        t: TypedTFunction;
    } {
        const original = useTranslationOriginal();

        return {
            ...original,
            t: original.t as TypedTFunction,
        };
    }

    // Create a standalone typed t function for use outside components
    function createTypedT(t: Function): TypedTFunction {
        return t as TypedTFunction;
    }

    // Hook with namespace support
    function useTypedTranslationWithNS<N extends string>(
        ns?: N
    ): Omit<UseTranslationResponse<N, undefined>, 't'> & {
        t: TypedTFunction;
    } {
        const original = useTranslationOriginal(ns);

        return {
            ...original,
            t: original.t as TypedTFunction,
        };
    }

    return {
        useTypedTranslation,
        createTypedT,
        useTypedTranslationWithNS,
    };
}