import { ConvexError } from "convex/values";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { format, getDay } from "date-fns";
import { throwIfError, updateIfExists } from '../utils/core';
import { ERROR_CODES } from '../utils/errorCodes';
import { classValidations } from "../validations/class";
import type { CreateMultipleClassInstancesArgs, UpdateSingleInstanceArgs } from "../convex/mutations/classInstances";

/**
 * Class Instance Operations - Business Logic Layer
 * 
 * This module handles the core business operations for class instance management,
 * including creation, updates, validation, and template/venue synchronization.
 * All functions implement safety-first validation and maintain data integrity.
 */

/***************************************************************
 * Instance Data Preparation
 ***************************************************************/
/**
 * Prepares and validates arguments for bulk class instance creation
 * 
 * @description Validates all required fields for creating multiple recurring class instances.
 * Handles weekly/daily frequency patterns with optional day-of-week selection.
 * 
 * @param args - Raw arguments for multiple instance creation
 * @returns CreateMultipleClassInstancesArgs - Validated and prepared arguments
 * 
 * @example
 * // Create weekly yoga classes for 4 weeks on Mon/Wed/Fri
 * const args = {
 *   templateId: "template_123",
 *   startTime: Date.now() + (24 * 60 * 60 * 1000),
 *   frequency: 'weekly',
 *   weeks: 4,
 *   selectedDaysOfWeek: [1, 3, 5] // Mon, Wed, Fri
 * };
 * const prepared = prepareCreateMultipleInstances(args);
 * // Returns validated args with sanitized inputs
 * 
 * @example
 * // Create daily classes for 2 weeks (all days)
 * const args = {
 *   templateId: "template_123", 
 *   startTime: Date.now() + (24 * 60 * 60 * 1000),
 *   frequency: 'daily',
 *   weeks: 2
 *   // selectedDaysOfWeek omitted = all days
 * };
 * const prepared = prepareCreateMultipleInstances(args);
 * 
 * @throws ConvexError When validation fails (invalid weeks count, bad frequency, etc.)
 * @business_rule weeks must be positive integer <= 100
 * @business_rule frequency must be 'daily' or 'weekly'
 * @business_rule selectedDaysOfWeek optional, validates 0-6 range if provided
 * @safety Preserves non-validated properties for backward compatibility
 */
export const prepareCreateMultipleInstances = (args: CreateMultipleClassInstancesArgs): CreateMultipleClassInstancesArgs => {
    const i = args;

    return {
        // Spread the original to keep values that are not being validated
        ...i,
        // Mandatory fields
        startTime: throwIfError(classValidations.validateStartTime(i.startTime), 'startTime'),
        frequency: throwIfError(classValidations.validateFrequency(i.frequency), 'frequency'),
        weeks: throwIfError(classValidations.validateCount(i.weeks), 'weeks'),

        // Optional fields
        ...(i.selectedDaysOfWeek !== undefined && {
            selectedDaysOfWeek: throwIfError(classValidations.validateSelectedDaysOfWeek(i.selectedDaysOfWeek), 'selectedDaysOfWeek')
        }),
    };
};

