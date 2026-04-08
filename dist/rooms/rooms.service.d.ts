import { Room, GameState, RoomSettings, Player } from '../common/interfaces/game.interface';
import { GameService } from '../game/game.service';
export declare class RoomsService {
    private readonly gameService;
    private rooms;
    private games;
    constructor(gameService: GameService);
    createRoom(hostPlayer: Player, settings: RoomSettings): Room;
    getRoom(code: string): Room;
    getGameState(code: string): GameState;
    joinRoom(code: string, player: Player): Room;
    leaveRoom(code: string, playerId: string): void;
    setPlayerReady(code: string, playerId: string, isReady: boolean): Room;
    setPlayerConnected(code: string, playerId: string, isConnected: boolean): Room;
    startGame(code: string): GameState;
    private generateRoomCode;
}
