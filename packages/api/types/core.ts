import { SystemTableNames } from "convex/server";
import type { Doc, Id, TableNames } from "../convex/_generated/dataModel";

/**
 * Generic validation result for consistent error handling across the application
 * @template T The type of the validated value
 */
export interface ValidationResult<T> {
    success: boolean;
    value?: T;
    error?: string;
    field?: string; // Field name for better error attribution
}

/**
 * Authentication context with user and business information
 * Used throughout the application for authorization checks
 */
export interface AuthContext {
    user: Doc<"users">;
    business: Doc<"businesses">;
}

/**
 * Audit fields interface for tracking entity changes
 * Used by all major entities in the system
 */
export interface AuditFields {
    createdAt: number;
    createdBy: Id<"users">;
    updatedAt?: number;
    updatedBy?: Id<"users">;
}

/**
 * Soft delete fields for entities that support soft deletion
 */
export interface SoftDeleteFields {
    deleted?: boolean;
    deletedAt?: number | null;
    deletedBy?: Id<"users"> | null;
}

/**
 * Base entity interface combining audit and soft delete capabilities
 * @template TId The type of the entity ID
 */
export interface BaseEntity<TId extends TableNames | SystemTableNames> extends AuditFields, SoftDeleteFields {
    _id: Id<TId>;
    _creationTime: number;
}

/**
 * Multi-tenant entity interface for business-scoped entities
 * @template TId The type of the entity ID
 */
export interface BusinessScopedEntity<TId extends TableNames | SystemTableNames> extends BaseEntity<TId> {
    businessId: Id<"businesses">;
}

/**
 * Common address structure used across venues and businesses
 */
export interface Address {
    street: string;
    city: string;
    zipCode: string;
    country: string;
    state?: string;
}

/**
 * Geographic coordinates for location-based features
 */
export interface Coordinates {
    latitude: number;
    longitude: number;
}

/**
 * Time range interface for booking windows and availability
 */
export interface TimeRange {
    startTime: number;
    endTime: number;
}

/**
 * Booking window constraints for class scheduling
 */
export interface BookingWindow {
    minHours: number; // Minimum hours before class start
    maxHours: number; // Maximum hours before class start
}

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
    limit?: number;
    offset?: number;
    cursor?: string;
}

/**
 * Pagination result wrapper
 * @template T The type of items in the paginated list
 */
export interface PaginatedResult<T> {
    items: T[];
    hasMore: boolean;
    cursor?: string;
    total?: number;
}

/**
 * Common filter parameters for entity queries
 */
export interface FilterParams {
    businessId?: Id<"businesses">;
    deleted?: boolean;
    createdAfter?: number;
    createdBefore?: number;
}

/**
 * Sort parameters for ordered queries
 */
export interface SortParams {
    field: string;
    direction: 'asc' | 'desc';
}

/**
 * Search parameters for text-based queries
 */
export interface SearchParams {
    query?: string;
    fields?: string[];
}

/**
 * Comprehensive query parameters combining all common query options
 */
export interface QueryParams extends PaginationParams, FilterParams, SortParams, SearchParams { }

/**
 * Error context for structured error handling
 */
export interface ErrorContext {
    field?: string;
    code: string;
    details?: Record<string, any>;
}

/**
 * API response wrapper for consistent response structure
 * @template T The type of the response data
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code: string;
        field?: string;
        details?: Record<string, any>;
    };
    meta?: {
        timestamp: number;
        requestId?: string;
    };
}

/**
 * Utility type to make all properties of T optional except for K
 * @template T The base type
 * @template K The keys that should remain required
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Utility type to make specific properties of T required
 * @template T The base type
 * @template K The keys that should be required
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Utility type to extract the value type from a ValidationResult
 * @template T ValidationResult type
 */
export type ValidationValue<T> = T extends ValidationResult<infer U> ? U : never;

/**
 * String constraints for common validation patterns
 */
export type BusinessName = string & { __brand: 'BusinessName' };
export type EmailAddress = string & { __brand: 'EmailAddress' };
export type PhoneNumber = string & { __brand: 'PhoneNumber' };
export type WebsiteUrl = string & { __brand: 'WebsiteUrl' };

/**
 * Numeric constraints for business rules
 */
export type PositiveInteger = number & { __brand: 'PositiveInteger' };
export type NonNegativeNumber = number & { __brand: 'NonNegativeNumber' };
export type Timestamp = number & { __brand: 'Timestamp' };

/**
 * Day of week type (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;