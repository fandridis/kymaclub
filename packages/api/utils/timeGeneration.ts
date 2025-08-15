import { addDays, addWeeks, format, getDay } from "date-fns";

/**
 * Pure utility functions for time generation and manipulation
 */

export const generateInstanceTimes = (
    startTime: number,
    duration: number,
    frequency: 'daily' | 'weekly',
    weeks: number,
    selectedDaysOfWeek: number[] = []
): { startTime: number; endTime: number }[] => {
    const instances: { startTime: number; endTime: number }[] = [];
    const startDate = new Date(startTime);
    const durationMs = duration * 60 * 1000;

    if (frequency === 'daily') {
        const endDate = addWeeks(startDate, weeks);
        let currentDate = new Date(startDate);

        while (currentDate < endDate) {
            const dayOfWeek = getDay(currentDate);

            if (selectedDaysOfWeek.includes(dayOfWeek)) {
                const instanceStartTime = currentDate.getTime();
                const instanceEndTime = instanceStartTime + durationMs;

                instances.push({
                    startTime: instanceStartTime,
                    endTime: instanceEndTime
                });
            }

            currentDate = addDays(currentDate, 1);
        }
    } else if (frequency === 'weekly') {
        for (let week = 0; week < weeks; week++) {
            const instanceDate = addWeeks(startDate, week);
            const instanceStartTime = instanceDate.getTime();
            const instanceEndTime = instanceStartTime + durationMs;

            instances.push({
                startTime: instanceStartTime,
                endTime: instanceEndTime
            });
        }
    }

    return instances;
};

export const generateTimePatternData = (startTime: number, endTime: number): { timePattern: string; dayOfWeek: number } => {
    return {
        timePattern: `${format(startTime, 'HH:mm')}-${format(endTime, 'HH:mm')}`,
        dayOfWeek: getDay(startTime)
    };
};

export const calculateNewInstanceTimes = (
    originalInstance: { startTime: number; endTime: number },
    newStartTime?: number,
    newEndTime?: number
): { newStartTime: number; newEndTime: number } => {
    let calculatedStartTime = originalInstance.startTime;
    let calculatedEndTime = originalInstance.endTime;

    if (newStartTime && newEndTime) {
        // Both times provided - use as templates
        const newStartDate = new Date(newStartTime);
        const newEndDate = new Date(newEndTime);

        const instanceDate = new Date(originalInstance.startTime);
        instanceDate.setHours(newStartDate.getHours(), newStartDate.getMinutes(), 0, 0);
        calculatedStartTime = instanceDate.getTime();

        const instanceEndDate = new Date(originalInstance.startTime);
        instanceEndDate.setHours(newEndDate.getHours(), newEndDate.getMinutes(), 0, 0);
        calculatedEndTime = instanceEndDate.getTime();
    } else if (newStartTime) {
        // Only start time provided - maintain duration
        const duration = originalInstance.endTime - originalInstance.startTime;
        const newStartDate = new Date(newStartTime);

        const instanceDate = new Date(originalInstance.startTime);
        instanceDate.setHours(newStartDate.getHours(), newStartDate.getMinutes(), 0, 0);
        calculatedStartTime = instanceDate.getTime();
        calculatedEndTime = calculatedStartTime + duration;
    }

    return {
        newStartTime: calculatedStartTime,
        newEndTime: calculatedEndTime
    };
};

export const timeUtils = {
    generateInstanceTimes,
    generateTimePatternData,
    calculateNewInstanceTimes,
};