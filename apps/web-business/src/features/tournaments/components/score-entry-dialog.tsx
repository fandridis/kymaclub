"use client"

import { useState, useEffect } from "react";
import type { TournamentAmericanoMatch, ParticipantSnapshot, TournamentAmericanoMatchPoints } from "@repo/api/types/widget";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Minus, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreEntryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    match: TournamentAmericanoMatch;
    participants: ParticipantSnapshot[]; // Participants snapshot from tournament state
    matchPoints: TournamentAmericanoMatchPoints;
    onSubmit: (matchId: string, team1Score: number, team2Score: number) => void;
}

function ScoreButton({
    onClick,
    disabled,
    children,
    variant = "default"
}: {
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    variant?: "default" | "destructive";
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                "active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed",
                "touch-manipulation select-none",
                variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
                variant === "destructive" && "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
        >
            {children}
        </button>
    );
}

function TeamScoreControl({
    teamNames,
    score,
    onIncrement,
    onDecrement,
    isWinning,
    maxPoints,
}: {
    teamNames: string[];
    score: number;
    onIncrement: () => void;
    onDecrement: () => void;
    isWinning: boolean;
    maxPoints: number;
}) {
    return (
        <div className={cn(
            "flex-1 flex flex-col items-center p-4 rounded-2xl transition-colors",
            isWinning && "bg-emerald-50 dark:bg-emerald-950/30"
        )}>
            {/* Team names */}
            <div className="text-center mb-4 space-y-0.5">
                {teamNames.map((name, i) => (
                    <p key={i} className={cn(
                        "text-sm font-semibold truncate max-w-[120px]",
                        isWinning && "text-emerald-700 dark:text-emerald-400"
                    )}>
                        {name}
                    </p>
                ))}
            </div>

            {/* Score display */}
            <div className={cn(
                "text-6xl font-bold tabular-nums my-4 transition-colors",
                isWinning && "text-emerald-600 dark:text-emerald-400"
            )}>
                {score}
            </div>

            {/* Score controls */}
            <div className="flex items-center gap-4 mt-2">
                <ScoreButton
                    onClick={onDecrement}
                    disabled={score <= 0}
                    variant="destructive"
                >
                    <Minus className="h-6 w-6" />
                </ScoreButton>
                <ScoreButton
                    onClick={onIncrement}
                    disabled={score >= maxPoints}
                >
                    <Plus className="h-6 w-6" />
                </ScoreButton>
            </div>
        </div>
    );
}

export function ScoreEntryDialog({
    open,
    onOpenChange,
    match,
    participants,
    matchPoints,
    onSubmit
}: ScoreEntryDialogProps) {
    const [team1Score, setTeam1Score] = useState(match.team1Score ?? 0);
    const [team2Score, setTeam2Score] = useState(match.team2Score ?? 0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset scores when match changes
    useEffect(() => {
        setTeam1Score(match.team1Score ?? 0);
        setTeam2Score(match.team2Score ?? 0);
    }, [match.id, match.team1Score, match.team2Score]);

    // Create participants lookup (id -> displayName)
    const participantsMap = new Map(
        participants.map(p => [p.id, p.displayName])
    );

    const getTeamNames = (teamIds: string[]): string[] => {
        return teamIds.map(id => participantsMap.get(id) || "Unknown");
    };

    const team1Names = getTeamNames(match.team1);
    const team2Names = getTeamNames(match.team2);

    // Auto-calculate other score when one changes
    const handleTeam1Increment = () => {
        if (team1Score < matchPoints) {
            const newScore = team1Score + 1;
            setTeam1Score(newScore);
            setTeam2Score(matchPoints - newScore);
        }
    };

    const handleTeam1Decrement = () => {
        if (team1Score > 0) {
            const newScore = team1Score - 1;
            setTeam1Score(newScore);
            setTeam2Score(matchPoints - newScore);
        }
    };

    const handleTeam2Increment = () => {
        if (team2Score < matchPoints) {
            const newScore = team2Score + 1;
            setTeam2Score(newScore);
            setTeam1Score(matchPoints - newScore);
        }
    };

    const handleTeam2Decrement = () => {
        if (team2Score > 0) {
            const newScore = team2Score - 1;
            setTeam2Score(newScore);
            setTeam1Score(matchPoints - newScore);
        }
    };

    const handleSubmit = async () => {
        if (!isValid()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(match.id, team1Score, team2Score);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = () => {
        if (team1Score < 0 || team2Score < 0) return false;
        if (team1Score > matchPoints || team2Score > matchPoints) return false;
        // Note: Ties are allowed
        return true;
    };

    const isEditing = match.status === "completed";
    const team1Winning = team1Score > team2Score;
    const team2Winning = team2Score > team1Score;

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="max-h-[90vh]">
                <DrawerHeader className="text-center pb-2">
                    <DrawerTitle className="flex items-center justify-center gap-2">
                        {isEditing ? "Edit Score" : "Enter Score"}
                        {isEditing && <Badge variant="secondary">Editing</Badge>}
                    </DrawerTitle>
                    <DrawerDescription className="flex items-center justify-center gap-2">
                        <span>Round {match.roundNumber}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {match.courtId.replace('court_', 'Court ').toUpperCase()}
                        </span>
                    </DrawerDescription>
                </DrawerHeader>

                <div className="px-4 pb-4">
                    {/* Score entry area */}
                    <div className="flex items-stretch gap-2">
                        <TeamScoreControl
                            teamNames={team1Names}
                            score={team1Score}
                            onIncrement={handleTeam1Increment}
                            onDecrement={handleTeam1Decrement}
                            isWinning={team1Winning}
                            maxPoints={matchPoints}
                        />

                        {/* VS divider */}
                        <div className="flex flex-col items-center justify-center px-2">
                            <span className="text-sm font-bold text-muted-foreground">VS</span>
                        </div>

                        <TeamScoreControl
                            teamNames={team2Names}
                            score={team2Score}
                            onIncrement={handleTeam2Increment}
                            onDecrement={handleTeam2Decrement}
                            isWinning={team2Winning}
                            maxPoints={matchPoints}
                        />
                    </div>

                </div>

                <DrawerFooter className="pt-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !isValid()}
                        size="lg"
                        className="w-full h-14 text-base font-semibold"
                    >
                        {isSubmitting ? (
                            "Saving..."
                        ) : (
                            <>
                                <Check className="h-5 w-5 mr-2" />
                                {isEditing ? "Update Score" : "Save Score"}
                            </>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        Cancel
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
