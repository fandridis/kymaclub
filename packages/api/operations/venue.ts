import type { Doc, Id } from "../convex/_generated/dataModel";
import { coreValidations } from "../validations/core";
import { venueValidations } from "../validations/venue";
import { CreateVenueArgs, UpdateVenueArgs } from "../convex/mutations/venues";
import { throwIfError } from "../utils/core";

/**
 * Venue Operations - Business Logic for Venue Management
 * 
 * This module handles venue creation, updates, and validation logic.
 * Venues represent physical locations where classes are held, with comprehensive
 * address information, amenities, and business metadata.
 * 
 * Key Features:
 * - Full address validation with optional state/geocoding
 * - Flexible capacity and equipment management
 * - Social media and contact information handling
 * - Multi-tenant venue isolation by businessId
 * - Image storage support for venue photos
 */

/**
 * Prepares and validates venue creation arguments with comprehensive field validation
 * 
 * @description Validates all required and optional venue fields, ensuring data integrity
 * and business rule compliance. Handles complex address validation with optional geocoding.
 * 
 * @param args - Raw venue creation arguments from API
 * @returns CreateVenueArgs['venue'] - Validated venue object ready for database insertion
 * 
 * @example
 * // Create yoga studio venue
 * const venueArgs = {
 *   venue: {
 *     name: "Downtown Yoga Studio",
 *     email: "info@yogastudio.com", 
 *     address: {
 *       street: "123 Main St",
 *       city: "Portland", 
 *       zipCode: "97201",
 *       country: "USA",
 *       state: "OR"
 *     },
 *     description: "Modern yoga studio with natural lighting",
 *     capacity: 25,
 *     equipment: ["yoga mats", "blocks", "straps"],
 *     amenities: ["parking", "changing rooms", "showers"],
 *     phone: "+1-503-555-0123",
 *     website: "https://yogastudio.com"
 *   }
 * };
 * const cleanVenue = prepareCreateVenue(venueArgs);
 * 
 * @example
 * // Minimal venue (required fields only)
 * const minimalArgs = {
 *   venue: {
 *     name: "Basic Studio",
 *     email: "contact@studio.com",
 *     address: {
 *       street: "456 Oak Ave", 
 *       city: "Seattle",
 *       zipCode: "98101",
 *       country: "USA"
 *       // state is optional
 *     }
 *   }
 * };
 * const basicVenue = prepareCreateVenue(minimalArgs);
 * 
 * @throws ConvexError When required field validation fails (name, email, address)
 * @throws ConvexError When optional field validation fails (capacity < 0, invalid email format)
 * @business_rule name: Required, trimmed, ≤200 characters
 * @business_rule email: Required, valid email format for venue contact
 * @business_rule address: All fields required except state (optional for non-US)
 * @business_rule capacity: Optional, must be positive integer if provided
 * @business_rule equipment: Optional array, each item ≤100 characters
 * @data_integrity Preserves non-validated fields for backward compatibility
 * @validation_layer Uses core and venue-specific validation functions
 */
export const prepareCreateVenue = (args: CreateVenueArgs): CreateVenueArgs['venue'] => {
    const v = args.venue;

    const cleanVenue: CreateVenueArgs['venue'] = {
        // ADR-007: Field Preservation Strategy
        // Decision: Preserve non-validated fields during venue creation
        // Rationale: Allows system evolution without breaking existing venue data
        // Date: 2024-08, Context: Need backward compatibility for venue extensions
        // Alternative considered: Strict schema enforcement, rejected due to migration complexity
        ...v,
        
        // Mandatory fields - comprehensive validation for core venue data
        name: throwIfError(venueValidations.validateName(v.name), 'name'),
        email: throwIfError(coreValidations.validateEmail(v.email), 'email'), // Required for venue contact
        
        // Address validation - comprehensive geographic data validation
        address: {
            street: throwIfError(coreValidations.validateStreet(v.address.street), 'address.street'),
            city: throwIfError(coreValidations.validateCity(v.address.city), 'address.city'),
            zipCode: throwIfError(coreValidations.validateZipCode(v.address.zipCode), 'address.zipCode'),
            country: throwIfError(coreValidations.validateCountry(v.address.country), 'address.country'),
            // State is optional (not all countries use states)
            ...(v.address.state !== undefined && { state: throwIfError(coreValidations.validateState(v.address.state), 'address.state') }),
        },

        // Optional fields
        ...(v.description !== undefined && { description: throwIfError(venueValidations.validateDescription(v.description), 'description') }),
        ...(v.capacity !== undefined && { capacity: throwIfError(venueValidations.validateCapacity(v.capacity), 'capacity') }),
        ...(v.equipment !== undefined && { equipment: throwIfError(venueValidations.validateEquipment(v.equipment), 'equipment') }),
        ...(v.amenities !== undefined && { amenities: v.amenities }),
        ...(v.services !== undefined && { services: v.services }),
        ...(v.imageStorageIds !== undefined && { imageStorageIds: v.imageStorageIds }),
        ...(v.phone !== undefined && { phone: v.phone }),
        ...(v.website !== undefined && { website: v.website }),
        ...(v.socialMedia !== undefined && { socialMedia: v.socialMedia }),
    };

    return cleanVenue;
};

