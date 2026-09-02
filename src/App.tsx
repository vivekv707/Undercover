import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Clock3, MessageCircle, UserRound } from 'lucide-react'
import {
  ClueScreen,
  DiscussionScreen,
  EliminationScreen,
  GuessScreen,
  ResultScreen,
  RevealScreen,
  SetupScreen,
  TieScreen,
  VoteScreen,
} from './components/screens'
import { AppHeader, Modal } from './components/ui'
import {
  eliminatePlayer,
  getActivePlayers,
  getVoteLeaders,
  isCorrectMrWhiteGuess,
  MAX_PLAYERS,
  MIN_PLAYERS,
  resolveWinner,
  validateConfig,
} from './game/engine'
import { wordPacks } from './game/packs'
import {
  beginElimination,
  beginRound,
  createSession,
  loadConfig,
  loadSession,
  SESSION_STORAGE_KEY,
  SETUP_STORAGE_KEY,
  type GameSession,
} from './game/session'
import type { GameConfig } from './game/types'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function App() {
  const [config, setConfig] = useState<GameConfig>(loadConfig)
  const [session, setSession] = useState<GameSession | null>(loadSession)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [openModal, setOpenModal] = useState<'rules' | 'exit' | null>(null)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  )
  const [whiteGuess, setWhiteGuess] = useState('')

  useEffect(() => {
    localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(config))
  }, [config])

  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }, [session])

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
  }, [])

  useEffect(() => {
    if (session?.phase !== 'discussion' || !session.timerRunning) return

    const timer = window.setInterval(() => {
      setSession((current) => {
        if (!current || current.phase !== 'discussion') return current
        const remaining = Math.max(0, current.discussionRemaining - 1)
        return { ...current, discussionRemaining: remaining, timerRunning: remaining > 0 }
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [session?.phase, session?.timerRunning])

  const vibrate = (pattern: number | number[] = 20) => {
    navigator.vibrate?.(pattern)
  }

  const startGame = (nextConfig = config) => {
    const error = validateConfig(nextConfig)
    if (error) {
      setSetupError(error)
      return
    }

    try {
      setConfig(nextConfig)
      setSession(createSession(nextConfig))
      setSetupError(null)
      setWhiteGuess('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : 'Could not start the game.')
    }
  }

  const updatePlayerName = (index: number, name: string) => {
    setConfig((current) => ({
      ...current,
      playerNames: current.playerNames.map((playerName, playerIndex) =>
        playerIndex === index ? name : playerName,
      ),
    }))
  }

  const addPlayer = () => {
    setConfig((current) => {
      if (current.playerNames.length >= MAX_PLAYERS) return current
      return {
        ...current,
        playerNames: [
          ...current.playerNames,
          `Player ${current.playerNames.length + 1}`,
        ],
      }
    })
  }

  const removePlayer = (index: number) => {
    setConfig((current) => {
      if (current.playerNames.length <= MIN_PLAYERS) return current
      const playerNames = current.playerNames.filter((_, playerIndex) => playerIndex !== index)
      let undercoverCount = current.undercoverCount
      let mrWhiteCount = current.mrWhiteCount

      while (undercoverCount + mrWhiteCount > playerNames.length - 2) {
        if (mrWhiteCount > 0) mrWhiteCount -= 1
        else undercoverCount -= 1
      }

      return { ...current, playerNames, undercoverCount, mrWhiteCount }
    })
  }

  const changeRoleCount = (role: 'undercover' | 'mr-white', amount: number) => {
    setConfig((current) => {
      const key = role === 'undercover' ? 'undercoverCount' : 'mrWhiteCount'
      const otherCount =
        role === 'undercover' ? current.mrWhiteCount : current.undercoverCount
      const nextValue = current[key] + amount

      if (nextValue < 0 || nextValue + otherCount > current.playerNames.length - 2) {
        return current
      }

      if (nextValue + otherCount < 1) return current
      return { ...current, [key]: nextValue }
    })
  }

  const togglePack = (packId: string) => {
    setConfig((current) => ({
      ...current,
      packIds: current.packIds.includes(packId)
        ? current.packIds.filter((id) => id !== packId)
        : [...current.packIds, packId],
    }))
  }

  const revealSecret = () => {
    vibrate()
    setSession((current) => (current ? { ...current, secretVisible: true } : current))
  }

  const finishReveal = () => {
    setSession((current) => {
      if (!current) return current
      if (current.revealIndex < current.players.length - 1) {
        return {
          ...current,
          revealIndex: current.revealIndex + 1,
          secretVisible: false,
        }
      }

      return beginRound({ ...current, secretVisible: false }, 1)
    })
  }

  const advanceSpeaker = () => {
    setSession((current) => {
      if (!current) return current
      if (current.speakerIndex < current.speakerOrder.length - 1) {
        return { ...current, speakerIndex: current.speakerIndex + 1 }
      }

      return {
        ...current,
        phase: 'discussion',
        discussionRemaining: current.config.discussionSeconds,
        timerRunning: current.config.discussionSeconds > 0,
      }
    })
  }

  const startVote = () => {
    setSession((current) => {
      if (!current) return current
      const voterOrder = getActivePlayers(current.players).map((player) => player.id)
      return {
        ...current,
        phase: 'vote',
        timerRunning: false,
        voterOrder,
        voterIndex: 0,
        voteReady: false,
        votes: {},
        voteTargetIds: null,
        selectedVote: null,
      }
    })
  }

  const lockVote = () => {
    vibrate()
    setSession((current) => {
      if (!current || !current.selectedVote) return current
      const voterId = current.voterOrder[current.voterIndex]
      const votes = { ...current.votes, [voterId]: current.selectedVote }

      if (current.voterIndex < current.voterOrder.length - 1) {
        return {
          ...current,
          votes,
          voterIndex: current.voterIndex + 1,
          voteReady: false,
          selectedVote: null,
        }
      }

      const leaders = getVoteLeaders(votes)
      if (leaders.length > 1) {
        return {
          ...current,
          phase: 'tie',
          votes,
          tieIds: leaders,
          selectedVote: null,
        }
      }

      return beginElimination({ ...current, votes, selectedVote: null }, leaders[0])
    })
  }

  const revote = () => {
    setSession((current) =>
      current
        ? {
            ...current,
            phase: 'vote',
            voterIndex: 0,
            voteReady: false,
            votes: {},
            voteTargetIds: current.tieIds,
            selectedVote: null,
          }
        : current,
    )
  }

  const drawTiebreaker = () => {
    setSession((current) => {
      if (!current || current.tieIds.length === 0) return current
      const playerId = current.tieIds[Math.floor(Math.random() * current.tieIds.length)]
      return beginElimination(current, playerId)
    })
  }

  const continueAfterElimination = () => {
    setSession((current) => {
      if (!current || !current.eliminatedId) return current
      const eliminated = current.players.find(
        (player) => player.id === current.eliminatedId,
      )

      if (eliminated?.role === 'mr-white') {
        return { ...current, phase: 'mr-white-guess', whiteGuessStatus: 'idle' }
      }

      if (current.pendingWinner) {
        return { ...current, phase: 'result', winner: current.pendingWinner }
      }

      return beginRound(current, current.round + 1)
    })
  }

  const submitWhiteGuess = (event: FormEvent) => {
    event.preventDefault()
    if (!session || !session.eliminatedId || !whiteGuess.trim()) return

    if (isCorrectMrWhiteGuess(whiteGuess, session.pair.civilian)) {
      vibrate([30, 40, 80])
      setSession({
        ...session,
        phase: 'result',
        winner: { team: 'mr-white', reason: 'word-guessed' },
      })
      return
    }

    vibrate([60, 30, 60])
    const players = eliminatePlayer(session.players, session.eliminatedId)
    setSession({
      ...session,
      players,
      whiteGuessStatus: 'wrong',
      pendingWinner: resolveWinner(players),
    })
  }

  const continueAfterWrongGuess = () => {
    setWhiteGuess('')
    setSession((current) => {
      if (!current) return current
      if (current.pendingWinner) {
        return { ...current, phase: 'result', winner: current.pendingWinner }
      }

      return beginRound(current, current.round + 1)
    })
  }

  const abandonGame = () => {
    setSession(null)
    setOpenModal(null)
    setWhiteGuess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const installApp = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const rulesModal = openModal === 'rules' && (
    <Modal title="How to play" onClose={() => setOpenModal(null)}>
      <div className="rules-list">
        <div>
          <span className="rule-number">01</span>
          <p>Pass the phone so everyone can privately check their word.</p>
        </div>
        <div>
          <span className="rule-number">02</span>
          <p>Take turns giving one careful clue, then discuss who feels out of place.</p>
        </div>
        <div>
          <span className="rule-number">03</span>
          <p>Vote in secret. The player with the most votes is out.</p>
        </div>
      </div>
      <div className="role-rules">
        <p>
          <strong>Civilians</strong> share one word and hunt every infiltrator.
        </p>
        <p>
          <strong>Undercovers</strong> get a related word and try to blend in.
        </p>
        <p>
          <strong>Mr. White</strong> gets no word, but can win by guessing the Civilian
          word.
        </p>
      </div>
    </Modal>
  )

  const exitModal = openModal === 'exit' && (
    <Modal
      title="Leave this game?"
      onClose={() => setOpenModal(null)}
      actions={
        <>
          <button
            className="button button-ghost"
            type="button"
            onClick={() => setOpenModal(null)}
          >
            Keep playing
          </button>
          <button className="button button-danger" type="button" onClick={abandonGame}>
            Leave game
          </button>
        </>
      }
    >
      <p>The current round and its secret words will be cleared from this device.</p>
    </Modal>
  )

  if (!session) {
    return (
      <div className="app setup-app">
        <AppHeader
          onHelp={() => setOpenModal('rules')}
          onInstall={installPrompt ? installApp : undefined}
        />
        <SetupScreen
          config={config}
          error={setupError}
          onNameChange={updatePlayerName}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
          onRoleChange={changeRoleCount}
          onTogglePack={togglePack}
          onDiscussionTimeChange={(seconds) =>
            setConfig((current) => ({ ...current, discussionSeconds: seconds }))
          }
          onStart={() => startGame()}
        />
        {rulesModal}
      </div>
    )
  }

  let content: ReactNode = null

  if (session.phase === 'reveal') {
    content = (
      <RevealScreen session={session} onReveal={revealSecret} onFinishReveal={finishReveal} />
    )
  } else if (session.phase === 'clues') {
    content = <ClueScreen session={session} onAdvance={advanceSpeaker} />
  } else if (session.phase === 'discussion') {
    content = (
      <DiscussionScreen
        session={session}
        onToggleTimer={() =>
          setSession((current) =>
            current ? { ...current, timerRunning: !current.timerRunning } : current,
          )
        }
        onAddTime={() =>
          setSession((current) =>
            current
              ? {
                  ...current,
                  discussionRemaining: current.discussionRemaining + 30,
                  timerRunning: true,
                }
              : current,
          )
        }
        onStartVote={startVote}
      />
    )
  } else if (session.phase === 'vote') {
    content = (
      <VoteScreen
        session={session}
        onReady={() => setSession({ ...session, voteReady: true })}
        onSelect={(playerId) => setSession({ ...session, selectedVote: playerId })}
        onLock={lockVote}
      />
    )
  } else if (session.phase === 'tie') {
    content = <TieScreen session={session} onRevote={revote} onDraw={drawTiebreaker} />
  } else if (session.phase === 'elimination') {
    content = <EliminationScreen session={session} onContinue={continueAfterElimination} />
  } else if (session.phase === 'mr-white-guess') {
    content = (
      <GuessScreen
        session={session}
        guess={whiteGuess}
        onGuessChange={setWhiteGuess}
        onSubmit={submitWhiteGuess}
        onContinue={continueAfterWrongGuess}
      />
    )
  } else if (session.phase === 'result') {
    content = (
      <ResultScreen
        session={session}
        onReplay={() => startGame(session.config)}
        onSetup={abandonGame}
      />
    )
  }

  const activePlayers = getActivePlayers(session.players)
  const activePack = wordPacks.find((pack) => pack.id === session.packId)

  return (
    <div className={`app game-app phase-${session.phase}`}>
      <AppHeader
        onHelp={() => setOpenModal('rules')}
        onInstall={installPrompt ? installApp : undefined}
        onExit={() => setOpenModal('exit')}
      />
      {content}
      <footer className="game-footer">
        <span>
          <UserRound aria-hidden="true" /> {activePlayers.length} in
        </span>
        <span>
          <MessageCircle aria-hidden="true" /> Round {session.round}
        </span>
        <span>
          <Clock3 aria-hidden="true" /> {activePack?.name}
        </span>
      </footer>
      {rulesModal}
      {exitModal}
    </div>
  )
}

export default App
