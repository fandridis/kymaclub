import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { el } from 'date-fns/locale/el';
import { tz } from '@date-fns/tz';
import { TicketCheckIcon } from 'lucide-react-native';
import { theme } from '../theme';
import { useTypedTranslation } from '../i18n/typed';
import i18n from '../i18n';

interface SameClassCardProps {
    startTime: number;
    spotsAvailable: number;
    isBookedByUser: boolean;
    onPress: () => void;
}

// Map i18next language codes to date-fns locales
const getDateFnsLocale = (language: string) => {
    switch (language) {
        case 'el':
            return el;
        case 'en':
        default:
            return enUS;
    }
};

export function SameClassCard({ startTime, spotsAvailable, isBookedByUser, onPress }: SameClassCardProps) {
    const { t } = useTypedTranslation();
    const currentLanguage = i18n.language || 'en';
    const dateFnsLocale = getDateFnsLocale(currentLanguage);
    const startDate = new Date(startTime);

    // Format day name (e.g., "SAT"), date (e.g., "Dec 13"), and time (e.g., "11:00")
    let dayName: string;
    let dateStr: string;
    let timeStr: string;

    try {
        dayName = format(startDate, 'EEE', {
            in: tz('Europe/Athens'),
            locale: dateFnsLocale,
        });
        dateStr = format(startDate, 'MMM d', {
            in: tz('Europe/Athens'),
            locale: dateFnsLocale,
        });
        timeStr = format(startDate, 'HH:mm', {
            in: tz('Europe/Athens'),
            locale: dateFnsLocale,
        });
    } catch (e) {
        // Fallback without timezone
        dayName = format(startDate, 'EEE', { locale: dateFnsLocale });
        dateStr = format(startDate, 'MMM d', { locale: dateFnsLocale });
        timeStr = format(startDate, 'HH:mm', { locale: dateFnsLocale });
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.touchable}
        >
            <View style={styles.shadowContainer}>
                <View style={styles.card}>
                    {/* Booked indicator */}
                    {isBookedByUser && (
                        <View style={styles.bookedBadge}>
                            <TicketCheckIcon size={18} color="#000" />
                        </View>
                    )}

                    {/* Header: Day and Date */}
                    <View style={styles.header}>
                        <Text style={styles.dayName}>{dayName}</Text>
                        <Text style={styles.date}>{dateStr}</Text>
                    </View>

                    {/* Body: Time and Spots */}
                    <View style={styles.body}>
                        <Text style={styles.time}>{timeStr}</Text>
                        <Text style={styles.spots}>
                            {t('classes.spotsLeft', { count: spotsAvailable })}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    touchable: {
        width: 118,
        height: 130,
        marginRight: 12,
    },
    shadowContainer: {
        flex: 1,
        borderRadius: 14,
        shadowColor: theme.colors.zinc[600],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    card: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: theme.colors.zinc[200],
    },
    bookedBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        zIndex: 10,
    },
    header: {
        backgroundColor: theme.colors.zinc[700],
        paddingVertical: 10,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    dayName: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.85)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    date: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
        marginTop: 2,
    },
    body: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingVertical: 12,
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    time: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.zinc[800],
        letterSpacing: -0.5,
    },
    spots: {
        fontSize: 11,
        fontWeight: '500',
        color: theme.colors.zinc[400],
        marginTop: 4,
    },
});