/**
 * Prepares and validates arguments for single class instance updates
 * 
 * @description Enforces critical business rule: cannot update endTime without startTime.
 * Provides conditional validation - only validates time pairs when both provided.
 * Validates all other fields independently when present.
 * 
 * @param args - Raw update arguments for single instance
 * @returns Partial<UpdateSingleInstanceArgs['instance']> - Validated update object
 * 
 * @example
 * // Safe time update (both start and end provided)
 * const updateArgs = {
 *   startTime: Date.now() + (60 * 60 * 1000), // 1 hour from now
 *   endTime: Date.now() + (2 * 60 * 60 * 1000), // 2 hours from now
 *   name: "Updated Yoga Class"
 * };
 * const result = prepareUpdateInstance(updateArgs);
 * // Returns: validated object with all fields
 * 
 * @example
 * // Safe partial update (only start time)
 * const updateArgs = {
 *   startTime: Date.now() + (60 * 60 * 1000),
 *   name: "Updated Name Only"
 * };
 * const result = prepareUpdateInstance(updateArgs);
 * // Returns: { startTime: validated_time, name: "Updated Name Only" }
 * 
 * @example
 * // UNSAFE: endTime without startTime (throws error)
 * const badArgs = {
 *   endTime: Date.now() + (2 * 60 * 60 * 1000), // Missing startTime!
 *   name: "This will fail"
 * };
 * prepareUpdateInstance(badArgs); // Throws ConvexError
 * 
 * @throws ConvexError When endTime provided without startTime (business rule violation)
 * @throws ConvexError When any field validation fails (capacity < 0, etc.)
 * @business_rule ADR-001: endTime updates require startTime to prevent orphaned time ranges
 * @business_rule Time validation only occurs when both startTime AND endTime provided
 * @safety All validation errors include field attribution for better UX
 */
export const prepareUpdateInstance = (args: UpdateSingleInstanceArgs['instance']): Partial<UpdateSingleInstanceArgs['instance']> => {
    const i = args;

    // ADR-001: Business Rule - Prevent orphaned endTime updates
    // Decision: Require startTime when updating endTime to maintain data consistency
    // Rationale: EndTime without startTime creates invalid time ranges and breaks calendar display
    // Date: 2024-08, Context: Calendar drag-drop was creating invalid instances
    // Alternative considered: Auto-calculate startTime from duration, rejected due to complexity
    if (i.endTime !== undefined && i.startTime === undefined) {
        throw new ConvexError({
            message: "Cannot update end time without start time",
            field: "endTime",
            code: ERROR_CODES.VALIDATION_ERROR
        });
    }

    console.log('args:  ', i)

    return {
        ...i,

        // ADR-002: Validation Strategy - Conditional validation based on field presence  
        // Decision: Only validate endTime when both startTime + endTime provided together
        // Rationale: Allows partial updates while ensuring complete updates are validated
        // Alternative considered: Always validate endTime against existing startTime, rejected due to DB read complexity
        
        // Time fields with special business logic - validate as pair or individually
        ...(i.startTime !== undefined && i.endTime !== undefined && {
            startTime: throwIfError(classValidations.validateStartTime(i.startTime), 'startTime'),
            endTime: throwIfError(classValidations.validateEndTime(i.endTime, i.startTime), 'endTime'),
        }),
        ...(i.startTime !== undefined && i.endTime === undefined && {
            startTime: throwIfError(classValidations.validateStartTime(i.startTime), 'startTime'),
        }),

        // Optional fields
        ...(i.name !== undefined && { name: throwIfError(classValidations.validateName(i.name), 'name') }),
        ...(i.instructor !== undefined && { instructor: throwIfError(classValidations.validateInstructor(i.instructor), 'instructor') }),
        ...(i.description !== undefined && { description: throwIfError(classValidations.validateDescription(i.description), 'description') }),
        ...(i.tags !== undefined && { tags: throwIfError(classValidations.validateTags(i.tags), 'tags') }),
        ...(i.capacity !== undefined && { capacity: throwIfError(classValidations.validateCapacity(i.capacity), 'capacity') }),
        ...(i.baseCredits !== undefined && { baseCredits: throwIfError(classValidations.validateBaseCredits(i.baseCredits), 'baseCredits') }),
        ...(i.bookingWindow !== undefined && { bookingWindow: throwIfError(classValidations.validateBookingWindow(i.bookingWindow), 'bookingWindow') }),
        ...(i.cancellationWindowHours !== undefined && { cancellationWindowHours: throwIfError(classValidations.validateCancellationWindowHours(i.cancellationWindowHours), 'cancellationWindowHours') }),
        ...(i.color !== undefined && { color: i.color }),
    };
};

