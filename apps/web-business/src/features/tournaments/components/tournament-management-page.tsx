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
    Plus, Loader2, ArrowLeft,
    MoreVertical, Lock, Unlock, ChevronRight, Clock
} from "lucide-react";
import { MatchSchedule } from './match-schedule';
import { Leaderboard } from './leaderboard';
import { AddWalkInDialog } from './add-walk-in-dialog';
import { ParticipantsList } from './participants-list';
import { PreviewBanner } from './preview-banner';
import { cn } from "@/lib/utils";
import { useNavigate } from '@tanstack/react-router';

interface TournamentManagementPageProps {
    widgetId: string;
}

export function TournamentManagementPage({ widgetId }: TournamentManagementPageProps) {
    const navigate = useNavigate();
    const [showAddWalkIn, setShowAddWalkIn] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("players");
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
    const startTournament = useMutation(api.mutations.widgets.startAmericanoTournament);
    const completeTournament = useMutation(api.mutations.widgets.completeAmericanoTournament);
    const recordMatchResult = useMutation(api.mutations.widgets.recordAmericanoMatchResult);
    const advanceRound = useMutation(api.mutations.widgets.advanceAmericanoRound);
    const lockWidget = useMutation(api.mutations.widgets.lockWidget);
    const unlockWidget = useMutation(api.mutations.widgets.unlockWidget);

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
                    <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto mb-4" />
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

    // Use setupParticipants for setup mode, participants for active/completed
    const setupParticipants = tournamentState.setupParticipants;
    const participants = tournamentState.participants;

    // For setup: use setupParticipants count
    // For active/completed: use participants count
    const currentParticipantCount = isSetupOrReady
        ? setupParticipants.length
        : participants.length;

    const canStart = isSetupOrReady && setupParticipants.length === tournamentState.config.numberOfPlayers;
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
                                        className="gap-2 text-orange-600"
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

            {/* Stats Row - Minimal style like mobile */}
            <div className="max-w-2xl mx-auto px-4 pb-5">
                <div className="flex items-center justify-center">
                    <div className="flex-1 text-center">
                        <p className="text-xl font-extrabold text-slate-900 tabular-nums">
                            {currentParticipantCount}/{config.numberOfPlayers}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">players</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200" />
                    <div className="flex-1 text-center">
                        <p className="text-xl font-extrabold text-slate-900 tabular-nums">{config.matchPoints}</p>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">points</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200" />
                    <div className="flex-1 text-center">
                        <p className="text-xl font-extrabold text-slate-900 tabular-nums">{config.courts?.length ?? 2}</p>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">courts</p>
                    </div>
                </div>
            </div>

            {/* Tabs and Content */}
            <div className="max-w-2xl mx-auto px-4 pb-12">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Tab List */}
                    <TabsList className="grid w-full grid-cols-3 bg-slate-100 border border-slate-200 rounded-xl p-1 h-12 mb-6">
                        <TabsTrigger
                            value="players"
                            className="rounded-lg font-bold text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=inactive]:text-slate-500 transition-all"
                        >
                            Players
                        </TabsTrigger>
                        <TabsTrigger
                            value="schedule"
                            className="rounded-lg font-bold text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=inactive]:text-slate-500 transition-all"
                        >
                            Schedule
                        </TabsTrigger>
                        <TabsTrigger
                            value="leaderboard"
                            className="rounded-lg font-bold text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=inactive]:text-slate-500 transition-all"
                        >
                            Leaderboard
                        </TabsTrigger>
                    </TabsList>

                    {/* Locked indicator banner */}
                    {isLocked && (
                        <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                            <Lock className="h-4 w-4" />
                            <span className="text-sm font-semibold">Tournament is locked. Unlock to make changes.</span>
                        </div>
                    )}

                    {/* Players Tab */}
                    <TabsContent value="players" className="mt-0">
                        <div className="space-y-6">
                            {/* Setup Panel - only show during setup on Players tab */}
                            {isSetupOrReady && (
                                <SetupPanel
                                    currentPlayers={setupParticipants.length}
                                    targetPlayers={tournamentState.config.numberOfPlayers}
                                    canStart={canStart}
                                    onAddWalkIn={() => setShowAddWalkIn(true)}
                                    onStart={handleStartTournament}
                                    startTimeCheck={tournamentState.startTimeCheck}
                                />
                            )}

                            {/* Participants list */}
                            {isSetupOrReady ? (
                                // Setup mode - use full setup participants with management
                                setupParticipants.length > 0 ? (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4">
                                            Registered Players
                                        </h3>
                                        <ParticipantsList
                                            participants={setupParticipants}
                                            widgetId={widgetId}
                                            canRemove={true}
                                        />
                                    </div>
                                ) : (
                                    <EmptyState playerCount={0} />
                                )
                            ) : (
                                // Active/completed - show simple read-only list
                                participants.length > 0 ? (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-6">
                                        <h3 className="text-lg font-bold text-slate-900 mb-4">
                                            Tournament Players
                                        </h3>
                                        <div className="space-y-2">
                                            {participants.map((p, idx) => (
                                                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-sm font-bold text-slate-600">{idx + 1}</span>
                                                    </div>
                                                    <p className="font-semibold text-slate-900">{p.displayName}</p>
                                                </div>
                                            ))}
                                            <p className="text-xs text-slate-400 text-center pt-2">
                                                {participants.length} player{participants.length !== 1 ? "s" : ""} in tournament
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <EmptyState playerCount={0} />
                                )
                            )}
                        </div>
                    </TabsContent>

                    {/* Schedule Tab */}
                    <TabsContent value="schedule" className="mt-0">
                        {/* Preview Banner - during setup mode */}
                        {isSetupOrReady && tournamentState.previewSchedule && (
                            <PreviewBanner placeholderCount={tournamentState.previewSchedule.placeholderCount} />
                        )}

                        {/* Round Complete Banner - active mode */}
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

                        {/* Match Schedule - preview or real */}
                        {tournamentState.state ? (
                            <MatchSchedule
                                matches={tournamentState.state.matches}
                                participants={participants}
                                currentRound={tournamentState.state.currentRound}
                                onSaveScore={handleSaveScore}
                                canRecordScores={canRecordScores}
                                matchPoints={tournamentState.config.matchPoints}
                                courts={tournamentState.config.courts}
                            />
                        ) : tournamentState.previewSchedule ? (
                            <MatchSchedule
                                matches={tournamentState.previewSchedule.matches}
                                participants={setupParticipants}
                                currentRound={1}
                                onSaveScore={handleSaveScore}
                                canRecordScores={false}
                                matchPoints={tournamentState.config.matchPoints}
                                courts={tournamentState.config.courts}
                                isPreview={true}
                            />
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <p className="font-bold">Schedule will be generated when tournament starts</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Leaderboard Tab */}
                    <TabsContent value="leaderboard" className="mt-0">
                        {tournamentState.state ? (
                            <Leaderboard
                                standings={tournamentState.state.standings}
                                participants={participants}
                                isComplete={isCompleted}
                            />
                        ) : (
                            <div className="text-center py-12">
                                <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold">Leaderboard will be populated when tournament starts</p>
                                <p className="text-sm text-slate-300 mt-1">Rankings will update as matches are completed</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
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
                        <AlertDialogAction onClick={handleCompleteTournament} className="bg-orange-500 hover:bg-orange-600">
                            Complete Tournament
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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

    if (status === "setup" || status === "ready") {
        return (
            <span className="text-[10px] font-black px-2.5 py-1 bg-slate-200 text-slate-500 rounded tracking-wider">
                SETTING UP
            </span>
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

// Setup Panel Component - No sync button needed, bookings are auto-included
function SetupPanel({
    currentPlayers,
    targetPlayers,
    canStart,
    onAddWalkIn,
    onStart,
    startTimeCheck,
}: {
    currentPlayers: number;
    targetPlayers: number;
    canStart: boolean;
    onAddWalkIn: () => void;
    onStart: () => void;
    startTimeCheck: {
        canStart: boolean;
        reason?: string;
        allowedStartTime?: number;
        minutesUntilAllowed?: number;
    } | null;
}) {
    const remaining = targetPlayers - currentPlayers;
    const progress = (currentPlayers / targetPlayers) * 100;
    const hasEnoughPlayers = currentPlayers === targetPlayers;
    const canStartNow = canStart && startTimeCheck?.canStart !== false;

    // Format time until allowed
    const formatTimeUntilAllowed = () => {
        if (!startTimeCheck?.minutesUntilAllowed) return null;
        const mins = startTimeCheck.minutesUntilAllowed;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        if (hours > 0) {
            return `${hours}h ${remainingMins}m`;
        }
        return `${mins}m`;
    };

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
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Start time restriction notice */}
            {hasEnoughPlayers && startTimeCheck && !startTimeCheck.canStart && (
                <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                        <span className="font-bold">Can start in {formatTimeUntilAllowed()}</span>
                        <span className="text-amber-600"> · Tournament starts become available 2 hours before class time</span>
                    </p>
                </div>
            )}

            <div className="flex gap-3">
                <Button
                    variant="outline"
                    onClick={onAddWalkIn}
                    className="flex-1 h-12 bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 font-bold"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Walk-in
                </Button>
                <Button
                    onClick={onStart}
                    disabled={!canStartNow}
                    className={cn(
                        "flex-1 h-12 font-bold transition-all",
                        canStartNow
                            ? "bg-orange-500 hover:bg-orange-600 text-white"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                >
                    <Play className="h-4 w-4 mr-2" />
                    Start Tournament
                </Button>
            </div>

            <p className="text-xs text-slate-400 mt-4 text-center">
                Bookings are automatically included. Add walk-ins for non-booked players.
            </p>
        </div>
    );
}

// Empty State Component
function EmptyState({ playerCount }: { playerCount: number }) {
    return (
        <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 mb-6">
                <Trophy className="h-10 w-10 text-orange-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Ready to Play</h3>
            <p className="text-slate-400 font-semibold max-w-sm mx-auto">
                {playerCount === 0
                    ? "Waiting for bookings or add walk-ins to get started."
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
            <div className="rounded-2xl p-5 mb-6 bg-gradient-to-r from-emerald-50 to-orange-50 border border-emerald-200">
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
        <div className="rounded-2xl p-5 mb-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="font-black text-orange-800">Round {currentRound} Complete!</p>
                        <p className="text-sm text-orange-600">
                            All matches finished. {totalRounds - currentRound} round{totalRounds - currentRound !== 1 ? 's' : ''} remaining.
                        </p>
                    </div>
                </div>
                <Button
                    onClick={onAdvance}
                    disabled={isLocked}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
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
