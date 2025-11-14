import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { SearchIcon, TicketIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation';
import { theme } from '../theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTypedTranslation } from '../i18n/typed';
import { useQuery } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { useCurrentUser } from '../hooks/useCurrentUser';

export function FloatingNavButtons() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { t } = useTypedTranslation();
    const { user } = useCurrentUser();

    // Check if there are upcoming bookings
    const userBookings = useQuery(
        api.queries.bookings.getCurrentUserUpcomingBookings,
        user ? { daysAhead: 7 } : "skip"
    );

    const hasUpcomingBookings = userBookings && userBookings.length > 0;

    const handleSearchPress = () => {
        navigation.navigate('Explore');
    };

    const handleBookingsPress = () => {
        navigation.navigate('Bookings');
    };

    return (
        <View style={styles.container}>
            {/* Spacer to push content to center when bookings button is visible */}
            {hasUpcomingBookings && <View style={styles.spacer} />}

            {/* Search Button - Always visible, centered */}
            <View style={styles.searchButtonShadow}>
                <TouchableOpacity
                    onPress={handleSearchPress}
                    style={styles.searchButton}
                    activeOpacity={0.8}
                    accessibilityLabel={t('navigation.explore')}
                    accessibilityRole="button"
                >
                    <BlurView
                        intensity={20}
                        tint="light"
                        style={[StyleSheet.absoluteFillObject, styles.blurContainer]}
                    />
                    <View style={styles.searchButtonContent}>
                        <SearchIcon size={24} color={theme.colors.zinc[950]} />
                        <Text style={styles.buttonLabel}>{t('navigation.explore')}</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Bookings Button - Only visible if there are upcoming bookings */}
            {hasUpcomingBookings && (
                <View style={styles.bookingsButtonShadow}>
                    <TouchableOpacity
                        onPress={handleBookingsPress}
                        style={styles.bookingsButton}
                        activeOpacity={0.8}
                        accessibilityLabel={t('navigation.bookings')}
                        accessibilityRole="button"
                    >
                        <LinearGradient
                            colors={['#10b981', '#8b5cf6', '#f97316']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.bookingsGradient}
                        >
                            <TicketIcon size={24} color={theme.colors.zinc[50]} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {/* Spacer to balance layout when bookings button is visible */}
            {hasUpcomingBookings && <View style={styles.spacer} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        zIndex: 1000,
    },
    spacer: {
        flex: 1,
    },
    searchButtonShadow: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 16,
    },
    searchButton: {
        borderRadius: 32,
        overflow: 'hidden',
    },
    blurContainer: {
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    searchButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 8,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.zinc[950],
    },
    bookingsButtonShadow: {
        width: 54,
        height: 54,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 20,
    },
    bookingsButton: {
        width: 54,
        height: 54,
        borderRadius: 27,
        overflow: 'hidden',
    },
    bookingsGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 27,
    },
});

