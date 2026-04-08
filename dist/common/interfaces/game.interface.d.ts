export declare enum CharacterType {
    DUKE = "duke",
    ASSASSIN = "assassin",
    CAPTAIN = "captain",
    AMBASSADOR = "ambassador",
    CONTESSA = "contessa",
    INQUISITOR = "inquisitor"
}
export declare enum ActionType {
    INCOME = "income",
    FOREIGN_AID = "foreign_aid",
    COUP = "coup",
    TAX = "tax",
    ASSASSINATE = "assassinate",
    STEAL = "steal",
    EXCHANGE = "exchange",
    INVESTIGATE = "investigate"
}
export declare enum GamePhase {
    LOBBY = "lobby",
    STARTING = "starting",
    ACTION = "action",
    RESPONSE = "response",
    CHALLENGE = "challenge",
    REVEAL = "reveal",
    EXCHANGE = "exchange",
    INVESTIGATE = "investigate",
    ENDED = "ended"
}
export declare enum ResponseType {
    ALLOW = "allow",
    CHALLENGE = "challenge",
    BLOCK = "block"
}
export interface Influence {
    character: CharacterType;
    revealed: boolean;
}
export interface Player {
    id: string;
    username: string;
    coins: number;
    influences: Influence[];
    isAlive: boolean;
    isHost: boolean;
    isReady: boolean;
    isConnected: boolean;
}
export interface ActionData {
    type: ActionType;
    actorId: string;
    targetId?: string;
    claimedCharacter?: CharacterType;
    cost?: number;
}
export interface PendingAction {
    action: ActionData;
    timestamp: number;
    respondedPlayers: string[];
}
export interface ChallengeData {
    challengerId: string;
    targetId: string;
    claimedCharacter: CharacterType;
}
export interface BlockData {
    blockerId: string;
    claimedCharacter: CharacterType;
}
export interface RoomSettings {
    maxPlayers: number;
    includeInquisitor: boolean;
}
export interface Room {
    code: string;
    settings: RoomSettings;
    players: Player[];
    hostId: string;
}
export interface GameState {
    phase: GamePhase;
    players: Player[];
    currentPlayerId: string | null;
    deck: CharacterType[];
    treasury: number;
    pendingAction: PendingAction | null;
    pendingChallenge: ChallengeData | null;
    pendingBlock: BlockData | null;
    revealingPlayerId: string | null;
    exchangeOptions: CharacterType[] | null;
    pendingInvestigation: {
        targetId: string;
        cardIndex: number;
        character: CharacterType;
    } | null;
    winner: Player | null;
    includeInquisitor: boolean;
}
