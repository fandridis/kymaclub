import { describe, it, expect } from "vitest";
import { ConvexError } from "convex/values";
import { classTemplateOperations } from "./classTemplate";
import { createTestUser, createTestBusiness } from "../convex/testResources";
import type { Doc } from "../convex/_generated/dataModel";
import type { CreateClassTemplateArgs, UpdateClassTemplateArgs } from "../convex/mutations/classTemplates";

describe('Class Template Operations', () => {
    const mockBusinessId = createTestBusiness()._id;
    const mockUserId = createTestUser()._id;

    describe('prepareCreateTemplate', () => {
        const validTemplateArgs: CreateClassTemplateArgs = {
            template: {
                name: 'Morning Yoga',
                instructor: 'Maria Pappas',
                description: 'Relaxing morning yoga session',
                duration: 60,
                capacity: 20,
                price: 500, // 5 euros in cents
                tags: ['yoga', 'beginner'],
                bookingWindow: { minHours: 2, maxHours: 168 },
                cancellationWindowHours: 24,
                waitlistCapacity: 5,
                venueId: 'venue123' as any,
                primaryCategory: 'wellness_center',
            }
        };

        it('should prepare valid template data', () => {
            const result = classTemplateOperations.prepareCreateTemplate(validTemplateArgs);

            expect(result.name).toBe('Morning Yoga');
            expect(result.instructor).toBe('Maria Pappas');
            expect(result.duration).toBe(60);
            expect(result.capacity).toBe(20);
            expect(result.price).toBe(500);
            expect(result.tags).toEqual(['yoga', 'beginner']);
            expect(result.bookingWindow).toEqual({ minHours: 2, maxHours: 168 });
        });

        it('should trim whitespace from name and instructor', () => {
            const args = {
                ...validTemplateArgs,
                template: {
                    ...validTemplateArgs.template,
                    name: '  Evening Pilates  ',
                    instructor: '  John Smith  '
                }
            };

            const result = classTemplateOperations.prepareCreateTemplate(args);
            expect(result.name).toBe('Evening Pilates');
            expect(result.instructor).toBe('John Smith');
        });

        it('should throw error for empty name', () => {
            const args = {
                ...validTemplateArgs,
                template: {
                    ...validTemplateArgs.template,
                    name: ''
                }
            };

            expect(() => classTemplateOperations.prepareCreateTemplate(args))
                .toThrow(ConvexError);
        });

        it('should throw error for empty instructor', () => {
            const args = {
                ...validTemplateArgs,
                template: {
                    ...validTemplateArgs.template,
                    instructor: ''
                }
            };

            expect(() => classTemplateOperations.prepareCreateTemplate(args))
                .toThrow(ConvexError);
        });

        it('should throw error for invalid duration', () => {
            const args = {
                ...validTemplateArgs,
                template: {
                    ...validTemplateArgs.template,
                    duration: 0
                }
            };

            expect(() => classTemplateOperations.prepareCreateTemplate(args))
                .toThrow(ConvexError);
        });

        it('should throw error for invalid capacity', () => {
            const args = {
                ...validTemplateArgs,
                template: {
                    ...validTemplateArgs.template,
                    capacity: -5
                }
            };

            expect(() => classTemplateOperations.prepareCreateTemplate(args))
                .toThrow(ConvexError);
        });

        it('should throw error for invalid price euros', () => {
            const args = {
                ...validTemplateArgs,
                template: {
                    ...validTemplateArgs.template,
                    price: 50 // Below minimum of 100
                }
            };

            expect(() => classTemplateOperations.prepareCreateTemplate(args))
                .toThrow(ConvexError);
        });

        it('should handle missing optional fields', () => {
            const minimalArgs: CreateClassTemplateArgs = {
                template: {
                    name: 'Simple Class',
                    instructor: 'Teacher',
                    duration: 45,
                    capacity: 15,
                    price: 300, // 3 euros in cents
                    venueId: 'venue123' as any
                }
            };

            const result = classTemplateOperations.prepareCreateTemplate(minimalArgs);

            expect(result.name).toBe('Simple Class');
            expect(result.instructor).toBe('Teacher');
            expect(result.description).toBeUndefined();
            expect(result.tags).toBeUndefined();
            expect(result.bookingWindow).toBeUndefined();
        });

        it('should validate booking window if provided', () => {
            const args = {
                ...validTemplateArgs,
                template: {
                    ...validTemplateArgs.template,
                    bookingWindow: { minHours: 10, maxHours: 5 } // Invalid: max < min
                }
            };

            expect(() => classTemplateOperations.prepareCreateTemplate(args))
                .toThrow(ConvexError);
        });

        it('should validate waitlist capacity if provided', () => {
            const args = {
                ...validTemplateArgs,
                template: {
                    ...validTemplateArgs.template,
                    waitlistCapacity: -1 // Invalid: negative
                }
            };

            expect(() => classTemplateOperations.prepareCreateTemplate(args))
                .toThrow(ConvexError);
        });
    });

    describe('prepareUpdateTemplate', () => {
        it('should update only provided fields', () => {
            const updates: UpdateClassTemplateArgs['template'] = {
                name: 'Updated Class',
                capacity: 25
            };

            const result = classTemplateOperations.prepareUpdateTemplate(updates);

            expect(result.name).toBe('Updated Class');
            expect(result.capacity).toBe(25);
            expect(result.instructor).toBeUndefined(); // Not included in update
        });

        it('should validate updated fields', () => {
            const updates: UpdateClassTemplateArgs['template'] = {
                name: '', // Invalid empty name
                capacity: 25
            };

            expect(() => classTemplateOperations.prepareUpdateTemplate(updates))
                .toThrow(ConvexError);
        });

        it('should handle empty update', () => {
            const updates: UpdateClassTemplateArgs['template'] = {};

            const result = classTemplateOperations.prepareUpdateTemplate(updates);

            expect(Object.keys(result)).toHaveLength(0);
        });

        it('should validate all provided fields', () => {
            const updates: UpdateClassTemplateArgs['template'] = {
                name: 'Valid Name',
                instructor: 'Valid Instructor',
                duration: 90,
                capacity: 30,
                price: 800, // 8 euros in cents
                bookingWindow: { minHours: 1, maxHours: 72 }
            };

            const result = classTemplateOperations.prepareUpdateTemplate(updates);

            expect(result.name).toBe('Valid Name');
            expect(result.instructor).toBe('Valid Instructor');
            expect(result.duration).toBe(90);
            expect(result.capacity).toBe(30);
            expect(result.price).toBe(800);
            expect(result.bookingWindow).toEqual({ minHours: 1, maxHours: 72 });
        });
    });

    describe('createDefaultTemplate', () => {
        it('should create default template with correct properties', () => {
            const result = classTemplateOperations.createDefaultTemplate(mockBusinessId, mockUserId);

            expect(result.businessId).toBe(mockBusinessId);
            expect(result.isActive).toBe(true);
            expect(result.allowWaitlist).toBe(false);
            expect(result.createdBy).toBe(mockUserId);
            expect(typeof result.createdAt).toBe('number');
            expect(result.createdAt).toBeGreaterThan(0);
        });

        it('should create template with current timestamp', () => {
            const before = Date.now();
            const result = classTemplateOperations.createDefaultTemplate(mockBusinessId, mockUserId);
            const after = Date.now();

            expect(result.createdAt).toBeGreaterThanOrEqual(before);
            expect(result.createdAt).toBeLessThanOrEqual(after);
        });
    });

    describe('validateTemplateForInstanceCreation', () => {
        const validTemplate: Doc<"classTemplates"> = {
            _id: 'template123' as any,
            _creationTime: Date.now(),
            businessId: mockBusinessId,
            name: 'Valid Class',
            instructor: 'Valid Instructor',
            primaryCategory: 'yoga_studio' as any,
            description: 'Description',
            duration: 60,
            capacity: 20,
            price: 500, // 5 euros in cents
            venueId: 'venue123' as any,
            color: '#3B82F6',
            isActive: true,
            tags: ['yoga'],
            bookingWindow: { minHours: 2, maxHours: 168 },
            cancellationWindowHours: 24,
            allowWaitlist: false,
            imageStorageIds: [],
            createdAt: Date.now(),
            createdBy: mockUserId,
            updatedAt: Date.now(),
            updatedBy: mockUserId
        };

        it('should validate complete template', () => {
            const result = classTemplateOperations.validateTemplateForInstanceCreation(validTemplate);

            expect(result.isValid).toBe(true);
            expect(result.missingFields).toHaveLength(0);
        });

        it('should detect missing name', () => {
            const template = { ...validTemplate, name: '' };
            const result = classTemplateOperations.validateTemplateForInstanceCreation(template);

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('name');
        });

        it('should detect missing instructor', () => {
            const template = { ...validTemplate, instructor: '   ' };
            const result = classTemplateOperations.validateTemplateForInstanceCreation(template);

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('instructor');
        });

        it('should detect invalid duration', () => {
            const template = { ...validTemplate, duration: 0 };
            const result = classTemplateOperations.validateTemplateForInstanceCreation(template);

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('duration');
        });

        it('should detect invalid capacity', () => {
            const template = { ...validTemplate, capacity: -1 };
            const result = classTemplateOperations.validateTemplateForInstanceCreation(template);

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('capacity');
        });

        it('should detect missing price euros', () => {
            const template = { ...validTemplate, price: undefined as any };
            const result = classTemplateOperations.validateTemplateForInstanceCreation(template);

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('price');
        });

        it('should detect missing primary category', () => {
            const template = { ...validTemplate, primaryCategory: undefined };
            const result = classTemplateOperations.validateTemplateForInstanceCreation(template);

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('primaryCategory');
        });

        it('should detect blank primary category', () => {
            const template = { ...validTemplate, primaryCategory: '   ' as any };
            const result = classTemplateOperations.validateTemplateForInstanceCreation(template);

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('primaryCategory');
        });

        it('should detect multiple missing fields', () => {
            const template = {
                ...validTemplate,
                name: '',
                instructor: '',
                duration: 0,
                capacity: 0,
                price: undefined as any
            };
            const result = classTemplateOperations.validateTemplateForInstanceCreation(template);

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toHaveLength(5);
            expect(result.missingFields).toContain('name');
            expect(result.missingFields).toContain('instructor');
            expect(result.missingFields).toContain('duration');
            expect(result.missingFields).toContain('capacity');
            expect(result.missingFields).toContain('price');
        });

        it('should accept zero price euros', () => {
            const template = { ...validTemplate, price: 0 };
            const result = classTemplateOperations.validateTemplateForInstanceCreation(template);

            expect(result.isValid).toBe(true); // Zero price is acceptable for instance creation (free classes)
            expect(result.missingFields).not.toContain('price');
        });

        it('should reject negative price euros', () => {
            const template = { ...validTemplate, price: -1 };
            const result = classTemplateOperations.validateTemplateForInstanceCreation(template);

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('price');
        });
    });
});
