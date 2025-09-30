/**
 * Credits utility module for handling currency conversions and formatting
 * in a ClassPass-like application.
 * 
 * Note: All monetary values are stored and handled in cents to avoid 
 * floating-point precision issues.
 */

// Constants
export const CREDITS_TO_CENTS_RATIO = 50; // 1 credit = 50 cents (0.50 in business currency)
export const CENTS_PER_EURO = 100;
export const MIN_CREDITS = 0;
export const MAX_CREDITS = 1_000_000; // Reasonable upper limit to prevent overflow
export const DEFAULT_LOCALE = 'el-GR'; // Greek locale for euro formatting

// Custom error class for credits-related errors
export class CreditsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CreditsError';
    }
}

/**
 * Validates if a value is a finite, non-negative number
 * @throws {CreditsError} If the value is invalid
 */
const validateAmount = (value: number, fieldName: string): void => {
    if (typeof value !== 'number') {
        throw new CreditsError(`${fieldName} must be a number`);
    }

    if (!Number.isFinite(value)) {
        throw new CreditsError(`${fieldName} must be a finite number`);
    }

    if (value < 0) {
        throw new CreditsError(`${fieldName} cannot be negative`);
    }

    if (fieldName === 'Credits' && value > MAX_CREDITS) {
        throw new CreditsError(`${fieldName} exceeds maximum allowed value`);
    }
};

/**
 * Validates if a value is a valid integer (for cents)
 * @throws {CreditsError} If the value is not an integer
 */
const validateInteger = (value: number, fieldName: string): void => {
    validateAmount(value, fieldName);
    if (!Number.isInteger(value)) {
        throw new CreditsError(`${fieldName} must be an integer (cents)`);
    }
};

/**
 * Converts credits to cents
 * @param credits - Number of credits to convert
 * @returns Amount in cents
 * @throws {CreditsError} If credits is invalid
 */
export const creditsToCents = (credits: number): number => {
    validateAmount(credits, 'Credits');
    return Math.round(credits * CREDITS_TO_CENTS_RATIO);
};

/**
 * Converts cents to credits
 * @param cents - Amount in cents to convert
 * @returns Number of credits
 * @throws {CreditsError} If cents is invalid
 */
export const centsToCredits = (cents: number): number => {
    validateInteger(cents, 'Cents');
    return cents / CREDITS_TO_CENTS_RATIO;
};

/**
 * Converts cents to euros
 * @param cents - Amount in cents
 * @returns Amount in euros
 * @throws {CreditsError} If cents is invalid
 */
export const centsToEuros = (cents: number): number => {
    validateInteger(cents, 'Cents');
    return cents / CENTS_PER_EURO;
};

/**
 * Converts euros to cents
 * @param euros - Amount in euros
 * @returns Amount in cents
 * @throws {CreditsError} If euros is invalid
 */
export const eurosToCents = (euros: number): number => {
    validateAmount(euros, 'Euros');
    return Math.round(euros * CENTS_PER_EURO);
};

/**
 * Formats cents as a euro currency string
 * @param cents - Amount in cents to format
 * @param locale - Locale for formatting (defaults to 'el-GR')
 * @param options - Additional Intl.NumberFormat options
 * @returns Formatted currency string
 * @throws {CreditsError} If cents is invalid
 */
export const formatCentsAsEuros = (
    cents: number,
    locale: string = DEFAULT_LOCALE,
    options?: Partial<Intl.NumberFormatOptions>
): string => {
    validateInteger(cents, 'Cents');

    const euros = centsToEuros(cents);
    const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options
    });

    return formatter.format(euros);
};

/**
 * Formats credits with appropriate display (no currency symbol)
 * @param credits - Number of credits to format
 * @param locale - Locale for formatting (defaults to 'el-GR')
 * @returns Formatted credits string
 * @throws {CreditsError} If credits is invalid
 */
export const formatCredits = (
    credits: number,
    locale: string = DEFAULT_LOCALE
): string => {
    validateAmount(credits, 'Credits');

    const formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    return `${formatter.format(Math.round(credits))} credits`;
};

/**
 * Converts credits to cents and formats as euro currency string
 * @param credits - Number of credits to convert and format
 * @param locale - Locale for formatting (defaults to 'el-GR')
 * @returns Formatted euro currency string
 * @throws {CreditsError} If credits is invalid
 */
export const creditsToFormattedEuros = (
    credits: number,
    locale: string = DEFAULT_LOCALE
): string => {
    const cents = creditsToCents(credits);
    return formatCentsAsEuros(cents, locale);
};