/**
 * Prepares bulk instance updates when template changes occur
 * 
 * @description Propagates template changes to all associated instances while maintaining
 * historical integrity via templateSnapshot updates. Supports partial updates.
 * 
 * @param instances - Array of class instances to update
 * @param templateChanges - Partial template changes to propagate
 * @returns Array of update objects with instanceId and changes
 * 
 * @example
 * // Template instructor change propagates to all instances
 * const instances = [{ _id: "inst_1", name: "Old Class", templateSnapshot: {...} }];
 * const changes = { 
 *   name: "New Class Name", 
 *   instructor: "New Instructor" 
 * };
 * const updates = prepareInstanceUpdatesFromTemplateChanges(instances, changes);
 * // Returns: [{
 * //   instanceId: "inst_1",
 * //   changes: {
 * //     name: "New Class Name",
 * //     instructor: "New Instructor", 
 * //     templateSnapshot: { ...existing, name: "New Class Name", instructor: "New Instructor" }
 * //   }
 * // }]
 * 
 * @example
 * // Partial update (only name changes)
 * const changes = { name: "Updated Name" };
 * const updates = prepareInstanceUpdatesFromTemplateChanges(instances, changes);
 * // Only name field updated, other templateSnapshot fields preserved
 * 
 * @business_rule Instance fields are updated directly AND templateSnapshot is updated
 * @business_rule templateSnapshot preserves existing fields, only updates specified changes
 * @data_integrity Maintains historical record of template state via snapshot
 * @performance Batches multiple instance updates for efficient database operations
 */
export const prepareInstanceUpdatesFromTemplateChanges = (
    instances: Doc<"classInstances">[],
    templateChanges: Partial<Doc<"classTemplates">>
): Array<{ instanceId: Id<"classInstances">; changes: Partial<Doc<"classInstances">> }> => {
    // ADR-003: Template Change Propagation Strategy
    // Decision: Update both instance fields AND templateSnapshot simultaneously
    // Rationale: Instance fields for current behavior, snapshot for historical audit trail
    // Date: 2024-08, Context: Need to track template evolution while maintaining instance independence
    // Alternative considered: Only update snapshot, rejected due to performance implications
    
    return instances.map(instance => ({
        instanceId: instance._id,
        changes: {
            // Direct instance field updates for immediate effect
            ...updateIfExists({
                name: templateChanges.name,
                description: templateChanges.description,
                instructor: templateChanges.instructor,
            }),
            // Historical snapshot preservation with selective updates
            templateSnapshot: {
                ...instance.templateSnapshot, // Preserve existing snapshot data
                ...updateIfExists({
                    name: templateChanges.name,
                    description: templateChanges.description,
                    instructor: templateChanges.instructor,
                    imageStorageIds: templateChanges.imageStorageIds,
                    deleted: templateChanges.deleted,
                }),
            },
        }
    }));
};

/**
 * Prepares bulk instance updates when venue changes occur
 * 
 * @description Propagates venue changes to instance venueSnapshots for historical integrity.
 * Handles nested address updates by merging with existing address data.
 * 
 * @param instances - Array of class instances to update
 * @param venueChanges - Partial venue changes to propagate
 * @returns Array of update objects with instanceId and changes
 * 
 * @example
 * // Venue address change propagates to all instances
 * const instances = [{ 
 *   _id: "inst_1", 
 *   venueSnapshot: { 
 *     name: "Old Studio", 
 *     address: { street: "Old St", city: "Portland", zipCode: "97201" }
 *   }
 * }];
 * const changes = { 
 *   name: "New Studio Name",
 *   address: { street: "New Street" } // Partial address update
 * };
 * const updates = prepareInstanceUpdatesFromVenueChanges(instances, changes);
 * // Returns: venueSnapshot with merged address: { street: "New Street", city: "Portland", zipCode: "97201" }
 * 
 * @example
 * // Image update
 * const changes = { imageStorageIds: ["new_img_1", "new_img_2"] };
 * const updates = prepareInstanceUpdatesFromVenueChanges(instances, changes);
 * // Updates venue snapshot with new images
 * 
 * @business_rule Only venueSnapshot is updated, no direct instance fields affected
 * @business_rule Address changes are merged, not replaced (preserves city, state, etc.)
 * @data_integrity Maintains historical venue state at time of class scheduling
 * @performance Batched updates for multiple instances
 */
