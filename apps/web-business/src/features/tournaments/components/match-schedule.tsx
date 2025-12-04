"use client"

import { useState } from "react";
import type { TournamentAmericanoMatch, ParticipantSnapshot, TournamentAmericanoMatchPoints, TournamentCourt } from "@repo/api/types/widget";
import { ChevronDown, Minus, Plus, Check, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchScheduleProps {
    matches: TournamentAmericanoMatch[];
    participants: ParticipantSnapshot[]; // Participants snapshot from tournament state
    currentRound: number;
    onSaveScore: (matchId: string, team1Score: number, team2Score: number) => Promise<void>;
    canRecordScores: boolean;
    matchPoints: TournamentAmericanoMatchPoints;
    courts: TournamentCourt[];
}

// Inline Score Control
function InlineScoreControl({
    score,
    onIncrement,
    onDecrement,
    maxPoints,
    isWinning,
}: {
    score: number;
    onIncrement: () => void;
    onDecrement: () => void;
    maxPoints: number;
    isWinning: boolean;
}) {
    return (
        <div className="flex items-center gap-1.5">
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDecrement(); }}
                disabled={score <= 0}
                className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    "bg-slate-100 hover:bg-slate-200 border border-slate-300",
                    "disabled:opacity-30 disabled:cursor-not-allowed",
                    "active:scale-95"
                )}
            >
                <Minus className="h-3.5 w-3.5 text-slate-600" />
            </button>
            <span className={cn(
                "text-2xl font-black tabular-nums w-10 text-center",
                isWinning ? "text-orange-600" : "text-slate-900"
            )}>
                {score}
            </span>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onIncrement(); }}
                disabled={score >= maxPoints}
                className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    "bg-slate-100 hover:bg-slate-200 border border-slate-300",
                    "disabled:opacity-30 disabled:cursor-not-allowed",
                    "active:scale-95"
                )}
            >
                <Plus className="h-3.5 w-3.5 text-slate-600" />
            </button>
        </div>
    );
}

