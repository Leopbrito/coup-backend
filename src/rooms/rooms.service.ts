import { Injectable, NotFoundException } from '@nestjs/common';
import { Room, GameState, RoomSettings, Player } from '../common/interfaces/game.interface';
import { GameService } from '../game/game.service';

@Injectable()
export class RoomsService {
  private rooms: Map<string, Room> = new Map();
  private games: Map<string, GameState> = new Map();

  constructor(private readonly gameService: GameService) {}

  createRoom(hostPlayer: Player, settings: RoomSettings): Room {
    const code = this.generateRoomCode();
    
    // Ensure host player is marked as host inside the room
    const host: Player = { ...hostPlayer, isHost: true, isConnected: true };

    const room: Room = {
      code,
      settings,
      players: [host],
      hostId: host.id,
    };

    this.rooms.set(code, room);
    
    // Initialize empty game state
    const gameState = this.gameService.createInitialGameState(room);
    this.games.set(code, gameState);

    return room;
  }

  getRoom(code: string): Room {
    const room = this.rooms.get(code);
    if (!room) {
      throw new NotFoundException(`Room ${code} not found`);
    }
    return room;
  }

  getGameState(code: string): GameState {
    const gameState = this.games.get(code);
    if (!gameState) {
      throw new NotFoundException(`Game for room ${code} not found`);
    }
    return gameState;
  }

  joinRoom(code: string, player: Player): Room {
    const room = this.getRoom(code);
    
    if (room.players.length >= room.settings.maxPlayers) {
      throw new Error(`Room ${code} is full`);
    }

    if (room.players.some((p) => p.id === player.id)) {
      // Re-joining? Just update connection
      const existing = room.players.find((p) => p.id === player.id);
      if (existing) {
         existing.isConnected = true;
      }
      return room;
    }

    const newPlayer: Player = { ...player, isHost: false, isConnected: true };
    room.players.push(newPlayer);
    
    return room;
  }

  leaveRoom(code: string, playerId: string): void {
    const room = this.getRoom(code);
    room.players = room.players.filter((p) => p.id !== playerId);
    
    if (room.players.length === 0) {
      this.rooms.delete(code);
      this.games.delete(code);
    } else if (room.hostId === playerId) {
      // reassign host
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
    }
  }

  setPlayerReady(code: string, playerId: string, isReady: boolean): Room {
    const room = this.getRoom(code);
    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.isReady = isReady;
    }
    return room;
  }

  setPlayerConnected(code: string, playerId: string, isConnected: boolean): Room {
    const room = this.getRoom(code);
    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.isConnected = isConnected;
    }
    return room;
  }

  startGame(code: string): GameState {
    const room = this.getRoom(code);
    let gameState = this.getGameState(code);

    // Synchronize players into game state
    gameState.players = [...room.players];
    
    gameState = this.gameService.startGame(gameState);
    this.games.set(code, gameState);

    return gameState;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Prevent collisions (highly unlikely but possible)
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }
}