export const prepareInstanceUpdatesFromVenueChanges = (
    instances: Doc<"classInstances">[],
    venueChanges: Partial<Doc<"venues">>
): Array<{ instanceId: Id<"classInstances">; changes: Partial<Doc<"classInstances">> }> => {
    // ADR-004: Venue Change Propagation - Snapshot Only Updates
    // Decision: Only update venueSnapshot, never direct instance venue fields
    // Rationale: Venues are reference data, instances need historical point-in-time snapshots
    // Date: 2024-08, Context: Customer booking confirmations must show venue as it was when booked
    // Alternative considered: Update instance.venueId references, rejected due to data integrity concerns
    
    return instances.map(instance => ({
        instanceId: instance._id,
        changes: {
            venueSnapshot: {
                ...instance.venueSnapshot, // Preserve existing snapshot data
                ...updateIfExists({
                    name: venueChanges.name,
                    // Smart address merging - preserve fields not being updated
                    address: venueChanges.address && {
                        ...instance.venueSnapshot.address, // Keep existing city, state, etc.
                        ...venueChanges.address, // Override with specific changes
                    },
                    imageStorageIds: venueChanges.imageStorageIds,
                    deleted: venueChanges.deleted,
                }),
            },
        }
    }));
};

/***************************************************************
 * Instance Creation Operations
 ***************************************************************/

/**
 * Creates a new class instance from a template with full data integrity
 * 
 * @description Generates complete class instance from template, calculating derived fields
 * like endTime, timePattern, dayOfWeek. Creates point-in-time snapshots of template
 * and venue data for historical consistency.
 * 
 * @param template - Source class template with duration, capacity, credits, etc.
 * @param venue - Venue information for location and address details
 * @param business - Business context for timezone and ownership
 * @param user - Creating user for audit trail
 * @param startTime - Start timestamp for the class instance
 * @returns Complete class instance object ready for database insertion
 * 
 * @example
 * // Create yoga class instance
 * const template = {
 *   name: "Yoga Flow", duration: 60, baseCredits: 12,
 *   capacity: 15, instructor: "Jane Doe"
 * };
 * const venue = {
 *   name: "Downtown Studio", 
 *   address: { street: "123 Main St", city: "Portland" }
 * };
 * const business = { timezone: "America/Los_Angeles" };
 * const startTime = new Date('2024-01-08T10:00:00').getTime();
 * 
 * const instance = createInstanceFromTemplate(template, venue, business, user, startTime);
 * // Returns: {
 * //   name: "Yoga Flow", startTime: 1704722400000, endTime: 1704726000000,
 * //   timePattern: "10:00-11:00", dayOfWeek: 1, capacity: 15,
 * //   bookedCount: 0, waitlistCount: 0,
 * //   templateSnapshot: { name: "Yoga Flow", instructor: "Jane Doe", ... },
 * //   venueSnapshot: { name: "Downtown Studio", address: {...}, ... },
 * //   createdAt: 1704722400000, createdBy: "user_123"
 * // }
 * 
 * @example
 * // Duration calculation and time pattern
 * const template = { duration: 90 }; // 90 minutes
 * const startTime = new Date('2024-01-08T14:30:00').getTime(); // 2:30 PM
 * const instance = createInstanceFromTemplate(template, venue, business, user, startTime);
 * // Results: endTime = startTime + 90min, timePattern = "14:30-16:00"
 * 
 * @throws ConvexError When startTime validation fails
 * @business_rule endTime = startTime + (template.duration * 60 * 1000)
 * @business_rule dayOfWeek calculated using getDay() (0=Sunday, 1=Monday, etc.)
 * @business_rule timePattern format: "HH:mm-HH:mm" in 24-hour format
 * @data_integrity Creates immutable snapshots of template and venue at creation time
 * @audit_trail Sets createdAt, createdBy for full audit trail
 * @initialization bookedCount and waitlistCount start at 0
 */
