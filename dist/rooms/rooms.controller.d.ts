import { RoomsService } from './rooms.service';
import { RoomSettings, Player } from '../common/interfaces/game.interface';
import { RoomsGateway } from './rooms.gateway';
export declare class RoomsController {
    private readonly roomsService;
    private readonly roomsGateway;
    constructor(roomsService: RoomsService, roomsGateway: RoomsGateway);
    createRoom(body: {
        hostPlayer: Player;
        settings: RoomSettings;
    }): import("../common/interfaces/game.interface").Room;
    joinRoom(code: string, body: {
        player: Player;
    }): import("../common/interfaces/game.interface").Room;
    leaveRoom(code: string, body: {
        playerId: string;
    }): {
        success: boolean;
    };
    startGame(code: string): {
        success: boolean;
    };
    getRoom(code: string): import("../common/interfaces/game.interface").Room;
    updateReadyStatus(code: string, id: string, body: {
        isReady: boolean;
    }): import("../common/interfaces/game.interface").Room;
}
