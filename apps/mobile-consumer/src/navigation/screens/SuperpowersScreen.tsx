import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { SettingsHeader } from '../../components/Settings';
import { StackScreenHeader } from '../../components/StackScreenHeader';

type Superpower = {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: string;
};

const superpowers: Superpower[] = [
    {
        id: 'hoarder',
        name: 'The Hoarder',
        description: 'Credits purchased while this superpower is active, expire in +2 months than usually',
        price: 5,
        icon: '💎'
    },
    {
        id: 'early-bird',
        name: 'Early Bird',
        description: 'Users with this superpower active, can book classes 12h before everyone else',
        price: 10,
        icon: '🐦'
    },
    {
        id: 'vip',
        name: 'The VIP',
        description: 'When on waitlist, you have priority against others non-VIP users, even if you joined later',
        price: 5,
        icon: '👑'
    },
    {
        id: 'social-butterfly',
        name: 'Social Butterfly',
        description: 'Once a month, you can bring a friend to tag along a class for free',
        price: 15,
        icon: '🦋'
    }
];

export function SuperpowersScreen() {
    const navigation = useNavigation();
    const [activeSuperpowers, setActiveSuperpowers] = useState<Set<string>>(new Set());

    const handleSuperpowerToggle = (superpowerId: string) => {
        const newActive = new Set(activeSuperpowers);
        if (newActive.has(superpowerId)) {
            newActive.delete(superpowerId);
        } else {
            newActive.add(superpowerId);
        }
        setActiveSuperpowers(newActive);
    };

    const getTotalMonthlyCost = () => {
        return Array.from(activeSuperpowers).reduce((total, id) => {
            const superpower = superpowers.find(s => s.id === id);
            return total + (superpower?.price || 0);
        }, 0);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StackScreenHeader title="Superpowers" />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <Text style={styles.screenSubtitle}>
                        Enhance your experience with special abilities and exclusive benefits.
                    </Text>
                </View>

                {/* Total Cost Display */}
                <View style={styles.totalCostSection}>
                    <Text style={styles.totalCostTitle}>Total Monthly Cost</Text>
                    <Text style={styles.totalCostAmount}>${getTotalMonthlyCost()}/month</Text>
                </View>

                {/* Superpowers Section */}
                <SettingsHeader title="Available Superpowers" />
                <View style={styles.superpowersGrid}>
                    {superpowers.map((superpower) => {
                        const isActive = activeSuperpowers.has(superpower.id);
                        return (
                            <TouchableOpacity
                                key={superpower.id}
                                style={[
                                    styles.superpowerCard,
                                    isActive && styles.superpowerCardActive
                                ]}
                                onPress={() => handleSuperpowerToggle(superpower.id)}
                            >
                                <View style={styles.superpowerHeader}>
                                    <Text style={styles.superpowerIcon}>{superpower.icon}</Text>
                                    <View style={styles.superpowerToggle}>
                                        <Switch
                                            value={isActive}
                                            onValueChange={() => handleSuperpowerToggle(superpower.id)}
                                            trackColor={{ false: theme.colors.zinc[300], true: theme.colors.emerald[300] }}
                                            thumbColor={isActive ? theme.colors.emerald[600] : theme.colors.zinc[500]}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.superpowerName}>{superpower.name}</Text>
                                <Text style={styles.superpowerDescription}>{superpower.description}</Text>
                                <Text style={styles.superpowerPrice}>${superpower.price}/month</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.zinc[50],
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 60,
    },
    headerSection: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.lg,
    },
    screenSubtitle: {
        fontSize: theme.fontSize.base,
        color: theme.colors.zinc[600],
        lineHeight: theme.fontSize.base * 1.4,
    },
    totalCostSection: {
        backgroundColor: '#fff',
        padding: 24,
        alignItems: 'center',
        marginBottom: 8,
    },
    totalCostTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.zinc[900],
        marginBottom: 8,
    },
    totalCostAmount: {
        fontSize: theme.fontSize['3xl'],
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.emerald[600],
    },
    superpowersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    superpowerCard: {
        width: '47%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        minHeight: 140,
    },
    superpowerCardActive: {
        borderColor: theme.colors.emerald[500],
        backgroundColor: theme.colors.emerald[50],
    },
    superpowerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    superpowerIcon: {
        fontSize: 24,
    },
    superpowerToggle: {
        transform: [{ scale: 0.8 }],
    },
    superpowerName: {
        fontSize: theme.fontSize.base,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.zinc[900],
        marginBottom: 8,
    },
    superpowerDescription: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.zinc[600],
        marginBottom: 8,
        lineHeight: 18,
    },
    superpowerPrice: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.emerald[600],
    },
});
