import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StarIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation';

interface PointsBadgeProps {
    pointsBalance: number;
}

export function PointsBadge({ pointsBalance }: PointsBadgeProps) {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const handlePress = () => {
        navigation.navigate('Settings');
    };

    return (
        <TouchableOpacity
            accessibilityLabel="Open settings"
            accessibilityRole="button"
            onPress={handlePress}
            activeOpacity={0.85}
            style={styles.container}
        >
            <LinearGradient
                colors={[theme.colors.amber[400], theme.colors.amber[500], theme.colors.amber[600]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <StarIcon size={18} color={theme.colors.white} fill={theme.colors.white} />
                    <Text style={styles.text}>{pointsBalance || 0}</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 22,
        overflow: 'hidden',
    },
    gradient: {
        borderRadius: 22,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    text: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.white,
    },
});