/**
 * Creates default venue object with business ownership and audit fields
 * 
 * @description Generates base venue structure with business association and audit trail.
 * Used as foundation for venue creation - combine with prepareCreateVenue for complete venue.
 * 
 * @param businessId - ID of business that owns this venue
 * @param userId - ID of user creating the venue (for audit trail)
 * @returns Partial venue object with ownership and audit fields
 * 
 * @example
 * // Create venue foundation
 * const businessId = "biz_123";
 * const userId = "user_456";
 * const venueBase = createDefaultVenue(businessId, userId);
 * // Returns: {
 * //   businessId: "biz_123",
 * //   isActive: true,
 * //   createdAt: 1692345678000,
 * //   createdBy: "user_456"
 * // }
 * 
 * @example
 * // Combine with venue data for complete venue
 * const venueData = prepareCreateVenue(venueArgs);
 * const completeVenue = { ...createDefaultVenue(businessId, userId), ...venueData };
 * 
 * @business_rule All venues must be associated with a business (multi-tenant isolation)
 * @business_rule New venues are active by default (isActive: true)
 * @audit_trail Includes createdAt timestamp and createdBy user ID
 * @data_integrity Uses current timestamp, not client-provided creation time
 */
export const createDefaultVenue = (
    businessId: Id<"businesses">,
    userId: Id<"users">
) => {
    return {
        businessId,
        isActive: true,
        createdAt: Date.now(),
        createdBy: userId,
    };
};

/**
 * Prepares and validates venue update arguments with intelligent field merging
 * 
 * @description Handles partial venue updates while preserving existing data.
 * Supports selective address updates - only provided address fields are validated and updated.
 * Maintains data integrity by merging updates with existing venue data.
 * 
 * @param updates - Partial venue update arguments from API
 * @param existingVenue - Current venue state from database
 * @returns UpdateVenueArgs['venue'] - Validated update object ready for database merge
 * 
 * @example
 * // Update venue description and capacity only
 * const updates = {
 *   venue: {
 *     description: "Updated: Modern studio with new equipment",
 *     capacity: 30
 *   }
 * };
 * const currentVenue = { }; // existing venue from DB
 * const cleanUpdates = prepareUpdateVenue(updates, currentVenue);
 * // Only description and capacity validated/updated, other fields preserved
 * 
 * @example
 * // Partial address update (only street)
 * const addressUpdate = {
 *   venue: {
 *     address: {
 *       street: "789 New Street" // Only updating street, city/zip/etc. preserved
 *     }
 *   }
 * };
 * const updatedVenue = prepareUpdateVenue(addressUpdate, existingVenue);
 * // Result: address merged with existing data, only street changed
 * 
 * @example
 * // Add geocoding coordinates
 * const geoUpdate = {
 *   venue: {
 *     address: {
 *       latitude: 45.5152,
 *       longitude: -122.6784
 *     }
 *   }
 * };
 * const geoVenue = prepareUpdateVenue(geoUpdate, existingVenue);
 * 
 * @throws ConvexError When any provided field fails validation
 * @business_rule Only provided fields are validated and updated
 * @business_rule Address fields merge with existing address (preserve unchanged fields)
 * @data_integrity Existing venue data preserved for fields not in update
 * @partial_updates Supports updating individual address components without affecting others
 * @geocoding_support Supports adding/updating latitude/longitude coordinates
 */
