"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const game_service_1 = require("../game/game.service");
let RoomsService = class RoomsService {
    gameService;
    rooms = new Map();
    games = new Map();
    constructor(gameService) {
        this.gameService = gameService;
    }
    createRoom(hostPlayer, settings) {
        const code = this.generateRoomCode();
        const host = { ...hostPlayer, isHost: true, isConnected: true };
        const room = {
            code,
            settings,
            players: [host],
            hostId: host.id,
        };
        this.rooms.set(code, room);
        const gameState = this.gameService.createInitialGameState(room);
        this.games.set(code, gameState);
        return room;
    }
    getRoom(code) {
        const room = this.rooms.get(code);
        if (!room) {
            throw new common_1.NotFoundException(`Room ${code} not found`);
        }
        return room;
    }
    getGameState(code) {
        const gameState = this.games.get(code);
        if (!gameState) {
            throw new common_1.NotFoundException(`Game for room ${code} not found`);
        }
        return gameState;
    }
    joinRoom(code, player) {
        const room = this.getRoom(code);
        if (room.players.length >= room.settings.maxPlayers) {
            throw new Error(`Room ${code} is full`);
        }
        if (room.players.some((p) => p.id === player.id)) {
            const existing = room.players.find((p) => p.id === player.id);
            if (existing) {
                existing.isConnected = true;
            }
            return room;
        }
        const newPlayer = { ...player, isHost: false, isConnected: true };
        room.players.push(newPlayer);
        return room;
    }
    leaveRoom(code, playerId) {
        const room = this.getRoom(code);
        room.players = room.players.filter((p) => p.id !== playerId);
        if (room.players.length === 0) {
            this.rooms.delete(code);
            this.games.delete(code);
        }
        else if (room.hostId === playerId) {
            room.hostId = room.players[0].id;
            room.players[0].isHost = true;
        }
    }
    setPlayerReady(code, playerId, isReady) {
        const room = this.getRoom(code);
        const player = room.players.find((p) => p.id === playerId);
        if (player) {
            player.isReady = isReady;
        }
        return room;
    }
    setPlayerConnected(code, playerId, isConnected) {
        const room = this.getRoom(code);
        const player = room.players.find((p) => p.id === playerId);
        if (player) {
            player.isConnected = isConnected;
        }
        return room;
    }
    startGame(code) {
        const room = this.getRoom(code);
        let gameState = this.getGameState(code);
        gameState.players = [...room.players];
        gameState = this.gameService.startGame(gameState);
        this.games.set(code, gameState);
        return gameState;
    }
    processAction(code, action) {
        let gameState = this.getGameState(code);
        gameState = this.gameService.performAction(gameState, action);
        this.games.set(code, gameState);
        return gameState;
    }
    processResponse(code, playerId, response, blockCharacter) {
        let gameState = this.getGameState(code);
        gameState = this.gameService.respondToAction(gameState, playerId, response, blockCharacter);
        this.games.set(code, gameState);
        return gameState;
    }
    processExchange(code, playerId, keptCards) {
        let gameState = this.getGameState(code);
        gameState = this.gameService.resolveExchange(gameState, playerId, keptCards);
        this.games.set(code, gameState);
        return gameState;
    }
    processInvestigate(code, playerId, forceExchange) {
        let gameState = this.getGameState(code);
        gameState = this.gameService.resolveInvestigate(gameState, playerId, forceExchange);
        this.games.set(code, gameState);
        return gameState;
    }
    processReveal(code, playerId, influenceIndex) {
        let gameState = this.getGameState(code);
        gameState = this.gameService.revealInfluence(gameState, playerId, influenceIndex);
        this.games.set(code, gameState);
        return gameState;
    }
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (this.rooms.has(code)) {
            return this.generateRoomCode();
        }
        return code;
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [game_service_1.GameService])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map