/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param lat1 - Latitude of the first point
 * @param lon1 - Longitude of the first point
 * @param lat2 - Latitude of the second point
 * @param lon2 - Longitude of the second point
 * @returns Distance in meters
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180; // Convert to radians
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Check if a location is within a specified radius from a center point
 * @param userLat - User's latitude
 * @param userLon - User's longitude
 * @param centerLat - Center point latitude
 * @param centerLon - Center point longitude
 * @param radiusKm - Radius in kilometers
 * @returns true if within radius, false otherwise
 */
export function isWithinRadius(
    userLat: number,
    userLon: number,
    centerLat: number,
    centerLon: number,
    radiusKm: number
): boolean {
    const distanceInMeters = calculateDistance(userLat, userLon, centerLat, centerLon);
    const distanceInKm = distanceInMeters / 1000;
    return distanceInKm <= radiusKm;
}

/**
 * Format distance for display
 * @param meters - Distance in meters
 * @returns Formatted string with appropriate unit
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)}m`;
    }
    const km = meters / 1000;
    if (km < 10) {
        return `${km.toFixed(1)}km`;
    }
    return `${Math.round(km)}km`;
}

/**
 * Get distance information from user to service center
 * @param userLat - User's latitude
 * @param userLon - User's longitude
 * @param centerLat - Center point latitude
 * @param centerLon - Center point longitude
 * @returns Object with distance information
 */
export function getDistanceInfo(
    userLat: number,
    userLon: number,
    centerLat: number,
    centerLon: number
) {
    const distanceInMeters = calculateDistance(userLat, userLon, centerLat, centerLon);
    const distanceInKm = distanceInMeters / 1000;

    return {
        meters: distanceInMeters,
        kilometers: distanceInKm,
        formatted: formatDistance(distanceInMeters),
        isWithin50km: distanceInKm <= 50
    };
}

// Service area configuration for your app
export const SERVICE_AREA = {
    athens: {
        latitude: 37.9838,
        longitude: 23.7275,
        radiusKm: 50,
        name: 'Athens'
    }
} as const;

/**
 * Check if user is within any service area
 * @param userLat - User's latitude
 * @param userLon - User's longitude
 * @returns Service area info if within range, null otherwise
 */
export function checkServiceAreaAccess(userLat: number, userLon: number) {
    for (const [key, area] of Object.entries(SERVICE_AREA)) {
        const isWithin = isWithinRadius(
            userLat,
            userLon,
            area.latitude,
            area.longitude,
            area.radiusKm
        );

        if (isWithin) {
            const distance = calculateDistance(
                userLat,
                userLon,
                area.latitude,
                area.longitude
            );

            return {
                area: key,
                areaName: area.name,
                distance,
                distanceFormatted: formatDistance(distance),
                isWithinServiceArea: true
            };
        }
    }

    // Find nearest service area for waitlist purposes
    let nearestArea = null;
    let minDistance = Infinity;

    for (const [key, area] of Object.entries(SERVICE_AREA)) {
        const distance = calculateDistance(
            userLat,
            userLon,
            area.latitude,
            area.longitude
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestArea = {
                area: key,
                areaName: area.name,
                distance,
                distanceFormatted: formatDistance(distance),
                distanceInKm: distance / 1000
            };
        }
    }

    return {
        isWithinServiceArea: false,
        nearestArea
    };
}

// Validation helpers
export function isValidLatitude(lat: number): boolean {
    return typeof lat === 'number' && lat >= -90 && lat <= 90;
}

export function isValidLongitude(lon: number): boolean {
    return typeof lon === 'number' && lon >= -180 && lon <= 180;
}

export function validateCoordinates(lat: number, lon: number): { valid: boolean; error?: string } {
    if (!isValidLatitude(lat)) {
        return { valid: false, error: 'Invalid latitude. Must be between -90 and 90.' };
    }
    if (!isValidLongitude(lon)) {
        return { valid: false, error: 'Invalid longitude. Must be between -180 and 180.' };
    }
    return { valid: true };
}