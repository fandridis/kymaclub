"use client"

import { useState, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@repo/api/convex/_generated/api";
import type { Id } from "@repo/api/convex/_generated/dataModel";
import type { SetupParticipant, FixedTeam } from "@repo/api/types/widget";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, GripVertical, Save, Shuffle, X, Check, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamAssignmentProps {
    participants: SetupParticipant[];
    widgetId: string;
    existingTeams?: FixedTeam[];
    targetTeamCount: number; // numberOfPlayers / 2
    onTeamsSaved?: () => void;
}

// Team with display info
interface TeamWithInfo {
    teamId: string;
    players: SetupParticipant[];
}

export function TeamAssignment({
    participants,
    widgetId,
    existingTeams,
    targetTeamCount,
    onTeamsSaved,
}: TeamAssignmentProps) {
    const setTeams = useMutation(api.mutations.widgets.setAmericanoFixedTeams);
    const removeWalkIn = useMutation(api.mutations.widgets.removeWalkIn);
    const [isSaving, setIsSaving] = useState(false);
    const [teams, setTeamsState] = useState<TeamWithInfo[]>([]);
    const [unassignedPlayers, setUnassignedPlayers] = useState<SetupParticipant[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<SetupParticipant | null>(null);

    // Initialize teams from existing config or empty state
    useEffect(() => {
        const participantsMap = new Map(participants.map(p => [p.id, p]));

        if (existingTeams && existingTeams.length > 0) {
            // Load existing teams
            const loadedTeams: TeamWithInfo[] = existingTeams.map(team => ({
                teamId: team.teamId,
                players: team.playerIds
                    .map(id => participantsMap.get(id))
                    .filter((p): p is SetupParticipant => p !== undefined),
            }));

            // Find unassigned players
            const assignedIds = new Set(existingTeams.flatMap(t => t.playerIds));
            const unassigned = participants.filter(p => !assignedIds.has(p.id));

            // Add empty teams if needed
            const currentTeamCount = loadedTeams.length;
            for (let i = currentTeamCount; i < targetTeamCount; i++) {
                loadedTeams.push({
                    teamId: `team_${i + 1}`,
                    players: [],
                });
            }

            setTeamsState(loadedTeams);
            setUnassignedPlayers(unassigned);
        } else {
            // Initialize with empty teams
            const emptyTeams: TeamWithInfo[] = [];
            for (let i = 0; i < targetTeamCount; i++) {
                emptyTeams.push({
                    teamId: `team_${i + 1}`,
                    players: [],
                });
            }
            setTeamsState(emptyTeams);
            setUnassignedPlayers([...participants]);
        }
    }, [participants, existingTeams, targetTeamCount]);

    // Check if all teams have exactly 2 players
    const allTeamsComplete = teams.every(t => t.players.length === 2);
    const canSave = allTeamsComplete && unassignedPlayers.length === 0;

    // Handle clicking on a player
    const handlePlayerClick = useCallback((player: SetupParticipant, fromTeamId?: string) => {
        if (selectedPlayer) {
            if (selectedPlayer.id === player.id) {
                // Deselect
                setSelectedPlayer(null);
                return;
            }

            // Swap players if both are selected
            if (fromTeamId) {
                // If clicking another player in a team, swap them
                const selectedTeamIndex = teams.findIndex(t =>
                    t.players.some(p => p.id === selectedPlayer.id)
                );
                const targetTeamIndex = teams.findIndex(t => t.teamId === fromTeamId);

                if (selectedTeamIndex !== -1 && targetTeamIndex !== -1) {
                    // Both in teams - swap
                    const newTeams = [...teams];
                    const selectedTeam = newTeams[selectedTeamIndex];
                    const targetTeam = newTeams[targetTeamIndex];
                    if (!selectedTeam || !targetTeam) return;

                    const selectedPlayerIndex = selectedTeam.players.findIndex(
                        p => p.id === selectedPlayer.id
                    );
                    const targetPlayerIndex = targetTeam.players.findIndex(
                        p => p.id === player.id
                    );

                    const temp = selectedTeam.players[selectedPlayerIndex];
                    const targetPlayer = targetTeam.players[targetPlayerIndex];
                    if (!temp || !targetPlayer) return;

                    selectedTeam.players[selectedPlayerIndex] = targetPlayer;
                    targetTeam.players[targetPlayerIndex] = temp;

                    setTeamsState(newTeams);
                    setSelectedPlayer(null);
                } else if (selectedTeamIndex === -1 && targetTeamIndex !== -1) {
                    // Selected is unassigned, target is in team - swap
                    const newTeams = [...teams];
                    const targetTeam = newTeams[targetTeamIndex];
                    if (!targetTeam) return;

                    const targetPlayerIndex = targetTeam.players.findIndex(
                        p => p.id === player.id
                    );

                    const removedPlayer = targetTeam.players[targetPlayerIndex];
                    if (!removedPlayer) return;

                    targetTeam.players[targetPlayerIndex] = selectedPlayer;

                    setTeamsState(newTeams);
                    setUnassignedPlayers(prev =>
                        prev.filter(p => p.id !== selectedPlayer.id).concat(removedPlayer)
                    );
                    setSelectedPlayer(null);
                }
            } else {
                // Target is unassigned - swap with selected if selected is in a team
                const selectedTeamIndex = teams.findIndex(t =>
                    t.players.some(p => p.id === selectedPlayer.id)
                );

                if (selectedTeamIndex !== -1) {
                    // Selected is in team, target is unassigned - swap
                    const newTeams = [...teams];
                    const selectedTeam = newTeams[selectedTeamIndex];
                    if (!selectedTeam) return;

                    const selectedPlayerIndex = selectedTeam.players.findIndex(
                        p => p.id === selectedPlayer.id
                    );

                    const removedPlayer = selectedTeam.players[selectedPlayerIndex];
                    if (!removedPlayer) return;

                    selectedTeam.players[selectedPlayerIndex] = player;

                    setTeamsState(newTeams);
                    setUnassignedPlayers(prev =>
                        prev.filter(p => p.id !== player.id).concat(removedPlayer)
                    );
                    setSelectedPlayer(null);
                } else {
                    // Both unassigned - just select the new one
                    setSelectedPlayer(player);
                }
            }
        } else {
            setSelectedPlayer(player);
        }
    }, [selectedPlayer, teams]);

    // Add selected player to a team
    const handleAddToTeam = useCallback((teamIndex: number) => {
        if (!selectedPlayer) return;

        const team = teams[teamIndex];
        if (!team) return;
        if (team.players.length >= 2) {
            toast.error("Team already has 2 players");
            return;
        }

        // Remove from unassigned
        setUnassignedPlayers(prev => prev.filter(p => p.id !== selectedPlayer.id));

        // Add to team
        const newTeams = [...teams];
        newTeams[teamIndex] = {
            ...team,
            players: [...team.players, selectedPlayer],
        };
        setTeamsState(newTeams);
        setSelectedPlayer(null);
    }, [selectedPlayer, teams]);

    // Remove player from team
    const handleRemoveFromTeam = useCallback((teamIndex: number, playerId: string) => {
        const team = teams[teamIndex];
        if (!team) return;
        const player = team.players.find(p => p.id === playerId);
        if (!player) return;

        // Remove from team
        const newTeams = [...teams];
        newTeams[teamIndex] = {
            ...team,
            players: team.players.filter(p => p.id !== playerId),
        };
        setTeamsState(newTeams);

        // Add back to unassigned
        setUnassignedPlayers(prev => [...prev, player]);
        setSelectedPlayer(null);
    }, [teams]);

    // Auto-assign randomly
    const handleAutoAssign = useCallback(() => {
        const allPlayers = [...unassignedPlayers, ...teams.flatMap(t => t.players)];

        // Shuffle players
        const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);

        // Create new teams
        const newTeams: TeamWithInfo[] = [];
        for (let i = 0; i < targetTeamCount; i++) {
            newTeams.push({
                teamId: `team_${i + 1}`,
                players: [shuffled[i * 2], shuffled[i * 2 + 1]].filter(Boolean) as SetupParticipant[],
            });
        }

        setTeamsState(newTeams);
        setUnassignedPlayers([]);
        setSelectedPlayer(null);
    }, [unassignedPlayers, teams, targetTeamCount]);

    // Clear all assignments
    const handleClearAll = useCallback(() => {
        const allPlayers = [...unassignedPlayers, ...teams.flatMap(t => t.players)];

        const emptyTeams: TeamWithInfo[] = [];
        for (let i = 0; i < targetTeamCount; i++) {
            emptyTeams.push({
                teamId: `team_${i + 1}`,
                players: [],
            });
        }

        setTeamsState(emptyTeams);
        setUnassignedPlayers(allPlayers);
        setSelectedPlayer(null);
    }, [unassignedPlayers, teams, targetTeamCount]);

    // Remove walk-in from widget entirely
    const handleRemoveWalkIn = async (player: SetupParticipant) => {
        if (!player.isWalkIn || !player.walkInId) return;

        try {
            await removeWalkIn({
                widgetId: widgetId as Id<"classInstanceWidgets">,
                walkInId: player.walkInId,
            });
            toast.success("Walk-in removed");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to remove";
            toast.error(message);
        }
    };

    // Save teams
    const handleSave = async () => {
        if (!canSave) return;

        setIsSaving(true);
        try {
            const teamsToSave: FixedTeam[] = teams.map(t => ({
                teamId: t.teamId,
                playerIds: t.players.map(p => p.id),
            }));

            await setTeams({
                widgetId: widgetId as Id<"classInstanceWidgets">,
                teams: teamsToSave,
            });

            toast.success("Teams saved successfully!");
            onTeamsSaved?.();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to save teams";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with actions */}
            <div className="space-y-3">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Team Assignment</h3>
                    <p className="text-sm text-slate-500">
                        {canSave
                            ? "All teams assigned. Ready to save!"
                            : `Assign players to ${targetTeamCount} teams of 2`
                        }
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAll}
                        disabled={unassignedPlayers.length === participants.length}
                    >
                        <X className="h-4 w-4 mr-1" />
                        Clear
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAutoAssign}
                        disabled={participants.length !== targetTeamCount * 2}
                    >
                        <Shuffle className="h-4 w-4 mr-1" />
                        Auto-assign
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!canSave || isSaving}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                        {isSaving ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-1" />
                                Save Teams
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Unassigned players */}
            {unassignedPlayers.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Unassigned Players ({unassignedPlayers.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {unassignedPlayers.map(player => (
                            <PlayerChip
                                key={player.id}
                                player={player}
                                isSelected={selectedPlayer?.id === player.id}
                                isSwappable={selectedPlayer !== null && selectedPlayer.id !== player.id}
                                onClick={() => handlePlayerClick(player)}
                                onRemove={player.isWalkIn ? () => handleRemoveWalkIn(player) : undefined}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Teams grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teams.map((team, teamIndex) => (
                    <TeamCard
                        key={team.teamId}
                        team={team}
                        teamIndex={teamIndex}
                        selectedPlayer={selectedPlayer}
                        onPlayerClick={(player) => handlePlayerClick(player, team.teamId)}
                        onRemovePlayer={(playerId) => handleRemoveFromTeam(teamIndex, playerId)}
                        onAddSelectedPlayer={() => handleAddToTeam(teamIndex)}
                        canAddPlayer={selectedPlayer !== null && team.players.length < 2 && !team.players.some(p => p.id === selectedPlayer?.id)}
                    />
                ))}
            </div>

            {/* Hint */}
            {selectedPlayer && (
                <p className="text-sm text-orange-600 text-center">
                    Click on a team slot or another player to swap positions
                </p>
            )}
        </div>
    );
}

// Player chip component
function PlayerChip({
    player,
    isSelected,
    isSwappable,
    onClick,
    onRemove,
}: {
    player: SetupParticipant;
    isSelected: boolean;
    isSwappable?: boolean;
    onClick: () => void;
    onRemove?: () => void;
}) {
    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                "border-2",
                isSelected
                    ? "bg-orange-100 border-orange-500 text-orange-700 ring-2 ring-orange-500/30"
                    : isSwappable
                        ? "bg-white border-dashed border-orange-300 text-slate-700 hover:border-orange-400 hover:bg-orange-50/50"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            )}
        >
            <button
                type="button"
                onClick={onClick}
                className="inline-flex items-center gap-2"
            >
                <GripVertical className="h-3 w-3 text-slate-400" />
                <span className="truncate max-w-[120px]">{player.displayName}</span>
                {player.isWalkIn && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Walk-in
                    </Badge>
                )}
            </button>
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="p-0.5 hover:bg-slate-200 rounded"
                >
                    <X className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                </button>
            )}
        </div>
    );
}