function MatchCard({
    match,
    getTeamNames,
    getCourtName,
    canRecordScores,
    onSaveScore,
    matchPoints,
    isEditing,
    onStartEdit,
    onCancelEdit,
}: {
    match: TournamentAmericanoMatch;
    getTeamNames: (teamIds: string[]) => string[];
    getCourtName: (courtId: string) => string;
    canRecordScores: boolean;
    onSaveScore: (matchId: string, team1Score: number, team2Score: number) => Promise<void>;
    matchPoints: TournamentAmericanoMatchPoints;
    isEditing: boolean;
    onStartEdit: () => void;
    onCancelEdit: () => void;
}) {
    const [team1Score, setTeam1Score] = useState(match.team1Score ?? Math.floor(matchPoints / 2));
    const [team2Score, setTeam2Score] = useState(match.team2Score ?? Math.ceil(matchPoints / 2));
    const [isSaving, setIsSaving] = useState(false);

    const team1Names = getTeamNames(match.team1);
    const team2Names = getTeamNames(match.team2);
    const isCompleted = match.status === "completed";
    const isLive = match.status === "in_progress";

    const winner = isCompleted
        ? ((match.team1Score ?? 0) > (match.team2Score ?? 0) ? 1 : 2)
        : null;

    // Auto-calculate score handlers
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
        setIsSaving(true);
        try {
            await onSaveScore(match.id, team1Score, team2Score);
            onCancelEdit();
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setTeam1Score(match.team1Score ?? Math.floor(matchPoints / 2));
        setTeam2Score(match.team2Score ?? Math.ceil(matchPoints / 2));
        onCancelEdit();
    };

    const team1Winning = team1Score > team2Score;
    const team2Winning = team2Score > team1Score;

    if (isEditing) {
        return (
            <div className={cn(
                "rounded-2xl p-3 transition-all duration-200",
                "bg-white",
                "border-2 border-orange-500",
                "shadow-xl shadow-orange-500/20"
            )}>
                {/* Teams & Scores */}
                <div className="flex items-center justify-between gap-2">
                    {/* Team 1 */}
                    <div className="flex-1 flex flex-col items-center">
                        <div className="mb-3 space-y-0.5 text-center">
                            {team1Names.map((name, i) => (
                                <p key={i} className={cn(
                                    "text-sm font-bold truncate max-w-[100px]",
                                    team1Winning ? "text-orange-600" : "text-slate-700"
                                )}>
                                    {name}
                                </p>
                            ))}
                        </div>
                        <InlineScoreControl
                            score={team1Score}
                            onIncrement={handleTeam1Increment}
                            onDecrement={handleTeam1Decrement}
                            maxPoints={matchPoints}
                            isWinning={team1Winning}
                        />
                    </div>

                    {/* Center: Court + VS */}
                    <div className="flex flex-col items-center gap-1 px-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                            {getCourtName(match.courtId)}
                        </span>
                        <span className="text-3xl font-black text-slate-300 tracking-wider">VS</span>
                    </div>

                    {/* Team 2 */}
                    <div className="flex-1 flex flex-col items-center">
                        <div className="mb-3 space-y-0.5 text-center">
                            {team2Names.map((name, i) => (
                                <p key={i} className={cn(
                                    "text-sm font-bold truncate max-w-[100px]",
                                    team2Winning ? "text-orange-600" : "text-slate-700"
                                )}>
                                    {name}
                                </p>
                            ))}
                        </div>
                        <InlineScoreControl
                            score={team2Score}
                            onIncrement={handleTeam2Increment}
                            onDecrement={handleTeam2Decrement}
                            maxPoints={matchPoints}
                            isWinning={team2Winning}
                        />
                    </div>
                </div>

                {/* Info & Actions */}
                <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            className={cn(
                                "flex-1 h-11 rounded-xl font-bold text-sm transition-all",
                                "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300",
                                "flex items-center justify-center gap-2",
                                "disabled:opacity-50"
                            )}
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={cn(
                                "flex-1 h-11 rounded-xl font-bold text-sm transition-all",
                                "bg-orange-500 hover:bg-orange-600 text-white",
                                "flex items-center justify-center gap-2",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            <Check className="h-4 w-4" />
                            {isSaving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "rounded-2xl p-3 transition-all duration-200",
            "bg-white",
            "border border-slate-200",
            "shadow-sm hover:shadow-md",
            isLive && "border-orange-400 shadow-lg shadow-orange-500/10"
        )}>
            {/* Teams & Scores */}
            <div className="flex items-center gap-2">
                {/* Team 1 */}
                <div className="flex-1">
                    <div className="mb-2 space-y-0.5">
                        {team1Names.map((name, i) => (
                            <p
                                key={i}
                                className={cn(
                                    "text-sm font-bold truncate",
                                    winner === 1 ? "text-orange-600" : "text-slate-600"
                                )}
                            >
                                {name}
                            </p>
                        ))}
                    </div>
                    <p className={cn(
                        "text-5xl font-black tabular-nums tracking-tight",
                        winner === 1 ? "text-orange-600" : "text-slate-900"
                    )}>
                        {isCompleted ? match.team1Score : "–"}
                    </p>
                </div>

                {/* Center: Court + VS */}
                <div className="flex flex-col items-center gap-1 px-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {getCourtName(match.courtId)}
                    </span>
                    <span className="text-4xl font-black text-slate-200 tracking-wider">VS</span>
                    {isLive && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 animate-pulse flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            LIVE
                        </span>
                    )}
                </div>

                {/* Team 2 */}
                <div className="flex-1 text-right">
                    <div className="mb-2 space-y-0.5">
                        {team2Names.map((name, i) => (
                            <p
                                key={i}
                                className={cn(
                                    "text-sm font-bold truncate",
                                    winner === 2 ? "text-orange-600" : "text-slate-600"
                                )}
                            >
                                {name}
                            </p>
                        ))}
                    </div>
                    <p className={cn(
                        "text-5xl font-black tabular-nums tracking-tight",
                        winner === 2 ? "text-orange-600" : "text-slate-900"
                    )}>
                        {isCompleted ? match.team2Score : "–"}
                    </p>
                </div>
            </div>

            {/* Edit button */}
            {canRecordScores && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-center">
                    <button
                        onClick={onStartEdit}
                        className={cn(
                            "px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
                            "bg-slate-100 hover:bg-orange-500 text-slate-600 hover:text-white",
                            "flex items-center gap-2",
                            "border border-slate-200 hover:border-orange-500"
                        )}
                    >
                        <Pencil className="h-4 w-4" />
                        {isCompleted ? "Edit Score" : "Enter Score"}
                    </button>
                </div>
            )}
        </div>
    );
}

