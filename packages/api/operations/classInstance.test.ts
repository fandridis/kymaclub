import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  prepareUpdateInstance,
  createInstanceFromTemplate,
  prepareCreateMultipleInstances,
  prepareInstanceUpdatesFromTemplateChanges,
  prepareInstanceUpdatesFromVenueChanges,
  classInstanceOperations
} from "./classInstance";
import type { Doc } from "../convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { ERROR_CODES } from "../utils/errorCodes";

// Mock classValidations
vi.mock("../validations/class", () => ({
  classValidations: {
    validateStartTime: vi.fn((time) => ({ success: true, value: time })),
    validateEndTime: vi.fn((endTime, startTime) => {
      if (endTime <= startTime) {
        return { success: false, error: "End time must be after start time" };
      }
      return { success: true, value: endTime };
    }),
    validateFrequency: vi.fn((freq) => ({ success: true, value: freq })),
    validateCount: vi.fn((count) => {
      if (count < 1) return { success: false, error: "Count must be positive" };
      return { success: true, value: count };
    }),
    validateSelectedDaysOfWeek: vi.fn((days) => ({ success: true, value: days })),
    validateName: vi.fn((name) => ({ success: true, value: name })),
    validateInstructor: vi.fn((instructor) => ({ success: true, value: instructor })),
    validateDescription: vi.fn((desc) => ({ success: true, value: desc })),
    validateTags: vi.fn((tags) => ({ success: true, value: tags })),
    validateCapacity: vi.fn((capacity) => {
      if (capacity < 1) return { success: false, error: "Capacity must be positive" };
      return { success: true, value: capacity };
    }),
    validateBaseCredits: vi.fn((credits) => {
      if (credits < 0) return { success: false, error: "Credits cannot be negative" };
      return { success: true, value: credits };
    }),
    validateBookingWindow: vi.fn((window) => ({ success: true, value: window })),
    validateCancellationWindowHours: vi.fn((hours) => ({ success: true, value: hours })),
    validateDiscountRules: vi.fn((rules) => ({ success: true, value: rules })),
    validatePrimaryCategory: vi.fn((category) => ({ success: true, value: category }))
  }
}));

