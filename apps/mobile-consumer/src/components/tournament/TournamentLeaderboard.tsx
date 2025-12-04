import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { theme } from '../../theme';
import type { TournamentAmericanoStanding, ParticipantSnapshot } from '@repo/api/types/widget';

interface TournamentLeaderboardProps {
    standings: TournamentAmericanoStanding[];
    participants: ParticipantSnapshot[]; // Participants snapshot from tournament state
}

// Medal colors
const GOLD_BORDER = '#ffdf20';
const GOLD_BG = '#fef9c2';
const GOLD_BADGE = '#efb100';  // dark gold

const SILVER_BORDER = '#cad5e2';
const SILVER_BG = '#f1f5f9';
const SILVER_BADGE = '#62748e'; // dark grey (zinc-600)

const BRONZE_BORDER = '#ffb86a';
const BRONZE_BG = '#fff7ed';
const BRONZE_BADGE = '#ff8904'; // dark orange

export function TournamentLeaderboard({ standings, participants }: TournamentLeaderboardProps) {
    const participantsMap = new Map(
        participants.map(p => [p.id, p.displayName])
    );

    const getName = (id: string) => participantsMap.get(id) || 'Unknown';

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
                const isThird = rank === 3;
                const isPodium = isFirst || isSecond || isThird;

                // Get colors based on position
                const getRowColors = () => {
                    if (isFirst) return { border: GOLD_BORDER, bg: GOLD_BG };
                    if (isSecond) return { border: SILVER_BORDER, bg: SILVER_BG };
                    if (isThird) return { border: BRONZE_BORDER, bg: BRONZE_BG };
                    return { border: theme.colors.zinc[200], bg: '#fff' };
                };

                const rowColors = getRowColors();

                return (
                    <View
                        key={standing.participantId}
                        style={[
                            styles.row,
                            {
                                backgroundColor: rowColors.bg,
                                borderColor: rowColors.border,
                                borderWidth: isPodium ? 1 : 1,
                            }
                        ]}
                    >
                        {/* Rank Badge */}
                        <View style={[
                            styles.rankBadge,
                            isFirst && { backgroundColor: GOLD_BADGE },
                            isSecond && { backgroundColor: SILVER_BADGE },
                            isThird && { backgroundColor: BRONZE_BADGE },
                        ]}>
                            <Text style={[
                                styles.rankText,
                                isPodium && styles.rankTextPodium
                            ]}>
                                {rank}
                            </Text>
                        </View>

                        {/* Name & Record */}
                        <View style={styles.info}>
                            <Text style={[
                                styles.name,
                                isPodium && styles.namePodium
                            ]} numberOfLines={1}>
                                {name}
                            </Text>
                            <Text style={styles.record}>
                                <Text style={[styles.wins, isPodium && styles.winsPodium]}>{wins}W</Text>
                                <Text style={[styles.dot, isPodium && styles.dotPodium]}> · </Text>
                                <Text style={[styles.losses, isPodium && styles.lossesPodium]}>{losses}L</Text>
                            </Text>
                        </View>

                        {/* Point Difference */}
                        <View style={styles.diffContainer}>
                            <Text style={[
                                styles.diff,
                                isPodium && styles.diffPodium,
                                !isPodium && isPositive && styles.diffPositive,
                                !isPodium && isNegative && styles.diffNegative,
                            ]}>
                                {isPositive && '+'}{diff}
                            </Text>
                            <Text style={[styles.diffLabel, isPodium && styles.diffLabelPodium]}>pts</Text>
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
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: '#fff',
        borderColor: theme.colors.zinc[200],
    },
    rankBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.zinc[100],
    },
    rankText: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.colors.zinc[500],
    },
    rankTextPodium: {
        color: '#ffffff',
        fontWeight: '900',
    },
    info: {
        flex: 1,
        marginLeft: 12,
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.zinc[800],
        marginBottom: 2,
    },
    namePodium: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.zinc[900],
    },
    record: {
        fontSize: 12,
        fontWeight: '600',
    },
    wins: {
        color: '#10b981',
    },
    winsPodium: {
        color: '#059669',
    },
    dot: {
        color: theme.colors.zinc[400],
    },
    dotPodium: {
        color: theme.colors.zinc[500],
    },
    losses: {
        color: '#ef4444',
    },
    lossesPodium: {
        color: '#dc2626',
    },
    diffContainer: {
        alignItems: 'flex-end',
    },
    diff: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.zinc[400],
    },
    diffPodium: {
        color: theme.colors.zinc[700],
        fontWeight: '900',
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
    diffLabelPodium: {
        color: theme.colors.zinc[500],
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
