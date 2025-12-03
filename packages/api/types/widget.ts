import { Infer, v } from "convex/values";
import { Doc, Id } from "../convex/_generated/dataModel";
import {
    widgetTypeValidator,
    widgetStatusValidator,
    widgetSnapshotFields,
    tournamentCourtFields,
    tournamentAmericanoConfigFields,
    tournamentAmericanoMatchFields,
    tournamentAmericanoStandingFields,
    tournamentAmericanoStateFields,
    tournamentRoundRobinConfigFields,
    tournamentRoundRobinMatchFields,
    tournamentRoundRobinStandingFields,
    tournamentRoundRobinStateFields,
    tournamentBracketsConfigFields,
    tournamentBracketsMatchFields,
    tournamentBracketsStateFields,
    widgetConfigValidator,
    widgetStateValidator,
    walkInFields,
    walkInEntryFields,
    participantSnapshotFields,
} from "../convex/schema";

/***************************************************************
 * Widget Core Types - Derived from schema validators
 ***************************************************************/

// Widget type union (tournament_americano, tournament_round_robin, tournament_brackets)
export type WidgetType = Infer<typeof widgetTypeValidator>;

// Widget status lifecycle
export type WidgetStatus = Infer<typeof widgetStatusValidator>;

// Walk-in participant info (basic, without ID)
const walkInFieldObject = v.object(walkInFields);
export type WalkIn = Infer<typeof walkInFieldObject>;

// Walk-in entry stored in widget.walkIns array (with stable ID)
const walkInEntryFieldObject = v.object(walkInEntryFields);
export type WalkInEntry = Infer<typeof walkInEntryFieldObject>;

// Participant snapshot - frozen participant when tournament starts
const participantSnapshotFieldObject = v.object(participantSnapshotFields);
export type ParticipantSnapshot = Infer<typeof participantSnapshotFieldObject>;

// Widget snapshot (lightweight reference stored on class instances)
const widgetSnapshotFieldObject = v.object(widgetSnapshotFields);
export type WidgetSnapshot = Infer<typeof widgetSnapshotFieldObject>;

/***************************************************************
 * Widget Config - Discriminated Union (Type-Safe)
 ***************************************************************/

// Full widget config (discriminated union)
export type WidgetConfig = Infer<typeof widgetConfigValidator>;

// Extract config type for a specific widget type
export type AmericanoWidgetConfig = Extract<WidgetConfig, { type: 'tournament_americano' }>;
export type RoundRobinWidgetConfig = Extract<WidgetConfig, { type: 'tournament_round_robin' }>;
export type BracketsWidgetConfig = Extract<WidgetConfig, { type: 'tournament_brackets' }>;

/***************************************************************
 * Widget State - Discriminated Union (Type-Safe)
 ***************************************************************/

// Full widget state (discriminated union)
export type WidgetState = Infer<typeof widgetStateValidator>;

// Extract state type for a specific widget type
export type AmericanoWidgetState = Extract<WidgetState, { type: 'tournament_americano' }>;
export type RoundRobinWidgetState = Extract<WidgetState, { type: 'tournament_round_robin' }>;
export type BracketsWidgetState = Extract<WidgetState, { type: 'tournament_brackets' }>;

/***************************************************************
 * Tournament Court Types
 ***************************************************************/

const tournamentCourtFieldObject = v.object(tournamentCourtFields);
export type TournamentCourt = Infer<typeof tournamentCourtFieldObject>;

/***************************************************************
 * Americano Tournament Types
 ***************************************************************/

// Americano configuration (inner config object)
const tournamentAmericanoConfigFieldObject = v.object(tournamentAmericanoConfigFields);
export type TournamentAmericanoConfig = Infer<typeof tournamentAmericanoConfigFieldObject>;

// Americano mode type
export type TournamentAmericanoMode = TournamentAmericanoConfig['mode'];

// Americano number of players type
export type TournamentAmericanoPlayerCount = TournamentAmericanoConfig['numberOfPlayers'];

// Americano match points type
export type TournamentAmericanoMatchPoints = TournamentAmericanoConfig['matchPoints'];

// Americano match
const tournamentAmericanoMatchFieldObject = v.object(tournamentAmericanoMatchFields);
export type TournamentAmericanoMatch = Infer<typeof tournamentAmericanoMatchFieldObject>;

// Americano match status
export type TournamentAmericanoMatchStatus = TournamentAmericanoMatch['status'];

// Americano standing (leaderboard entry)
const tournamentAmericanoStandingFieldObject = v.object(tournamentAmericanoStandingFields);
export type TournamentAmericanoStanding = Infer<typeof tournamentAmericanoStandingFieldObject>;

