import React, { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { startOfWeek, addWeeks, format } from 'date-fns';
import { DateFilterBar } from '../../../components/DateFilterBar';
import { ClassesList } from '../../../components/ClassesList';
import { FilterOptions } from '../../../stores/explore-filters-store';
import { useClassInstances } from '../../../hooks/use-class-instances';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import * as Location from 'expo-location';

interface ClassesSectionProps {
    filters: FilterOptions;
    userLocation: Location.LocationObject | null;
}

export const ClassesSection = memo<ClassesSectionProps>(({ filters, userLocation }) => {
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const { user } = useCurrentUser();
    const userCity = user?.activeCitySlug;

    // Calculate full 4-week date range for class counts (Monday of current week + 4 weeks)
    const { fullRangeStart, fullRangeEnd } = useMemo(() => {
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const rangeEnd = addWeeks(weekStart, 4);
        rangeEnd.setHours(23, 59, 59, 999);
        return {
            fullRangeStart: weekStart.getTime(),
            fullRangeEnd: rangeEnd.getTime(),
        };
    }, []);

    // Fetch all instances for 4-week range to compute class counts per day
    const { classInstances: allInstancesForRange } = useClassInstances({
        startDate: fullRangeStart,
        endDate: fullRangeEnd,
        includeBookingStatus: true,
        cityFilter: userCity,
    });

    // Compute class counts by date from the full range query
    const classCountsByDate = useMemo(() => {
        if (!allInstancesForRange || allInstancesForRange.length === 0) return {};

        const counts: Record<string, number> = {};
        for (const instance of allInstancesForRange) {
            const dateStr = format(new Date(instance.startTime), 'yyyy-MM-dd');
            counts[dateStr] = (counts[dateStr] || 0) + 1;
        }
        return counts;
    }, [allInstancesForRange]);

    const handleDateChange = useCallback((date: string) => {
        setSelectedDate(date);
    }, []);

    const stableFilters = useMemo(() => ({
        searchQuery: filters.searchQuery,
        categories: filters.categories,
    }), [filters.searchQuery, filters.categories]);

    return (
        <View style={{ flex: 1 }}>
            <DateFilterBar
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                classCountsByDate={classCountsByDate}
            />
            <ClassesList selectedDate={selectedDate} searchFilters={stableFilters} userLocation={userLocation} />
        </View>
    );
});

ClassesSection.displayName = 'ClassesSection'; 
