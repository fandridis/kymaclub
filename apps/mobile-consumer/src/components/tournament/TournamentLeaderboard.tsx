import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { theme } from '../../theme';
import type { TournamentAmericanoStanding, WidgetParticipant } from '@repo/api/types/widget';

interface TournamentLeaderboardProps {
    standings: TournamentAmericanoStanding[];
    participants: WidgetParticipant[];
}

export function TournamentLeaderboard({ standings, participants }: TournamentLeaderboardProps) {
    const participantMap = new Map(
        participants.map(p => [p._id.toString(), p.displayName])
    );

    const getName = (id: string) => participantMap.get(id) || 'Unknown';

    if (standings.length === 0) {
        return (
            <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                    <Trophy size={40} color={theme.colors.zinc[300]} />
                </View>
                <Text style={styles.emptyTitle}>No standings yet</Text>
                <Text style={styles.emptySubtitle}>Play some matches to see the leaderboard</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {standings.map((standing, idx) => {
                const rank = idx + 1;
                const name = getName(standing.participantId);
                const wins = standing.matchesWon ?? 0;
                const losses = standing.matchesLost ?? 0;
                const diff = standing.pointsDifference ?? 0;
                const isPositive = diff > 0;
                const isNegative = diff < 0;

                const isFirst = rank === 1;
                const isSecond = rank === 2;

                // Get row colors based on position
                const getRowStyle = () => {
                    if (isFirst) return { bg: '#fffbeb', border: '#fde68a' };
                    if (isSecond) return { bg: '#f8fafc', border: '#e2e8f0' };
                    return { bg: '#fff', border: theme.colors.zinc[200] };
                };

                const getRankStyle = () => {
                    if (isFirst) return { bg: '#fbbf24', color: '#92400e' };
                    if (isSecond) return { bg: '#94a3b8', color: '#fff' };
                    return { bg: theme.colors.zinc[100], color: theme.colors.zinc[500] };
                };

                const rowStyle = getRowStyle();
                const rankStyle = getRankStyle();

                return (
                    <View
                        key={standing.participantId}
                        style={[styles.row, { backgroundColor: rowStyle.bg, borderColor: rowStyle.border }]}
                    >
                        {/* Rank Badge */}
                        <View style={[styles.rankBadge, { backgroundColor: rankStyle.bg }]}>
                            <Text style={[styles.rankText, { color: rankStyle.color }]}>{rank}</Text>
                        </View>

                        {/* Name & Record */}
                        <View style={styles.info}>
                            <Text style={[styles.name, isFirst && styles.nameFirst]} numberOfLines={1}>
                                {name}
                            </Text>
                            <Text style={styles.record}>
                                <Text style={styles.wins}>{wins}W</Text>
                                <Text style={styles.dot}> · </Text>
                                <Text style={styles.losses}>{losses}L</Text>
                            </Text>
                        </View>

                        {/* Point Difference */}
                        <View style={styles.diffContainer}>
                            <Text style={[
                                styles.diff,
                                isPositive && styles.diffPositive,
                                isNegative && styles.diffNegative,
                            ]}>
                                {isPositive && '+'}{diff}
                            </Text>
                            <Text style={styles.diffLabel}>pts</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        fontSize: 13,
        fontWeight: '800',
    },
    info: {
        flex: 1,
        marginLeft: 12,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.zinc[800],
        marginBottom: 2,
    },
    nameFirst: {
        color: '#92400e',
    },
    record: {
        fontSize: 12,
        fontWeight: '600',
    },
    wins: {
        color: '#10b981',
    },
    dot: {
        color: theme.colors.zinc[400],
    },
    losses: {
        color: '#ef4444',
    },
    diffContainer: {
        alignItems: 'flex-end',
    },
    diff: {
        fontSize: 18,
        fontWeight: '900',
        color: theme.colors.zinc[400],
    },
    diffPositive: {
        color: '#10b981',
    },
    diffNegative: {
        color: '#ef4444',
    },
    diffLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: theme.colors.zinc[400],
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: theme.colors.zinc[100],
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.zinc[500],
    },
    emptySubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.zinc[400],
        marginTop: 4,
    },
});
