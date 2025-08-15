import React, { memo, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { DateFilterBar } from '../../../components/DateFilterBar';
import { ClassesList } from '../../../components/ClassesList';

interface ClassesSectionProps {
    searchFilters: {
        searchQuery: string;
        categories: string[];
    };
}

export const ClassesSection = memo<ClassesSectionProps>(({ searchFilters }) => {
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

    const handleDateChange = useCallback((date: string) => {
        setSelectedDate(date);
    }, []);

    const stableFilters = useMemo(() => ({
        searchQuery: searchFilters.searchQuery,
        categories: searchFilters.categories,
    }), [searchFilters.searchQuery, searchFilters.categories]);

    return (
        <View style={{ flex: 1 }}>
            <DateFilterBar selectedDate={selectedDate} onDateChange={handleDateChange} />
            <ClassesList selectedDate={selectedDate} searchFilters={stableFilters} />
        </View>
    );
});

ClassesSection.displayName = 'ClassesSection'; 