function RoundSection({
    round,
    matches,
    currentRound,
    getTeamNames,
    getCourtName,
    canRecordScores,
    onSaveScore,
    matchPoints,
    editingMatchId,
    onStartEdit,
    onCancelEdit,
}: {
    round: number;
    matches: TournamentAmericanoMatch[];
    currentRound: number;
    getTeamNames: (teamIds: string[]) => string[];
    getCourtName: (courtId: string) => string;
    canRecordScores: boolean;
    onSaveScore: (matchId: string, team1Score: number, team2Score: number) => Promise<void>;
    matchPoints: TournamentAmericanoMatchPoints;
    editingMatchId: string | null;
    onStartEdit: (matchId: string) => void;
    onCancelEdit: () => void;
}) {
    const isCurrentRound = round === currentRound;
    const isFutureRound = round > currentRound;
    const [isExpanded, setIsExpanded] = useState(round >= currentRound);

    return (
        <div className={cn(
            "transition-opacity duration-300",
            isFutureRound ? "opacity-50" : "opacity-100"
        )}>
            {/* Round Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-3 mb-5 group"
            >
                <h2 className={cn(
                    "text-xl font-black tracking-tight uppercase",
                    isCurrentRound ? "text-orange-500" : "text-slate-900"
                )}>
                    Round {round}
                </h2>
                {isCurrentRound && (
                    <span className="text-[10px] font-black px-2.5 py-1 bg-orange-500 text-white rounded tracking-wider animate-pulse">
                        LIVE
                    </span>
                )}
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                <ChevronDown
                    className={cn(
                        "h-5 w-5 text-slate-400 transition-transform",
                        isExpanded && "rotate-180"
                    )}
                />
            </button>

            {/* Matches */}
            {isExpanded && (
                <div className="space-y-4">
                    {matches.map(match => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            getTeamNames={getTeamNames}
                            getCourtName={getCourtName}
                            canRecordScores={canRecordScores}
                            onSaveScore={onSaveScore}
                            matchPoints={matchPoints}
                            isEditing={editingMatchId === match.id}
                            onStartEdit={() => onStartEdit(match.id)}
                            onCancelEdit={onCancelEdit}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function MatchSchedule({
    matches,
    participants,
    currentRound,
    onSaveScore,
    canRecordScores,
    matchPoints,
    courts
}: MatchScheduleProps) {
    const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

    // Create participants lookup (id -> displayName)
    const participantsMap = new Map(
        participants.map(p => [p.id, p.displayName])
    );

    // Create court lookup
    const courtMap = new Map(
        courts.map(c => [c.id, c.name])
    );

    const getTeamNames = (teamIds: string[]): string[] => {
        return teamIds.map(id => participantsMap.get(id) || "Unknown");
    };

    const getCourtName = (courtId: string): string => {
        return courtMap.get(courtId) || courtId;
    };

    // Group matches by round
    const matchesByRound = matches.reduce((acc, match) => {
        const round = match.roundNumber;
        if (!acc[round]) acc[round] = [];
        acc[round].push(match);
        return acc;
    }, {} as Record<number, TournamentAmericanoMatch[]>);

    const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

    if (rounds.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-slate-400 font-bold">No matches scheduled yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {rounds.map(round => (
                <RoundSection
                    key={round}
                    round={round}
                    matches={matchesByRound[round] ?? []}
                    currentRound={currentRound}
                    getTeamNames={getTeamNames}
                    getCourtName={getCourtName}
                    canRecordScores={canRecordScores}
                    onSaveScore={onSaveScore}
                    matchPoints={matchPoints}
                    editingMatchId={editingMatchId}
                    onStartEdit={setEditingMatchId}
                    onCancelEdit={() => setEditingMatchId(null)}
                />
            ))}
        </div>
    );
}
