"use client"

import React from 'react';
import { Plus, Trophy, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from '@tanstack/react-router';
import type { Id } from '@repo/api/convex/_generated/dataModel';

// Widget type display names
const WIDGET_TYPE_NAMES: Record<string, string> = {
    tournament_americano: 'Padel Americano',
    tournament_round_robin: 'Round Robin',
    tournament_brackets: 'Brackets',
};

// Widget type icons
const WIDGET_TYPE_ICONS: Record<string, React.ReactNode> = {
    tournament_americano: <Trophy className="h-4 w-4" />,
    tournament_round_robin: <Trophy className="h-4 w-4" />,
    tournament_brackets: <Trophy className="h-4 w-4" />,
};

export interface WidgetSnapshot {
    widgetId: Id<"classInstanceWidgets">;
    type: string;
    name: string;
}

interface WidgetsSectionCardProps {
    widgetSnapshots: WidgetSnapshot[] | undefined;
    classInstanceId: Id<"classInstances">;
    onAddWidget: () => void;
    isLoading?: boolean;
}

export function WidgetsSectionCard({
    widgetSnapshots,
    classInstanceId,
    onAddWidget,
    isLoading = false,
}: WidgetsSectionCardProps) {
    const navigate = useNavigate();
    const widgets = widgetSnapshots ?? [];

    const handleViewWidget = (widgetId: Id<"classInstanceWidgets">) => {
        navigate({ to: '/tournaments/$widgetId', params: { widgetId } });
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Widgets</h3>
                <Card className="border-dashed">
                    <CardContent className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Widgets</h3>

            {widgets.length === 0 ? (
                <Card
                    className="border-dashed hover:border-primary/50 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={onAddWidget}
                >
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="rounded-full bg-muted p-3 mb-3">
                            <Plus className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            No widgets attached
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Click to add a tournament or other widget
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {widgets.map((widget) => (
                        <Card key={widget.widgetId} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
                                            {WIDGET_TYPE_ICONS[widget.type] || <Trophy className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{widget.name}</p>
                                            <Badge variant="secondary" className="mt-1">
                                                {WIDGET_TYPE_NAMES[widget.type] || widget.type}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewWidget(widget.widgetId)}
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Add more button */}
                    <Button
                        variant="outline"
                        className="w-full border-dashed"
                        onClick={onAddWidget}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Widget
                    </Button>
                </div>
            )}
        </div>
    );
}

