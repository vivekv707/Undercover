export type Role = 'civilian' | 'undercover' | 'mr-white'

export type WinnerTeam = 'civilians' | 'infiltrators' | 'mr-white'

export type PackTone =
  | 'coral'
  | 'yellow'
  | 'cyan'
  | 'green'
  | 'pink'
  | 'blue'
  | 'orange'
  | 'violet'

export interface WordPair {
  civilian: string
  undercover: string
}

export interface WordPack {
  id: string
  name: string
  description: string
  tone: PackTone
  stamp: string
  pairs: WordPair[]
}

export interface GameConfig {
  playerNames: string[]
  undercoverCount: number
  mrWhiteCount: number
  packIds: string[]
  discussionSeconds: number
}

export interface Player {
  id: string
  name: string
  role: Role
  word: string | null
  isEliminated: boolean
}

export interface StartedGame {
  players: Player[]
  pair: WordPair
  pairKey: string
  packId: string
}

export interface Winner {
  team: WinnerTeam
  reason: 'all-infiltrators-out' | 'one-civilian-left' | 'word-guessed'
}

export type Votes = Record<string, string>