"use client"

import type { TournamentAmericanoStanding, WidgetParticipant } from "@repo/api/types/widget";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardProps {
    standings: TournamentAmericanoStanding[];
    participants: WidgetParticipant[];
    isComplete?: boolean;
}

// Podium for top 3 players
function Podium({
    first,
    second,
    third,
    getName,
}: {
    first?: TournamentAmericanoStanding;
    second?: TournamentAmericanoStanding;
    third?: TournamentAmericanoStanding;
    getName: (id: string) => string;
}) {
    if (!first) return null;

    return (
        <div className="mb-8">
            <div className="flex items-end justify-center gap-2 px-4">
                {/* Second Place */}
                <div className="flex-1 max-w-[120px]">
                    {second && (
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center mb-2 shadow-lg">
                                <Medal className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-sm font-bold text-slate-700 text-center truncate w-full mb-1">
                                {getName(second.participantId)}
                            </p>
                            <div className="h-20 w-full bg-gradient-to-t from-slate-300 to-slate-200 rounded-t-lg flex items-center justify-center border-x border-t border-slate-400/30 shadow-md">
                                <span className="text-2xl font-black text-slate-600">2</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* First Place */}
                <div className="flex-1 max-w-[140px]">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mb-2 shadow-lg shadow-amber-400/30 ring-4 ring-amber-300/30">
                            <Trophy className="h-8 w-8 text-amber-900" />
                        </div>
                        <p className="text-base font-black text-amber-600 text-center truncate w-full mb-1">
                            {getName(first.participantId)}
                        </p>
                        <div className="h-28 w-full bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-lg flex items-center justify-center border-x border-t border-amber-500/30 shadow-lg shadow-amber-400/20">
                            <span className="text-3xl font-black text-amber-800">1</span>
                        </div>
                    </div>
                </div>

                {/* Third Place */}
                <div className="flex-1 max-w-[120px]">
                    {third && (
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center mb-2 shadow-lg">
                                <Award className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-sm font-bold text-slate-700 text-center truncate w-full mb-1">
                                {getName(third.participantId)}
                            </p>
                            <div className="h-16 w-full bg-gradient-to-t from-orange-400 to-orange-300 rounded-t-lg flex items-center justify-center border-x border-t border-orange-500/30 shadow-md">
                                <span className="text-2xl font-black text-orange-800">3</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Individual standing row
function StandingRow({
    standing,
    rank,
    playerName,
}: {
    standing: TournamentAmericanoStanding;
    rank: number;
    playerName: string;
}) {
    const wins = standing.matchesWon ?? 0;
    const losses = standing.matchesLost ?? 0;
    const pointsDiff = standing.pointsDifference ?? 0;
    const isPositive = pointsDiff > 0;
    const isNegative = pointsDiff < 0;

    return (
        <div className={cn(
            "rounded-xl p-4 flex items-center justify-between transition-all",
            "bg-white border border-slate-200 shadow-sm",
            "hover:shadow-md"
        )}>
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Rank */}
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 border border-slate-200">
                    <span className="text-sm font-black text-slate-500 tabular-nums">
                        {rank}
                    </span>
                </div>

                {/* Player info */}
                <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">
                        {playerName}
                    </p>
                    <p className="text-xs text-slate-400 font-bold">
                        <span className="text-emerald-500">{wins}W</span>
                        <span className="mx-1">·</span>
                        <span className="text-red-400">{losses}L</span>
                    </p>
                </div>
            </div>

            {/* Point difference */}
            <div className="text-right">
                <p className={cn(
                    "text-2xl font-black tabular-nums",
                    isPositive && "text-emerald-500",
                    isNegative && "text-red-400",
                    !isPositive && !isNegative && "text-slate-400"
                )}>
                    {isPositive && "+"}{pointsDiff}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">pts</p>
            </div>
        </div>
    );
}

export function Leaderboard({ standings, participants, isComplete }: LeaderboardProps) {
    // Create participant lookup
    const participantMap = new Map(
        participants.map(p => [p._id.toString(), p.displayName])
    );

    const getName = (id: string): string => {
        return participantMap.get(id) || "Unknown";
    };

    if (standings.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 mb-6">
                    <Trophy className="h-10 w-10 text-slate-300" />
                </div>
                <p className="font-bold text-slate-500">No standings yet</p>
                <p className="text-sm text-slate-400 font-medium mt-1">
                    Standings will appear after matches are played
                </p>
            </div>
        );
    }

    // Get top 3 for podium
    const [first, second, third] = standings;
    const restOfStandings = standings.slice(3);

    return (
        <div>
            {/* Title */}
            {isComplete && (
                <div className="text-center mb-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">
                        Final Results
                    </span>
                </div>
            )}

            {/* Podium for top 3 */}
            <Podium
                first={first}
                second={second}
                third={third}
                getName={getName}
            />

            {/* Remaining standings */}
            {restOfStandings.length > 0 && (
                <div className="space-y-2">
                    {restOfStandings.map((standing, index) => {
                        const rank = index + 4; // Start from 4th place
                        const playerName = getName(standing.participantId);

                        return (
                            <StandingRow
                                key={standing.participantId}
                                standing={standing}
                                rank={rank}
                                playerName={playerName}
                            />
                        );
                    })}
                </div>
            )}

            {/* Top 3 stats (below podium) */}
            {standings.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-200">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4 text-center">
                        Top Performers
                    </p>
                    <div className="space-y-2">
                        {standings.slice(0, 3).map((standing, index) => {
                            const rank = index + 1;
                            const playerName = getName(standing.participantId);
                            const wins = standing.matchesWon ?? 0;
                            const losses = standing.matchesLost ?? 0;
                            const pointsDiff = standing.pointsDifference ?? 0;
                            const isPositive = pointsDiff > 0;
                            const isNegative = pointsDiff < 0;

                            const colors = {
                                1: { bg: "bg-amber-50", border: "border-amber-200", rank: "text-amber-600", name: "text-amber-700" },
                                2: { bg: "bg-slate-50", border: "border-slate-200", rank: "text-slate-500", name: "text-slate-700" },
                                3: { bg: "bg-orange-50", border: "border-orange-200", rank: "text-orange-500", name: "text-orange-700" },
                            }[rank] ?? { bg: "bg-white", border: "border-slate-200", rank: "text-slate-500", name: "text-slate-700" };

                            return (
                                <div
                                    key={standing.participantId}
                                    className={cn(
                                        "rounded-xl p-4 flex items-center justify-between",
                                        colors.bg,
                                        "border",
                                        colors.border
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={cn("text-lg font-black tabular-nums", colors.rank)}>
                                            #{rank}
                                        </span>
                                        <span className={cn("font-bold", colors.name)}>
                                            {playerName}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-slate-400 font-bold">
                                            <span className="text-emerald-500">{wins}W</span>
                                            <span className="mx-1">·</span>
                                            <span className="text-red-400">{losses}L</span>
                                        </span>
                                        <span className={cn(
                                            "text-lg font-black tabular-nums min-w-[3rem] text-right",
                                            isPositive && "text-emerald-500",
                                            isNegative && "text-red-400",
                                            !isPositive && !isNegative && "text-slate-400"
                                        )}>
                                            {isPositive && "+"}{pointsDiff}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
