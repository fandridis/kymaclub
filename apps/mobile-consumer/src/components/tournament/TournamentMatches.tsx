import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';
import { ChevronDown, Pencil, Minus, Plus, Check, X } from 'lucide-react-native';
import { theme } from '../../theme';
import type { TournamentAmericanoMatch, ParticipantSnapshot, TournamentAmericanoMatchPoints, TournamentCourt } from '@repo/api/types/widget';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TournamentMatchesProps {
    matches: TournamentAmericanoMatch[];
    participants: ParticipantSnapshot[]; // Participants snapshot from tournament state
    currentRound: number;
    matchPoints: TournamentAmericanoMatchPoints;
    courts: TournamentCourt[];
    onSaveScore?: (matchId: string, team1Score: number, team2Score: number) => Promise<void>;
    canRecordScores?: boolean;
    currentUserParticipantId?: string | null; // Current user's participant ID for permission checks
}

export function TournamentMatches({ matches, participants, currentRound, matchPoints, courts, onSaveScore, canRecordScores = false, currentUserParticipantId }: TournamentMatchesProps) {
    const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([currentRound]));
    const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
    const [team1Score, setTeam1Score] = useState(0);
    const [team2Score, setTeam2Score] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const participantsMap = new Map(
        participants.map(p => [p.id, p.displayName])
    );

    const courtMap = new Map(
        courts.map(c => [c.id, c.name])
    );

    const getTeamNames = (teamIds: string[]) => {
        return teamIds.map(id => participantsMap.get(id) || '?');
    };

    const getCourtName = (courtId: string) => {
        return courtMap.get(courtId) || courtId;
    };

    const matchesByRound = matches.reduce((acc, match) => {
        const round = match.roundNumber;
        if (!acc[round]) acc[round] = [];
        acc[round].push(match);
        return acc;
    }, {} as Record<number, TournamentAmericanoMatch[]>);

    const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

    const toggleRound = useCallback((round: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedRounds(prev => {
            const next = new Set(prev);
            if (next.has(round)) {
                next.delete(round);
            } else {
                next.add(round);
            }
            return next;
        });
    }, []);

    const startEditing = (match: TournamentAmericanoMatch) => {
        setEditingMatchId(match.id);
        setTeam1Score(match.team1Score ?? Math.floor(matchPoints / 2));
        setTeam2Score(match.team2Score ?? Math.ceil(matchPoints / 2));
    };

    const cancelEditing = () => {
        setEditingMatchId(null);
    };

    const handleTeam1Increment = () => {
        if (team1Score < matchPoints) {
            setTeam1Score(team1Score + 1);
            setTeam2Score(matchPoints - (team1Score + 1));
        }
    };

    const handleTeam1Decrement = () => {
        if (team1Score > 0) {
            setTeam1Score(team1Score - 1);
            setTeam2Score(matchPoints - (team1Score - 1));
        }
    };

    const handleTeam2Increment = () => {
        if (team2Score < matchPoints) {
            setTeam2Score(team2Score + 1);
            setTeam1Score(matchPoints - (team2Score + 1));
        }
    };

    const handleTeam2Decrement = () => {
        if (team2Score > 0) {
            setTeam2Score(team2Score - 1);
            setTeam1Score(matchPoints - (team2Score - 1));
        }
    };

    const handleSave = async () => {
        if (!editingMatchId || !onSaveScore) return;

        setIsSaving(true);
        try {
            await onSaveScore(editingMatchId, team1Score, team2Score);
            setEditingMatchId(null);
        } finally {
            setIsSaving(false);
        }
    };

    const renderMatch = (match: TournamentAmericanoMatch, isCurrentRound: boolean) => {
        const team1Names = getTeamNames(match.team1);
        const team2Names = getTeamNames(match.team2);
        const isCompleted = match.status === 'completed';
        const isLive = match.status === 'in_progress';
        const isEditing = editingMatchId === match.id;

        // Check if current user can edit this match
        // Mobile users can only edit matches they're playing in, and only if no score exists yet
        const isUserInMatch = currentUserParticipantId && (
            match.team1.includes(currentUserParticipantId) ||
            match.team2.includes(currentUserParticipantId)
        );
        const hasExistingScore = isCompleted || (match.team1Score !== undefined && match.team1Score !== null);
        const canEditThisMatch = isUserInMatch && !hasExistingScore;

        const winner = isCompleted
            ? ((match.team1Score ?? 0) > (match.team2Score ?? 0) ? 1 : 2)
            : null;

        const team1Winning = isEditing ? team1Score > team2Score : false;
        const team2Winning = isEditing ? team2Score > team1Score : false;

        if (isEditing) {
            return (
                <View key={match.id} style={styles.matchCardEditing}>
                    {/* Teams & Scores */}
                    <View style={styles.matchContentEditing}>
                        {/* Team 1 */}
                        <View style={styles.teamSideEditing}>
                            <View style={styles.teamNamesEditing}>
                                {team1Names.map((name, i) => (
                                    <Text key={i} style={[styles.playerNameEditing, team1Winning && styles.playerNameWinning]}>
                                        {name}
                                    </Text>
                                ))}
                            </View>
                            <View style={styles.scoreControls}>
                                <TouchableOpacity
                                    style={styles.scoreBtn}
                                    onPress={handleTeam1Decrement}
                                    disabled={team1Score <= 0}
                                >
                                    <Minus size={16} color={team1Score <= 0 ? theme.colors.zinc[300] : theme.colors.zinc[600]} />
                                </TouchableOpacity>
                                <Text style={[styles.scoreValueEditing, team1Winning && styles.scoreValueWinning]}>
                                    {team1Score}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.scoreBtn, styles.scoreBtnPlus]}
                                    onPress={handleTeam1Increment}
                                    disabled={team1Score >= matchPoints}
                                >
                                    <Plus size={16} color={team1Score >= matchPoints ? theme.colors.zinc[300] : theme.colors.zinc[600]} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Center */}
                        <View style={styles.centerEditing}>
                            <Text style={styles.courtLabelEditing}>
                                {getCourtName(match.courtId)}
                            </Text>
                            <Text style={styles.vsTextEditing}>VS</Text>
                        </View>

                        {/* Team 2 */}
                        <View style={[styles.teamSideEditing, styles.teamSideRight]}>
                            <View style={styles.teamNamesEditing}>
                                {team2Names.map((name, i) => (
                                    <Text key={i} style={[styles.playerNameEditing, styles.playerNameRight, team2Winning && styles.playerNameWinning]}>
                                        {name}
                                    </Text>
                                ))}
                            </View>
                            <View style={styles.scoreControls}>
                                <TouchableOpacity
                                    style={styles.scoreBtn}
                                    onPress={handleTeam2Decrement}
                                    disabled={team2Score <= 0}
                                >
                                    <Minus size={16} color={team2Score <= 0 ? theme.colors.zinc[300] : theme.colors.zinc[600]} />
                                </TouchableOpacity>
                                <Text style={[styles.scoreValueEditing, team2Winning && styles.scoreValueWinning]}>
                                    {team2Score}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.scoreBtn, styles.scoreBtnPlus]}
                                    onPress={handleTeam2Increment}
                                    disabled={team2Score >= matchPoints}
                                >
                                    <Plus size={16} color={team2Score >= matchPoints ? theme.colors.zinc[300] : theme.colors.zinc[600]} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.editingFooter}>
                        <View style={styles.editingButtons}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={cancelEditing}
                                disabled={isSaving}
                            >
                                <X size={16} color={theme.colors.zinc[600]} />
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                <Check size={16} color="#fff" />
                                <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View key={match.id} style={[styles.matchCard, isLive && styles.matchCardLive]}>
                {/* Match Content */}
                <View style={styles.matchContent}>
                    {/* Team 1 */}
                    <View style={styles.teamSide}>
                        <View style={styles.teamNames}>
                            {team1Names.map((name, i) => (
                                <Text key={i} style={[styles.playerName, winner === 1 && styles.playerNameWinner]}>
                                    {name}
                                </Text>
                            ))}
                        </View>
                        <Text style={[styles.scoreValue, winner === 1 && styles.scoreValueWinner]}>
                            {isCompleted ? match.team1Score : '–'}
                        </Text>
                    </View>

                    {/* Center: Court + VS */}
                    <View style={styles.center}>
                        <Text style={styles.courtLabel}>
                            {getCourtName(match.courtId)}
                        </Text>
                        <Text style={styles.vsText}>VS</Text>
                        {isLive && (
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>LIVE</Text>
                            </View>
                        )}
                    </View>

                    {/* Team 2 */}
                    <View style={[styles.teamSide, styles.teamSideRight]}>
                        <View style={styles.teamNames}>
                            {team2Names.map((name, i) => (
                                <Text key={i} style={[styles.playerName, styles.playerNameRight, winner === 2 && styles.playerNameWinner]}>
                                    {name}
                                </Text>
                            ))}
                        </View>
                        <Text style={[styles.scoreValue, styles.scoreValueRight, winner === 2 && styles.scoreValueWinner]}>
                            {isCompleted ? match.team2Score : '–'}
                        </Text>
                    </View>
                </View>

                {/* Edit Button - only show for current round when user can edit this match */}
                {isCurrentRound && canRecordScores && canEditThisMatch && (
                    <View style={styles.editButtonContainer}>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => startEditing(match)}
                            activeOpacity={0.7}
                        >
                            <Pencil size={14} color={theme.colors.zinc[600]} />
                            <Text style={styles.editButtonText}>Enter Score</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {rounds.map(round => {
                const isCurrentRound = round === currentRound;
                const isFutureRound = round > currentRound;
                const isExpanded = expandedRounds.has(round);

                return (
                    <View
                        key={round}
                        style={[styles.roundSection, isFutureRound && styles.roundSectionFaded]}
                    >
                        {/* Round Header */}
                        <TouchableOpacity
                            style={styles.roundHeader}
                            onPress={() => toggleRound(round)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.roundHeaderLeft}>
                                <Text style={[styles.roundTitle, isCurrentRound && styles.roundTitleCurrent, isFutureRound && styles.roundTitleFaded]}>
                                    ROUND {round}
                                </Text>
                                {isCurrentRound && (
                                    <View style={styles.roundLiveBadge}>
                                        <Text style={styles.roundLiveBadgeText}>LIVE</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.roundHeaderRight}>
                                <View style={styles.roundDivider} />
                                <ChevronDown
                                    size={20}
                                    color={theme.colors.zinc[400]}
                                    style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                                />
                            </View>
                        </TouchableOpacity>

                        {/* Matches */}
                        {isExpanded && (
                            <View style={styles.matchesList}>
                                {matchesByRound[round].map(match => renderMatch(match, isCurrentRound))}
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 20,
    },
    roundSection: {},
    roundSectionFaded: {
        opacity: 0.7,
    },
    roundHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    roundHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    roundHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: 12,
    },
    roundDivider: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.zinc[200],
        marginRight: 8,
    },
    roundTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: theme.colors.zinc[900],
        letterSpacing: -0.3,
    },
    roundTitleCurrent: {
        color: '#f97316',
    },
    roundTitleFaded: {
        opacity: 0.5,
    },
    roundLiveBadge: {
        backgroundColor: '#f97316',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    roundLiveBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    matchesList: {
        gap: 12,
    },
    // Match Card
    matchCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.zinc[200],
    },
    matchCardLive: {
        borderColor: '#f97316',
    },
    matchCardEditing: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#f97316',
    },
    matchContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    matchContentEditing: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    // Team Side
    teamSide: {
        flex: 1,
    },
    teamSideRight: {
        alignItems: 'flex-end',
    },
    teamSideEditing: {
        flex: 1,
    },
    teamNames: {
        marginBottom: 4,
    },
    teamNamesEditing: {
        marginBottom: 8,
    },
    playerName: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.zinc[600],
    },
    playerNameRight: {
        textAlign: 'right',
    },
    playerNameWinner: {
        color: '#f97316',
    },
    playerNameEditing: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.zinc[700],
    },
    playerNameWinning: {
        color: '#f97316',
    },
    scoreValue: {
        fontSize: 42,
        fontWeight: '900',
        color: theme.colors.zinc[900],
    },
    scoreValueRight: {
        textAlign: 'right',
    },
    scoreValueWinner: {
        color: '#f97316',
    },
    scoreValueEditing: {
        fontSize: 32,
        fontWeight: '900',
        color: theme.colors.zinc[900],
        minWidth: 40,
        textAlign: 'center',
    },
    scoreValueWinning: {
        color: '#f97316',
    },
    // Center
    center: {
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    centerEditing: {
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingTop: 8,
    },
    courtLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: theme.colors.zinc[400],
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    courtLabelEditing: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: '#f97316',
        textTransform: 'uppercase',
        backgroundColor: '#fff7ed',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 4,
    },
    vsText: {
        fontSize: 28,
        fontWeight: '900',
        color: theme.colors.zinc[200],
        letterSpacing: 2,
    },
    vsTextEditing: {
        fontSize: 24,
        fontWeight: '900',
        color: theme.colors.zinc[300],
        letterSpacing: 2,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    liveDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#f97316',
    },
    liveText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#f97316',
        letterSpacing: 0.5,
    },
    // Score Controls
    scoreControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    scoreBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.zinc[100],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.zinc[200],
    },
    scoreBtnPlus: {
        backgroundColor: theme.colors.zinc[100],
        borderColor: theme.colors.zinc[200],
    },
    // Edit Button
    editButtonContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.zinc[100],
        alignItems: 'center',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: theme.colors.zinc[100],
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.zinc[200],
    },
    editButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.zinc[600],
    },
    // Editing Footer
    editingFooter: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.zinc[100],
        alignItems: 'center',
    },
    editingError: {
        fontSize: 12,
        fontWeight: '700',
        color: '#f97316',
        marginBottom: 8,
    },
    editingButtons: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    cancelBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        backgroundColor: theme.colors.zinc[100],
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.zinc[200],
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.zinc[600],
    },
    saveBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        backgroundColor: '#f97316',
        borderRadius: 12,
    },
    saveBtnDisabled: {
        opacity: 0.5,
    },
    saveBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
});
