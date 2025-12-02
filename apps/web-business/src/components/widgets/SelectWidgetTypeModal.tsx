"use client"

import React from 'react';
import { Trophy, Users, GitBranch } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type WidgetType = 'tournament_americano' | 'tournament_round_robin' | 'tournament_brackets';

interface WidgetTypeOption {
    type: WidgetType;
    name: string;
    description: string;
    icon: React.ReactNode;
    available: boolean;
}

const WIDGET_OPTIONS: WidgetTypeOption[] = [
    {
        type: 'tournament_americano',
        name: 'Padel Americano',
        description: 'High-rotation format where players change partners each round. Great for social play!',
        icon: <Trophy className="h-6 w-6" />,
        available: true,
    },
    {
        type: 'tournament_round_robin',
        name: 'Round Robin',
        description: 'Classic format where every team plays against every other team.',
        icon: <Users className="h-6 w-6" />,
        available: false,
    },
    {
        type: 'tournament_brackets',
        name: 'Brackets',
        description: 'Single or double elimination tournament with visual bracket progression.',
        icon: <GitBranch className="h-6 w-6" />,
        available: false,
    },
];

interface SelectWidgetTypeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectType: (type: WidgetType) => void;
}

export function SelectWidgetTypeModal({
    open,
    onOpenChange,
    onSelectType,
}: SelectWidgetTypeModalProps) {
    const handleSelect = (option: WidgetTypeOption) => {
        if (!option.available) return;
        onSelectType(option.type);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Widget</DialogTitle>
                    <DialogDescription>
                        Choose a widget to attach to this class. Widgets add special features like tournaments.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 py-4">
                    {WIDGET_OPTIONS.map((option) => (
                        <Card
                            key={option.type}
                            className={cn(
                                "cursor-pointer transition-all",
                                option.available
                                    ? "hover:border-primary hover:shadow-sm"
                                    : "opacity-60 cursor-not-allowed"
                            )}
                            onClick={() => handleSelect(option)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "rounded-lg p-3",
                                        option.available
                                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                            : "bg-muted text-muted-foreground"
                                    )}>
                                        {option.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-sm">{option.name}</h4>
                                            {!option.available && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Coming Soon
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {option.description}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

