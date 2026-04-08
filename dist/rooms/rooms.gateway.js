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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const rooms_service_1 = require("./rooms.service");
const game_interface_1 = require("../common/interfaces/game.interface");
let RoomsGateway = class RoomsGateway {
    roomsService;
    server;
    clientMaps = new Map();
    constructor(roomsService) {
        this.roomsService = roomsService;
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        const mapping = this.clientMaps.get(client.id);
        if (mapping) {
            const { roomCode, playerId } = mapping;
            try {
                const room = this.roomsService.setPlayerConnected(roomCode, playerId, false);
                this.server.to(roomCode).emit('room:joined', room.players);
            }
            catch (err) {
            }
            this.clientMaps.delete(client.id);
        }
    }
    handleRoomJoin(data, client) {
        const { roomCode, player } = data;
        client.join(roomCode);
        this.clientMaps.set(client.id, { roomCode, playerId: player.id });
        client.data.userId = player.id;
        console.log(`Player ${player.id} joined room ${roomCode} websocket`);
        try {
            const room = this.roomsService.getRoom(roomCode);
            this.server.to(roomCode).emit('room:joined', room.players);
        }
        catch (e) {
            console.error(`Failed to emit room:joined for ${roomCode}:`, e);
        }
    }
    handleGameAction(actionData, client) {
        const mapping = this.clientMaps.get(client.id);
        if (mapping) {
            const { roomCode } = mapping;
            try {
                const state = this.roomsService.processAction(roomCode, actionData);
                this.server.to(roomCode).emit('game:action', actionData);
                this.broadcastState(roomCode, state);
            }
            catch (e) {
                console.error('Error processing game action:', e);
            }
        }
    }
    handleGameResponse(responseData, client) {
        const mapping = this.clientMaps.get(client.id);
        if (mapping) {
            const { roomCode } = mapping;
            try {
                const state = this.roomsService.processResponse(roomCode, responseData.playerId, responseData.response, responseData.blockCharacter);
                this.server.to(roomCode).emit('game:response', responseData);
                this.broadcastState(roomCode, state);
            }
            catch (e) {
                console.error('Error processing game response:', e);
            }
        }
    }
    handleGameExchange(client, data) {
        const { roomCode, playerId, keptCards } = data;
        try {
            const state = this.roomsService.processExchange(roomCode, playerId, keptCards);
            this.broadcastState(roomCode, state);
        }
        catch (error) {
            client.emit('error', error.message);
        }
    }
    handleGameInvestigateDecision(client, data) {
        const { roomCode, playerId, forceExchange } = data;
        try {
            const state = this.roomsService.processInvestigate(roomCode, playerId, forceExchange);
            this.broadcastState(roomCode, state);
        }
        catch (error) {
            client.emit('error', error.message);
        }
    }
    handleGameReveal(revealData, client) {
        const mapping = this.clientMaps.get(client.id);
        if (mapping) {
            const { roomCode } = mapping;
            try {
                const state = this.roomsService.processReveal(roomCode, revealData.playerId, revealData.influenceIndex);
                this.broadcastState(roomCode, state);
            }
            catch (e) {
                console.error('Error processing game reveal:', e);
            }
        }
    }
    broadcastState(roomCode, state) {
        const clientsData = Array.from(this.server.sockets.adapter.rooms.get(roomCode) || []);
        for (const clientId of clientsData) {
            const socket = this.server.sockets.sockets.get(clientId);
            if (!socket)
                continue;
            const filteredState = { ...state };
            if (state.phase === game_interface_1.GamePhase.INVESTIGATE && state.pendingInvestigation) {
                if (state.revealingPlayerId !== socket.data?.userId) {
                    filteredState.pendingInvestigation = {
                        ...state.pendingInvestigation,
                        character: null
                    };
                }
            }
            socket.emit('game:stateUpdate', filteredState);
        }
    }
};
exports.RoomsGateway = RoomsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RoomsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('room:join'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RoomsGateway.prototype, "handleRoomJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:action'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RoomsGateway.prototype, "handleGameAction", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:response'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RoomsGateway.prototype, "handleGameResponse", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:exchange'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RoomsGateway.prototype, "handleGameExchange", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:investigateDecision'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RoomsGateway.prototype, "handleGameInvestigateDecision", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:reveal'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], RoomsGateway.prototype, "handleGameReveal", null);
exports.RoomsGateway = RoomsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } }),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => rooms_service_1.RoomsService))),
    __metadata("design:paramtypes", [rooms_service_1.RoomsService])
], RoomsGateway);
//# sourceMappingURL=rooms.gateway.js.map