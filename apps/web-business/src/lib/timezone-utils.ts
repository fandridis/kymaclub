import { TZDate } from '@date-fns/tz';

/**
 * # Timezone Handling Strategy
 * 
 * This application follows a simple, consistent timezone approach:
 * 
 * ## Core Principle
 * - **Company timezone is the source of truth**
 * - All events are displayed in the company's timezone regardless of user's location
 * - Database stores UTC timestamps (best practice for international apps)
 * - We handle all timezone conversions manually (don't rely on browser/library defaults)
 * 
 * ## Data Flow
 * 1. **User Input**: User sees/inputs times in company timezone
 * 2. **Storage**: Convert to UTC for database storage
 * 3. **Display**: Convert UTC back to company timezone for display
 * 4. **Calendar**: FullCalendar displays company timezone times
 * 
 * ## Example (Greece company):
 * - User drags event to 11:30 AM → stored as 08:30 UTC → always displays as 11:30 AM Athens
 * - User in Dubai sees same event at 11:30 AM Athens (not 12:30 PM Dubai time)
 */


// ============================================================================
// Business-Specific Helpers
// ============================================================================

/**
 * Converts a UTC timestamp from the database to business timezone for display.
 * This is a convenience wrapper around convertUtcToTimezone for the common use case.
 * 
 * @param dbTimestamp - UTC timestamp from database (number or Date)
 * @param businessTimezone - The business's timezone
 * @returns Date object in business timezone for display
 */
export function dbTimestampToBusinessDate(dbTimestamp: number | Date, businessTimezone: string): Date {
    const utcDate = typeof dbTimestamp === 'number' ? new Date(dbTimestamp) : dbTimestamp;
    return convertUtcToTimezone(utcDate, businessTimezone);
}

/**
 * Converts a business timezone date to UTC timestamp for database storage.
 * This is a convenience wrapper around convertTimezoneToUtc for the common use case.
 * 
 * @param businessDate - Date in business timezone
 * @param businessTimezone - The business's timezone
 * @returns UTC timestamp for database storage
 */
export function businessDateToDbTimestamp(businessDate: Date, businessTimezone: string): number {
    return convertTimezoneToUtc(businessDate, businessTimezone).getTime();
}

/**
 * Converts a business timezone date to UTC Date object for database storage.
 * This is a convenience wrapper for when you need a Date object instead of timestamp.
 * 
 * @param businessDate - Date in business timezone  
 * @param businessTimezone - The business's timezone
 * @returns UTC Date object for database storage
 */
export function businessDateToDbDate(businessDate: Date, businessTimezone: string): Date {
    return convertTimezoneToUtc(businessDate, businessTimezone);
}


// ============================================================================
// UTC Helpers
// ============================================================================

/**
 * Converts a UTC timestamp to a specific timezone while preserving the local time representation.
 * 
 * @param utcDate - UTC Date object or timestamp from database
 * @param timezone - Target timezone (e.g., 'Europe/Athens')
 * @returns Date object representing the same moment in the target timezone
 */
export function convertUtcToTimezone(utcDate: Date, timezone: string): Date {
    // Create a TZDate in the target timezone from the UTC date
    return new TZDate(utcDate.getTime(), timezone);
}

/**
 * Converts a local time in a specific timezone to UTC for database storage.
 * 
 * @param localDate - Date object with time components representing the target timezone
 * @param timezone - Source timezone (e.g., 'Europe/Athens')
 * @returns Date object in UTC for database storage
 */
export function convertTimezoneToUtc(localDate: Date, timezone: string): Date {
    // Create a TZDate from the local date components, treating them as if they're in the target timezone
    const tzDate = new TZDate(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        localDate.getHours(),
        localDate.getMinutes(),
        localDate.getSeconds(),
        localDate.getMilliseconds(),
        timezone
    );

    // Return as regular Date (which will be in UTC)
    return new Date(tzDate.getTime());
}