"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const game_interface_1 = require("../common/interfaces/game.interface");
let GameService = class GameService {
    createInitialGameState(room) {
        const deck = this.initializeDeck(room.settings.includeInquisitor);
        return {
            phase: game_interface_1.GamePhase.LOBBY,
            players: room.players.map(p => ({ ...p, isAlive: true, coins: 2, influences: [] })),
            currentPlayerId: null,
            deck,
            treasury: 50,
            pendingAction: null,
            pendingChallenge: null,
            pendingBlock: null,
            revealingPlayerId: null,
            winner: null,
            includeInquisitor: room.settings.includeInquisitor,
        };
    }
    startGame(state) {
        const deck = [...state.deck];
        const players = state.players.map((player) => {
            const influences = [
                { character: deck.pop(), revealed: false },
                { character: deck.pop(), revealed: false },
            ];
            return {
                ...player,
                coins: 2,
                influences,
                isAlive: true,
            };
        });
        return {
            ...state,
            phase: game_interface_1.GamePhase.ACTION,
            players,
            deck,
            currentPlayerId: players[0].id,
        };
    }
    initializeDeck(includeInquisitor) {
        const deck = [];
        const charactersToInclude = [
            game_interface_1.CharacterType.DUKE,
            game_interface_1.CharacterType.ASSASSIN,
            game_interface_1.CharacterType.CAPTAIN,
            game_interface_1.CharacterType.CONTESSA,
        ];
        if (includeInquisitor) {
            charactersToInclude.push(game_interface_1.CharacterType.INQUISITOR);
        }
        else {
            charactersToInclude.push(game_interface_1.CharacterType.AMBASSADOR);
        }
        for (const character of charactersToInclude) {
            deck.push(character, character, character);
        }
        return this.shuffle(deck);
    }
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)()
], GameService);
//# sourceMappingURL=game.service.js.map