/**
 * Rounds credits to the nearest whole number
 * @param credits - Number of credits to round
 * @returns Rounded credits
 * @throws {CreditsError} If credits is invalid
 */
export const roundCredits = (credits: number): number => {
    validateAmount(credits, 'Credits');
    return Math.round(credits);
};

/**
 * Checks if user has sufficient credits for a purchase
 * @param userCredits - User's current credit balance
 * @param requiredCredits - Credits required for purchase
 * @returns True if user has sufficient credits
 * @throws {CreditsError} If either value is invalid
 */
export const hasSufficientCredits = (
    userCredits: number,
    requiredCredits: number
): boolean => {
    validateAmount(userCredits, 'User credits');
    validateAmount(requiredCredits, 'Required credits');
    return userCredits >= requiredCredits;
};

/**
 * Checks if user has sufficient credits for a purchase priced in cents
 * @param userCredits - User's current credit balance
 * @param priceInCents - Price in cents
 * @returns True if user has sufficient credits
 * @throws {CreditsError} If either value is invalid
 */
export const hasSufficientCreditsForPrice = (
    userCredits: number,
    priceInCents: number
): boolean => {
    validateAmount(userCredits, 'User credits');
    validateInteger(priceInCents, 'Price in cents');

    const requiredCredits = centsToCredits(priceInCents);
    return userCredits >= requiredCredits;
};

/**
 * Calculates remaining credits after a purchase
 * @param userCredits - User's current credit balance
 * @param spentCredits - Credits to spend
 * @returns Remaining credits after purchase
 * @throws {CreditsError} If values are invalid or insufficient credits
 */
export const calculateRemainingCredits = (
    userCredits: number,
    spentCredits: number
): number => {
    validateAmount(userCredits, 'User credits');
    validateAmount(spentCredits, 'Spent credits');

    if (!hasSufficientCredits(userCredits, spentCredits)) {
        throw new CreditsError('Insufficient credits for this transaction');
    }

    return userCredits - spentCredits;
};

/**
 * Calculates remaining credits after a purchase priced in cents
 * @param userCredits - User's current credit balance
 * @param priceInCents - Price in cents
 * @returns Remaining credits after purchase
 * @throws {CreditsError} If values are invalid or insufficient credits
 */
export const calculateRemainingCreditsAfterPurchase = (
    userCredits: number,
    priceInCents: number
): number => {
    validateAmount(userCredits, 'User credits');
    validateInteger(priceInCents, 'Price in cents');

    const spentCredits = centsToCredits(priceInCents);

    if (!hasSufficientCredits(userCredits, spentCredits)) {
        throw new CreditsError('Insufficient credits for this transaction');
    }

    return userCredits - spentCredits;
};

/**
 * Creates a display string showing both credits and euro equivalent
 * @param credits - Number of credits
 * @param locale - Locale for formatting (defaults to 'el-GR')
 * @returns Display string like "100 credits (50,00 €)"
 * @throws {CreditsError} If credits is invalid
 */
export const formatCreditsWithEuros = (
    credits: number,
    locale: string = DEFAULT_LOCALE
): string => {
    const formattedCredits = formatCredits(credits, locale);
    const formattedEuros = creditsToFormattedEuros(credits, locale);
    return `${formattedCredits} (${formattedEuros})`;
};

/**
 * Creates a display string showing price in both cents/euros and credits
 * @param priceInCents - Price in cents
 * @param locale - Locale for formatting (defaults to 'el-GR')
 * @returns Display string like "50,00 € (100 credits)"
 * @throws {CreditsError} If price is invalid
 */
export const formatPriceWithCredits = (
    priceInCents: number,
    locale: string = DEFAULT_LOCALE
): string => {
    validateInteger(priceInCents, 'Price in cents');

    const formattedEuros = formatCentsAsEuros(priceInCents, locale);
    const credits = centsToCredits(priceInCents);
    const formattedCredits = Math.round(credits);

    return `${formattedEuros} (${formattedCredits} credits)`;
};

/**
 * Parses a euro amount from a formatted string and returns cents
 * @param formattedEuros - Formatted euro string (e.g., "1.234,56 €")
 * @returns Amount in cents
 * @throws {CreditsError} If parsing fails
 */
