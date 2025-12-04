import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import { Trophy, X, Lock, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import type { RootStackParamList } from '..';
import { TournamentLeaderboard } from '../../components/tournament/TournamentLeaderboard';
import { TournamentMatches } from '../../components/tournament/TournamentMatches';
import { useCurrentUser } from '../../hooks/useCurrentUser';

type TournamentRoute = RouteProp<RootStackParamList, 'Tournament'>;
type TabType = 'schedule' | 'leaderboard';

export function TournamentScreen() {
    const navigation = useNavigation();
    const route = useRoute<TournamentRoute>();
    const { widgetId } = route.params;
    const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabType>('schedule');
    const { user } = useCurrentUser();

    const tournamentState = useQuery(
        api.queries.widgets.getAmericanoTournamentState,
        { widgetId: widgetId as Id<"classInstanceWidgets"> }
    );

    const widget = useQuery(
        api.queries.widgets.getById,
        { widgetId: widgetId as Id<"classInstanceWidgets"> }
    );

    // Get current user's booking for this class to determine their participant ID
    const userBooking = useQuery(
        api.queries.bookings.getUserBookings,
        widget ? { classInstanceId: widget.classInstanceId } : 'skip'
    );

    // Derive current user's participant ID from their confirmed booking
    // Status "pending" means the booking is confirmed/approved and not yet attended
    const currentUserParticipantId = userBooking?.status === 'pending' ? `booking_${userBooking._id}` : null;

    const recordMatchResult = useMutation(api.mutations.widgets.recordAmericanoMatchResult);

    const handleSaveScore = async (matchId: string, team1Score: number, team2Score: number) => {
        await recordMatchResult({
            widgetId: widgetId as Id<"classInstanceWidgets">,
            matchId,
            team1Score,
            team2Score,
        });
    };

    if (!tournamentState || !widget) {
        return (
            <View style={[styles.container, { paddingTop: topInset }]}>
                <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#f97316" />
                    <Text style={styles.loadingText}>Loading tournament...</Text>
                </View>
            </View>
        );
    }

    if (widget === null || tournamentState === null) {
        return (
            <View style={[styles.container, { paddingTop: topInset }]}>
                <View style={styles.errorContent}>
                    <Trophy size={56} color={theme.colors.zinc[300]} />
                    <Text style={styles.errorTitle}>Tournament not found</Text>
                    <Text style={styles.errorSubtitle}>This tournament may have been removed</Text>
                    <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.errorButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const status = widget.status;
    const isLocked = widget.isLocked === true;
    const isActive = status === 'active';
    const config = tournamentState.config;
    const state = tournamentState.state;
    const classInfo = tournamentState.classInstanceInfo;

    // Use setupParticipants for setup mode, participants for active/completed
    const setupParticipants = tournamentState.setupParticipants;
    const participants = tournamentState.participants;
    const currentParticipantCount = state ? participants.length : setupParticipants.length;
    const playersReady = currentParticipantCount === config.numberOfPlayers;
    const canRecordScores = isActive && !isLocked;

    // Check if current round is complete (waiting for organizer to advance)
    const currentRound = state?.currentRound ?? 1;
    const totalRounds = state?.totalRounds ?? 1;
    const currentRoundMatches = state?.matches.filter(m => m.roundNumber === currentRound) ?? [];
    const isCurrentRoundComplete = currentRoundMatches.length > 0 &&
        currentRoundMatches.every(m => m.status === 'completed');
    const isOnLastRound = currentRound >= totalRounds;
    const isWaitingForNextRound = isActive && isCurrentRoundComplete && !isOnLastRound;
    const isTournamentFinished = isActive && isCurrentRoundComplete && isOnLastRound;

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 16, paddingBottom: bottomInset + 24 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Row with Close Button */}
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerTop}>
                            <Text style={styles.className} numberOfLines={1}>
                                {classInfo?.className ?? 'Tournament'}
                            </Text>
                            <StatusBadge status={status} isLocked={isLocked} />
                        </View>
                        <Text style={styles.subtitle}>
                            Americano Tournament · {classInfo?.venueName ?? 'Venue'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => navigation.goBack()}
                    >
                        <X size={24} color={theme.colors.zinc[600]} />
                    </TouchableOpacity>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {currentParticipantCount}/{config.numberOfPlayers}
                        </Text>
                        <Text style={styles.statLabel}>players</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{config.matchPoints}</Text>
                        <Text style={styles.statLabel}>points</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{config.courts.length}</Text>
                        <Text style={styles.statLabel}>courts</Text>
                    </View>
                </View>

                {/* Tabs */}
                {state && (
                    <View style={styles.tabsContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'schedule' && styles.tabActive]}
                            onPress={() => setActiveTab('schedule')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>
                                Schedule
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'leaderboard' && styles.tabActive]}
                            onPress={() => setActiveTab('leaderboard')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
                                Leaderboard
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Content */}
                {state ? (
                    activeTab === 'schedule' ? (
                        <>
                            {/* Round Complete Banner */}
                            {isWaitingForNextRound && (
                                <View style={styles.roundCompleteBanner}>
                                    <View style={styles.roundCompleteIcon}>
                                        <Clock size={20} color="#f97316" />
                                    </View>
                                    <View style={styles.roundCompleteContent}>
                                        <Text style={styles.roundCompleteTitle}>Round {currentRound} Complete!</Text>
                                        <Text style={styles.roundCompleteSubtitle}>
                                            Waiting for organizer to start Round {currentRound + 1}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            {isTournamentFinished && (
                                <View style={styles.tournamentFinishedBanner}>
                                    <View style={styles.tournamentFinishedIcon}>
                                        <Trophy size={20} color="#10b981" />
                                    </View>
                                    <View style={styles.roundCompleteContent}>
                                        <Text style={styles.tournamentFinishedTitle}>All Matches Complete!</Text>
                                        <Text style={styles.tournamentFinishedSubtitle}>
                                            Waiting for organizer to finalize results
                                        </Text>
                                    </View>
                                </View>
                            )}
                            <TournamentMatches
                                matches={state.matches}
                                participants={participants}
                                currentRound={state.currentRound}
                                matchPoints={config.matchPoints}
                                courts={config.courts}
                                onSaveScore={handleSaveScore}
                                canRecordScores={canRecordScores}
                                currentUserParticipantId={currentUserParticipantId}
                            />
                        </>
                    ) : (
                        <TournamentLeaderboard
                            standings={state.standings}
                            participants={participants}
                        />
                    )
                ) : (
                    <View style={styles.waitingContainer}>
                        <View style={styles.waitingIcon}>
                            <Trophy size={40} color="#f97316" />
                        </View>
                        <Text style={styles.waitingTitle}>Ready to Play</Text>
                        <Text style={styles.waitingSubtitle}>
                            {setupParticipants.length === 0
                                ? 'Waiting for players to register'
                                : `${setupParticipants.length}/${config.numberOfPlayers} players registered`
                            }
                        </Text>

                        {setupParticipants.length > 0 && (
                            <View style={styles.participantsList}>
                                {setupParticipants.map((p) => (
                                    <View key={p.id} style={styles.participantChip}>
                                        <Text style={styles.participantName}>{p.displayName}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

// Status Badge Component
function StatusBadge({ status, isLocked }: { status: string; isLocked?: boolean }) {
    if (status === 'active') {
        return (
            <View style={styles.statusBadgeRow}>
                <View style={styles.statusBadgeLive}>
                    <View style={styles.liveDot} />
                    <Text style={styles.statusBadgeLiveText}>LIVE</Text>
                </View>
                {isLocked && (
                    <View style={styles.statusBadgeLocked}>
                        <Lock size={10} color="#b45309" />
                        <Text style={styles.statusBadgeLockedText}>LOCKED</Text>
                    </View>
                )}
            </View>
        );
    }

    if (status === 'completed') {
        return (
            <View style={styles.statusBadgeCompleted}>
                <Text style={styles.statusBadgeCompletedText}>DONE</Text>
            </View>
        );
    }

    if (status === 'cancelled') {
        return (
            <View style={styles.statusBadgeCancelled}>
                <Text style={styles.statusBadgeCancelledText}>CANCELLED</Text>
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    loadingContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
        color: theme.colors.zinc[400],
        fontWeight: '600',
    },
    errorContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 24,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.zinc[900],
        marginTop: 12,
    },
    errorSubtitle: {
        fontSize: 15,
        color: theme.colors.zinc[500],
        textAlign: 'center',
    },
    errorButton: {
        marginTop: 20,
        paddingHorizontal: 28,
        paddingVertical: 12,
        backgroundColor: theme.colors.zinc[900],
        borderRadius: 12,
    },
    errorButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    headerLeft: {
        flex: 1,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.zinc[100],
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    className: {
        fontSize: 22,
        fontWeight: '900',
        color: theme.colors.zinc[900],
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.zinc[400],
    },
    // Status Badges
    statusBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusBadgeLive: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f97316',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    liveDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#fff',
    },
    statusBadgeLiveText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    statusBadgeLocked: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#fef3c7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    statusBadgeLockedText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#b45309',
        letterSpacing: 0.5,
    },
    statusBadgeCompleted: {
        backgroundColor: theme.colors.zinc[200],
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    statusBadgeCompletedText: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.colors.zinc[600],
        letterSpacing: 0.5,
    },
    statusBadgeCancelled: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    statusBadgeCancelledText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#dc2626',
        letterSpacing: 0.5,
    },
    // Stats Row
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: theme.colors.zinc[200],
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.zinc[900],
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.zinc[400],
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.zinc[100],
        borderRadius: 12,
        padding: 3,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 9,
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: theme.colors.zinc[700],
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.zinc[500],
    },
    tabTextActive: {
        color: '#fff',
    },
    // Round Complete Banner
    roundCompleteBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        marginBottom: 20,
        backgroundColor: '#fff7ed',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#fed7aa',
    },
    roundCompleteIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#fed7aa',
    },
    roundCompleteContent: {
        flex: 1,
    },
    roundCompleteTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#c2410c',
        marginBottom: 2,
    },
    roundCompleteSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#f97316',
    },
    // Tournament Finished Banner
    tournamentFinishedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        marginBottom: 20,
        backgroundColor: '#ecfdf5',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#a7f3d0',
    },
    tournamentFinishedIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#a7f3d0',
    },
    tournamentFinishedTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#059669',
        marginBottom: 2,
    },
    tournamentFinishedSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#10b981',
    },
    // Waiting State
    waitingContainer: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    waitingIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#fff7ed',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#fed7aa',
    },
    waitingTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: theme.colors.zinc[900],
        marginBottom: 6,
    },
    waitingSubtitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.zinc[400],
        marginBottom: 24,
    },
    participantsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
    },
    participantChip: {
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.zinc[200],
    },
    participantName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.zinc[700],
    },
});
