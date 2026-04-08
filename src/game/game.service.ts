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
}
