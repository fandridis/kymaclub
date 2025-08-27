import { describe, it, expect } from "vitest";
import { 
  generateInstanceTimes, 
  generateTimePatternData, 
  calculateNewInstanceTimes,
  timeUtils 
} from "./timeGeneration";

describe('Time Generation Utils', () => {
  
  describe('generateInstanceTimes', () => {
    
    describe('weekly frequency', () => {
      it('should generate correct weekly instances', () => {
        // Monday, January 8, 2024 at 10:00 AM
        const startTime = new Date('2024-01-08T10:00:00.000Z').getTime();
        const duration = 60; // 60 minutes
        const frequency = 'weekly';
        const weeks = 3;
        
        const instances = generateInstanceTimes(startTime, duration, frequency, weeks);
        
        expect(instances).toHaveLength(3);
        
        // First instance
        expect(instances[0].startTime).toBe(startTime);
        expect(instances[0].endTime).toBe(startTime + (60 * 60 * 1000));
        
        // Second instance (1 week later)
        const expectedSecond = new Date('2024-01-15T10:00:00.000Z').getTime();
        expect(instances[1].startTime).toBe(expectedSecond);
        expect(instances[1].endTime).toBe(expectedSecond + (60 * 60 * 1000));
        
        // Third instance (2 weeks later)
        const expectedThird = new Date('2024-01-22T10:00:00.000Z').getTime();
        expect(instances[2].startTime).toBe(expectedThird);
        expect(instances[2].endTime).toBe(expectedThird + (60 * 60 * 1000));
      });

      it('should handle different durations correctly', () => {
        const startTime = new Date('2024-01-08T14:30:00.000Z').getTime();
        const duration = 90; // 90 minutes
        const frequency = 'weekly';
        const weeks = 2;
        
        const instances = generateInstanceTimes(startTime, duration, frequency, weeks);
        
        expect(instances).toHaveLength(2);
        expect(instances[0].endTime - instances[0].startTime).toBe(90 * 60 * 1000);
        expect(instances[1].endTime - instances[1].startTime).toBe(90 * 60 * 1000);
      });

      it('should handle single week correctly', () => {
        const startTime = new Date('2024-01-08T10:00:00.000Z').getTime();
        const duration = 60;
        const frequency = 'weekly';
        const weeks = 1;
        
        const instances = generateInstanceTimes(startTime, duration, frequency, weeks);
        
        expect(instances).toHaveLength(1);
        expect(instances[0].startTime).toBe(startTime);
      });

      it('should return empty array for zero weeks', () => {
        const startTime = new Date('2024-01-08T10:00:00.000Z').getTime();
        const duration = 60;
        const frequency = 'weekly';
        const weeks = 0;
        
        const instances = generateInstanceTimes(startTime, duration, frequency, weeks);
        
        expect(instances).toHaveLength(0);
      });
    });

    describe('daily frequency', () => {
      it('should generate instances for selected days of the week', () => {
        // Monday, January 8, 2024 at 10:00 AM
        const startTime = new Date('2024-01-08T10:00:00.000Z').getTime();
        const duration = 60;
        const frequency = 'daily';
        const weeks = 2;
        const selectedDaysOfWeek = [1, 3, 5]; // Monday, Wednesday, Friday (0=Sunday, 1=Monday...)
        
        const instances = generateInstanceTimes(startTime, duration, frequency, weeks, selectedDaysOfWeek);
        
        // Should generate 6 instances (3 days × 2 weeks)
        expect(instances).toHaveLength(6);
        
        // Check first week - Monday (Jan 8), Wednesday (Jan 10), Friday (Jan 12)
        expect(instances[0].startTime).toBe(new Date('2024-01-08T10:00:00.000Z').getTime()); // Monday
        expect(instances[1].startTime).toBe(new Date('2024-01-10T10:00:00.000Z').getTime()); // Wednesday
        expect(instances[2].startTime).toBe(new Date('2024-01-12T10:00:00.000Z').getTime()); // Friday
        
        // Check second week - Monday (Jan 15), Wednesday (Jan 17), Friday (Jan 19)
        expect(instances[3].startTime).toBe(new Date('2024-01-15T10:00:00.000Z').getTime()); // Monday
        expect(instances[4].startTime).toBe(new Date('2024-01-17T10:00:00.000Z').getTime()); // Wednesday
        expect(instances[5].startTime).toBe(new Date('2024-01-19T10:00:00.000Z').getTime()); // Friday
      });

      it('should handle weekends correctly', () => {
        // Saturday, January 6, 2024 at 9:00 AM  
        const startTime = new Date('2024-01-06T09:00:00.000Z').getTime();
        const duration = 45;
        const frequency = 'daily';
        const weeks = 2;
        const selectedDaysOfWeek = [0, 6]; // Sunday and Saturday
        
        const instances = generateInstanceTimes(startTime, duration, frequency, weeks, selectedDaysOfWeek);
        
        // Should generate 4 instances (2 days × 2 weeks)
        expect(instances).toHaveLength(4);
        
        // Check that all instances fall on Saturday (6) or Sunday (0)
        instances.forEach(instance => {
          const dayOfWeek = new Date(instance.startTime).getDay();
          expect([0, 6]).toContain(dayOfWeek);
        });
      });

      it('should return empty array when no days selected', () => {
        const startTime = new Date('2024-01-08T10:00:00.000Z').getTime();
        const duration = 60;
        const frequency = 'daily';
        const weeks = 2;
        const selectedDaysOfWeek: number[] = [];
        
        const instances = generateInstanceTimes(startTime, duration, frequency, weeks, selectedDaysOfWeek);
        
        expect(instances).toHaveLength(0);
      });

      it('should handle single day selection correctly', () => {
        // Tuesday, January 9, 2024
        const startTime = new Date('2024-01-09T10:00:00.000Z').getTime();
        const duration = 60;
        const frequency = 'daily';
        const weeks = 3;
        const selectedDaysOfWeek = [2]; // Only Tuesday
        
        const instances = generateInstanceTimes(startTime, duration, frequency, weeks, selectedDaysOfWeek);
        
        // Should generate 3 instances (1 Tuesday per week × 3 weeks)
        expect(instances).toHaveLength(3);
        
        // All should be on Tuesday (day 2)
        instances.forEach(instance => {
          expect(new Date(instance.startTime).getDay()).toBe(2);
        });
      });

      it('should handle start date that does not match selected days', () => {
        // Start on Monday but only select Tuesday and Thursday
        const startTime = new Date('2024-01-08T10:00:00.000Z').getTime(); // Monday
        const duration = 60;
        const frequency = 'daily';
        const weeks = 1;
        const selectedDaysOfWeek = [2, 4]; // Tuesday, Thursday
        
        const instances = generateInstanceTimes(startTime, duration, frequency, weeks, selectedDaysOfWeek);
        
        expect(instances).toHaveLength(2);
        expect(new Date(instances[0].startTime).getDay()).toBe(2); // Tuesday
        expect(new Date(instances[1].startTime).getDay()).toBe(4); // Thursday
      });
    });

    describe('edge cases', () => {
      it('should preserve exact time of day across all instances', () => {
        // 2:30 PM on a Monday
        const startTime = new Date('2024-01-08T14:30:00.000Z').getTime();
        const duration = 75;
        const frequency = 'weekly';
        const weeks = 3;
        
        const instances = generateInstanceTimes(startTime, duration, frequency, weeks);
        
        // All instances should have the same time of day
        instances.forEach(instance => {
          const date = new Date(instance.startTime);
          expect(date.getUTCHours()).toBe(14);
          expect(date.getUTCMinutes()).toBe(30);
        });
      });

      it('should handle very long durations', () => {
        const startTime = new Date('2024-01-08T10:00:00.000Z').getTime();
        const duration = 240; // 4 hours
        const frequency = 'weekly';
        const weeks = 2;
        
        const instances = generateInstanceTimes(startTime, duration, frequency, weeks);
        
        expect(instances).toHaveLength(2);
        expect(instances[0].endTime - instances[0].startTime).toBe(4 * 60 * 60 * 1000);
        expect(instances[1].endTime - instances[1].startTime).toBe(4 * 60 * 60 * 1000);
      });

      it('should handle negative or zero duration gracefully', () => {
        const startTime = new Date('2024-01-08T10:00:00.000Z').getTime();
        const frequency = 'weekly';
        const weeks = 2;
        
        // Zero duration
        const zeroInstances = generateInstanceTimes(startTime, 0, frequency, weeks);
        expect(zeroInstances).toHaveLength(2);
        zeroInstances.forEach(instance => {
          expect(instance.endTime).toBe(instance.startTime);
        });

        // Negative duration (should still work mathematically)
        const negativeInstances = generateInstanceTimes(startTime, -30, frequency, weeks);
        expect(negativeInstances).toHaveLength(2);
        negativeInstances.forEach(instance => {
          expect(instance.endTime).toBe(instance.startTime - (30 * 60 * 1000));
        });
      });
    });
  });

  describe('generateTimePatternData', () => {
    it('should generate correct time pattern string', () => {
      // Use local timezone dates to match what date-fns format produces
      const startTime = new Date('2024-01-08T14:30:00').getTime(); // Monday 2:30 PM local
      const endTime = new Date('2024-01-08T16:00:00').getTime();   // Monday 4:00 PM local
      
      const result = generateTimePatternData(startTime, endTime);
      
      expect(result.timePattern).toBe('14:30-16:00');
      expect(result.dayOfWeek).toBe(1); // Monday
    });

    it('should handle different times correctly', () => {
      const startTime = new Date('2024-01-07T09:15:00').getTime(); // Sunday 9:15 AM local
      const endTime = new Date('2024-01-07T10:45:00').getTime();   // Sunday 10:45 AM local
      
      const result = generateTimePatternData(startTime, endTime);
      
      expect(result.timePattern).toBe('09:15-10:45');
      expect(result.dayOfWeek).toBe(0); // Sunday
    });

    it('should handle midnight times', () => {
      const startTime = new Date('2024-01-08T00:00:00').getTime(); // Monday midnight local
      const endTime = new Date('2024-01-08T01:30:00').getTime();   // Monday 1:30 AM local
      
      const result = generateTimePatternData(startTime, endTime);
      
      expect(result.timePattern).toBe('00:00-01:30');
      expect(result.dayOfWeek).toBe(1); // Monday
    });

    it('should handle late night times', () => {
      const startTime = new Date('2024-01-08T23:45:00').getTime(); // Monday 11:45 PM local
      const endTime = new Date('2024-01-08T23:59:00').getTime();   // Monday 11:59 PM local
      
      const result = generateTimePatternData(startTime, endTime);
      
      expect(result.timePattern).toBe('23:45-23:59');
      expect(result.dayOfWeek).toBe(1); // Monday
    });
  });

  describe('calculateNewInstanceTimes', () => {
    const originalInstance = {
      startTime: new Date('2024-01-08T14:30:00').getTime(), // Monday 2:30 PM local
      endTime: new Date('2024-01-08T16:00:00').getTime()    // Monday 4:00 PM local (90 min duration)
    };

    it('should update both start and end times when both provided', () => {
      const newStartTime = new Date('2024-01-08T10:00:00').getTime(); // 10:00 AM local
      const newEndTime = new Date('2024-01-08T11:30:00').getTime();   // 11:30 AM local
      
      const result = calculateNewInstanceTimes(originalInstance, newStartTime, newEndTime);
      
      // Should use the new times on the same date as original instance
      expect(new Date(result.newStartTime).getHours()).toBe(10);
      expect(new Date(result.newStartTime).getMinutes()).toBe(0);
      expect(new Date(result.newEndTime).getHours()).toBe(11);
      expect(new Date(result.newEndTime).getMinutes()).toBe(30);
      
      // Should preserve the original date
      expect(new Date(result.newStartTime).toDateString()).toBe(new Date(originalInstance.startTime).toDateString());
    });

    it('should maintain duration when only start time provided', () => {
      const newStartTime = new Date('2024-01-08T10:00:00').getTime(); // 10:00 AM local
      
      const result = calculateNewInstanceTimes(originalInstance, newStartTime);
      
      // Should update start time
      expect(new Date(result.newStartTime).getHours()).toBe(10);
      expect(new Date(result.newStartTime).getMinutes()).toBe(0);
      
      // Should maintain original duration (90 minutes)
      const duration = result.newEndTime - result.newStartTime;
      const originalDuration = originalInstance.endTime - originalInstance.startTime;
      expect(duration).toBe(originalDuration);
      
      // End time should be 11:30 AM (10:00 AM + 90 minutes)
      expect(new Date(result.newEndTime).getHours()).toBe(11);
      expect(new Date(result.newEndTime).getMinutes()).toBe(30);
    });

    it('should return original times when no new times provided', () => {
      const result = calculateNewInstanceTimes(originalInstance);
      
      expect(result.newStartTime).toBe(originalInstance.startTime);
      expect(result.newEndTime).toBe(originalInstance.endTime);
    });

    it('should handle midnight times correctly', () => {
      const newStartTime = new Date('2024-01-08T00:00:00').getTime(); // Midnight local
      
      const result = calculateNewInstanceTimes(originalInstance, newStartTime);
      
      expect(new Date(result.newStartTime).getHours()).toBe(0);
      expect(new Date(result.newStartTime).getMinutes()).toBe(0);
      
      // Duration should be maintained (90 minutes)
      const duration = result.newEndTime - result.newStartTime;
      const originalDuration = originalInstance.endTime - originalInstance.startTime;
      expect(duration).toBe(originalDuration);
    });

    it('should preserve date while updating time', () => {
      // Original is on Monday, let's use a template time from a different day
      const templateTime = new Date('2024-01-10T08:00:00').getTime(); // Wednesday 8:00 AM local
      
      const result = calculateNewInstanceTimes(originalInstance, templateTime);
      
      // Should use 8:00 AM time but on Monday (original date)
      expect(new Date(result.newStartTime).getHours()).toBe(8);
      expect(new Date(result.newStartTime).getMinutes()).toBe(0);
      expect(new Date(result.newStartTime).getDate()).toBe(new Date(originalInstance.startTime).getDate());
      expect(new Date(result.newStartTime).getMonth()).toBe(new Date(originalInstance.startTime).getMonth());
    });

    it('should handle end time on different day when both times provided', () => {
      const newStartTime = new Date('2024-01-08T23:30:00').getTime();  // 11:30 PM local
      const newEndTime = new Date('2024-01-09T01:00:00').getTime();    // 1:00 AM next day local
      
      const result = calculateNewInstanceTimes(originalInstance, newStartTime, newEndTime);
      
      // Start time should be 11:30 PM on original date
      expect(new Date(result.newStartTime).getHours()).toBe(23);
      expect(new Date(result.newStartTime).getMinutes()).toBe(30);
      
      // End time should be 1:00 AM on original date (ignoring the template's date)
      expect(new Date(result.newEndTime).getHours()).toBe(1);
      expect(new Date(result.newEndTime).getMinutes()).toBe(0);
      expect(new Date(result.newEndTime).getDate()).toBe(new Date(originalInstance.startTime).getDate());
    });
  });

  describe('timeUtils object', () => {
    it('should export all utility functions', () => {
      expect(timeUtils.generateInstanceTimes).toBe(generateInstanceTimes);
      expect(timeUtils.generateTimePatternData).toBe(generateTimePatternData);
      expect(timeUtils.calculateNewInstanceTimes).toBe(calculateNewInstanceTimes);
    });
  });
});