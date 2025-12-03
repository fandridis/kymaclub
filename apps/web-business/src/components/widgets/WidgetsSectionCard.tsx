"use client"

import React, { useState } from 'react';
import { Plus, Trophy, Eye, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import { api } from '@repo/api/convex/_generated/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from '@tanstack/react-router';
import type { Id } from '@repo/api/convex/_generated/dataModel';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Widget type display names
const WIDGET_TYPE_NAMES: Record<string, string> = {
    tournament_americano: 'Padel Americano',
    tournament_round_robin: 'Round Robin',
    tournament_brackets: 'Brackets',
};

// Status badge variants with colors
const STATUS_BADGE_VARIANTS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
    setup: { label: 'Setting Up', variant: 'outline', className: 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
    ready: { label: 'Ready to Start', variant: 'secondary', className: 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
    active: { label: 'In Progress', variant: 'default', className: 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30' },
    completed: { label: 'Completed', variant: 'secondary', className: 'text-muted-foreground' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
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
    onEditWidget?: (widgetId: Id<"classInstanceWidgets">, type: string) => void;
    isLoading?: boolean;
}

export function WidgetsSectionCard({
    widgetSnapshots,
    classInstanceId,
    onAddWidget,
    onEditWidget,
    isLoading = false,
}: WidgetsSectionCardProps) {
    const navigate = useNavigate();
    const widgets = widgetSnapshots ?? [];
    const [widgetToDelete, setWidgetToDelete] = useState<Id<"classInstanceWidgets"> | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Query widget data to get status
    const widgetData = useQuery(
        api.queries.widgets.getByInstance,
        { classInstanceId }
    );

    const detachWidget = useMutation(api.mutations.widgets.detachWidget);

    const handleViewWidget = (widgetId: Id<"classInstanceWidgets">) => {
        navigate({ to: '/tournaments/$widgetId', params: { widgetId } });
    };

    const handleDeleteWidget = async () => {
        if (!widgetToDelete) return;

        setIsDeleting(true);
        try {
            await detachWidget({ widgetId: widgetToDelete });
            toast.success('Widget deleted successfully');
            setWidgetToDelete(null);
        } catch (error) {
            if (error instanceof ConvexError) {
                toast.error(error.data.message);
            } else {
                console.error('Failed to delete widget:', error);
                toast.error('Failed to delete widget. Please try again.');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    // Check if widget can be edited/deleted (only in setup status)
    const canModifyWidget = widgetData?.status === 'setup';

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
                <div className="space-y-3">
                    {widgets.map((widget) => {
                        const status = widgetData?.status ?? 'setup';
                        const statusInfo = STATUS_BADGE_VARIANTS[status] ?? STATUS_BADGE_VARIANTS.setup;
                        const config = widgetData?.widgetConfig;

                        // Extract config details for display
                        const configDetails = config?.type === 'tournament_americano' && config?.config ? {
                            players: config.config.numberOfPlayers,
                            points: config.config.matchPoints,
                            courts: config.config.courts?.length ?? 0,
                        } : null;

                        return (
                            <Card key={widget.widgetId} className="overflow-hidden">
                                <CardContent className="p-3">
                                    {/* Header row */}
                                    <div className="flex items-center justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="rounded-md bg-muted p-1.5 shrink-0">
                                                <Trophy className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-medium text-sm truncate">
                                                    {WIDGET_TYPE_NAMES[widget.type] || widget.type}
                                                </h4>
                                            </div>
                                        </div>
                                        <Badge
                                            variant={statusInfo?.variant ?? 'outline'}
                                            className={`text-xs ${statusInfo?.className ?? ''}`}
                                        >
                                            {statusInfo?.label ?? 'Unknown'}
                                        </Badge>
                                    </div>

                                    {/* Config details row */}
                                    {configDetails && (
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 pl-8">
                                            <span><strong>{configDetails.players}</strong> players</span>
                                            <span><strong>{configDetails.points}</strong> pts</span>
                                            <span><strong>{configDetails.courts}</strong> courts</span>
                                        </div>
                                    )}

                                    {/* Actions row */}
                                    <div className="flex items-center justify-between gap-2 pt-2 border-t">
                                        {canModifyWidget ? (
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs"
                                                    onClick={() => onEditWidget?.(widget.widgetId, widget.type)}
                                                >
                                                    <Pencil className="h-3 w-3 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => setWidgetToDelete(widget.widgetId)}
                                                >
                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                {status === 'active' && 'In progress'}
                                                {status === 'completed' && 'Finished'}
                                                {status === 'cancelled' && 'Cancelled'}
                                                {status === 'ready' && 'Ready'}
                                            </span>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-xs"
                                            onClick={() => handleViewWidget(widget.widgetId)}
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            {canModifyWidget ? 'Manage' : 'View'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {/* Add more button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed"
                        onClick={onAddWidget}
                    >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add Widget
                    </Button>
                </div>
            )}

            {/* Delete confirmation dialog */}
            <AlertDialog open={!!widgetToDelete} onOpenChange={(open) => !open && setWidgetToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Widget?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The widget and all its configuration will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteWidget}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

