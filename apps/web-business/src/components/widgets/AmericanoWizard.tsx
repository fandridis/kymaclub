"use client"

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@repo/api/convex/_generated/api';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { Id } from '@repo/api/convex/_generated/dataModel';

// Configuration types
type PlayerCount = 8 | 12 | 16;
type MatchPoints = 20 | 21 | 24 | 25;
type Mode = 'individual_rotation' | 'fixed_teams';

interface Court {
    id: string;
    name: string;
}

interface AmericanoConfig {
    numberOfPlayers: PlayerCount;
    matchPoints: MatchPoints;
    courts: Court[];
    maxMatchesPerPlayer: number;
    mode: Mode;
}

interface AmericanoWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classInstanceId: Id<"classInstances">;
    onComplete: () => void;
}

const STEPS = ['Players', 'Format', 'Courts', 'Review'];

const PLAYER_OPTIONS: { value: PlayerCount; label: string }[] = [
    { value: 8, label: '8 Players' },
    { value: 12, label: '12 Players' },
    { value: 16, label: '16 Players' },
];

const MATCH_POINTS_OPTIONS: { value: MatchPoints; label: string }[] = [
    { value: 20, label: '20 Points' },
    { value: 21, label: '21 Points' },
    { value: 24, label: '24 Points' },
    { value: 25, label: '25 Points' },
];

const MODE_OPTIONS: { value: Mode; label: string; description: string }[] = [
    {
        value: 'individual_rotation',
        label: 'Individual Rotation',
        description: 'Players rotate partners each round'
    },
    {
        value: 'fixed_teams',
        label: 'Fixed Teams',
        description: 'Teams stay together throughout'
    },
];

