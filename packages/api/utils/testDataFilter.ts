import type { Doc } from "../convex/_generated/dataModel";

/**
 * Utility functions for filtering test data based on user tester status
 * 
 * Test data filtering rules:
 * - If user.isTester === true: Show all records (including test ones)
 * - If user.isTester !== true (false or undefined): Filter out records where isTest === true
 */

/**
 * Check if a user is a tester
 */
export function isUserTester(user: Doc<"users"> | null | undefined): boolean {
    return user?.isTester === true;
}

/**
 * Filter out test venues unless user is a tester
 */
export function filterTestVenues<T extends { isTest?: boolean }>(
    venues: T[],
    user: Doc<"users"> | null | undefined
): T[] {
    if (isUserTester(user)) {
        return venues; // Testers see everything
    }
    return venues.filter(venue => venue.isTest !== true);
}

/**
 * Filter out test class instances unless user is a tester
 */
export function filterTestClassInstances<T extends { isTest?: boolean }>(
    instances: T[],
    user: Doc<"users"> | null | undefined
): T[] {
    if (isUserTester(user)) {
        return instances; // Testers see everything
    }
    return instances.filter(instance => instance.isTest !== true);
}

/**
 * Check if a single venue should be visible to user
 */
export function isVenueVisible(
    venue: { isTest?: boolean },
    user: Doc<"users"> | null | undefined
): boolean {
    if (isUserTester(user)) {
        return true; // Testers see everything
    }
    return venue.isTest !== true;
}

/**
 * Check if a single class instance should be visible to user
 */
export function isClassInstanceVisible(
    instance: { isTest?: boolean },
    user: Doc<"users"> | null | undefined
): boolean {
    if (isUserTester(user)) {
        return true; // Testers see everything
    }
    return instance.isTest !== true;
}

