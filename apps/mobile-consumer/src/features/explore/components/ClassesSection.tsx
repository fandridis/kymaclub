import React, { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { DateFilterBar } from '../../../components/DateFilterBar';
import { ClassesList } from '../../../components/ClassesList';
import { FilterOptions } from '../../../stores/explore-filters-store';
import * as Location from 'expo-location';

interface ClassesSectionProps {
    filters: FilterOptions;
    userLocation: Location.LocationObject | null;
}

export const ClassesSection = memo<ClassesSectionProps>(({ filters, userLocation }) => {
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

    const handleDateChange = useCallback((date: string) => {
        setSelectedDate(date);
    }, []);

    const stableFilters = useMemo(() => ({
        searchQuery: filters.searchQuery,
        categories: filters.categories,
        distanceKm: filters.distanceKm,
    }), [filters.searchQuery, filters.categories, filters.distanceKm]);

    return (
        <View style={{ flex: 1 }}>
            <DateFilterBar selectedDate={selectedDate} onDateChange={handleDateChange} />
            <ClassesList selectedDate={selectedDate} searchFilters={stableFilters} userLocation={userLocation} />
        </View>
    );
});

ClassesSection.displayName = 'ClassesSection'; 
