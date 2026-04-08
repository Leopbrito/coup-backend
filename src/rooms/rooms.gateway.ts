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
import { Player, GameState, GamePhase } from '../common/interfaces/game.interface';

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
    client.data.userId = player.id;
    
    console.log(`Player ${player.id} joined room ${roomCode} websocket`);
    
    try {
      const room = this.roomsService.getRoom(roomCode);
      this.server.to(roomCode).emit('room:joined', room.players);
    } catch (e) {
      console.error(`Failed to emit room:joined for ${roomCode}:`, e);
    }
  }

  @SubscribeMessage('game:action')
  handleGameAction(
    @MessageBody() actionData: any, // depending on ActionData structure
    @ConnectedSocket() client: Socket,
  ) {
    const mapping = this.clientMaps.get(client.id);
    if (mapping) {
      const { roomCode } = mapping;
      try {
        const state = this.roomsService.processAction(roomCode, actionData);
        // We can still broadcast the action for UI logs
        this.server.to(roomCode).emit('game:action', actionData);
        this.broadcastState(roomCode, state);
      } catch (e) {
        console.error('Error processing game action:', e);
      }
    }
  }

  @SubscribeMessage('game:response')
  handleGameResponse(
    @MessageBody() responseData: { playerId: string, response: 'allow' | 'challenge' | 'block', blockCharacter?: any },
    @ConnectedSocket() client: Socket,
  ) {
    const mapping = this.clientMaps.get(client.id);
    if (mapping) {
      const { roomCode } = mapping;
      try {
        const state = this.roomsService.processResponse(roomCode, responseData.playerId, responseData.response, responseData.blockCharacter);
        this.server.to(roomCode).emit('game:response', responseData);
        this.broadcastState(roomCode, state);
      } catch (e) {
        console.error('Error processing game response:', e);
      }
    }
  }

  @SubscribeMessage('game:exchange')
  handleGameExchange(@ConnectedSocket() client: Socket, @MessageBody() data: { roomCode: string; playerId: string; keptCards: any[] }) {
    const { roomCode, playerId, keptCards } = data;
    try {
      const state = this.roomsService.processExchange(roomCode, playerId, keptCards);
      this.broadcastState(roomCode, state);
    } catch (error) {
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('game:investigateDecision')
  handleGameInvestigateDecision(@ConnectedSocket() client: Socket, @MessageBody() data: { roomCode: string; playerId: string; forceExchange: boolean }) {
    const { roomCode, playerId, forceExchange } = data;
    try {
      const state = this.roomsService.processInvestigate(roomCode, playerId, forceExchange);
      this.broadcastState(roomCode, state);
    } catch (error) {
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('game:reveal')
  handleGameReveal(
    @MessageBody() revealData: { playerId: string, influenceIndex: number },
    @ConnectedSocket() client: Socket,
  ) {
    const mapping = this.clientMaps.get(client.id);
    if (mapping) {
      const { roomCode } = mapping;
      try {
        const state = this.roomsService.processReveal(roomCode, revealData.playerId, revealData.influenceIndex);
        this.broadcastState(roomCode, state);
      } catch (e) {
        console.error('Error processing game reveal:', e);
      }
    }
  }

  private broadcastState(roomCode: string, state: GameState) {
    const clientsData = Array.from(this.server.sockets.adapter.rooms.get(roomCode) || []);
    
    for (const clientId of clientsData) {
      const socket = this.server.sockets.sockets.get(clientId);
      if (!socket) continue;

      const filteredState = { ...state };
      if (state.phase === GamePhase.INVESTIGATE && state.pendingInvestigation) {
        // Only the actor (revealingPlayerId) should see the character
        if (state.revealingPlayerId !== socket.data?.userId) {
          filteredState.pendingInvestigation = { 
            ...state.pendingInvestigation, 
            character: null as any 
          };
        }
      }

      socket.emit('game:stateUpdate', filteredState);
    }
  }
}
