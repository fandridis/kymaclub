import React, { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { DateFilterBar } from '../../../components/DateFilterBar';
import { ClassesList } from '../../../components/ClassesList';
import { FilterOptions } from '../../../stores/explore-filters-store';
import * as Location from 'expo-location';

interface ClassesSectionProps {
    searchFilters: Pick<FilterOptions, 'searchQuery' | 'categories' | 'distanceKm'>;
    userLocation: Location.LocationObject | null;
}

export const ClassesSection = memo<ClassesSectionProps>(({ searchFilters, userLocation }) => {
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

    const handleDateChange = useCallback((date: string) => {
        setSelectedDate(date);
    }, []);

    const stableFilters = useMemo(() => ({
        searchQuery: searchFilters.searchQuery,
        categories: searchFilters.categories,
        distanceKm: searchFilters.distanceKm,
    }), [searchFilters.searchQuery, searchFilters.categories, searchFilters.distanceKm]);

    return (
        <View style={{ flex: 1 }}>
            <DateFilterBar selectedDate={selectedDate} onDateChange={handleDateChange} />
            <ClassesList selectedDate={selectedDate} searchFilters={stableFilters} userLocation={userLocation} />
        </View>
    );
});

ClassesSection.displayName = 'ClassesSection'; 
