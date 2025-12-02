"use client"

import { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import type { Id } from "@repo/api/convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Trophy, Play, CheckCircle, XCircle,
    Plus, RefreshCw, Loader2, ArrowLeft, Users, Target, LayoutGrid,
    MoreVertical, Lock, Unlock, ChevronRight
} from "lucide-react";
import { MatchSchedule } from './match-schedule';
import { Leaderboard } from './leaderboard';
import { AddWalkInDialog } from './add-walk-in-dialog';
import { cn } from "@/lib/utils";
import { useNavigate } from '@tanstack/react-router';

interface TournamentManagementPageProps {
    widgetId: string;
}

export function TournamentManagementPage({ widgetId }: TournamentManagementPageProps) {
    const navigate = useNavigate();
    const [showAddWalkIn, setShowAddWalkIn] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("schedule");
    const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

    // Fetch tournament data
    const tournamentState = useQuery(
        api.queries.widgets.getAmericanoTournamentState,
        { widgetId: widgetId as Id<"classInstanceWidgets"> }
    );

    const widget = useQuery(
        api.queries.widgets.getById,
        { widgetId: widgetId as Id<"classInstanceWidgets"> }
    );

    // Mutations
    const syncParticipants = useMutation(api.mutations.widgets.syncParticipantsFromBookings);
    const startTournament = useMutation(api.mutations.widgets.startAmericanoTournament);
    const completeTournament = useMutation(api.mutations.widgets.completeAmericanoTournament);
    const recordMatchResult = useMutation(api.mutations.widgets.recordAmericanoMatchResult);
    const advanceRound = useMutation(api.mutations.widgets.advanceAmericanoRound);
    const lockWidget = useMutation(api.mutations.widgets.lockWidget);
    const unlockWidget = useMutation(api.mutations.widgets.unlockWidget);

    const handleSyncParticipants = async () => {
        try {
            const result = await syncParticipants({
                widgetId: widgetId as Id<"classInstanceWidgets">
            });
            toast.success(`Added ${result.addedCount} participant(s)`);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to sync";
            toast.error(message);
        }
    };

    const handleStartTournament = async () => {
        try {
            await startTournament({
                widgetId: widgetId as Id<"classInstanceWidgets">
            });
            toast.success("Tournament started!");
            setActiveTab("schedule");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to start";
            toast.error(message);
        }
    };

    const handleCompleteTournament = async () => {
        try {
            await completeTournament({
                widgetId: widgetId as Id<"classInstanceWidgets">
            });
            toast.success("Tournament completed!");
            setShowCompleteConfirm(false);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to complete";
            toast.error(message);
        }
    };

    const handleLockToggle = async () => {
        try {
            if (widget?.isLocked) {
                await unlockWidget({
                    widgetId: widgetId as Id<"classInstanceWidgets">
                });
                toast.success("Tournament unlocked");
            } else {
                await lockWidget({
                    widgetId: widgetId as Id<"classInstanceWidgets">
                });
                toast.success("Tournament locked");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update lock state";
            toast.error(message);
        }
    };

    const handleSaveScore = async (matchId: string, team1Score: number, team2Score: number) => {
        await recordMatchResult({
            widgetId: widgetId as Id<"classInstanceWidgets">,
            matchId,
            team1Score,
            team2Score,
        });
        toast.success("Score saved!");
    };

    const handleAdvanceRound = async () => {
        try {
            const result = await advanceRound({
                widgetId: widgetId as Id<"classInstanceWidgets">
            });
            toast.success(`Advanced to Round ${result.newRound}!`);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to advance round";
            toast.error(message);
        }
    };

    const handleClose = () => {
        navigate({ to: '/calendar' });
    };

    // Loading state
    if (!widget || !tournamentState) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-cyan-500 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">Loading tournament...</p>
                </div>
            </div>
        );
    }

    // Not found
    if (widget === null) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <XCircle className="h-14 w-14 text-red-500" />
                <p className="text-lg text-slate-600 font-bold">Tournament not found</p>
            </div>
        );
    }

    const status = widget.status;
    const isSetupOrReady = status === "setup" || status === "ready";
    const isActive = status === "active";
    const isCompleted = status === "completed";
    const isLocked = widget.isLocked === true;
    const canStart = isSetupOrReady && tournamentState.participants.length === tournamentState.config.numberOfPlayers;
    const classInfo = tournamentState.classInstanceInfo;
    const config = tournamentState.config;
    const canRecordScores = isActive && !isLocked;

    // Check if current round is complete
    const state = tournamentState.state;
    const currentRound = state?.currentRound ?? 1;
    const totalRounds = state?.totalRounds ?? 1;
    const currentRoundMatches = state?.matches.filter(m => m.roundNumber === currentRound) ?? [];
    const isCurrentRoundComplete = currentRoundMatches.length > 0 &&
        currentRoundMatches.every(m => m.status === 'completed');
    const isOnLastRound = currentRound >= totalRounds;
    const canAdvanceRound = isActive && isCurrentRoundComplete && !isOnLastRound && !isLocked;

    return (
        <div className="min-h-screen bg-white">
            {/* Back button */}
            <div className="max-w-2xl mx-auto px-4 pt-4">
                <button
                    onClick={handleClose}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="text-sm font-bold">Back</span>
                </button>
            </div>

            {/* Header */}
            <div className="max-w-2xl mx-auto px-4 pt-6 pb-6">
                {/* Class name row with status badge and menu */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            {classInfo?.className || "Tournament"}
                        </h1>
                        <StatusBadge status={status} isLocked={isLocked} />
                    </div>

                    {/* Dots menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-900">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={handleLockToggle} className="gap-2">
                                {isLocked ? (
                                    <>
                                        <Unlock className="h-4 w-4" />
                                        Unlock Tournament
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4" />
                                        Lock Tournament
                                    </>
                                )}
                            </DropdownMenuItem>
                            {isActive && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setShowCompleteConfirm(true)}
                                        className="gap-2 text-cyan-600"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Complete Tournament
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Tournament type and venue */}
                <p className="text-sm text-slate-400 font-semibold">
                    Americano Tournament · {classInfo?.venueName || "Venue"}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="max-w-2xl mx-auto px-4 pb-6">
                <div className="grid grid-cols-3 gap-3">
                    <StatCard
                        icon={<Users className="h-5 w-5" />}
                        label="Players"
                        value={`${tournamentState.participants.length}/${config.numberOfPlayers}`}
                        accent={tournamentState.participants.length === config.numberOfPlayers}
                    />
                    <StatCard
                        icon={<Target className="h-5 w-5" />}
                        label="Points"
                        value={String(config.matchPoints)}
                    />
                    <StatCard
                        icon={<LayoutGrid className="h-5 w-5" />}
                        label="Courts"
                        value={String(config.courts?.length ?? 2)}
                    />
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pb-12">
                {/* Setup Panel */}
                {isSetupOrReady && (
                    <SetupPanel
                        currentPlayers={tournamentState.participants.length}
                        targetPlayers={tournamentState.config.numberOfPlayers}
                        canStart={canStart}
                        onAddWalkIn={() => setShowAddWalkIn(true)}
                        onSync={handleSyncParticipants}
                        onStart={handleStartTournament}
                    />
                )}

                {/* Locked indicator banner */}
                {isLocked && (
                    <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                        <Lock className="h-4 w-4" />
                        <span className="text-sm font-semibold">Tournament is locked. Unlock to make changes.</span>
                    </div>
                )}

                {/* Main Content */}
                {tournamentState.state ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 border border-slate-200 rounded-xl p-1 h-12">
                            <TabsTrigger
                                value="schedule"
                                className="rounded-lg font-bold text-sm data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=inactive]:text-slate-500 transition-all"
                            >
                                Schedule
                            </TabsTrigger>
                            <TabsTrigger
                                value="leaderboard"
                                className="rounded-lg font-bold text-sm data-[state=active]:bg-cyan-500 data-[state=active]:text-white data-[state=inactive]:text-slate-500 transition-all"
                            >
                                Leaderboard
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="schedule" className="mt-0">
                            {/* Round Complete Banner */}
                            {isCurrentRoundComplete && isActive && (
                                <RoundCompletePanel
                                    currentRound={currentRound}
                                    totalRounds={totalRounds}
                                    isOnLastRound={isOnLastRound}
                                    isLocked={isLocked}
                                    onAdvance={handleAdvanceRound}
                                    onComplete={() => setShowCompleteConfirm(true)}
                                />
                            )}
                            <MatchSchedule
                                matches={tournamentState.state.matches}
                                participants={tournamentState.participants}
                                currentRound={tournamentState.state.currentRound}
                                onSaveScore={handleSaveScore}
                                canRecordScores={canRecordScores}
                                matchPoints={tournamentState.config.matchPoints}
                                courts={tournamentState.config.courts}
                            />
                        </TabsContent>

                        <TabsContent value="leaderboard" className="mt-0">
                            <Leaderboard
                                standings={tournamentState.state.standings}
                                participants={tournamentState.participants}
                                isComplete={isCompleted}
                            />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <EmptyState playerCount={tournamentState.participants.length} />
                )}
            </div>

            {/* Dialogs */}
            <AddWalkInDialog
                open={showAddWalkIn}
                onOpenChange={setShowAddWalkIn}
                widgetId={widgetId}
            />

            {/* Complete Tournament Confirmation */}
            <AlertDialog open={showCompleteConfirm} onOpenChange={setShowCompleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Complete Tournament?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will finalize the tournament and lock the final standings.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCompleteTournament} className="bg-cyan-500 hover:bg-cyan-600">
                            Complete Tournament
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Stat Card Component
function StatCard({
    icon,
    label,
    value,
    accent = false
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div className={cn(
            "rounded-xl p-4 transition-all",
            "bg-white border shadow-sm",
            accent ? "border-cyan-300 bg-cyan-50" : "border-slate-200"
        )}>
            <div className={cn(
                "flex items-center gap-2 mb-2",
                accent ? "text-cyan-600" : "text-slate-400"
            )}>
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <p className={cn(
                "text-2xl font-black tabular-nums",
                accent ? "text-cyan-600" : "text-slate-900"
            )}>
                {value}
            </p>
        </div>
    );
}

// Status Badge Component
function StatusBadge({ status, isLocked }: { status: string; isLocked?: boolean }) {
    if (status === "active") {
        return (
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2.5 py-1 bg-orange-500 text-white rounded tracking-wider animate-pulse flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    LIVE
                </span>
                {isLocked && (
                    <span className="text-[10px] font-black px-2.5 py-1 bg-amber-100 text-amber-700 rounded tracking-wider flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        LOCKED
                    </span>
                )}
            </div>
        );
    }

    if (status === "completed") {
        return (
            <span className="text-[10px] font-black px-2.5 py-1 bg-slate-200 text-slate-600 rounded tracking-wider">
                COMPLETE
            </span>
        );
    }

    if (status === "cancelled") {
        return (
            <span className="text-[10px] font-black px-2.5 py-1 bg-red-100 text-red-600 rounded tracking-wider">
                CANCELLED
            </span>
        );
    }

    return null;
}

// Setup Panel Component
function SetupPanel({
    currentPlayers,
    targetPlayers,
    canStart,
    onAddWalkIn,
    onSync,
    onStart,
}: {
    currentPlayers: number;
    targetPlayers: number;
    canStart: boolean;
    onAddWalkIn: () => void;
    onSync: () => void;
    onStart: () => void;
}) {
    const remaining = targetPlayers - currentPlayers;
    const progress = (currentPlayers / targetPlayers) * 100;

    return (
        <div className="rounded-2xl p-6 mb-8 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Players Registered
                    </p>
                    <p className="text-4xl font-black text-slate-900 tabular-nums">
                        {currentPlayers}
                        <span className="text-slate-300">/{targetPlayers}</span>
                    </p>
                </div>
                {remaining > 0 && (
                    <div className="text-right">
                        <p className="text-3xl font-black text-orange-500 tabular-nums">
                            {remaining}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            more needed
                        </p>
                    </div>
                )}
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="flex gap-3">
                <Button
                    variant="outline"
                    onClick={onAddWalkIn}
                    className="flex-1 h-12 bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 font-bold"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Player
                </Button>
                <Button
                    variant="outline"
                    onClick={onSync}
                    className="flex-1 h-12 bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 font-bold"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync
                </Button>
                <Button
                    onClick={onStart}
                    disabled={!canStart}
                    className={cn(
                        "flex-1 h-12 font-bold transition-all",
                        canStart
                            ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                >
                    <Play className="h-4 w-4 mr-2" />
                    Start
                </Button>
            </div>
        </div>
    );
}

// Empty State Component
function EmptyState({ playerCount }: { playerCount: number }) {
    return (
        <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-50 border border-cyan-200 mb-6">
                <Trophy className="h-10 w-10 text-cyan-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Ready to Play</h3>
            <p className="text-slate-400 font-semibold max-w-sm mx-auto">
                {playerCount === 0
                    ? "Add players to get started with the tournament."
                    : "Once all players are registered, start the tournament to generate matches."
                }
            </p>
        </div>
    );
}

// Round Complete Panel Component
function RoundCompletePanel({
    currentRound,
    totalRounds,
    isOnLastRound,
    isLocked,
    onAdvance,
    onComplete,
}: {
    currentRound: number;
    totalRounds: number;
    isOnLastRound: boolean;
    isLocked: boolean;
    onAdvance: () => void;
    onComplete: () => void;
}) {
    if (isOnLastRound) {
        // Last round complete - show finish tournament
        return (
            <div className="rounded-2xl p-5 mb-6 bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                            <Trophy className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="font-black text-emerald-800">All Matches Complete!</p>
                            <p className="text-sm text-emerald-600">
                                Final round finished. Ready to finalize standings.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={onComplete}
                        disabled={isLocked}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Finish Tournament
                    </Button>
                </div>
            </div>
        );
    }

    // Regular round complete - show advance button
    return (
        <div className="rounded-2xl p-5 mb-6 bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="font-black text-cyan-800">Round {currentRound} Complete!</p>
                        <p className="text-sm text-cyan-600">
                            All matches finished. {totalRounds - currentRound} round{totalRounds - currentRound !== 1 ? 's' : ''} remaining.
                        </p>
                    </div>
                </div>
                <Button
                    onClick={onAdvance}
                    disabled={isLocked}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold"
                >
                    Start Round {currentRound + 1}
                    <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
            {isLocked && (
                <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Unlock tournament to advance to the next round.
                </p>
            )}
        </div>
    );
}
