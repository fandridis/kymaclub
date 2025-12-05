import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DiamondIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation';

interface CreditsBadgeProps {
    creditBalance: number;
}

export function CreditsBadge({ creditBalance }: CreditsBadgeProps) {
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
            style={styles.creditsBadgeContainer}
        >
            <LinearGradient
                colors={['#10b981', '#8b5cf6', '#f97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.creditsBadgeGradient}
            >
                <View style={styles.creditsBadgeContent}>
                    <DiamondIcon size={20} color={theme.colors.zinc[50]} />
                    <Text style={styles.creditsBadgeText}>{creditBalance || 0}</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    creditsBadgeContainer: {
        borderRadius: 22,
        overflow: 'hidden',
    },
    creditsBadgeGradient: {
        borderRadius: 22,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    creditsBadgeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    creditsBadgeText: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.zinc[50],
    },
});

