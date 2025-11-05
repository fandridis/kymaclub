import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { DiamondIcon } from 'lucide-react-native';
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
            style={styles.creditsBadge}
        >
            <DiamondIcon size={14} color={theme.colors.emerald[950]} />
            <Text style={styles.creditsBadgeText}>{creditBalance || 0}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    creditsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.emerald[100],
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 8,
        gap: 3,
        borderWidth: 1,
        borderColor: theme.colors.emerald[200],
    },
    creditsBadgeText: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.emerald[950],
    },
});

