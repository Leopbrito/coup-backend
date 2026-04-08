import { Controller, Post, Get, Put, Body, Param, HttpCode } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomSettings, Player } from '../common/interfaces/game.interface';
import { RoomsGateway } from './rooms.gateway';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly roomsGateway: RoomsGateway,
  ) {}

  @Post()
  createRoom(@Body() body: { hostPlayer: Player; settings: RoomSettings }) {
    const room = this.roomsService.createRoom(body.hostPlayer, body.settings);
    return room;
  }

  @Post(':code/join')
  joinRoom(@Param('code') code: string, @Body() body: { player: Player }) {
    const room = this.roomsService.joinRoom(code, body.player);
    this.roomsGateway.server.to(code).emit('room:joined', room.players);
    return room;
  }

  @Post(':code/leave')
  @HttpCode(200)
  leaveRoom(@Param('code') code: string, @Body() body: { playerId: string }) {
    this.roomsService.leaveRoom(code, body.playerId);
    this.roomsGateway.server.to(code).emit('room:left', body.playerId);
    // Also, emit updated players or have room emit
    try {
       const room = this.roomsService.getRoom(code);
       this.roomsGateway.server.to(code).emit('room:joined', room.players); // to refresh list
    } catch {
       // room deleted
    }
    return { success: true };
  }

  @Post(':code/start')
  @HttpCode(200)
  startGame(@Param('code') code: string) {
    const gameState = this.roomsService.startGame(code);
    this.roomsGateway.server.to(code).emit('game:started');
    this.roomsGateway.server.to(code).emit('game:stateUpdate', gameState);
    return { success: true };
  }

  @Get(':code')
  getRoom(@Param('code') code: string) {
    return this.roomsService.getRoom(code);
  }

  @Put(':code/players/:id/ready')
  updateReadyStatus(
    @Param('code') code: string,
    @Param('id') id: string,
    @Body() body: { isReady: boolean },
  ) {
    const room = this.roomsService.setPlayerReady(code, id, body.isReady);
    this.roomsGateway.server.to(code).emit('player:ready', id);
    // Need to also emit updated players list sometimes, but frontend usually reacts to player:ready maybe
    this.roomsGateway.server.to(code).emit('room:joined', room.players); 
    return room;
  }
}