export const parseEurosToCents = (formattedEuros: string): number => {
    // Remove currency symbols and spaces
    const cleaned = formattedEuros.replace(/[€\s]/g, '');

    // Handle different decimal separators (comma vs period)
    // Assume last occurrence of comma or period is decimal separator
    const normalized = cleaned.replace(/,/g, match => {
        const lastComma = cleaned.lastIndexOf(',');
        const lastPeriod = cleaned.lastIndexOf('.');

        if (lastComma > lastPeriod) {
            // Comma is decimal separator
            return cleaned.indexOf(match) === lastComma ? '.' : '';
        } else {
            // Comma is thousands separator
            return '';
        }
    });

    const parsed = parseFloat(normalized);

    if (isNaN(parsed)) {
        throw new CreditsError('Invalid euro amount format');
    }

    validateAmount(parsed, 'Parsed euros');
    return eurosToCents(parsed);
};

/**
 * Batch converts an array of credit amounts to cents
 * @param creditsArray - Array of credit amounts
 * @returns Array of amounts in cents
 * @throws {CreditsError} If any credit amount is invalid
 */
export const batchCreditsToCents = (creditsArray: number[]): number[] => {
    return creditsArray.map(credits => creditsToCents(credits));
};

/**
 * Batch converts an array of cent amounts to credits
 * @param centsArray - Array of amounts in cents
 * @returns Array of credit amounts
 * @throws {CreditsError} If any cent amount is invalid
 */
export const batchCentsToCredits = (centsArray: number[]): number[] => {
    return centsArray.map(cents => centsToCredits(cents));
};

/**
 * Calculates total credits from an array
 * @param creditsArray - Array of credit amounts
 * @returns Total credits
 * @throws {CreditsError} If any credit amount is invalid
 */
export const sumCredits = (creditsArray: number[]): number => {
    const total = creditsArray.reduce((sum, credits) => {
        validateAmount(credits, 'Credits in array');
        return sum + credits;
    }, 0);

    validateAmount(total, 'Total credits');
    return total;
};

/**
 * Calculates total cents from an array
 * @param centsArray - Array of amounts in cents
 * @returns Total in cents
 * @throws {CreditsError} If any cent amount is invalid
 */
export const sumCents = (centsArray: number[]): number => {
    const total = centsArray.reduce((sum, cents) => {
        validateInteger(cents, 'Cents in array');
        return sum + cents;
    }, 0);

    validateInteger(total, 'Total cents');
    return total;
};

// Legacy support - mark as deprecated
/**
 * Converts credits to euros
 */
export const creditsToEuros = (credits: number): number => {
    const cents = creditsToCents(credits);
    return centsToEuros(cents);
};

/**
 * Converts euros to credit
 */
export const eurosToCredits = (euros: number): number => {
    const cents = eurosToCents(euros);
    return centsToCredits(cents);
};

/**
 * Converts credits to formatted euro string for display
 * @param credits - Number of credits to convert and format
 * @param locale - Locale for formatting (defaults to 'el-GR')
 * @returns Formatted euro string
 */
export const formatEuros = (
    credits: number,
    locale: string = DEFAULT_LOCALE
): string => {
    return creditsToFormattedEuros(credits, locale);
};

/**
 * Subscription pricing constants and utilities
 */
export const SUBSCRIPTION_BASE_PRICE_PER_CREDIT = 0.65; // Base price per credit for subscriptions

/**
 * Calculates subscription pricing with tiered discounts
 * @param credits - Number of credits per month
 * @returns Object with pricing details
 */
export const calculateSubscriptionPricing = (credits: number) => {
    validateAmount(credits, 'Credits');

    const basePricePerCredit = SUBSCRIPTION_BASE_PRICE_PER_CREDIT;
    let discount = 0;

    // Determine discount tier based on credit amount
    if (credits >= 450) {
        discount = 10; // 450-500 credits: 10% discount
    } else if (credits >= 300) {
        discount = 7;  // 300-445 credits: 7% discount
    } else if (credits >= 200) {
        discount = 5;  // 200-295 credits: 5% discount
    } else if (credits >= 100) {
        discount = 3;  // 100-195 credits: 3% discount
    } else {
        discount = 0;  // Up to 95 credits: no discount
    }

    // Calculate discounted price per credit
    const pricePerCredit = basePricePerCredit * (1 - discount / 100);
    const totalPrice = credits * pricePerCredit;
    const priceInCents = Math.round(totalPrice * 100);

    return {
        credits,
        priceInCents,
        pricePerCredit: Number(pricePerCredit.toFixed(3)),
        discount,
        basePricePerCredit
    };
};