import { QRScanResult, QRScannerError, QRScannerErrorType } from './types';

/**
 * Basic QR code data validators
 */
export class QRValidator {
    /**
     * Validates if the scanned data is not empty
     */
    static isNotEmpty(data: string): boolean {
        return !!data && data.trim().length > 0;
    }

    /**
     * Validates if the scanned data is a valid URL
     */
    static isValidUrl(data: string): boolean {
        try {
            new URL(data);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validates if the scanned data matches a specific pattern
     */
    static matchesPattern(data: string, pattern: RegExp): boolean {
        return pattern.test(data);
    }

    /**
     * Validates if the scanned data is a valid JSON
     */
    static isValidJson(data: string): boolean {
        try {
            JSON.parse(data);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validates if the scanned data has a minimum length
     */
    static hasMinLength(data: string, minLength: number): boolean {
        return data.length >= minLength;
    }

    /**
     * Validates if the scanned data has a maximum length
     */
    static hasMaxLength(data: string, maxLength: number): boolean {
        return data.length <= maxLength;
    }

    /**
     * Validates if the scanned data contains specific prefixes
     */
    static hasPrefix(data: string, prefixes: string[]): boolean {
        return prefixes.some(prefix => data.startsWith(prefix));
    }

    /**
     * Composite validator that combines multiple validation rules
     */
    static createCompositeValidator(
        validators: Array<(data: string) => boolean>
    ) {
        return (data: string): boolean => {
            return validators.every(validator => validator(data));
        };
    }
}

/**
 * Common QR code validators for typical use cases
 */
export const CommonValidators = {
    /**
     * Validates ticket QR codes (example format: TICKET-12345)
     */
    ticketQR: (data: string): boolean => {
        return QRValidator.matchesPattern(data, /^TICKET-\d+$/i);
    },

    /**
     * Validates URL-based QR codes
     */
    urlQR: (data: string): boolean => {
        return QRValidator.isValidUrl(data);
    },

    /**
     * Validates general text QR codes with length constraints
     */
    textQR: (data: string): boolean => {
        return QRValidator.isNotEmpty(data) &&
            QRValidator.hasMinLength(data, 1) &&
            QRValidator.hasMaxLength(data, 1000);
    },

    /**
     * Validates JSON-formatted QR codes
     */
    jsonQR: (data: string): boolean => {
        return QRValidator.isValidJson(data);
    },
};

/**
 * Processes and validates a scanned QR code result
 */
export const processQRScanResult = async (
    result: any, // BarcodeScanningResult from expo-camera
    validator?: (data: string) => boolean | Promise<boolean>
): Promise<QRScanResult> => {
    const scanResult: QRScanResult = {
        data: result.data,
        type: result.type,
        bounds: result.bounds,
        timestamp: Date.now(),
    };

    // Apply validation if provided
    if (validator) {
        try {
            const isValid = await validator(scanResult.data);
            if (!isValid) {
                throw new QRScannerError(
                    QRScannerErrorType.VALIDATION_FAILED,
                    'QR code validation failed'
                );
            }
        } catch (error) {
            if (error instanceof QRScannerError) {
                throw error;
            }
            throw new QRScannerError(
                QRScannerErrorType.VALIDATION_FAILED,
                'QR code validation error',
                error as Error
            );
        }
    }

    return scanResult;
};