// Americano tournament state (inner state object)
const tournamentAmericanoStateFieldObject = v.object(tournamentAmericanoStateFields);
export type TournamentAmericanoState = Infer<typeof tournamentAmericanoStateFieldObject>;

/***************************************************************
 * Round Robin Tournament Types
 ***************************************************************/

// Round Robin configuration
const tournamentRoundRobinConfigFieldObject = v.object(tournamentRoundRobinConfigFields);
export type TournamentRoundRobinConfig = Infer<typeof tournamentRoundRobinConfigFieldObject>;

// Round Robin match
const tournamentRoundRobinMatchFieldObject = v.object(tournamentRoundRobinMatchFields);
export type TournamentRoundRobinMatch = Infer<typeof tournamentRoundRobinMatchFieldObject>;

// Round Robin standing
const tournamentRoundRobinStandingFieldObject = v.object(tournamentRoundRobinStandingFields);
export type TournamentRoundRobinStanding = Infer<typeof tournamentRoundRobinStandingFieldObject>;

// Round Robin state
const tournamentRoundRobinStateFieldObject = v.object(tournamentRoundRobinStateFields);
export type TournamentRoundRobinState = Infer<typeof tournamentRoundRobinStateFieldObject>;

/***************************************************************
 * Brackets Tournament Types
 ***************************************************************/

// Brackets configuration
const tournamentBracketsConfigFieldObject = v.object(tournamentBracketsConfigFields);
export type TournamentBracketsConfig = Infer<typeof tournamentBracketsConfigFieldObject>;

// Brackets match
const tournamentBracketsMatchFieldObject = v.object(tournamentBracketsMatchFields);
export type TournamentBracketsMatch = Infer<typeof tournamentBracketsMatchFieldObject>;

// Brackets state
const tournamentBracketsStateFieldObject = v.object(tournamentBracketsStateFields);
export type TournamentBracketsState = Infer<typeof tournamentBracketsStateFieldObject>;

/***************************************************************
 * Document Types - Derived from table definitions
 ***************************************************************/

// Class instance widget document
export type ClassInstanceWidget = Doc<"classInstanceWidgets">;

/***************************************************************
 * Helper Types
 ***************************************************************/

// Setup participant - unified view of bookings + walk-ins during setup
// Used before tournament starts (derived from live queries)
export interface SetupParticipant {
    id: string; // "booking_<bookingId>" or "walkin_<walkInId>"
    displayName: string;
    isWalkIn: boolean;
    // Booking reference (if not walk-in)
    bookingId?: Id<"bookings">;
    userId?: Id<"users">;
    // Walk-in reference (if walk-in)
    walkInId?: string;
    walkInPhone?: string;
    walkInEmail?: string;
}

// Widget with setup participants (for display during setup mode)
export interface WidgetWithSetupParticipants extends ClassInstanceWidget {
    setupParticipants: SetupParticipant[];
}

// Widget with participants (for display during active/completed tournaments)
export interface WidgetWithParticipants extends ClassInstanceWidget {
    // Participants is already in widgetState, this is for convenience
}

/***************************************************************
 * Type Guards - For runtime type narrowing
 ***************************************************************/

// Check if widget config is Americano
export const isAmericanoConfig = (config: WidgetConfig): config is AmericanoWidgetConfig => {
    return config.type === 'tournament_americano';
};

// Check if widget config is Round Robin
export const isRoundRobinConfig = (config: WidgetConfig): config is RoundRobinWidgetConfig => {
    return config.type === 'tournament_round_robin';
};

// Check if widget config is Brackets
export const isBracketsConfig = (config: WidgetConfig): config is BracketsWidgetConfig => {
    return config.type === 'tournament_brackets';
};

// Check if widget state is Americano
export const isAmericanoState = (state: WidgetState): state is AmericanoWidgetState => {
    return state.type === 'tournament_americano';
};

// Check if widget state is Round Robin
export const isRoundRobinState = (state: WidgetState): state is RoundRobinWidgetState => {
    return state.type === 'tournament_round_robin';
};

// Check if widget state is Brackets
export const isBracketsState = (state: WidgetState): state is BracketsWidgetState => {
    return state.type === 'tournament_brackets';
};

/***************************************************************
 * Utility Types
 ***************************************************************/

// Get the config type from a WidgetConfig
export type ConfigFromWidgetConfig<T extends WidgetConfig> = T['config'];

// Get the state type from a WidgetState
export type StateFromWidgetState<T extends WidgetState> = T['state'];
