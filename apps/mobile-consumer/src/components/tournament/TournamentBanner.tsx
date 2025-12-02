import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trophy, ChevronRight, Users, Award } from 'lucide-react-native';
import { theme } from '../../theme';
import type { ClassInstanceWidget } from '@repo/api/types/widget';

interface TournamentBannerProps {
    widget: ClassInstanceWidget;
    onPress: () => void;
}

const STATUS_LABELS: Record<string, string> = {
    setup: 'Setting Up',
    ready: 'Ready to Start',
    active: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
    setup: theme.colors.secondary,
    ready: theme.colors.primary,
    active: theme.colors.success,
    completed: theme.colors.secondary,
    cancelled: theme.colors.error,
};

export function TournamentBanner({ widget, onPress }: TournamentBannerProps) {
    const status = widget.status;
    const statusLabel = STATUS_LABELS[status] || status;
    const statusColor = STATUS_COLORS[status] || theme.colors.secondary;

    // Get config info
    const config = widget.widgetConfig.config;
    const isAmericano = widget.widgetConfig.type === 'tournament_americano';

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.iconContainer}>
                <Trophy color={theme.colors.warning} size={24} />
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>
                        {isAmericano ? 'Americano Tournament' : 'Tournament'}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: statusColor }]}>
                        <Text style={styles.badgeText}>{statusLabel}</Text>
                    </View>
                </View>

                {isAmericano && (
                    <View style={styles.details}>
                        <View style={styles.detailItem}>
                            <Users size={14} color={theme.colors.textSecondary} />
                            <Text style={styles.detailText}>
                                {config.numberOfPlayers} players
                            </Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Award size={14} color={theme.colors.textSecondary} />
                            <Text style={styles.detailText}>
                                {config.matchPoints} pts
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            <ChevronRight color={theme.colors.textSecondary} size={20} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: `${theme.colors.warning}20`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
    },
    details: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 4,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
    },
});

