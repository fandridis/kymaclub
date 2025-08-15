import { describe, it, expect } from "vitest";
import { venueValidations } from "./venue";

describe('Venue Validations', () => {
    describe('validateName', () => {
        it('should accept valid venue name', () => {
            const result = venueValidations.validateName('Kyma Yoga Studio');
            
            expect(result).toEqual({
                success: true,
                value: 'Kyma Yoga Studio'
            });
        });

        it('should trim whitespace from venue name', () => {
            const result = venueValidations.validateName('  Kyma Studio  ');
            
            expect(result).toEqual({
                success: true,
                value: 'Kyma Studio'
            });
        });

        it('should reject empty name', () => {
            const result = venueValidations.validateName('');
            
            expect(result).toEqual({
                success: false,
                error: 'Name is required'
            });
        });

        it('should reject whitespace-only name', () => {
            const result = venueValidations.validateName('   ');
            
            expect(result).toEqual({
                success: false,
                error: 'Name is required'
            });
        });

        it('should reject name exceeding 100 characters', () => {
            const longName = 'a'.repeat(101);
            const result = venueValidations.validateName(longName);
            
            expect(result).toEqual({
                success: false,
                error: 'Name cannot exceed 100 characters'
            });
        });

        it('should accept name with exactly 100 characters', () => {
            const maxName = 'a'.repeat(100);
            const result = venueValidations.validateName(maxName);
            
            expect(result.success).toBe(true);
            expect(result.value).toBe(maxName);
        });
    });

    describe('validateDescription', () => {
        it('should accept valid description', () => {
            const description = 'A beautiful yoga studio in the heart of Athens';
            const result = venueValidations.validateDescription(description);
            
            expect(result).toEqual({
                success: true,
                value: description
            });
        });

        it('should trim whitespace from description', () => {
            const result = venueValidations.validateDescription('  Great studio  ');
            
            expect(result).toEqual({
                success: true,
                value: 'Great studio'
            });
        });

        it('should accept empty description', () => {
            const result = venueValidations.validateDescription('');
            
            expect(result).toEqual({
                success: true,
                value: ''
            });
        });

        it('should reject description exceeding 2000 characters', () => {
            const longDescription = 'a'.repeat(2001);
            const result = venueValidations.validateDescription(longDescription);
            
            expect(result).toEqual({
                success: false,
                error: 'Description cannot exceed 2000 characters'
            });
        });

        it('should accept description with exactly 2000 characters', () => {
            const maxDescription = 'a'.repeat(2000);
            const result = venueValidations.validateDescription(maxDescription);
            
            expect(result.success).toBe(true);
            expect(result.value).toBe(maxDescription);
        });
    });

    describe('validateCapacity', () => {
        it('should accept valid capacity', () => {
            const result = venueValidations.validateCapacity(25);
            
            expect(result).toEqual({
                success: true,
                value: 25
            });
        });

        it('should reject zero capacity', () => {
            const result = venueValidations.validateCapacity(0);
            
            expect(result).toEqual({
                success: false,
                error: 'Capacity must be a positive integer'
            });
        });

        it('should reject negative capacity', () => {
            const result = venueValidations.validateCapacity(-5);
            
            expect(result).toEqual({
                success: false,
                error: 'Capacity must be a positive integer'
            });
        });

        it('should reject decimal capacity', () => {
            const result = venueValidations.validateCapacity(25.5);
            
            expect(result).toEqual({
                success: false,
                error: 'Capacity must be a positive integer'
            });
        });

        it('should reject capacity exceeding 2000', () => {
            const result = venueValidations.validateCapacity(2001);
            
            expect(result).toEqual({
                success: false,
                error: 'Capacity cannot exceed 2000'
            });
        });

        it('should accept capacity of exactly 2000', () => {
            const result = venueValidations.validateCapacity(2000);
            
            expect(result).toEqual({
                success: true,
                value: 2000
            });
        });
    });

    describe('validateEquipment', () => {
        it('should accept valid equipment array', () => {
            const equipment = ['yoga mats', 'blocks', 'straps'];
            const result = venueValidations.validateEquipment(equipment);
            
            expect(result).toEqual({
                success: true,
                value: equipment
            });
        });

        it('should trim equipment items', () => {
            const equipment = ['  yoga mats  ', '  blocks  '];
            const result = venueValidations.validateEquipment(equipment);
            
            expect(result).toEqual({
                success: true,
                value: ['yoga mats', 'blocks']
            });
        });

        it('should accept empty equipment array', () => {
            const result = venueValidations.validateEquipment([]);
            
            expect(result).toEqual({
                success: true,
                value: []
            });
        });

        it('should reject non-array equipment', () => {
            const result = venueValidations.validateEquipment('not an array' as any);
            
            expect(result).toEqual({
                success: false,
                error: 'Equipment must be an array'
            });
        });

        it('should reject equipment with empty items', () => {
            const equipment = ['yoga mats', '', 'blocks'];
            const result = venueValidations.validateEquipment(equipment);
            
            expect(result).toEqual({
                success: false,
                error: 'Equipment items cannot be empty'
            });
        });

        it('should reject equipment with whitespace-only items', () => {
            const equipment = ['yoga mats', '   ', 'blocks'];
            const result = venueValidations.validateEquipment(equipment);
            
            expect(result).toEqual({
                success: false,
                error: 'Equipment items cannot be empty'
            });
        });
    });

    describe('validateLatitude', () => {
        it('should accept valid latitude', () => {
            const result = venueValidations.validateLatitude(37.9838);
            
            expect(result).toEqual({
                success: true,
                value: 37.9838
            });
        });

        it('should accept latitude at boundaries', () => {
            expect(venueValidations.validateLatitude(-90)).toEqual({
                success: true,
                value: -90
            });
            
            expect(venueValidations.validateLatitude(90)).toEqual({
                success: true,
                value: 90
            });
        });

        it('should reject latitude below -90', () => {
            const result = venueValidations.validateLatitude(-91);
            
            expect(result).toEqual({
                success: false,
                error: 'Latitude must be between -90 and 90'
            });
        });

        it('should reject latitude above 90', () => {
            const result = venueValidations.validateLatitude(91);
            
            expect(result).toEqual({
                success: false,
                error: 'Latitude must be between -90 and 90'
            });
        });
    });

    describe('validateLongitude', () => {
        it('should accept valid longitude', () => {
            const result = venueValidations.validateLongitude(23.7275);
            
            expect(result).toEqual({
                success: true,
                value: 23.7275
            });
        });

        it('should accept longitude at boundaries', () => {
            expect(venueValidations.validateLongitude(-180)).toEqual({
                success: true,
                value: -180
            });
            
            expect(venueValidations.validateLongitude(180)).toEqual({
                success: true,
                value: 180
            });
        });

        it('should reject longitude below -180', () => {
            const result = venueValidations.validateLongitude(-181);
            
            expect(result).toEqual({
                success: false,
                error: 'Longitude must be between -180 and 180'
            });
        });

        it('should reject longitude above 180', () => {
            const result = venueValidations.validateLongitude(181);
            
            expect(result).toEqual({
                success: false,
                error: 'Longitude must be between -180 and 180'
            });
        });
    });

    // validateAddress tests removed - use individual core validations instead
});