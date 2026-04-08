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
exports.RoomsController = void 0;
const common_1 = require("@nestjs/common");
const rooms_service_1 = require("./rooms.service");
const rooms_gateway_1 = require("./rooms.gateway");
let RoomsController = class RoomsController {
    roomsService;
    roomsGateway;
    constructor(roomsService, roomsGateway) {
        this.roomsService = roomsService;
        this.roomsGateway = roomsGateway;
    }
    createRoom(body) {
        const room = this.roomsService.createRoom(body.hostPlayer, body.settings);
        return room;
    }
    joinRoom(code, body) {
        const room = this.roomsService.joinRoom(code, body.player);
        this.roomsGateway.server.to(code).emit('room:joined', room.players);
        return room;
    }
    leaveRoom(code, body) {
        this.roomsService.leaveRoom(code, body.playerId);
        this.roomsGateway.server.to(code).emit('room:left', body.playerId);
        try {
            const room = this.roomsService.getRoom(code);
            this.roomsGateway.server.to(code).emit('room:joined', room.players);
        }
        catch {
        }
        return { success: true };
    }
    startGame(code) {
        const gameState = this.roomsService.startGame(code);
        this.roomsGateway.server.to(code).emit('game:started');
        this.roomsGateway.server.to(code).emit('game:stateUpdate', gameState);
        return { success: true };
    }
    getRoom(code) {
        return this.roomsService.getRoom(code);
    }
    updateReadyStatus(code, id, body) {
        const room = this.roomsService.setPlayerReady(code, id, body.isReady);
        this.roomsGateway.server.to(code).emit('player:ready', id);
        this.roomsGateway.server.to(code).emit('room:joined', room.players);
        return room;
    }
};
exports.RoomsController = RoomsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "createRoom", null);
__decorate([
    (0, common_1.Post)(':code/join'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "joinRoom", null);
__decorate([
    (0, common_1.Post)(':code/leave'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "leaveRoom", null);
__decorate([
    (0, common_1.Post)(':code/start'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "startGame", null);
__decorate([
    (0, common_1.Get)(':code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "getRoom", null);
__decorate([
    (0, common_1.Put)(':code/players/:id/ready'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RoomsController.prototype, "updateReadyStatus", null);
exports.RoomsController = RoomsController = __decorate([
    (0, common_1.Controller)('rooms'),
    __metadata("design:paramtypes", [rooms_service_1.RoomsService,
        rooms_gateway_1.RoomsGateway])
], RoomsController);
//# sourceMappingURL=rooms.controller.js.map