export function AmericanoWizard({
    open,
    onOpenChange,
    classInstanceId,
    onComplete,
}: AmericanoWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [numberOfPlayers, setNumberOfPlayers] = useState<PlayerCount>(8);
    const [matchPoints, setMatchPoints] = useState<MatchPoints>(21);
    const [mode, setMode] = useState<Mode>('individual_rotation');
    const [courts, setCourts] = useState<Court[]>([
        { id: '1', name: 'Court A' },
        { id: '2', name: 'Court B' },
    ]);
    const [maxMatchesPerPlayer, setMaxMatchesPerPlayer] = useState(4);
    const [newCourtName, setNewCourtName] = useState('');

    const attachWidget = useMutation(api.mutations.widgets.attachWidget);

    const handleAddCourt = () => {
        if (!newCourtName.trim()) return;
        setCourts([
            ...courts,
            { id: String(Date.now()), name: newCourtName.trim() }
        ]);
        setNewCourtName('');
    };

    const handleRemoveCourt = (id: string) => {
        setCourts(courts.filter(c => c.id !== id));
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const config: AmericanoConfig = {
                numberOfPlayers,
                matchPoints,
                courts,
                maxMatchesPerPlayer,
                mode,
            };

            await attachWidget({
                classInstanceId,
                widgetConfig: {
                    type: 'tournament_americano',
                    config,
                },
            });

            toast.success('Tournament created successfully!');
            onComplete();
            onOpenChange(false);

            // Reset form
            setCurrentStep(0);
        } catch (error) {
            console.error('Failed to create tournament:', error);
            toast.error('Failed to create tournament. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0: // Players
                return numberOfPlayers > 0;
            case 1: // Format
                return matchPoints > 0 && mode;
            case 2: // Courts
                return courts.length >= 2;
            case 3: // Review
                return true;
            default:
                return false;
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-6">
                        <div>
                            <Label className="text-base font-medium">Number of Players</Label>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">
                                Select how many players will participate
                            </p>
                            <RadioGroup
                                value={String(numberOfPlayers)}
                                onValueChange={(v) => setNumberOfPlayers(Number(v) as PlayerCount)}
                                className="grid grid-cols-3 gap-3"
                            >
                                {PLAYER_OPTIONS.map((option) => (
                                    <Label
                                        key={option.value}
                                        htmlFor={`players-${option.value}`}
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-colors",
                                            numberOfPlayers === option.value
                                                ? "border-primary bg-primary/5"
                                                : "border-muted hover:border-muted-foreground/50"
                                        )}
                                    >
                                        <RadioGroupItem
                                            value={String(option.value)}
                                            id={`players-${option.value}`}
                                            className="sr-only"
                                        />
                                        <span className="text-2xl font-bold">{option.value}</span>
                                        <span className="text-xs text-muted-foreground">players</span>
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-6">
                        <div>
                            <Label className="text-base font-medium">Match Points</Label>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">
                                Points needed to win each match
                            </p>
                            <RadioGroup
                                value={String(matchPoints)}
                                onValueChange={(v) => setMatchPoints(Number(v) as MatchPoints)}
                                className="grid grid-cols-4 gap-3"
                            >
                                {MATCH_POINTS_OPTIONS.map((option) => (
                                    <Label
                                        key={option.value}
                                        htmlFor={`points-${option.value}`}
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-colors",
                                            matchPoints === option.value
                                                ? "border-primary bg-primary/5"
                                                : "border-muted hover:border-muted-foreground/50"
                                        )}
                                    >
                                        <RadioGroupItem
                                            value={String(option.value)}
                                            id={`points-${option.value}`}
                                            className="sr-only"
                                        />
                                        <span className="text-lg font-bold">{option.value}</span>
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>

                        <div>
                            <Label className="text-base font-medium">Tournament Mode</Label>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">
                                How should partners be assigned?
                            </p>
                            <RadioGroup
                                value={mode}
                                onValueChange={(v) => setMode(v as Mode)}
                                className="space-y-3"
                            >
                                {MODE_OPTIONS.map((option) => (
                                    <Label
                                        key={option.value}
                                        htmlFor={`mode-${option.value}`}
                                        className={cn(
                                            "flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors",
                                            mode === option.value
                                                ? "border-primary bg-primary/5"
                                                : "border-muted hover:border-muted-foreground/50"
                                        )}
                                    >
                                        <RadioGroupItem
                                            value={option.value}
                                            id={`mode-${option.value}`}
                                            className="mt-1"
                                        />
                                        <div>
                                            <span className="font-medium">{option.label}</span>
                                            <p className="text-sm text-muted-foreground">
                                                {option.description}
                                            </p>
                                        </div>
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>

                        <div>
                            <Label className="text-base font-medium">Max Matches Per Player</Label>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">
                                Limit how many matches each player plays
                            </p>
                            <Input
                                type="number"
                                min={2}
                                max={10}
                                value={maxMatchesPerPlayer}
                                onChange={(e) => setMaxMatchesPerPlayer(Number(e.target.value))}
                                className="w-24"
                            />
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div>
                            <Label className="text-base font-medium">Courts</Label>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">
                                Add the courts available for this tournament (minimum 2)
                            </p>

                            <div className="space-y-2 mb-4">
                                {courts.map((court) => (
                                    <div
                                        key={court.id}
                                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                    >
                                        <span className="font-medium">{court.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveCourt(court.id)}
                                            disabled={courts.length <= 2}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    placeholder="Court name (e.g., Court C)"
                                    value={newCourtName}
                                    onChange={(e) => setNewCourtName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddCourt();
                                        }
                                    }}
                                />
                                <Button
                                    variant="outline"
                                    onClick={handleAddCourt}
                                    disabled={!newCourtName.trim()}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div>
                            <Label className="text-base font-medium">Review Configuration</Label>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">
                                Confirm your tournament settings
                            </p>

                            <div className="space-y-4 rounded-lg border p-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Players</span>
                                    <span className="font-medium">{numberOfPlayers}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Match Points</span>
                                    <span className="font-medium">{matchPoints}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Mode</span>
                                    <span className="font-medium">
                                        {mode === 'individual_rotation' ? 'Individual Rotation' : 'Fixed Teams'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Max Matches/Player</span>
                                    <span className="font-medium">{maxMatchesPerPlayer}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Courts</span>
                                    <span className="font-medium">{courts.map(c => c.name).join(', ')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Padel Americano Tournament</DialogTitle>
                    <DialogDescription>
                        Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
                    </DialogDescription>
                </DialogHeader>

                {/* Progress indicator */}
                <div className="flex gap-1 mb-4">
                    {STEPS.map((_, index) => (
                        <div
                            key={index}
                            className={cn(
                                "h-1 flex-1 rounded-full transition-colors",
                                index <= currentStep ? "bg-primary" : "bg-muted"
                            )}
                        />
                    ))}
                </div>

                <div className="py-4 min-h-[300px]">
                    {renderStep()}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 0 || isSubmitting}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>

                    {currentStep < STEPS.length - 1 ? (
                        <Button
                            onClick={handleNext}
                            disabled={!canProceed()}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Tournament'
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

