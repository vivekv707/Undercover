import { describe, expect, it } from 'vitest'
import { beginElimination, type GameSession } from './session'

const session: GameSession = {
  version: 1,
  config: {
    playerNames: ['A', 'B', 'C', 'D', 'E'],
    undercoverCount: 1,
    mrWhiteCount: 1,
    packIds: ['test'],
    discussionSeconds: 60,
  },
  players: [
    { id: 'a', name: 'A', role: 'civilian', word: 'Coffee', isEliminated: false },
    { id: 'b', name: 'B', role: 'civilian', word: 'Coffee', isEliminated: false },
    { id: 'c', name: 'C', role: 'civilian', word: 'Coffee', isEliminated: false },
    { id: 'd', name: 'D', role: 'undercover', word: 'Tea', isEliminated: false },
    { id: 'e', name: 'E', role: 'mr-white', word: null, isEliminated: false },
  ],
  pair: { civilian: 'Coffee', undercover: 'Tea' },
  pairKey: 'test:Coffee:Tea',
  packId: 'test',
  phase: 'vote',
  revealIndex: 4,
  secretVisible: false,
  round: 1,
  speakerOrder: ['a', 'b', 'c', 'd', 'e'],
  speakerIndex: 4,
  discussionRemaining: 0,
  timerRunning: false,
  voterOrder: ['a', 'b', 'c', 'd', 'e'],
  voterIndex: 4,
  voteReady: false,
  votes: {},
  voteTargetIds: null,
  selectedVote: null,
  tieIds: [],
  eliminatedId: null,
  pendingWinner: null,
  winner: null,
  whiteGuessStatus: 'idle',
}

describe('Mr. White verdict', () => {
  it('marks Mr. White out but defers victory until the final guess', () => {
    const result = beginElimination(session, 'e')

    expect(result.players.find((player) => player.id === 'e')?.isEliminated).toBe(true)
    expect(result.pendingWinner).toBeNull()
    expect(result.phase).toBe('elimination')
  })
})