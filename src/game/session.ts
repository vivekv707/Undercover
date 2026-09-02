import {
  createGame,
  createSpeakerOrder,
  eliminatePlayer,
  resolveWinner,
} from './engine'
import { defaultPackIds, wordPacks } from './packs'
import type { GameConfig, StartedGame, Votes, Winner } from './types'

export type GamePhase =
  | 'reveal'
  | 'clues'
  | 'discussion'
  | 'vote'
  | 'tie'
  | 'elimination'
  | 'mr-white-guess'
  | 'result'

export interface GameSession extends StartedGame {
  version: 1
  config: GameConfig
  phase: GamePhase
  revealIndex: number
  secretVisible: boolean
  round: number
  speakerOrder: string[]
  speakerIndex: number
  discussionRemaining: number
  timerRunning: boolean
  voterOrder: string[]
  voterIndex: number
  voteReady: boolean
  votes: Votes
  voteTargetIds: string[] | null
  selectedVote: string | null
  tieIds: string[]
  eliminatedId: string | null
  pendingWinner: Winner | null
  winner: Winner | null
  whiteGuessStatus: 'idle' | 'wrong'
}

export const SETUP_STORAGE_KEY = 'undercover:setup-v1'
export const SESSION_STORAGE_KEY = 'undercover:session-v1'
const PAIRS_STORAGE_KEY = 'undercover:used-pairs-v1'

export const defaultConfig: GameConfig = {
  playerNames: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5'],
  undercoverCount: 1,
  mrWhiteCount: 1,
  packIds: defaultPackIds,
  discussionSeconds: 60,
}

export function loadConfig(): GameConfig {
  try {
    const saved = localStorage.getItem(SETUP_STORAGE_KEY)
    if (!saved) return defaultConfig
    const parsed = JSON.parse(saved) as GameConfig
    return Array.isArray(parsed.playerNames) && Array.isArray(parsed.packIds)
      ? parsed
      : defaultConfig
  } catch {
    return defaultConfig
  }
}

export function loadSession(): GameSession | null {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved) as GameSession

    if (parsed.version !== 1 || !Array.isArray(parsed.players)) return null

    return {
      ...parsed,
      secretVisible: false,
      voteReady: false,
      selectedVote: null,
    }
  } catch {
    return null
  }
}

function loadUsedPairKeys(): Set<string> {
  try {
    const saved = JSON.parse(localStorage.getItem(PAIRS_STORAGE_KEY) ?? '[]') as string[]
    return new Set(Array.isArray(saved) ? saved : [])
  } catch {
    return new Set()
  }
}

function savePairKey(pairKey: string) {
  const pairKeys = [...loadUsedPairKeys(), pairKey].slice(-250)
  localStorage.setItem(PAIRS_STORAGE_KEY, JSON.stringify([...new Set(pairKeys)]))
}

export function createSession(config: GameConfig): GameSession {
  const game = createGame(config, wordPacks, loadUsedPairKeys())
  savePairKey(game.pairKey)

  return {
    ...game,
    version: 1,
    config,
    phase: 'reveal',
    revealIndex: 0,
    secretVisible: false,
    round: 1,
    speakerOrder: [],
    speakerIndex: 0,
    discussionRemaining: config.discussionSeconds,
    timerRunning: false,
    voterOrder: [],
    voterIndex: 0,
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
}

export function beginRound(session: GameSession, round: number): GameSession {
  return {
    ...session,
    phase: 'clues',
    round,
    speakerOrder: createSpeakerOrder(session.players),
    speakerIndex: 0,
    voterOrder: [],
    voterIndex: 0,
    votes: {},
    voteTargetIds: null,
    tieIds: [],
    eliminatedId: null,
    pendingWinner: null,
    whiteGuessStatus: 'idle',
  }
}

export function beginElimination(
  session: GameSession,
  playerId: string,
): GameSession {
  const target = session.players.find((player) => player.id === playerId)
  if (!target) return session

  if (target.role === 'mr-white') {
    return {
      ...session,
      players: eliminatePlayer(session.players, playerId),
      phase: 'elimination',
      eliminatedId: playerId,
      pendingWinner: null,
    }
  }

  const players = eliminatePlayer(session.players, playerId)
  return {
    ...session,
    players,
    phase: 'elimination',
    eliminatedId: playerId,
    pendingWinner: resolveWinner(players),
  }
}

export function roleName(role: 'civilian' | 'undercover' | 'mr-white'): string {
  if (role === 'mr-white') return 'Mr. White'
  if (role === 'undercover') return 'Undercover'
  return 'Civilian'
}

export function winnerCopy(
  winner: Winner,
): { eyebrow: string; title: string; note: string } {
  if (winner.team === 'mr-white') {
    return {
      eyebrow: 'Case cracked',
      title: 'Mr. White wins',
      note: 'One perfect guess turned the whole room upside down.',
    }
  }

  if (winner.team === 'civilians') {
    return {
      eyebrow: 'Cover blown',
      title: 'Civilians win',
      note: 'Every infiltrator has been found and voted out.',
    }
  }

  return {
    eyebrow: 'Mission complete',
    title: 'Infiltrators win',
    note: 'They survived until only one Civilian remained.',
  }
}