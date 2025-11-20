import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTypedTranslation } from '../../i18n/typed';

interface StartsInBadgeProps {
    startTime: number;
}

export function StartsInBadge({ startTime }: StartsInBadgeProps) {
    const { t } = useTypedTranslation();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        // Update every minute to keep the "starts in" text fresh
        const timer = setInterval(() => {
            setNow(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    const timeUntilStartMs = startTime - now.getTime();
    const timeUntilStartHours = Math.floor(timeUntilStartMs / (1000 * 60 * 60));
    const timeUntilStartMinutes = Math.floor((timeUntilStartMs % (1000 * 60 * 60)) / (1000 * 60));

    let startsInText: string | null = null;

    if (timeUntilStartHours > 0) {
        const timeStr = t('news.inHours', { hours: timeUntilStartHours, minutes: timeUntilStartMinutes });
        startsInText = t('news.startsIn', { time: timeStr });
    } else if (timeUntilStartMinutes > 0) {
        const timeStr = t('news.inMinutes', { minutes: timeUntilStartMinutes });
        startsInText = t('news.startsIn', { time: timeStr });
    } else {
        startsInText = t('news.startsNow');
    }

    // If the class has already started significantly (e.g. -5 mins), we might want to hide it or show "Started"
    // But for now, let's just stick to the requested logic. 
    // If it's negative, it will show "Starts soon" or we can return null if we want to hide it.
    // The list filtering in parent should handle removing old classes.
    if (timeUntilStartMs < -1000 * 60 * 60) { // 1 hour ago
        return null;
    }

    return (
        <View style={styles.startsInPill}>
            <Text style={styles.startsInPillText} numberOfLines={1}>
                {startsInText}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    startsInPill: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    startsInPillText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
});
