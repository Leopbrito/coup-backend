import { CharacterType, GameState, Room } from '../common/interfaces/game.interface';
export declare class GameService {
    createInitialGameState(room: Room): GameState;
    startGame(state: GameState): GameState;
    initializeDeck(includeInquisitor: boolean): CharacterType[];
    private shuffle;
}
