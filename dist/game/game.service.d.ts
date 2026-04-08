import { CharacterType, GameState, Room } from '../common/interfaces/game.interface';
export declare class GameService {
    createInitialGameState(room: Room): GameState;
    startGame(state: GameState): GameState;
    initializeDeck(includeInquisitor: boolean): CharacterType[];
    private shuffle;
    performAction(state: GameState, action: any): GameState;
    executeAction(state: GameState, action: any): GameState;
    resolveExchange(state: GameState, playerId: string, keptCharacters: CharacterType[]): GameState;
    resolveInvestigate(state: GameState, playerId: string, forceExchange: boolean): GameState;
    respondToAction(state: GameState, playerId: string, response: 'allow' | 'challenge' | 'block', blockCharacter?: CharacterType): GameState;
    revealInfluence(state: GameState, playerId: string, influenceIndex: number): GameState;
    nextTurn(state: GameState): GameState;
}
