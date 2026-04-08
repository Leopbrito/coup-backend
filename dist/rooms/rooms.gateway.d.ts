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
    handleGameResponse(responseData: any, client: Socket): void;
}
