import { describe, expect, it } from 'vitest'
import {
  createGame,
  eliminatePlayer,
  getVoteLeaders,
  isCorrectMrWhiteGuess,
  resolveWinner,
  validateConfig,
} from './engine'
import type { GameConfig, Player, WordPack } from './types'

const pack: WordPack = {
  id: 'test',
  name: 'Test',
  description: 'Test pack',
  tone: 'coral',
  stamp: 'TS',
  pairs: [
    { civilian: 'Coffee', undercover: 'Tea' },
    { civilian: 'Pillow', undercover: 'Blanket' },
  ],
}

const config: GameConfig = {
  playerNames: ['A', 'B', 'C', 'D', 'E'],
  undercoverCount: 1,
  mrWhiteCount: 1,
  packIds: ['test'],
  discussionSeconds: 60,
}

function player(id: string, role: Player['role'], isEliminated = false): Player {
  return { id, name: id, role, word: null, isEliminated }
}

describe('createGame', () => {
  it('assigns the configured roles and keeps Mr. White wordless', () => {
    const game = createGame(config, [pack], new Set(), () => 0)

    expect(game.players.filter(({ role }) => role === 'civilian')).toHaveLength(3)
    expect(game.players.filter(({ role }) => role === 'undercover')).toHaveLength(1)
    expect(game.players.filter(({ role }) => role === 'mr-white')).toHaveLength(1)
    expect(game.players.find(({ role }) => role === 'mr-white')?.word).toBeNull()
    expect(game.players.find(({ role }) => role === 'undercover')?.word).toBe('Tea')
  })

  it('avoids a used word pair while unused pairs remain', () => {
    const game = createGame(config, [pack], new Set(['test:Coffee:Tea']), () => 0)

    expect(game.pair.civilian).toBe('Pillow')
  })
})

describe('official victory rules', () => {
  it('awards Civilians when every infiltrator is gone', () => {
    const players = [
      player('a', 'civilian'),
      player('b', 'civilian'),
      player('c', 'undercover'),
    ]

    expect(resolveWinner(eliminatePlayer(players, 'c'))?.team).toBe('civilians')
  })

  it('awards infiltrators when only one Civilian remains', () => {
    const players = [
      player('a', 'civilian'),
      player('b', 'civilian', true),
      player('c', 'undercover'),
      player('d', 'mr-white'),
    ]

    expect(resolveWinner(players)).toEqual({
      team: 'infiltrators',
      reason: 'one-civilian-left',
    })
  })

  it('continues while both sides still have room to play', () => {
    const players = [
      player('a', 'civilian'),
      player('b', 'civilian'),
      player('c', 'undercover'),
    ]

    expect(resolveWinner(players)).toBeNull()
  })
})

describe('round helpers', () => {
  it('returns every player tied for the highest vote', () => {
    expect(getVoteLeaders({ a: 'c', b: 'd', c: 'c', d: 'd' })).toEqual(['c', 'd'])
  })

  it('accepts a Mr. White guess regardless of spacing or case', () => {
    expect(isCorrectMrWhiteGuess('  ICE-cream ', 'Ice cream')).toBe(true)
  })

  it('requires two Civilians in a valid setup', () => {
    expect(
      validateConfig({
        ...config,
        playerNames: ['A', 'B', 'C'],
        undercoverCount: 1,
        mrWhiteCount: 1,
      }),
    ).toMatch(/two Civilian/)
  })
})