export const prepareUpdateVenue = (updates: UpdateVenueArgs, existingVenue: Doc<"venues">): UpdateVenueArgs['venue'] => {
    const v = updates.venue;

    const cleanVenue: UpdateVenueArgs['venue'] = {
        // Spread the original to keep values that are not being validated
        ...v,
        // ADR-008: Smart Address Merging Strategy
        // Decision: Merge address updates with existing address data
        // Rationale: Allows partial address updates without losing existing geographic data
        // Date: 2024-08, Context: Geocoding updates shouldn't require re-entering full address
        // Alternative considered: Replace entire address object, rejected due to data loss risk
        
        // Address merging - preserve existing fields, validate and update only provided fields
        address: {
            ...existingVenue.address, // Preserve all existing address data
            ...(v.address?.street !== undefined && { street: throwIfError(coreValidations.validateStreet(v.address.street), 'address.street') }),
            ...(v.address?.city !== undefined && { city: throwIfError(coreValidations.validateCity(v.address.city), 'address.city') }),
            ...(v.address?.zipCode !== undefined && { zipCode: throwIfError(coreValidations.validateZipCode(v.address.zipCode), 'address.zipCode') }),
            ...(v.address?.country !== undefined && { country: throwIfError(coreValidations.validateCountry(v.address.country), 'address.country') }),
            // State is optional for international venues
            ...(v.address?.state !== undefined && { state: throwIfError(coreValidations.validateState(v.address.state), 'address.state') }),
            // Geocoding coordinates - support for map integration
            ...(v.address?.latitude !== undefined && { latitude: throwIfError(venueValidations.validateLatitude(v.address.latitude), 'address.latitude') }),
            ...(v.address?.longitude !== undefined && { longitude: throwIfError(venueValidations.validateLongitude(v.address.longitude), 'address.longitude') }),
        },

        // Optional fields
        ...(v.name !== undefined && { name: throwIfError(venueValidations.validateName(v.name), 'name') }),
        ...(v.description !== undefined && { description: throwIfError(venueValidations.validateDescription(v.description), 'description') }),
        ...(v.capacity !== undefined && { capacity: throwIfError(venueValidations.validateCapacity(v.capacity), 'capacity') }),
        ...(v.equipment !== undefined && { equipment: throwIfError(venueValidations.validateEquipment(v.equipment), 'equipment') }),
        ...(v.amenities !== undefined && { amenities: v.amenities }),
        ...(v.services !== undefined && { services: v.services }),
        ...(v.imageStorageIds !== undefined && { imageStorageIds: v.imageStorageIds }),
        ...(v.phone !== undefined && { phone: v.phone }),
        ...(v.website !== undefined && { website: v.website }),
        ...(v.email !== undefined && { email: v.email }),
        ...(v.socialMedia !== undefined && { socialMedia: v.socialMedia }),
    };

    return cleanVenue;
};

/**
 * Exported venue operations for external consumption
 * 
 * @description Centralized export object for all venue-related operations.
 * Used by services layer, API endpoints, and business workflow orchestration.
 * 
 * @example
 * import { venueOperations } from './operations/venue';
 * 
 * // Create new venue
 * const venueData = venueOperations.prepareCreateVenue(createArgs);
 * const venueBase = venueOperations.createDefaultVenue(businessId, userId);
 * const completeVenue = { ...venueBase, ...venueData };
 * 
 * // Update existing venue
 * const updates = venueOperations.prepareUpdateVenue(updateArgs, existingVenue);
 * 
 * @operations_included prepareCreateVenue, createDefaultVenue, prepareUpdateVenue
 * @business_context All venue operations respect multi-tenant business isolation
 * @data_validation Comprehensive field validation with helpful error attribution
 * @address_intelligence Smart address handling with partial update support
 */
export const venueOperations = {
    prepareCreateVenue,
    createDefaultVenue,
    prepareUpdateVenue,
};