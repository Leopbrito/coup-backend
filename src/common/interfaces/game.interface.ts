export enum CharacterType {
  DUKE = 'duke',
  ASSASSIN = 'assassin',
  CAPTAIN = 'captain',
  AMBASSADOR = 'ambassador',
  CONTESSA = 'contessa',
  INQUISITOR = 'inquisitor',
}

export enum ActionType {
  INCOME = 'income',
  FOREIGN_AID = 'foreign_aid',
  COUP = 'coup',
  TAX = 'tax',
  ASSASSINATE = 'assassinate',
  STEAL = 'steal',
  EXCHANGE = 'exchange',
  INVESTIGATE = 'investigate',
}

export enum GamePhase {
  LOBBY = 'lobby',
  STARTING = 'starting',
  ACTION = 'action',
  RESPONSE = 'response',
  CHALLENGE = 'challenge',
  REVEAL = 'reveal',
  ENDED = 'ended',
}

export enum ResponseType {
  ALLOW = 'allow',
  CHALLENGE = 'challenge',
  BLOCK = 'block',
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
  pendingAction: any | null;
  pendingChallenge: any | null;
  pendingBlock: any | null;
  revealingPlayerId: string | null;
  winner: Player | null;
  includeInquisitor: boolean;
}
