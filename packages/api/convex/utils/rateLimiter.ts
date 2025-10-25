import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

const DAY = 24 * HOUR;

/**
 * This is the rate limiter for the API.
 */

export const rateLimiter = new RateLimiter(components.rateLimiter, {
    authenticatedUserRequests: {
        kind: "token bucket",
        rate: 100,
        period: MINUTE,
        capacity: 200,
    },

    loginAttemptsPerIdentifier: {
        kind: "token bucket",
        rate: 3,           // 3 per 5 minutes
        period: 5 * MINUTE,
        capacity: 5,       // small burst allowed
    },

    loginAttemptsPerIdentifierDaily: {
        kind: "fixed window",
        rate: 20,          // 20 per day
        period: DAY,
    },
});