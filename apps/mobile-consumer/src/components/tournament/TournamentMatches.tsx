import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';
import { ChevronDown, Pencil, Minus, Plus, Check, X } from 'lucide-react-native';
import { theme } from '../../theme';
import type { TournamentAmericanoMatch, WidgetParticipant, TournamentAmericanoMatchPoints, TournamentCourt } from '@repo/api/types/widget';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TournamentMatchesProps {
    matches: TournamentAmericanoMatch[];
    participants: WidgetParticipant[];
    currentRound: number;
    matchPoints: TournamentAmericanoMatchPoints;
    courts: TournamentCourt[];
}

export function TournamentMatches({ matches, participants, currentRound, matchPoints, courts }: TournamentMatchesProps) {
    const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([currentRound]));
    const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
    const [team1Score, setTeam1Score] = useState(0);
    const [team2Score, setTeam2Score] = useState(0);

    const participantMap = new Map(
        participants.map(p => [p._id.toString(), p.displayName])
    );

    const courtMap = new Map(
        courts.map(c => [c.id, c.name])
    );

    const getTeamNames = (teamIds: string[]) => {
        return teamIds.map(id => participantMap.get(id) || '?');
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

    const handleSave = () => {
        // TODO: Call mutation to save score
        setEditingMatchId(null);
    };

    const isValid = team1Score !== team2Score;

    const renderMatch = (match: TournamentAmericanoMatch, isCurrentRound: boolean) => {
        const team1Names = getTeamNames(match.team1);
        const team2Names = getTeamNames(match.team2);
        const isCompleted = match.status === 'completed';
        const isLive = match.status === 'in_progress';
        const isEditing = editingMatchId === match.id;

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
                                    <Plus size={16} color={team1Score >= matchPoints ? '#fff' : '#fff'} />
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
                                    <Plus size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.editingFooter}>
                        {!isValid && (
                            <Text style={styles.editingError}>Ties not allowed</Text>
                        )}
                        <View style={styles.editingButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={cancelEditing}>
                                <X size={16} color={theme.colors.zinc[600]} />
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
                                onPress={handleSave}
                                disabled={!isValid}
                            >
                                <Check size={16} color="#fff" />
                                <Text style={styles.saveBtnText}>Save</Text>
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

                {/* Edit Button - only show for current round */}
                {isCurrentRound && (
                    <View style={styles.editButtonContainer}>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => startEditing(match)}
                            activeOpacity={0.7}
                        >
                            <Pencil size={14} color={theme.colors.zinc[600]} />
                            <Text style={styles.editButtonText}>
                                {isCompleted ? 'Edit Score' : 'Enter Score'}
                            </Text>
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
                                <Text style={[styles.roundTitle, isCurrentRound && styles.roundTitleCurrent]}>
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
        gap: 32,
    },
    roundSection: {},
    roundSectionFaded: {
        opacity: 0.5,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    matchCardLive: {
        borderColor: '#f97316',
        shadowColor: '#f97316',
        shadowOpacity: 0.1,
    },
    matchCardEditing: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#06b6d4',
        shadowColor: '#06b6d4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
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
        color: '#06b6d4',
    },
    playerNameEditing: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.zinc[700],
    },
    playerNameWinning: {
        color: '#06b6d4',
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
        color: '#06b6d4',
    },
    scoreValueEditing: {
        fontSize: 32,
        fontWeight: '900',
        color: theme.colors.zinc[900],
        minWidth: 40,
        textAlign: 'center',
    },
    scoreValueWinning: {
        color: '#06b6d4',
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
        color: '#06b6d4',
        textTransform: 'uppercase',
        backgroundColor: '#ecfeff',
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
        backgroundColor: '#06b6d4',
        borderColor: '#06b6d4',
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
        backgroundColor: '#06b6d4',
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
