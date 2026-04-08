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
            exchangeOptions: null,
            pendingInvestigation: null,
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
    performAction(state, action) {
        const actor = state.players.find(p => p.id === action.actorId);
        if (!actor)
            return state;
        const updatedPlayers = state.players.map(p => {
            if (p.id === action.actorId) {
                return { ...p, coins: p.coins - (action.cost || 0) };
            }
            return p;
        });
        const newState = { ...state, players: updatedPlayers };
        if (action.type === 'income' || action.type === 'coup') {
            return this.executeAction(newState, action);
        }
        return {
            ...newState,
            pendingAction: {
                action,
                timestamp: Date.now(),
                respondedPlayers: [action.actorId],
            },
            phase: game_interface_1.GamePhase.RESPONSE,
        };
    }
    executeAction(state, action) {
        let updatedPlayers = [...state.players];
        let updatedTreasury = state.treasury;
        switch (action.type) {
            case 'income':
                updatedPlayers = updatedPlayers.map(p => p.id === action.actorId ? { ...p, coins: p.coins + 1 } : p);
                updatedTreasury -= 1;
                break;
            case 'foreign_aid':
                updatedPlayers = updatedPlayers.map(p => p.id === action.actorId ? { ...p, coins: p.coins + 2 } : p);
                updatedTreasury -= 2;
                break;
            case 'tax':
                updatedPlayers = updatedPlayers.map(p => p.id === action.actorId ? { ...p, coins: p.coins + 3 } : p);
                updatedTreasury -= 3;
                break;
            case 'steal':
                const targetPlayer = state.players.find(p => p.id === action.targetId);
                const amount = targetPlayer ? Math.min(targetPlayer.coins, 2) : 0;
                updatedPlayers = updatedPlayers.map(p => {
                    if (p.id === action.actorId)
                        return { ...p, coins: p.coins + amount };
                    if (p.id === action.targetId)
                        return { ...p, coins: p.coins - amount };
                    return p;
                });
                break;
            case 'assassinate':
            case 'coup':
                return {
                    ...state,
                    players: updatedPlayers,
                    phase: game_interface_1.GamePhase.REVEAL,
                    revealingPlayerId: action.targetId,
                    pendingAction: null,
                };
            case 'exchange':
                const drawnCards = [state.deck.pop(), state.deck.pop()];
                return {
                    ...state,
                    phase: game_interface_1.GamePhase.EXCHANGE,
                    revealingPlayerId: action.actorId,
                    exchangeOptions: drawnCards,
                    pendingAction: null,
                };
            case 'investigate': {
                const targetPlayer = state.players.find(p => p.id === action.targetId);
                if (!targetPlayer)
                    return state;
                const unrevealedIndices = targetPlayer.influences
                    .map((inf, idx) => inf.revealed ? -1 : idx)
                    .filter(idx => idx !== -1);
                const cardIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
                return {
                    ...state,
                    phase: game_interface_1.GamePhase.INVESTIGATE,
                    revealingPlayerId: action.actorId,
                    pendingInvestigation: {
                        targetId: action.targetId,
                        cardIndex,
                        character: targetPlayer.influences[cardIndex].character
                    },
                    pendingAction: null,
                };
            }
        }
        return this.nextTurn({
            ...state,
            players: updatedPlayers,
            treasury: updatedTreasury,
        });
    }
    resolveExchange(state, playerId, keptCharacters) {
        const player = state.players.find(p => p.id === playerId);
        if (!player)
            return state;
        let keptIdx = 0;
        const newInfluences = player.influences.map(inf => {
            if (!inf.revealed && keptIdx < keptCharacters.length) {
                return { character: keptCharacters[keptIdx++], revealed: false };
            }
            return inf;
        });
        return this.nextTurn({
            ...state,
            players: state.players.map(p => p.id === playerId ? { ...p, influences: newInfluences } : p),
            exchangeOptions: null,
            phase: game_interface_1.GamePhase.ACTION,
        });
    }
    resolveInvestigate(state, playerId, forceExchange) {
        const investigation = state.pendingInvestigation;
        if (!investigation)
            return state;
        let updatedPlayers = [...state.players];
        let updatedDeck = [...state.deck];
        if (forceExchange) {
            updatedPlayers = updatedPlayers.map(p => {
                if (p.id === investigation.targetId) {
                    const newInfluences = [...p.influences];
                    const oldChar = newInfluences[investigation.cardIndex].character;
                    const newChar = updatedDeck.pop();
                    updatedDeck.push(oldChar);
                    updatedDeck = this.shuffle(updatedDeck);
                    newInfluences[investigation.cardIndex] = { character: newChar, revealed: false };
                    return { ...p, influences: newInfluences };
                }
                return p;
            });
        }
        return this.nextTurn({
            ...state,
            players: updatedPlayers,
            deck: updatedDeck,
            pendingInvestigation: null,
            phase: game_interface_1.GamePhase.ACTION,
        });
    }
    respondToAction(state, playerId, response, blockCharacter) {
        if (!state.pendingAction)
            return state;
        const respondedPlayers = [...state.pendingAction.respondedPlayers, playerId];
        if (response === 'challenge') {
            const actor = state.players.find(p => p.id === state.pendingAction.action.actorId);
            if (!actor)
                return state;
            const hasCard = actor.influences.some(i => i.character === state.pendingAction.action.claimedCharacter && !i.revealed);
            if (hasCard) {
                const stateAfterAction = this.executeAction(state, state.pendingAction.action);
                return {
                    ...stateAfterAction,
                    phase: game_interface_1.GamePhase.REVEAL,
                    revealingPlayerId: playerId,
                };
            }
            else {
                return {
                    ...state,
                    phase: game_interface_1.GamePhase.REVEAL,
                    revealingPlayerId: actor.id,
                    pendingAction: null,
                };
            }
        }
        else if (response === 'block' && blockCharacter) {
            return {
                ...state,
                pendingBlock: {
                    blockerId: playerId,
                    claimedCharacter: blockCharacter,
                },
                phase: game_interface_1.GamePhase.RESPONSE,
            };
        }
        else if (response === 'allow') {
            const newState = {
                ...state,
                pendingAction: { ...state.pendingAction, respondedPlayers },
            };
            const alivePlayers = newState.players.filter(p => p.isAlive && p.id !== state.pendingAction?.action.actorId);
            if (respondedPlayers.length > alivePlayers.length) {
                return this.executeAction(newState, state.pendingAction.action);
            }
            return newState;
        }
        return state;
    }
    revealInfluence(state, playerId, influenceIndex) {
        const newPlayers = state.players.map((p) => {
            if (p.id === playerId) {
                const newInfluences = [...p.influences];
                newInfluences[influenceIndex] = {
                    ...newInfluences[influenceIndex],
                    revealed: true,
                };
                const isAlive = newInfluences.some((inf) => !inf.revealed);
                return { ...p, influences: newInfluences, isAlive };
            }
            return p;
        });
        const newState = {
            ...state,
            players: newPlayers,
            revealingPlayerId: null,
            phase: game_interface_1.GamePhase.ACTION,
        };
        const alivePlayers = newState.players.filter((p) => p.isAlive);
        if (alivePlayers.length === 1) {
            return {
                ...newState,
                winner: alivePlayers[0],
                phase: game_interface_1.GamePhase.ENDED,
            };
        }
        return this.nextTurn(newState);
    }
    nextTurn(state) {
        const alivePlayers = state.players.filter((p) => p.isAlive);
        const currentIndex = alivePlayers.findIndex((p) => p.id === state.currentPlayerId);
        const idx = currentIndex >= 0 ? currentIndex : 0;
        const nextIndex = (idx + 1) % alivePlayers.length;
        return {
            ...state,
            currentPlayerId: alivePlayers[nextIndex].id,
            pendingAction: null,
            pendingChallenge: null,
            pendingBlock: null,
            phase: game_interface_1.GamePhase.ACTION,
        };
    }
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)()
], GameService);
//# sourceMappingURL=game.service.js.map