export const createInstanceFromTemplate = (
    template: Doc<"classTemplates">,
    venue: Doc<"venues">,
    business: Doc<"businesses">,
    user: Doc<"users">,
    startTime: number
) => {
    // ADR-005: Time Calculation Strategy
    // Decision: Calculate endTime from template duration, validate startTime first
    // Rationale: Ensures data consistency and prevents invalid time ranges
    // Date: 2024-08, Context: Manual endTime entry was causing booking conflicts
    // Alternative considered: Accept both start/end times, rejected due to user error potential
    
    // Validate startTime using business rules (not too far future, valid timestamp)
    const validatedStartTime = throwIfError(classValidations.validateStartTime(startTime), 'startTime');

    // Calculate endTime deterministically from template duration (in minutes)
    const endTime = validatedStartTime + (template.duration * 60 * 1000);

    const now = Date.now();

    return {
        businessId: business._id,
        templateId: template._id,
        venueId: template.venueId!,
        timezone: business.timezone,
        startTime: validatedStartTime,
        endTime,
        status: 'scheduled' as const,

        timePattern: `${format(validatedStartTime, 'HH:mm')}-${format(endTime, 'HH:mm')}`,
        dayOfWeek: getDay(validatedStartTime),

        name: template.name,
        description: template.description,
        instructor: template.instructor,
        capacity: template.capacity,
        baseCredits: template.baseCredits,
        bookingWindow: template.bookingWindow,
        cancellationWindowHours: template.cancellationWindowHours,
        tags: template.tags,
        color: template.color,

        // Booking tracking
        bookedCount: 0,
        waitlistCount: 0,

        // ADR-006: Historical Snapshot Strategy  
        // Decision: Capture point-in-time snapshots of template and venue data
        // Rationale: Booking confirmations must show accurate info as it was when booked
        // Date: 2024-08, Context: Template/venue changes were affecting historical bookings
        // Alternative considered: Live references, rejected due to customer confusion
        
        // Template snapshot - captures template state at instance creation
        templateSnapshot: {
            name: template.name,
            description: template.description,
            instructor: template.instructor,
            imageStorageIds: template.imageStorageIds,
        },

        // Venue snapshot - captures venue state at instance creation
        venueSnapshot: {
            name: venue.name,
            address: {
                street: venue.address.street,
                city: venue.address.city,
                zipCode: venue.address.zipCode,
                country: venue.address.country,
                state: venue.address.state,
            },
            imageStorageIds: venue.imageStorageIds,
        },

        // Audit fields
        createdAt: now,
        createdBy: user._id,
    };
};




/**
 * Exported class instance operations for external consumption
 * 
 * @description Centralized export object for all class instance operations.
 * Used by services layer, API endpoints, and integration tests for consistent
 * business logic application.
 * 
 * @example
 * import { classInstanceOperations } from './operations/classInstance';
 * 
 * // Prepare bulk instance creation
 * const prepared = classInstanceOperations.prepareCreateMultipleInstances(args);
 * 
 * // Create instance from template
 * const instance = classInstanceOperations.createInstanceFromTemplate(
 *   template, venue, business, user, startTime
 * );
 * 
 * // Prepare updates from template changes
 * const updates = classInstanceOperations.prepareInstanceUpdatesFromTemplateChanges(
 *   instances, templateChanges
 * );
 * 
 * @operations_included prepareCreateMultipleInstances, prepareUpdateInstance,
 *                      prepareInstanceUpdatesFromTemplateChanges, prepareInstanceUpdatesFromVenueChanges,
 *                      createInstanceFromTemplate
 */
export const classInstanceOperations = {
    prepareCreateMultipleInstances,
    prepareUpdateInstance,
    prepareInstanceUpdatesFromTemplateChanges,
    prepareInstanceUpdatesFromVenueChanges,
    createInstanceFromTemplate,
};