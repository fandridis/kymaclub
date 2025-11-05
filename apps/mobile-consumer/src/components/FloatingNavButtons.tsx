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
import { useAuthenticatedUser } from '../stores/auth-store';

export function FloatingNavButtons() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { t } = useTypedTranslation();
    const user = useAuthenticatedUser();

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
            <TouchableOpacity
                onPress={handleSearchPress}
                style={styles.searchButton}
                activeOpacity={0.8}
                accessibilityLabel={t('navigation.explore')}
                accessibilityRole="button"
            >
                <BlurView intensity={20} style={[StyleSheet.absoluteFillObject, styles.blurContainer]} />
                <View style={styles.searchButtonContent}>
                    <SearchIcon size={24} color={theme.colors.zinc[950]} />
                    <Text style={styles.buttonLabel}>{t('navigation.explore')}</Text>
                </View>
            </TouchableOpacity>

            {/* Bookings Button - Only visible if there are upcoming bookings */}
            {hasUpcomingBookings && (
                <TouchableOpacity
                    onPress={handleBookingsPress}
                    style={styles.bookingsButton}
                    activeOpacity={0.8}
                    accessibilityLabel={t('navigation.bookings')}
                    accessibilityRole="button"
                >
                    <View style={styles.bookingsGradientContainer}>
                        <LinearGradient
                            colors={['#10b981', '#8b5cf6', '#f97316']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <BlurView intensity={20} style={styles.bookingsBlurContainer}>
                            <TicketIcon size={24} color={theme.colors.zinc[50]} />
                        </BlurView>
                    </View>
                </TouchableOpacity>
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
    searchButton: {
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
    },
    bookingsButton: {
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
    },
    blurContainer: {
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(80, 80, 80, 0.1)',
    },
    searchButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 8,
    },
    bookingsGradientContainer: {
        borderRadius: 32,
        overflow: 'hidden',
        width: 54,
        height: 54,
    },
    bookingsBlurContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        width: 54,
        height: 54,
        borderRadius: 32,
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.zinc[950],
    },
});

