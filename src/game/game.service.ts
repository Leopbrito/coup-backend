import { Injectable } from '@nestjs/common';
import {
  CharacterType,
  GameState,
  GamePhase,
  Player,
  Room,
} from '../common/interfaces/game.interface';

@Injectable()
export class GameService {
  createInitialGameState(room: Room): GameState {
    const deck = this.initializeDeck(room.settings.includeInquisitor);

    return {
      phase: GamePhase.LOBBY,
      players: room.players.map(p => ({ ...p, isAlive: true, coins: 2, influences: [] })), // initial state, will deal on start
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

  startGame(state: GameState): GameState {
    const deck = [...state.deck];
    
    // dealing cards
    const players = state.players.map((player) => {
      const influences = [
        { character: deck.pop()!, revealed: false },
        { character: deck.pop()!, revealed: false },
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
      phase: GamePhase.ACTION,
      players,
      deck,
      currentPlayerId: players[0].id, // basic, first player starts
    };
  }

  initializeDeck(includeInquisitor: boolean): CharacterType[] {
    const deck: CharacterType[] = [];
    const charactersToInclude = [
      CharacterType.DUKE,
      CharacterType.ASSASSIN,
      CharacterType.CAPTAIN,
      CharacterType.CONTESSA,
    ];

    if (includeInquisitor) {
      charactersToInclude.push(CharacterType.INQUISITOR);
    } else {
      charactersToInclude.push(CharacterType.AMBASSADOR);
    }

    // Usually there are 3 of each card
    for (const character of charactersToInclude) {
      deck.push(character, character, character);
    }

    // Shuffle deck
    return this.shuffle(deck);
  }

  private shuffle(array: any[]) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  performAction(state: GameState, action: any): GameState {
    const actor = state.players.find(p => p.id === action.actorId);
    if (!actor) return state;

    // Deduct costs immediately
    const updatedPlayers = state.players.map(p => {
      if (p.id === action.actorId) {
        return { ...p, coins: p.coins - (action.cost || 0) };
      }
      return p;
    });

    const newState = { ...state, players: updatedPlayers };

    // Instant actions (cannot be challenged or blocked)
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
      phase: GamePhase.RESPONSE,
    };
  }

  executeAction(state: GameState, action: any): GameState {
    let updatedPlayers = [...state.players];
    let updatedTreasury = state.treasury;

    switch (action.type) {
      case 'income':
        updatedPlayers = updatedPlayers.map(p => 
          p.id === action.actorId ? { ...p, coins: p.coins + 1 } : p
        );
        updatedTreasury -= 1;
        break;
      case 'foreign_aid':
        updatedPlayers = updatedPlayers.map(p => 
          p.id === action.actorId ? { ...p, coins: p.coins + 2 } : p
        );
        updatedTreasury -= 2;
        break;
      case 'tax':
        updatedPlayers = updatedPlayers.map(p => 
          p.id === action.actorId ? { ...p, coins: p.coins + 3 } : p
        );
        updatedTreasury -= 3;
        break;
      case 'steal':
        const targetPlayer = state.players.find(p => p.id === action.targetId);
        const amount = targetPlayer ? Math.min(targetPlayer.coins, 2) : 0;
        updatedPlayers = updatedPlayers.map(p => {
          if (p.id === action.actorId) return { ...p, coins: p.coins + amount };
          if (p.id === action.targetId) return { ...p, coins: p.coins - amount };
          return p;
        });
        break;
      case 'assassinate':
      case 'coup':
        return {
          ...state,
          players: updatedPlayers,
          phase: GamePhase.REVEAL,
          revealingPlayerId: action.targetId,
          pendingAction: null,
        };
      case 'exchange':
        const drawnCards = [state.deck.pop()!, state.deck.pop()!];
        return {
          ...state,
          phase: GamePhase.EXCHANGE,
          revealingPlayerId: action.actorId,
          exchangeOptions: drawnCards,
          pendingAction: null,
        };
      case 'investigate': {
        const targetPlayer = state.players.find(p => p.id === action.targetId);
        if (!targetPlayer) return state;
        
        // Pick random unrevealed influence
        const unrevealedIndices = targetPlayer.influences
          .map((inf, idx) => inf.revealed ? -1 : idx)
          .filter(idx => idx !== -1);
        
        const cardIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
        
        return {
          ...state,
          phase: GamePhase.INVESTIGATE,
          revealingPlayerId: action.actorId, // actor is the one who sees the result
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

  resolveExchange(state: GameState, playerId: string, keptCharacters: CharacterType[]): GameState {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return state;

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
      phase: GamePhase.ACTION,
    });
  }

  resolveInvestigate(state: GameState, playerId: string, forceExchange: boolean): GameState {
    const investigation = state.pendingInvestigation;
    if (!investigation) return state;

    let updatedPlayers = [...state.players];
    let updatedDeck = [...state.deck];

    if (forceExchange) {
      updatedPlayers = updatedPlayers.map(p => {
        if (p.id === investigation.targetId) {
          const newInfluences = [...p.influences];
          const oldChar = newInfluences[investigation.cardIndex].character;
          
          // Swap with deck
          const newChar = updatedDeck.pop()!;
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
      phase: GamePhase.ACTION,
    });
  }

  respondToAction(state: GameState, playerId: string, response: 'allow' | 'challenge' | 'block', blockCharacter?: CharacterType): GameState {
    if (!state.pendingAction) return state;

    const respondedPlayers = [...state.pendingAction.respondedPlayers, playerId];

    if (response === 'challenge') {
      const actor = state.players.find(p => p.id === state.pendingAction!.action.actorId);
      if (!actor) return state;

      const hasCard = actor.influences.some(i => i.character === state.pendingAction!.action.claimedCharacter && !i.revealed);

      if (hasCard) {
        // Actor wins: Execute the action effects and then force the challenger to reveal
        const stateAfterAction = this.executeAction(state, state.pendingAction.action);
        return {
          ...stateAfterAction,
          phase: GamePhase.REVEAL,
          revealingPlayerId: playerId, // Challenger must reveal
        };
      } else {
        // Actor loses: Action is cancelled and actor must reveal
        return {
          ...state,
          phase: GamePhase.REVEAL,
          revealingPlayerId: actor.id,
          pendingAction: null,
        };
      }
    } else if (response === 'block' && blockCharacter) {
      return {
        ...state,
        pendingBlock: {
          blockerId: playerId,
          claimedCharacter: blockCharacter,
        },
        phase: GamePhase.RESPONSE, // In a full implementation, this could be challenged too
      };
    } else if (response === 'allow') {
      const newState = {
        ...state,
        pendingAction: { ...state.pendingAction, respondedPlayers },
      };

      // Check if all other alive players have allowed
      const alivePlayers = newState.players.filter(p => p.isAlive && p.id !== state.pendingAction?.action.actorId);
      if (respondedPlayers.length > alivePlayers.length) { // all responded (including actor)
        return this.executeAction(newState, state.pendingAction.action);
      }
      return newState;
    }
    return state;
  }

  revealInfluence(state: GameState, playerId: string, influenceIndex: number): GameState {
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
      phase: GamePhase.ACTION,
    };

    // Check for winner
    const alivePlayers = newState.players.filter((p) => p.isAlive);
    if (alivePlayers.length === 1) {
      return {
        ...newState,
        winner: alivePlayers[0],
        phase: GamePhase.ENDED,
      };
    }

    return this.nextTurn(newState);
  }

  nextTurn(state: GameState): GameState {
    const alivePlayers = state.players.filter((p) => p.isAlive);
    const currentIndex = alivePlayers.findIndex((p) => p.id === state.currentPlayerId);
    
    // If current player is dead or somehow removed
    const idx = currentIndex >= 0 ? currentIndex : 0;
    
    const nextIndex = (idx + 1) % alivePlayers.length;

    return {
      ...state,
      currentPlayerId: alivePlayers[nextIndex].id,
      pendingAction: null,
      pendingChallenge: null,
      pendingBlock: null,
      phase: GamePhase.ACTION,
    };
  }
}