// Team card component
function TeamCard({
    team,
    teamIndex,
    selectedPlayer,
    onPlayerClick,
    onRemovePlayer,
    onAddSelectedPlayer,
    canAddPlayer,
}: {
    team: TeamWithInfo;
    teamIndex: number;
    selectedPlayer: SetupParticipant | null;
    onPlayerClick: (player: SetupParticipant) => void;
    onRemovePlayer: (playerId: string) => void;
    onAddSelectedPlayer: () => void;
    canAddPlayer: boolean;
}) {
    const isComplete = team.players.length === 2;

    // Check if a player slot is swappable (has a player that can be swapped with selected)
    const isSlotSwappable = (player: SetupParticipant | undefined): boolean => {
        if (!selectedPlayer || !player) return false;
        // Can swap if selected player is different from this player
        return selectedPlayer.id !== player.id;
    };

    return (
        <div
            className={cn(
                "p-4 rounded-xl border-2 transition-all",
                isComplete
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white border-slate-200",
                canAddPlayer && "border-orange-400 ring-2 ring-orange-400/20"
            )}
        >
            {/* Team header */}
            <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    isComplete ? "bg-emerald-500" : "bg-slate-200"
                )}>
                    <Users className={cn("h-4 w-4", isComplete ? "text-white" : "text-slate-500")} />
                </div>
                <div className="flex-1">
                    <p className="font-bold text-slate-900">Team {teamIndex + 1}</p>
                    <p className="text-xs text-slate-500">
                        {team.players.length}/2 players
                    </p>
                </div>
                {isComplete && (
                    <Check className="h-5 w-5 text-emerald-500" />
                )}
            </div>

            {/* Player slots */}
            <div className="space-y-2">
                {[0, 1].map((slotIndex) => {
                    const player = team.players[slotIndex];
                    const swappable = isSlotSwappable(player);

                    if (player) {
                        return (
                            <div
                                key={player.id}
                                className={cn(
                                    "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
                                    "border-2",
                                    selectedPlayer?.id === player.id
                                        ? "bg-orange-100 border-orange-500"
                                        : swappable
                                            ? "bg-white border-dashed border-orange-300 hover:border-orange-400 hover:bg-orange-50/50"
                                            : "bg-white border-slate-200 hover:border-slate-300"
                                )}
                                onClick={() => onPlayerClick(player)}
                            >
                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                    <span className="text-xs font-bold text-slate-600">
                                        {player.displayName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{player.displayName}</p>
                                    {player.isWalkIn && (
                                        <p className="text-[10px] text-slate-500">Walk-in</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemovePlayer(player.id);
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded"
                                >
                                    <X className="h-4 w-4 text-slate-400" />
                                </button>
                            </div>
                        );
                    }

                    // Empty slot
                    return (
                        <button
                            key={`slot-${slotIndex}`}
                            type="button"
                            onClick={canAddPlayer ? onAddSelectedPlayer : undefined}
                            disabled={!canAddPlayer}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 p-3 rounded-lg transition-all",
                                "border-2 border-dashed",
                                canAddPlayer
                                    ? "border-orange-400 bg-orange-50 text-orange-600 hover:bg-orange-100 cursor-pointer"
                                    : "border-slate-200 text-slate-400 cursor-default"
                            )}
                        >
                            <UserPlus className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                {canAddPlayer ? "Click to add" : "Empty slot"}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

