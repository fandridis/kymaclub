import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Trophy, Users, Target, LayoutGrid } from "lucide-react"
import { useTypedTranslation } from "@/lib/typed"
import type {
    WidgetConfig,
    TournamentAmericanoConfig,
    TournamentCourt,
    TournamentAmericanoPlayerCount,
    TournamentAmericanoMatchPoints,
    TournamentAmericanoMode,
} from "@repo/api/types/widget"

interface WidgetConfigFormProps {
    config?: WidgetConfig | null
    onChange: (config: WidgetConfig | null) => void
    disabled?: boolean
}

// Default courts
const DEFAULT_COURTS: TournamentCourt[] = [
    { id: "court_a", name: "Court A" },
    { id: "court_b", name: "Court B" },
];

// Default Americano config
const DEFAULT_AMERICANO_CONFIG: TournamentAmericanoConfig = {
    numberOfPlayers: 8,
    matchPoints: 21,
    courts: DEFAULT_COURTS,
    maxMatchesPerPlayer: 7,
    mode: "individual_rotation",
};

export function WidgetConfigForm({
    config = null,
    onChange,
    disabled = false,
}: WidgetConfigFormProps) {
    const { t } = useTypedTranslation();
    const [isEnabled, setIsEnabled] = useState(config !== null);
    const [widgetType, setWidgetType] = useState<WidgetConfig['type'] | null>(
        config?.type ?? null
    );
    const [americanoConfig, setAmericanoConfig] = useState<TournamentAmericanoConfig>(
        config?.type === 'tournament_americano'
            ? config.config
            : DEFAULT_AMERICANO_CONFIG
    );

    // Sync local state with props
    useEffect(() => {
        setIsEnabled(config !== null);
        setWidgetType(config?.type ?? null);
        if (config?.type === 'tournament_americano') {
            setAmericanoConfig(config.config);
        }
    }, [config]);

    const handleToggle = (enabled: boolean) => {
        setIsEnabled(enabled);
        if (enabled) {
            // Default to Americano when enabling
            setWidgetType('tournament_americano');
            onChange({
                type: 'tournament_americano',
                config: americanoConfig,
            });
        } else {
            setWidgetType(null);
            onChange(null);
        }
    };

    const handleTypeChange = (type: WidgetConfig['type']) => {
        setWidgetType(type);
        if (type === 'tournament_americano') {
            onChange({
                type: 'tournament_americano',
                config: americanoConfig,
            });
        }
        // Future: Handle round_robin and brackets types
    };

    const updateAmericanoConfig = (updates: Partial<TournamentAmericanoConfig>) => {
        const updated = { ...americanoConfig, ...updates };
        setAmericanoConfig(updated);
        if (widgetType === 'tournament_americano') {
            onChange({
                type: 'tournament_americano',
                config: updated,
            });
        }
    };

    const addCourt = () => {
        const courtLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const nextIndex = americanoConfig.courts.length;
        const nextLetter = courtLetters[nextIndex];
        if (!nextLetter) return;

        const newCourt: TournamentCourt = {
            id: `court_${nextLetter.toLowerCase()}`,
            name: `Court ${nextLetter}`,
        };
        updateAmericanoConfig({
            courts: [...americanoConfig.courts, newCourt],
        });
    };

    const removeCourt = (courtId: string) => {
        if (americanoConfig.courts.length <= 1) return;
        updateAmericanoConfig({
            courts: americanoConfig.courts.filter(c => c.id !== courtId),
        });
    };

    const updateCourtName = (courtId: string, name: string) => {
        updateAmericanoConfig({
            courts: americanoConfig.courts.map(c =>
                c.id === courtId ? { ...c, name } : c
            ),
        });
    };

    return (
        <Card className={disabled ? "opacity-60" : ""}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        <CardTitle className="text-base">Tournament Widget</CardTitle>
                    </div>
                    <Switch
                        checked={isEnabled}
                        onCheckedChange={handleToggle}
                        disabled={disabled}
                    />
                </div>
                <CardDescription>
                    Add a tournament format to this class for organized competitions
                </CardDescription>
            </CardHeader>

            {isEnabled && (
                <CardContent className="space-y-6">
                    {/* Widget Type Selection */}
                    <div className="space-y-2">
                        <Label>Tournament Format</Label>
                        <Select
                            value={widgetType ?? undefined}
                            onValueChange={(value) => handleTypeChange(value as WidgetConfig['type'])}
                            disabled={disabled}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tournament_americano">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        <span>Americano</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="tournament_round_robin" disabled>
                                    <div className="flex items-center gap-2">
                                        <LayoutGrid className="h-4 w-4" />
                                        <span>Round Robin</span>
                                        <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                                    </div>
                                </SelectItem>
                                <SelectItem value="tournament_brackets" disabled>
                                    <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4" />
                                        <span>Brackets</span>
                                        <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Americano Configuration */}
                    {widgetType === 'tournament_americano' && (
                        <div className="space-y-4 border-t pt-4">
                            {/* Number of Players */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Number of Players</Label>
                                    <Select
                                        value={americanoConfig.numberOfPlayers.toString()}
                                        onValueChange={(value) =>
                                            updateAmericanoConfig({
                                                numberOfPlayers: parseInt(value) as TournamentAmericanoPlayerCount
                                            })
                                        }
                                        disabled={disabled}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="8">8 Players</SelectItem>
                                            <SelectItem value="12">12 Players</SelectItem>
                                            <SelectItem value="16">16 Players</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Match Points */}
                                <div className="space-y-2">
                                    <Label>Points per Match</Label>
                                    <Select
                                        value={americanoConfig.matchPoints.toString()}
                                        onValueChange={(value) =>
                                            updateAmericanoConfig({
                                                matchPoints: parseInt(value) as TournamentAmericanoMatchPoints
                                            })
                                        }
                                        disabled={disabled}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="20">20 Points</SelectItem>
                                            <SelectItem value="21">21 Points</SelectItem>
                                            <SelectItem value="24">24 Points</SelectItem>
                                            <SelectItem value="25">25 Points</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Mode */}
                            <div className="space-y-2">
                                <Label>Tournament Mode</Label>
                                <Select
                                    value={americanoConfig.mode}
                                    onValueChange={(value) =>
                                        updateAmericanoConfig({
                                            mode: value as TournamentAmericanoMode
                                        })
                                    }
                                    disabled={disabled}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual_rotation">
                                            Individual Rotation (players rotate partners)
                                        </SelectItem>
                                        <SelectItem value="fixed_teams">
                                            Fixed Teams (play with same partner)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Max Matches per Player */}
                            <div className="space-y-2">
                                <Label>Max Matches per Player</Label>
                                <Input
                                    type="number"
                                    min={3}
                                    max={20}
                                    value={americanoConfig.maxMatchesPerPlayer}
                                    onChange={(e) =>
                                        updateAmericanoConfig({
                                            maxMatchesPerPlayer: parseInt(e.target.value) || 7
                                        })
                                    }
                                    disabled={disabled}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Limits how many matches each player plays (for scheduling optimization)
                                </p>
                            </div>

                            {/* Courts */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Courts</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addCourt}
                                        disabled={disabled || americanoConfig.courts.length >= 8}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Court
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {americanoConfig.courts.map((court, index) => (
                                        <div key={court.id} className="flex items-center gap-2">
                                            <Input
                                                value={court.name}
                                                onChange={(e) => updateCourtName(court.id, e.target.value)}
                                                placeholder={`Court ${index + 1}`}
                                                disabled={disabled}
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeCourt(court.id)}
                                                disabled={disabled || americanoConfig.courts.length <= 1}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {americanoConfig.courts.length} court{americanoConfig.courts.length !== 1 ? 's' : ''} configured.
                                    {' '}Minimum courts needed: {Math.floor(americanoConfig.numberOfPlayers / 4)}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

