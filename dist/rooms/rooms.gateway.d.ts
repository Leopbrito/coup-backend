import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './rooms.service';
import { Player } from '../common/interfaces/game.interface';
export declare class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly roomsService;
    server: Server;
    private clientMaps;
    constructor(roomsService: RoomsService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleRoomJoin(data: {
        roomCode: string;
        player: Player;
    }, client: Socket): void;
    handleGameAction(actionData: any, client: Socket): void;
    handleGameResponse(responseData: {
        playerId: string;
        response: 'allow' | 'challenge' | 'block';
        blockCharacter?: any;
    }, client: Socket): void;
    handleGameExchange(client: Socket, data: {
        roomCode: string;
        playerId: string;
        keptCards: any[];
    }): void;
    handleGameInvestigateDecision(client: Socket, data: {
        roomCode: string;
        playerId: string;
        forceExchange: boolean;
    }): void;
    handleGameReveal(revealData: {
        playerId: string;
        influenceIndex: number;
    }, client: Socket): void;
    private broadcastState;
}
