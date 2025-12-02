"use client"

import { useMutation } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import type { Id } from "@repo/api/convex/_generated/dataModel";
import type { WidgetParticipant } from "@repo/api/types/widget";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, UserPlus, User, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface ParticipantsListProps {
    participants: WidgetParticipant[];
    widgetId: string;
    canRemove: boolean;
}

function ParticipantCard({
    participant,
    index,
    canRemove,
    onRemove
}: {
    participant: WidgetParticipant;
    index: number;
    canRemove: boolean;
    onRemove: () => void;
}) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border">
            {/* Number badge */}
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{index + 1}</span>
            </div>

            {/* Player info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{participant.displayName}</p>
                    <Badge
                        variant={participant.walkIn ? "secondary" : "outline"}
                        className="flex-shrink-0 text-[10px] px-1.5"
                    >
                        {participant.walkIn ? "Walk-in" : "Booking"}
                    </Badge>
                </div>

                {/* Contact info if available */}
                {(participant.walkIn?.phone || participant.walkIn?.email) && (
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {participant.walkIn?.phone && (
                            <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {participant.walkIn.phone}
                            </span>
                        )}
                        {participant.walkIn?.email && (
                            <span className="flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{participant.walkIn.email}</span>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Remove button */}
            {canRemove && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRemove}
                    className="flex-shrink-0 h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}

export function ParticipantsList({ participants, widgetId, canRemove }: ParticipantsListProps) {
    const removeParticipant = useMutation(api.mutations.widgets.removeParticipant);

    const handleRemove = async (participantId: Id<"widgetParticipants">) => {
        try {
            await removeParticipant({ participantId });
            toast.success("Participant removed");
        } catch (error: any) {
            toast.error(error.message || "Failed to remove participant");
        }
    };

    if (participants.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                    <UserPlus className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-muted-foreground">No players yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                    Add walk-ins or sync from bookings
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {participants.map((participant, index) => (
                <ParticipantCard
                    key={participant._id}
                    participant={participant}
                    index={index}
                    canRemove={canRemove}
                    onRemove={() => handleRemove(participant._id)}
                />
            ))}

            <p className="text-xs text-muted-foreground text-center pt-2">
                {participants.length} player{participants.length !== 1 ? "s" : ""} registered
            </p>
        </div>
    );
}
