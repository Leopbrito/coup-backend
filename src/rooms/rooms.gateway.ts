import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Player } from '../common/interfaces/game.interface';

@WebSocketGateway({ cors: { origin: '*' } })
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map to link socketId to tracking connection { roomCode, playerId }
  private clientMaps: Map<string, { roomCode: string; playerId: string }> = new Map();

  constructor(
    @Inject(forwardRef(() => RoomsService))
    private readonly roomsService: RoomsService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const mapping = this.clientMaps.get(client.id);
    if (mapping) {
      const { roomCode, playerId } = mapping;
      try {
        const room = this.roomsService.setPlayerConnected(roomCode, playerId, false);
        this.server.to(roomCode).emit('room:joined', room.players); // broadcasat updated room
      } catch (err) {
        // Room might no longer exist
      }
      this.clientMaps.delete(client.id);
    }
  }

  @SubscribeMessage('room:join')
  handleRoomJoin(
    @MessageBody() data: { roomCode: string; player: Player },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomCode, player } = data;
    client.join(roomCode);
    
    // Store mapping for disconnects
    this.clientMaps.set(client.id, { roomCode, playerId: player.id });
    
    console.log(`Player ${player.id} joined room ${roomCode} websocket`);
  }

  @SubscribeMessage('game:action')
  handleGameAction(
    @MessageBody() actionData: any, // depending on ActionData structure
    @ConnectedSocket() client: Socket,
  ) {
    const mapping = this.clientMaps.get(client.id);
    if (mapping) {
      const { roomCode } = mapping;
      // In a real scenario, this forwards to gameService to process action
      // Then broadcasts the updated state
      // For now, we just broadcast
      this.server.to(roomCode).emit('game:action', actionData);
      
      try {
        const state = this.roomsService.getGameState(roomCode);
        // Process action mutation here via roomsService / gameService
        // state = this.gameService.processAction(state, actionData);
        // this.server.to(roomCode).emit('game:stateUpdate', state);
      } catch {
        // Handle error
      }
    }
  }

  @SubscribeMessage('game:response')
  handleGameResponse(
    @MessageBody() responseData: any,
    @ConnectedSocket() client: Socket,
  ) {
    const mapping = this.clientMaps.get(client.id);
    if (mapping) {
      const { roomCode } = mapping;
      this.server.to(roomCode).emit('game:response', responseData);
      
      try {
        const state = this.roomsService.getGameState(roomCode);
        // Process response here via gameService
        // this.server.to(roomCode).emit('game:stateUpdate', state);
      } catch {
        // Handle error
      }
    }
  }
}