// Mock console.log to reduce test noise
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => { });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Class Instance Operations - Safety Tests', () => {

  describe('prepareUpdateInstance - Business Rule Enforcement', () => {

    it('should throw error when trying to update endTime without startTime', () => {
      const updateArgs = {
        endTime: Date.now() + (2 * 60 * 60 * 1000), // 2 hours from now
        // No startTime provided
        name: "Updated Yoga Class"
      };

      expect(() => prepareUpdateInstance(updateArgs)).toThrow(ConvexError);
      expect(() => prepareUpdateInstance(updateArgs)).toThrow("Cannot update end time without start time");
    });

    it('should allow updating endTime when startTime is also provided', () => {
      const now = Date.now();
      const updateArgs = {
        startTime: now + (60 * 60 * 1000), // 1 hour from now
        endTime: now + (2 * 60 * 60 * 1000), // 2 hours from now
        name: "Updated Yoga Class"
      };

      const result = prepareUpdateInstance(updateArgs);

      expect(result.startTime).toBe(updateArgs.startTime);
      expect(result.endTime).toBe(updateArgs.endTime);
      expect(result.name).toBe("Updated Yoga Class");
    });

    it('should allow updating startTime without endTime', () => {
      const updateArgs = {
        startTime: Date.now() + (60 * 60 * 1000),
        name: "Updated Yoga Class"
      };

      const result = prepareUpdateInstance(updateArgs);

      expect(result.startTime).toBe(updateArgs.startTime);
      expect(result.endTime).toBeUndefined();
    });

    it('should validate endTime is after startTime', () => {
      const now = Date.now();
      const updateArgs = {
        startTime: now + (2 * 60 * 60 * 1000), // 2 hours from now
        endTime: now + (1 * 60 * 60 * 1000), // 1 hour from now (before start!)
      };

      expect(() => prepareUpdateInstance(updateArgs)).toThrow("End time must be after start time");
    });

    it('should handle validation errors for other fields', async () => {
      const updateArgs = {
        capacity: -5, // Invalid negative capacity
        name: "Test Class"
      };

      // Mock validation to return error
      const { classValidations } = await import("../validations/class");
      vi.mocked(classValidations.validateCapacity).mockReturnValueOnce({
        success: false,
        error: "Capacity must be positive"
      });

      expect(() => prepareUpdateInstance(updateArgs)).toThrow("Capacity must be positive");
    });

    it('should recalculate hasDiscountRules when discountRules are updated', () => {
      const updateArgs = {
        discountRules: [{
          id: "early-bird",
          name: "Early Bird Special",
          condition: { type: "hours_before_min" as any, hours: 48 },
          discount: { type: "fixed_amount" as any, value: 150 }
        }]
      };

      const result = prepareUpdateInstance(updateArgs);

      expect(result.discountRules).toEqual(updateArgs.discountRules);
      expect(result.hasDiscountRules).toBe(true);
    });

    it('should set hasDiscountRules to false when discountRules are cleared', () => {
      const updateArgs = {
        discountRules: []
      };

      const result = prepareUpdateInstance(updateArgs);

      expect(result.discountRules).toEqual([]);
      expect(result.hasDiscountRules).toBe(false);
    });

    it('should not include hasDiscountRules when discountRules are undefined', () => {
      const updateArgs = {
        discountRules: undefined
      };

      const result = prepareUpdateInstance(updateArgs);

      expect(result.discountRules).toBeUndefined();
      expect(result.hasDiscountRules).toBeUndefined();
    });
  });

  describe('createInstanceFromTemplate - Data Integrity', () => {
    const mockTemplate: Doc<"classTemplates"> = {
      _id: "template_123" as any,
      _creationTime: Date.now(),
      venueId: "venue_123" as any,
      businessId: "business_123" as any,
      createdAt: Date.now(),
      createdBy: "user_123" as any,
      isActive: true,
      name: "Yoga Flow",
      description: "A relaxing yoga session",
      instructor: "Jane Doe",
      duration: 60, // 60 minutes
      capacity: 15,
      price: 1200, // 12 euros in cents
      bookingWindow: { minHours: 1, maxHours: 48 },
      cancellationWindowHours: 24,
      tags: ["yoga", "relaxation"],
      color: "#blue",
      imageStorageIds: ["img_1", "img_2"] as any,
      discountRules: [
        {
          id: "early-bird",
          name: "Early Bird Special",
          condition: { type: "hours_before_min" as const, hours: 48 },
          discount: { type: "fixed_amount" as const, value: 150 }
        }
      ],
      primaryCategory: 'wellness_center' as any,
    } as Doc<"classTemplates">;

    const mockVenue: Doc<"venues"> = {
      _id: "venue_123" as any,
      _creationTime: Date.now(),
      businessId: "business_123" as any,
      createdAt: Date.now(),
      createdBy: "user_123" as any,
      isActive: true,
      primaryCategory: "fitness_center" as any,
      name: "Downtown Studio",
      address: {
        street: "123 Main St",
        city: "Portland",
        zipCode: "97201",
        country: "USA",
        state: "OR"
      },
      imageStorageIds: ["venue_img_1"] as any
    } as Doc<"venues">;

    const mockBusiness: Doc<"businesses"> = {
      _id: "business_123" as any,
      _creationTime: Date.now(),
      timezone: "America/Los_Angeles",
      name: "Test Business",
      createdAt: Date.now(),
      createdBy: "user_123" as any,
      isActive: true
    } as Doc<"businesses">;

    const mockUser: Doc<"users"> = {
      _id: "user_123" as any,
      _creationTime: Date.now()
    } as Doc<"users">;

    it('should calculate endTime correctly from template duration', () => {
      const startTime = new Date('2024-01-08T10:00:00').getTime();

      const instance = createInstanceFromTemplate(
        mockTemplate,
        mockVenue,
        mockBusiness,
        mockUser,
        startTime
      );

      const expectedEndTime = startTime + (60 * 60 * 1000); // 60 minutes in milliseconds
      expect(instance.endTime).toBe(expectedEndTime);
    });

    it('should copy all required template fields', () => {
      const startTime = new Date('2024-01-08T10:00:00').getTime();

      const instance = createInstanceFromTemplate(
        mockTemplate,
        mockVenue,
        mockBusiness,
        mockUser,
        startTime
      );

      expect(instance.name).toBe(mockTemplate.name);
      expect(instance.description).toBe(mockTemplate.description);
      expect(instance.instructor).toBe(mockTemplate.instructor);
      expect(instance.capacity).toBe(mockTemplate.capacity);
      expect(instance.price).toBe(mockTemplate.price);
      expect(instance.bookingWindow).toBe(mockTemplate.bookingWindow);
      expect(instance.cancellationWindowHours).toBe(mockTemplate.cancellationWindowHours);
      expect(instance.primaryCategory).toBe(mockTemplate.primaryCategory);
      expect(instance.templateSnapshot.primaryCategory).toBe(mockTemplate.primaryCategory);
      expect(instance.tags).toEqual(mockTemplate.tags);
      expect(instance.color).toBe(mockTemplate.color);
    });

    it('should create proper template snapshot', () => {
      const startTime = new Date('2024-01-08T10:00:00').getTime();

      const instance = createInstanceFromTemplate(
        mockTemplate,
        mockVenue,
        mockBusiness,
        mockUser,
        startTime
      );

      expect(instance.templateSnapshot).toEqual({
        name: mockTemplate.name,
        description: mockTemplate.description,
        instructor: mockTemplate.instructor,
        imageStorageIds: mockTemplate.imageStorageIds,
        discountRules: mockTemplate.discountRules,
        primaryCategory: mockTemplate.primaryCategory,
      });
    });

    it('should create proper venue snapshot', () => {
      const startTime = new Date('2024-01-08T10:00:00').getTime();

      const instance = createInstanceFromTemplate(
        mockTemplate,
        mockVenue,
        mockBusiness,
        mockUser,
        startTime
      );

      expect(instance.venueSnapshot).toEqual({
        name: mockVenue.name,
        address: mockVenue.address,
        imageStorageIds: mockVenue.imageStorageIds
      });
    });

    it('should initialize booking counts to zero', () => {
      const startTime = new Date('2024-01-08T10:00:00').getTime();

      const instance = createInstanceFromTemplate(
        mockTemplate,
        mockVenue,
        mockBusiness,
        mockUser,
        startTime
      );

      expect(instance.bookedCount).toBe(0);
      expect(instance.waitlistCount).toBe(0);
    });

    it('should generate correct time pattern', () => {
      const startTime = new Date('2024-01-08T14:30:00').getTime(); // 2:30 PM

      const instance = createInstanceFromTemplate(
        mockTemplate,
        mockVenue,
        mockBusiness,
        mockUser,
        startTime
      );

      expect(instance.timePattern).toBe('14:30-15:30'); // 60 minute duration
    });

    it('should set correct dayOfWeek', () => {
      const mondayTime = new Date('2024-01-08T14:30:00').getTime(); // Monday

      const instance = createInstanceFromTemplate(
        mockTemplate,
        mockVenue,
        mockBusiness,
        mockUser,
        mondayTime
      );

      expect(instance.dayOfWeek).toBe(1); // Monday is day 1
    });

    it('should set audit fields correctly', () => {
      const startTime = new Date('2024-01-08T10:00:00').getTime();
      const beforeCreation = Date.now();

      const instance = createInstanceFromTemplate(
        mockTemplate,
        mockVenue,
        mockBusiness,
        mockUser,
        startTime
      );

      const afterCreation = Date.now();

      expect(instance.createdBy).toBe(mockUser._id);
      expect(instance.createdAt).toBeGreaterThanOrEqual(beforeCreation);
      expect(instance.createdAt).toBeLessThanOrEqual(afterCreation);
    });

    it('should handle templates with discountRules correctly', () => {
      const startTime = new Date('2024-01-08T10:00:00').getTime();

      const instance = createInstanceFromTemplate(
        mockTemplate,
        mockVenue,
        mockBusiness,
        mockUser,
        startTime
      );

      // Verify discountRules are copied to both instance and templateSnapshot
      expect(instance.discountRules).toEqual(mockTemplate.discountRules); // Instance now inherits template discountRules
      expect(instance.templateSnapshot.discountRules).toEqual(mockTemplate.discountRules);
    });

    it('should handle templates without discountRules correctly', () => {
      const templateWithoutDiscounts = { ...mockTemplate, discountRules: undefined };
      const startTime = new Date('2024-01-08T10:00:00').getTime();

      const instance = createInstanceFromTemplate(
        templateWithoutDiscounts,
        mockVenue,
        mockBusiness,
        mockUser,
        startTime
      );

      // Verify undefined discountRules are handled correctly
      expect(instance.discountRules).toBeUndefined();
      expect(instance.templateSnapshot.discountRules).toBeUndefined();
    });

    it('should validate startTime through validation layer', async () => {
      const invalidStartTime = "not a number" as any;

      const { classValidations } = await import("../validations/class");
      vi.mocked(classValidations.validateStartTime).mockReturnValueOnce({
        success: false,
        error: "Invalid start time"
      });

      expect(() => createInstanceFromTemplate(
        mockTemplate,
        mockVenue,
        mockBusiness,
        mockUser,
        invalidStartTime
      )).toThrow("Invalid start time");
    });
  });

  describe('prepareCreateMultipleInstances - Validation Safety', () => {

    it('should validate all required fields', () => {
      const args = {
        templateId: "template_123" as any,
        startTime: Date.now() + (24 * 60 * 60 * 1000),
        duration: 60,
        frequency: 'weekly' as const,
        weeks: 4,
        selectedDaysOfWeek: [1, 3, 5]
      };

      const result = prepareCreateMultipleInstances(args);

      expect(result.startTime).toBe(args.startTime);
      expect(result.frequency).toBe(args.frequency);
      expect(result.weeks).toBe(args.weeks);
      expect(result.selectedDaysOfWeek).toEqual(args.selectedDaysOfWeek);
    });

    it('should handle optional selectedDaysOfWeek', () => {
      const args = {
        templateId: "template_123" as any,
        startTime: Date.now() + (24 * 60 * 60 * 1000),
        duration: 60,
        frequency: 'weekly' as const,
        weeks: 4
        // No selectedDaysOfWeek
      };

      const result = prepareCreateMultipleInstances(args);

      expect(result.selectedDaysOfWeek).toBeUndefined();
    });

    it('should throw validation errors for invalid weeks count', async () => {
      const args = {
        templateId: "template_123" as any,
        startTime: Date.now() + (24 * 60 * 60 * 1000),
        duration: 60,
        frequency: 'weekly' as const,
        weeks: 0 // Invalid
      };

      const { classValidations } = await import("../validations/class");
      vi.mocked(classValidations.validateCount).mockReturnValueOnce({
        success: false,
        error: "Count must be positive"
      });

      expect(() => prepareCreateMultipleInstances(args)).toThrow("Count must be positive");
    });

    it('should preserve other properties not being validated', () => {
      const args = {
        startTime: Date.now() + (24 * 60 * 60 * 1000),
        frequency: 'weekly' as const,
        weeks: 4,
        templateId: "template_123" as any,
        venueId: "venue_123" as any,
        customProperty: "should be preserved"
      };

      const result = prepareCreateMultipleInstances(args as any);

      expect((result as any).templateId).toBe("template_123");
      expect((result as any).customProperty).toBe("should be preserved");
    });
  });

  describe('prepareInstanceUpdatesFromTemplateChanges - Snapshot Updates', () => {

    it('should update instance and templateSnapshot when template changes', () => {
      const instances = [{
        _id: "instance_1" as any,
        name: "Old Name",
        primaryCategory: 'wellness_center' as any,
        templateSnapshot: {
          name: "Old Name",
          description: "Old description",
          instructor: "Old instructor",
          imageStorageIds: ["old_img"],
          primaryCategory: 'wellness_center' as any,
        }
      }] as Doc<"classInstances">[];

      const templateChanges = {
        name: "New Yoga Class",
        description: "Updated description",
        instructor: "New Instructor",
        imageStorageIds: ["new_img_1", "new_img_2"] as any,
        primaryCategory: 'workshop' as any,
      };

      const updates = prepareInstanceUpdatesFromTemplateChanges(instances, templateChanges);

      expect(updates).toHaveLength(1);
      expect(updates[0].instanceId).toBe("instance_1");
      expect(updates[0].changes.name).toBe("New Yoga Class");
      expect(updates[0].changes.description).toBe("Updated description");
      expect(updates[0].changes.instructor).toBe("New Instructor");
      expect(updates[0].changes.primaryCategory).toBe('workshop');

      expect(updates[0].changes.templateSnapshot).toEqual({
        name: "New Yoga Class",
        description: "Updated description",
        instructor: "New Instructor",
        imageStorageIds: ["new_img_1", "new_img_2"],
        primaryCategory: 'workshop',
      });
    });

    it('should handle partial template updates', () => {
      const instances = [{
        _id: "instance_1" as any,
        name: "Current Name",
        primaryCategory: 'wellness_center' as any,
        templateSnapshot: {
          name: "Current Name",
          description: "Current description",
          instructor: "Current instructor",
          primaryCategory: 'wellness_center' as any,
        }
      }] as Doc<"classInstances">[];

      const templateChanges = {
        name: "Updated Name"
        // Only name is changing
      };

      const updates = prepareInstanceUpdatesFromTemplateChanges(instances, templateChanges);

      expect(updates[0].changes.name).toBe("Updated Name");
      expect(updates[0].changes.templateSnapshot?.name).toBe("Updated Name");
      // Other fields should be preserved from original template snapshot
      expect(updates[0].changes.templateSnapshot?.description).toBe("Current description");
      expect(updates[0].changes.templateSnapshot?.primaryCategory).toBe('wellness_center');
    });
  });

  describe('prepareInstanceUpdatesFromVenueChanges - Venue Snapshot Updates', () => {

    it('should update venueSnapshot when venue changes', () => {
      const instances = [{
        _id: "instance_1" as any,
        venueSnapshot: {
          name: "Old Studio",
          address: {
            street: "Old Street",
            city: "Old City",
            zipCode: "12345",
            country: "USA"
          },
          imageStorageIds: ["old_venue_img"]
        }
      }] as Doc<"classInstances">[];

      const venueChanges = {
        name: "New Studio Location",
        address: {
          street: "New Street",
          city: "New City",
          zipCode: "12345",
          country: "USA"
        },
        imageStorageIds: ["new_venue_img"] as any
      };

      const updates = prepareInstanceUpdatesFromVenueChanges(instances, venueChanges);

      expect(updates).toHaveLength(1);
      expect(updates[0].changes.venueSnapshot?.name).toBe("New Studio Location");
      expect(updates[0].changes.venueSnapshot?.address?.street).toBe("New Street");
      expect(updates[0].changes.venueSnapshot?.imageStorageIds).toEqual(["new_venue_img"]);
    });
  });

  describe('classInstanceOperations object', () => {
    it('should export all operation functions', () => {
      expect(classInstanceOperations.prepareCreateMultipleInstances).toBe(prepareCreateMultipleInstances);
      expect(classInstanceOperations.prepareUpdateInstance).toBe(prepareUpdateInstance);
      expect(classInstanceOperations.prepareInstanceUpdatesFromTemplateChanges).toBe(prepareInstanceUpdatesFromTemplateChanges);
      expect(classInstanceOperations.prepareInstanceUpdatesFromVenueChanges).toBe(prepareInstanceUpdatesFromVenueChanges);
      expect(classInstanceOperations.createInstanceFromTemplate).toBe(createInstanceFromTemplate);
    });
  });
});
