import { describe, it, expect } from "vitest";
import { classValidations } from "./class";

describe('Class Validations', () => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    describe('validateStartTime', () => {
        it('should accept valid future timestamp', () => {
            const futureTime = now + oneDay;
            const result = classValidations.validateStartTime(futureTime);
            
            expect(result).toEqual({
                success: true,
                value: futureTime
            });
        });

        it('should reject non-integer timestamp', () => {
            const result = classValidations.validateStartTime(123.45);
            
            expect(result).toEqual({
                success: false,
                error: 'Start time must be a valid timestamp'
            });
        });

        it('should reject zero or negative timestamp', () => {
            expect(classValidations.validateStartTime(0)).toEqual({
                success: false,
                error: 'Start time must be a valid timestamp'
            });
            
            expect(classValidations.validateStartTime(-100)).toEqual({
                success: false,
                error: 'Start time must be a valid timestamp'
            });
        });

        it('should reject timestamp more than 1 year in future', () => {
            const farFuture = now + (366 * oneDay);
            const result = classValidations.validateStartTime(farFuture);
            
            expect(result).toEqual({
                success: false,
                error: 'Start time cannot be more than 1 year in the future'
            });
        });

        it('should accept timestamp exactly 1 year from now', () => {
            const oneYearFromNow = now + (365 * oneDay);
            const result = classValidations.validateStartTime(oneYearFromNow);
            
            expect(result.success).toBe(true);
        });
    });

    describe('validateEndTime', () => {
        const startTime = now + oneHour;

        it('should accept valid end time after start time', () => {
            const endTime = startTime + oneHour;
            const result = classValidations.validateEndTime(endTime, startTime);
            
            expect(result).toEqual({
                success: true,
                value: endTime
            });
        });

        it('should reject non-integer end time', () => {
            const result = classValidations.validateEndTime(123.45, startTime);
            
            expect(result).toEqual({
                success: false,
                error: 'End time must be a valid timestamp'
            });
        });

        it('should reject end time before or equal to start time', () => {
            expect(classValidations.validateEndTime(startTime - 1000, startTime)).toEqual({
                success: false,
                error: 'End time must be after start time'
            });
            
            expect(classValidations.validateEndTime(startTime, startTime)).toEqual({
                success: false,
                error: 'End time must be after start time'
            });
        });

        it('should reject duration exceeding 8 hours', () => {
            const longEndTime = startTime + (9 * oneHour);
            const result = classValidations.validateEndTime(longEndTime, startTime);
            
            expect(result).toEqual({
                success: false,
                error: 'Instance duration cannot exceed 8 hours'
            });
        });

        it('should accept duration of exactly 8 hours', () => {
            const eightHourEndTime = startTime + (8 * oneHour);
            const result = classValidations.validateEndTime(eightHourEndTime, startTime);
            
            expect(result.success).toBe(true);
        });
    });

    describe('validateName', () => {
        it('should accept valid class name', () => {
            const result = classValidations.validateName('Morning Yoga');
            
            expect(result).toEqual({
                success: true,
                value: 'Morning Yoga'
            });
        });

        it('should trim whitespace', () => {
            const result = classValidations.validateName('  Evening Pilates  ');
            
            expect(result).toEqual({
                success: true,
                value: 'Evening Pilates'
            });
        });

        it('should reject empty name', () => {
            const result = classValidations.validateName('');
            
            expect(result).toEqual({
                success: false,
                error: 'Class name is required'
            });
        });

        it('should reject name exceeding 100 characters', () => {
            const longName = 'a'.repeat(101);
            const result = classValidations.validateName(longName);
            
            expect(result).toEqual({
                success: false,
                error: 'Class name must be 100 characters or less'
            });
        });
    });

    describe('validateCapacity', () => {
        it('should accept valid capacity', () => {
            const result = classValidations.validateCapacity(20);
            
            expect(result).toEqual({
                success: true,
                value: 20
            });
        });

        it('should reject zero or negative capacity', () => {
            expect(classValidations.validateCapacity(0)).toEqual({
                success: false,
                error: 'Capacity must be greater than zero'
            });
            
            expect(classValidations.validateCapacity(-5)).toEqual({
                success: false,
                error: 'Capacity must be greater than zero'
            });
        });

        it('should reject decimal capacity', () => {
            const result = classValidations.validateCapacity(20.5);
            
            expect(result).toEqual({
                success: false,
                error: 'Capacity must be a whole number'
            });
        });

        it('should reject capacity exceeding 100', () => {
            const result = classValidations.validateCapacity(101);
            
            expect(result).toEqual({
                success: false,
                error: 'Capacity cannot exceed 100'
            });
        });
    });

    describe('validatePrice', () => {
        it('should accept valid price', () => {
            const result = classValidations.validatePrice(500); // 5 euros in cents
            
            expect(result).toEqual({
                success: true,
                value: 500
            });
        });

        it('should reject price below minimum (100 cents)', () => {
            const result = classValidations.validatePrice(50); // 50 cents, below 1 euro minimum
            
            expect(result).toEqual({
                success: false,
                error: 'Price must be at least 1.00 in business currency (100 cents)'
            });
        });

        it('should reject negative prices', () => {
            const result = classValidations.validatePrice(-100);
            
            expect(result).toEqual({
                success: false,
                error: 'Price must be at least 1.00 in business currency (100 cents)'
            });
        });

        it('should reject prices exceeding maximum (10000 cents)', () => {
            const result = classValidations.validatePrice(15000); // 150 euros, above 100 euro maximum
            
            expect(result).toEqual({
                success: false,
                error: 'Price cannot exceed 100.00 in business currency (10000 cents)'
            });
        });

        it('should reject non-integer prices', () => {
            const result = classValidations.validatePrice(199.5); // Should be integer cents
            
            expect(result).toEqual({
                success: false,
                error: 'Price must be at least 1.00 in business currency (100 cents)'
            });
        });
    });

    describe('validateBookingWindow', () => {
        it('should accept valid booking window', () => {
            const window = { minHours: 2, maxHours: 168 };
            const result = classValidations.validateBookingWindow(window);
            
            expect(result).toEqual({
                success: true,
                value: window
            });
        });

        it('should reject negative minimum hours', () => {
            const window = { minHours: -1, maxHours: 24 };
            const result = classValidations.validateBookingWindow(window);
            
            expect(result).toEqual({
                success: false,
                error: 'Minimum booking hours cannot be negative'
            });
        });

        it('should reject max hours less than min hours', () => {
            const window = { minHours: 10, maxHours: 5 };
            const result = classValidations.validateBookingWindow(window);
            
            expect(result).toEqual({
                success: false,
                error: 'Maximum hours must be greater than or equal to minimum hours'
            });
        });

        it('should accept equal min and max hours', () => {
            const window = { minHours: 24, maxHours: 24 };
            const result = classValidations.validateBookingWindow(window);
            
            expect(result.success).toBe(true);
        });

        it('should reject max hours exceeding 30 days', () => {
            const window = { minHours: 0, maxHours: 721 };
            const result = classValidations.validateBookingWindow(window);
            
            expect(result).toEqual({
                success: false,
                error: 'Maximum booking window cannot exceed 30 days'
            });
        });
    });

    describe('validateSelectedDaysOfWeek', () => {
        it('should accept valid days array', () => {
            const days = [1, 3, 5]; // Monday, Wednesday, Friday
            const result = classValidations.validateSelectedDaysOfWeek(days);
            
            expect(result).toEqual({
                success: true,
                value: days
            });
        });

        it('should remove duplicates', () => {
            const days = [1, 3, 1, 5, 3];
            const result = classValidations.validateSelectedDaysOfWeek(days);
            
            expect(result).toEqual({
                success: true,
                value: [1, 3, 5]
            });
        });

        it('should reject non-array input', () => {
            const result = classValidations.validateSelectedDaysOfWeek('not array' as any);
            
            expect(result).toEqual({
                success: false,
                error: 'Selected days must be a list'
            });
        });

        it('should reject empty array', () => {
            const result = classValidations.validateSelectedDaysOfWeek([]);
            
            expect(result).toEqual({
                success: false,
                error: 'Selected days is required and cannot be empty'
            });
        });

        it('should reject invalid day numbers', () => {
            expect(classValidations.validateSelectedDaysOfWeek([1, 7])).toEqual({
                success: false,
                error: 'Selected days must contain valid day numbers (0=Sunday, 1=Monday, ..., 6=Saturday)'
            });
            
            expect(classValidations.validateSelectedDaysOfWeek([1, -1])).toEqual({
                success: false,
                error: 'Selected days must contain valid day numbers (0=Sunday, 1=Monday, ..., 6=Saturday)'
            });
            
            expect(classValidations.validateSelectedDaysOfWeek([1.5])).toEqual({
                success: false,
                error: 'Selected days must contain valid day numbers (0=Sunday, 1=Monday, ..., 6=Saturday)'
            });
        });
    });

    describe('validateDuration', () => {
        it('should accept valid duration', () => {
            const result = classValidations.validateDuration(60);
            
            expect(result).toEqual({
                success: true,
                value: 60
            });
        });

        it('should reject zero or negative duration', () => {
            expect(classValidations.validateDuration(0)).toEqual({
                success: false,
                error: 'Duration must be a positive number'
            });
            
            expect(classValidations.validateDuration(-30)).toEqual({
                success: false,
                error: 'Duration must be a positive number'
            });
        });

        it('should reject decimal duration', () => {
            const result = classValidations.validateDuration(60.5);
            
            expect(result).toEqual({
                success: false,
                error: 'Duration must be a positive number'
            });
        });

        it('should reject duration exceeding 8 hours', () => {
            const result = classValidations.validateDuration(481);
            
            expect(result).toEqual({
                success: false,
                error: 'Duration cannot exceed 8 hours (480 minutes)'
            });
        });

        it('should accept duration of exactly 8 hours', () => {
            const result = classValidations.validateDuration(480);
            
            expect(result.success).toBe(true);
        });
    });

    describe('validateWaitlistCapacity', () => {
        it('should accept valid waitlist capacity', () => {
            const result = classValidations.validateWaitlistCapacity(10);
            
            expect(result).toEqual({
                success: true,
                value: 10
            });
        });

        it('should accept zero waitlist capacity', () => {
            const result = classValidations.validateWaitlistCapacity(0);
            
            expect(result).toEqual({
                success: true,
                value: 0
            });
        });

        it('should reject negative waitlist capacity', () => {
            const result = classValidations.validateWaitlistCapacity(-1);
            
            expect(result).toEqual({
                success: false,
                error: 'Waitlist capacity must be a non-negative integer'
            });
        });

        it('should reject decimal waitlist capacity', () => {
            const result = classValidations.validateWaitlistCapacity(5.5);
            
            expect(result).toEqual({
                success: false,
                error: 'Waitlist capacity must be a non-negative integer'
            });
        });
    });

    describe('validateFrequency', () => {
        it('should accept valid frequencies', () => {
            expect(classValidations.validateFrequency('daily')).toEqual({
                success: true,
                value: 'daily'
            });
            
            expect(classValidations.validateFrequency('weekly')).toEqual({
                success: true,
                value: 'weekly'
            });
        });

        it('should reject invalid frequencies', () => {
            expect(classValidations.validateFrequency('monthly')).toEqual({
                success: false,
                error: "Frequency must be either 'daily' or 'weekly'"
            });
            
            expect(classValidations.validateFrequency('invalid')).toEqual({
                success: false,
                error: "Frequency must be either 'daily' or 'weekly'"
            });
        });
    });

    describe('validateCount', () => {
        it('should accept valid count', () => {
            const result = classValidations.validateCount(50);
            
            expect(result).toEqual({
                success: true,
                value: 50
            });
        });

        it('should reject zero or negative count', () => {
            expect(classValidations.validateCount(0)).toEqual({
                success: false,
                error: 'Count must be a positive integer'
            });
            
            expect(classValidations.validateCount(-1)).toEqual({
                success: false,
                error: 'Count must be a positive integer'
            });
        });

        it('should reject decimal count', () => {
            const result = classValidations.validateCount(10.5);
            
            expect(result).toEqual({
                success: false,
                error: 'Count must be a positive integer'
            });
        });

        it('should reject count exceeding 100', () => {
            const result = classValidations.validateCount(101);
            
            expect(result).toEqual({
                success: false,
                error: 'Cannot create more than 100 instances at once'
            });
        });
    });
});