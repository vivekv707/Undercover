import type {
  GameConfig,
  Player,
  Role,
  StartedGame,
  Votes,
  Winner,
  WordPack,
} from './types'

export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 20

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }

  return result
}

export function validateConfig(config: GameConfig): string | null {
  const playerCount = config.playerNames.length
  const infiltratorCount = config.undercoverCount + config.mrWhiteCount

  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    return `Add between ${MIN_PLAYERS} and ${MAX_PLAYERS} players.`
  }

  if (infiltratorCount < 1) {
    return 'Add at least one Undercover or Mr. White.'
  }

  if (infiltratorCount > playerCount - 2) {
    return 'Keep at least two Civilian players in the game.'
  }

  if (config.packIds.length === 0) {
    return 'Choose at least one word pack.'
  }

  return null
}

export function createGame(
  config: GameConfig,
  packs: WordPack[],
  usedPairKeys: Set<string> = new Set(),
  random: () => number = Math.random,
): StartedGame {
  const validationError = validateConfig(config)

  if (validationError) {
    throw new Error(validationError)
  }

  const selectedPacks = packs.filter((pack) => config.packIds.includes(pack.id))
  const allCandidates = selectedPacks.flatMap((pack) =>
    pack.pairs.map((pair) => ({
      pair,
      packId: pack.id,
      pairKey: `${pack.id}:${pair.civilian}:${pair.undercover}`,
    })),
  )

  if (allCandidates.length === 0) {
    throw new Error('The selected word packs could not be found.')
  }

  const unseenCandidates = allCandidates.filter(
    (candidate) => !usedPairKeys.has(candidate.pairKey),
  )
  const candidates = unseenCandidates.length > 0 ? unseenCandidates : allCandidates
  const selected = candidates[Math.floor(random() * candidates.length)]

  const roles: Role[] = [
    ...Array<Role>(config.undercoverCount).fill('undercover'),
    ...Array<Role>(config.mrWhiteCount).fill('mr-white'),
    ...Array<Role>(
      config.playerNames.length - config.undercoverCount - config.mrWhiteCount,
    ).fill('civilian'),
  ]
  const shuffledRoles = shuffle(roles, random)
  const players = config.playerNames.map((name, index): Player => {
    const role = shuffledRoles[index]

    return {
      id: `player-${index + 1}`,
      name: name.trim() || `Player ${index + 1}`,
      role,
      word:
        role === 'mr-white'
          ? null
          : role === 'undercover'
            ? selected.pair.undercover
            : selected.pair.civilian,
      isEliminated: false,
    }
  })

  return {
    players,
    pair: selected.pair,
    pairKey: selected.pairKey,
    packId: selected.packId,
  }
}

export function getActivePlayers(players: Player[]): Player[] {
  return players.filter((player) => !player.isEliminated)
}

export function createSpeakerOrder(
  players: Player[],
  random: () => number = Math.random,
): string[] {
  const activePlayers = getActivePlayers(players)
  const starterIndex = Math.floor(random() * activePlayers.length)

  return [
    ...activePlayers.slice(starterIndex),
    ...activePlayers.slice(0, starterIndex),
  ].map((player) => player.id)
}

export function tallyVotes(votes: Votes): Record<string, number> {
  return Object.values(votes).reduce<Record<string, number>>((totals, playerId) => {
    totals[playerId] = (totals[playerId] ?? 0) + 1
    return totals
  }, {})
}

export function getVoteLeaders(votes: Votes): string[] {
  const totals = tallyVotes(votes)
  const highestTotal = Math.max(0, ...Object.values(totals))

  return Object.entries(totals)
    .filter(([, total]) => total === highestTotal)
    .map(([playerId]) => playerId)
}

export function eliminatePlayer(players: Player[], playerId: string): Player[] {
  return players.map((player) =>
    player.id === playerId ? { ...player, isEliminated: true } : player,
  )
}

export function resolveWinner(players: Player[]): Winner | null {
  const activePlayers = getActivePlayers(players)
  const civilianCount = activePlayers.filter(
    (player) => player.role === 'civilian',
  ).length
  const infiltratorCount = activePlayers.length - civilianCount

  if (infiltratorCount === 0) {
    return { team: 'civilians', reason: 'all-infiltrators-out' }
  }

  if (civilianCount <= 1) {
    return { team: 'infiltrators', reason: 'one-civilian-left' }
  }

  return null
}

function normalizeGuess(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function isCorrectMrWhiteGuess(guess: string, civilianWord: string): boolean {
  return normalizeGuess(guess) === normalizeGuess(civilianWord)
}

export function getSuggestedInfiltratorCount(playerCount: number): number {
  if (playerCount <= 5) return 1
  if (playerCount <= 8) return 2
  if (playerCount <= 12) return 3
  if (playerCount <= 16) return 4
  return 5
}