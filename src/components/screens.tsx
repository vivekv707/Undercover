import type { CSSProperties, FormEvent } from 'react'
import {
  ArrowRight,
  Check,
  Clock3,
  Dice5,
  Eye,
  EyeOff,
  Hand,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TimerReset,
  Users,
  Vote,
  X,
} from 'lucide-react'
import {
  getActivePlayers,
  MAX_PLAYERS,
  MIN_PLAYERS,
  tallyVotes,
} from '../game/engine'
import { wordPacks } from '../game/packs'
import {
  roleName,
  winnerCopy,
  type GameSession,
} from '../game/session'
import type { GameConfig } from '../game/types'
import { PackCard, PlayerAvatar, Stepper } from './ui'

interface SetupScreenProps {
  config: GameConfig
  error: string | null
  onNameChange: (index: number, name: string) => void
  onAddPlayer: () => void
  onRemovePlayer: (index: number) => void
  onRoleChange: (role: 'undercover' | 'mr-white', amount: number) => void
  onTogglePack: (packId: string) => void
  onDiscussionTimeChange: (seconds: number) => void
  onStart: () => void
}

export function SetupScreen({
  config,
  error,
  onNameChange,
  onAddPlayer,
  onRemovePlayer,
  onRoleChange,
  onTogglePack,
  onDiscussionTimeChange,
  onStart,
}: SetupScreenProps) {
  const infiltratorCount = config.undercoverCount + config.mrWhiteCount
  const maxInfiltrators = config.playerNames.length - 2

  return (
    <main className="setup-layout">
      <section className="poster-panel" aria-labelledby="app-title">
        <div className="poster-copy">
          <span className="eyebrow">Pass & play social deduction</span>
          <h1 id="app-title">
            <span>UNDER</span>
            <span>COVER</span>
          </h1>
          <p>Everybody has a word. Almost everybody.</p>
        </div>
        <img className="poster-mark" src="/undercover-mark.svg" alt="" />
        <div className="poster-stats" aria-label="Game details">
          <span>
            <strong>3-20</strong> players
          </span>
          <span>
            <strong>{wordPacks.length}</strong> packs
          </span>
          <span>
            <strong>1</strong> phone
          </span>
        </div>
      </section>

      <section className="setup-panel" aria-label="Game setup">
        <div className="setup-heading">
          <div>
            <span className="section-number">01</span>
            <h2>Build the crew</h2>
          </div>
          <span className="count-label">{config.playerNames.length} players</span>
        </div>
        <div className="player-inputs">
          {config.playerNames.map((name, index) => (
            <label className="player-input" key={`player-input-${index}`}>
              <PlayerAvatar name={name} index={index} />
              <span className="sr-only">Player {index + 1} name</span>
              <input
                value={name}
                maxLength={24}
                onChange={(event) => onNameChange(index, event.target.value)}
              />
              <button
                type="button"
                onClick={() => onRemovePlayer(index)}
                disabled={config.playerNames.length <= MIN_PLAYERS}
                aria-label={`Remove ${name || `Player ${index + 1}`}`}
              >
                <X aria-hidden="true" />
              </button>
            </label>
          ))}
        </div>
        <button
          className="text-button"
          type="button"
          onClick={onAddPlayer}
          disabled={config.playerNames.length >= MAX_PLAYERS}
        >
          <Plus aria-hidden="true" /> Add player
        </button>

        <div className="setup-heading setup-heading-spaced">
          <div>
            <span className="section-number">02</span>
            <h2>Plant the suspects</h2>
          </div>
          <span className="count-label">{infiltratorCount} hidden</span>
        </div>
        <div className="role-steppers">
          <Stepper
            label="Undercover"
            note="Gets a related word"
            value={config.undercoverCount}
            onDecrease={() => onRoleChange('undercover', -1)}
            onIncrease={() => onRoleChange('undercover', 1)}
            decreaseDisabled={config.undercoverCount === 0 || infiltratorCount === 1}
            increaseDisabled={infiltratorCount >= maxInfiltrators}
          />
          <Stepper
            label="Mr. White"
            note="Gets no word"
            value={config.mrWhiteCount}
            onDecrease={() => onRoleChange('mr-white', -1)}
            onIncrease={() => onRoleChange('mr-white', 1)}
            decreaseDisabled={config.mrWhiteCount === 0 || infiltratorCount === 1}
            increaseDisabled={infiltratorCount >= maxInfiltrators}
          />
        </div>

        <div className="setup-heading setup-heading-spaced">
          <div>
            <span className="section-number">03</span>
            <h2>Pick word packs</h2>
          </div>
          <span className="count-label">{config.packIds.length} selected</span>
        </div>
        <div className="pack-grid">
          {wordPacks.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              selected={config.packIds.includes(pack.id)}
              onToggle={() => onTogglePack(pack.id)}
            />
          ))}
        </div>

        <div className="setup-heading setup-heading-spaced compact-heading">
          <div>
            <span className="section-number">04</span>
            <h2>Set discussion time</h2>
          </div>
        </div>
        <div className="segmented-control" aria-label="Discussion time">
          {[45, 60, 90, 0].map((seconds) => (
            <button
              key={seconds}
              type="button"
              className={config.discussionSeconds === seconds ? 'is-active' : ''}
              onClick={() => onDiscussionTimeChange(seconds)}
            >
              {seconds === 0 ? 'Off' : `${seconds}s`}
            </button>
          ))}
        </div>

        {error && (
          <div className="setup-error" role="alert">
            <ShieldAlert aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="setup-action">
          <button className="button button-primary button-large" type="button" onClick={onStart}>
            Deal secret words <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </section>
    </main>
  )
}

interface RevealScreenProps {
  session: GameSession
  onReveal: () => void
  onFinishReveal: () => void
}

export function RevealScreen({
  session,
  onReveal,
  onFinishReveal,
}: RevealScreenProps) {
  const player = session.players[session.revealIndex]

  return (
    <main className="game-stage reveal-stage">
      <div className="stage-meta">
        <span>Secret handoff</span>
        <span>
          {session.revealIndex + 1} / {session.players.length}
        </span>
      </div>
      <div className="reveal-progress" aria-hidden="true">
        {session.players.map((candidate, index) => (
          <span
            key={candidate.id}
            className={index <= session.revealIndex ? 'is-complete' : ''}
          />
        ))}
      </div>

      {!session.secretVisible ? (
        <section className="handoff-screen scene-enter">
          <div className="handoff-mark">
            <Hand aria-hidden="true" />
          </div>
          <span className="eyebrow">Keep the screen covered</span>
          <h1>
            Pass to
            <br />
            <em>{player.name}</em>
          </h1>
          <p>Only {player.name} should look at the next screen.</p>
          <button className="button button-primary button-large" type="button" onClick={onReveal}>
            <Eye aria-hidden="true" /> Reveal my word
          </button>
        </section>
      ) : (
        <section className="secret-screen scene-enter">
          <div className={`secret-card${player.role === 'mr-white' ? ' is-mr-white' : ''}`}>
            <span className="secret-label">
              {player.role === 'mr-white' ? 'Your role' : 'Your secret word'}
            </span>
            {player.role === 'mr-white' ? (
              <>
                <ShieldAlert aria-hidden="true" />
                <h1>MR. WHITE</h1>
                <p>You have no word. Listen closely, improvise, and blend in.</p>
              </>
            ) : (
              <>
                <Sparkles aria-hidden="true" />
                <h1>{player.word}</h1>
                <p>Memorize it. Nobody else should see this screen.</p>
              </>
            )}
          </div>
          <button className="button button-ink button-large" type="button" onClick={onFinishReveal}>
            <EyeOff aria-hidden="true" />
            {session.revealIndex === session.players.length - 1
              ? 'Hide & begin round'
              : 'Hide & pass on'}
          </button>
        </section>
      )}
    </main>
  )
}

interface ClueScreenProps {
  session: GameSession
  onAdvance: () => void
}

export function ClueScreen({ session, onAdvance }: ClueScreenProps) {
  const currentId = session.speakerOrder[session.speakerIndex]
  const player = session.players.find((candidate) => candidate.id === currentId)
  const nextId = session.speakerOrder[session.speakerIndex + 1]
  const nextPlayer = session.players.find((candidate) => candidate.id === nextId)

  if (!player) return null

  return (
    <main className="game-stage clue-stage">
      <div className="stage-meta">
        <span>Round {session.round} / Clues</span>
        <span>
          {session.speakerIndex + 1} / {session.speakerOrder.length}
        </span>
      </div>
      <section className="speaker-board scene-enter">
        <span className="eyebrow">Give one careful clue</span>
        <PlayerAvatar
          name={player.name}
          index={session.players.findIndex((candidate) => candidate.id === player.id)}
        />
        <h1>{player.name}</h1>
        <p>Say one word or a short phrase. Be useful, but not too obvious.</p>
        {nextPlayer && (
          <div className="up-next">
            <span>Up next</span>
            <strong>{nextPlayer.name}</strong>
          </div>
        )}
        <button className="button button-primary button-large" type="button" onClick={onAdvance}>
          <Check aria-hidden="true" />
          {nextPlayer ? 'Clue given' : 'Start discussion'}
        </button>
      </section>
      <div className="turn-rail" aria-label="Clue order">
        {session.speakerOrder.map((playerId, index) => {
          const candidate = session.players.find((item) => item.id === playerId)!
          const stateClass =
            index === session.speakerIndex
              ? 'is-current'
              : index < session.speakerIndex
                ? 'is-done'
                : ''
          return (
            <span key={playerId} className={stateClass}>
              {candidate.name}
            </span>
          )
        })}
      </div>
    </main>
  )
}

interface DiscussionScreenProps {
  session: GameSession
  onToggleTimer: () => void
  onAddTime: () => void
  onStartVote: () => void
}

export function DiscussionScreen({
  session,
  onToggleTimer,
  onAddTime,
  onStartVote,
}: DiscussionScreenProps) {
  const total = session.config.discussionSeconds || 1
  const progress = Math.max(0, Math.min(1, session.discussionRemaining / total))
  const activeCount = getActivePlayers(session.players).length

  return (
    <main className="game-stage discussion-stage">
      <div className="stage-meta">
        <span>Round {session.round} / Discussion</span>
        <span>{activeCount} still in</span>
      </div>
      <section className="discussion-board scene-enter">
        <span className="eyebrow">Compare notes. Watch reactions.</span>
        <h1>
          Who doesn't
          <br />
          <em>belong?</em>
        </h1>
        <div
          className={`timer-dial${session.discussionRemaining === 0 ? ' is-finished' : ''}`}
          style={{ '--timer-progress': `${progress * 360}deg` } as CSSProperties}
        >
          <Clock3 aria-hidden="true" />
          <strong>
            {session.config.discussionSeconds === 0
              ? 'No limit'
              : `${Math.floor(session.discussionRemaining / 60)}:${String(
                  session.discussionRemaining % 60,
                ).padStart(2, '0')}`}
          </strong>
          <span>
            {session.discussionRemaining === 0 && session.config.discussionSeconds > 0
              ? 'Time'
              : 'Talk it out'}
          </span>
        </div>
        {session.config.discussionSeconds > 0 && (
          <div className="timer-actions">
            <button className="icon-text-button" type="button" onClick={onToggleTimer}>
              {session.timerRunning ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              {session.timerRunning ? 'Pause' : 'Resume'}
            </button>
            <button className="icon-text-button" type="button" onClick={onAddTime}>
              <TimerReset aria-hidden="true" /> +30 sec
            </button>
          </div>
        )}
        <button className="button button-primary button-large" type="button" onClick={onStartVote}>
          <Vote aria-hidden="true" /> Start secret vote
        </button>
      </section>
    </main>
  )
}

interface VoteScreenProps {
  session: GameSession
  onReady: () => void
  onSelect: (playerId: string) => void
  onLock: () => void
}

export function VoteScreen({ session, onReady, onSelect, onLock }: VoteScreenProps) {
  const activePlayers = getActivePlayers(session.players)
  const voterId = session.voterOrder[session.voterIndex]
  const voter = session.players.find((player) => player.id === voterId)
  if (!voter) return null

  const targetIds = session.voteTargetIds ?? activePlayers.map((player) => player.id)
  const candidates = activePlayers.filter(
    (player) => player.id !== voter.id && targetIds.includes(player.id),
  )

  return (
    <main className="game-stage vote-stage">
      <div className="stage-meta">
        <span>Round {session.round} / Secret vote</span>
        <span>
          {session.voterIndex + 1} / {session.voterOrder.length}
        </span>
      </div>
      {!session.voteReady ? (
        <section className="handoff-screen scene-enter">
          <div className="handoff-mark vote-mark">
            <Vote aria-hidden="true" />
          </div>
          <span className="eyebrow">No peeking</span>
          <h1>
            Pass to
            <br />
            <em>{voter.name}</em>
          </h1>
          <p>{voter.name} will cast the next private vote.</p>
          <button className="button button-primary button-large" type="button" onClick={onReady}>
            <Eye aria-hidden="true" /> I'm ready
          </button>
        </section>
      ) : (
        <section className="ballot scene-enter">
          <span className="eyebrow">{voter.name}, choose one</span>
          <h1>
            Who gets
            <br />
            <em>your vote?</em>
          </h1>
          <div className="candidate-grid">
            {candidates.map((player) => {
              const playerIndex = session.players.findIndex(
                (candidate) => candidate.id === player.id,
              )
              return (
                <button
                  type="button"
                  key={player.id}
                  className={session.selectedVote === player.id ? 'is-selected' : ''}
                  onClick={() => onSelect(player.id)}
                >
                  <PlayerAvatar name={player.name} index={playerIndex} />
                  <strong>{player.name}</strong>
                  <Check aria-hidden="true" />
                </button>
              )
            })}
          </div>
          <button
            className="button button-ink button-large"
            type="button"
            onClick={onLock}
            disabled={!session.selectedVote}
          >
            Lock my vote <ArrowRight aria-hidden="true" />
          </button>
        </section>
      )}
    </main>
  )
}

interface TieScreenProps {
  session: GameSession
  onRevote: () => void
  onDraw: () => void
}

export function TieScreen({ session, onRevote, onDraw }: TieScreenProps) {
  const totals = tallyVotes(session.votes)

  return (
    <main className="game-stage tie-stage">
      <div className="stage-meta">
        <span>Round {session.round} / Deadlock</span>
        <span>{session.tieIds.length} tied</span>
      </div>
      <section className="tie-board scene-enter">
        <Dice5 aria-hidden="true" />
        <span className="eyebrow">The room is split</span>
        <h1>It's a tie.</h1>
        <div className="tie-list">
          {session.tieIds.map((playerId) => {
            const player = session.players.find((candidate) => candidate.id === playerId)!
            return (
              <div key={playerId}>
                <strong>{player.name}</strong>
                <span>{totals[playerId]} votes</span>
              </div>
            )
          })}
        </div>
        <div className="button-row">
          <button className="button button-primary" type="button" onClick={onRevote}>
            <RotateCcw aria-hidden="true" /> Revote
          </button>
          <button className="button button-ghost" type="button" onClick={onDraw}>
            <Dice5 aria-hidden="true" /> Draw a name
          </button>
        </div>
      </section>
    </main>
  )
}

interface EliminationScreenProps {
  session: GameSession
  onContinue: () => void
}

export function EliminationScreen({
  session,
  onContinue,
}: EliminationScreenProps) {
  const player = session.players.find((candidate) => candidate.id === session.eliminatedId)
  if (!player) return null

  const activeCount = getActivePlayers(session.players).length
  return (
    <main className={`game-stage elimination-stage role-${player.role}`}>
      <div className="stage-meta">
        <span>Round {session.round} / Verdict</span>
        <span>{activeCount} still in</span>
      </div>
      <section className="verdict-board scene-enter">
        <span className="eyebrow">The room voted out</span>
        <PlayerAvatar
          name={player.name}
          index={session.players.findIndex((candidate) => candidate.id === player.id)}
        />
        <h1>{player.name}</h1>
        <div className="role-reveal">
          <span>was</span>
          <strong>{roleName(player.role)}</strong>
        </div>
        <button className="button button-ink button-large" type="button" onClick={onContinue}>
          {player.role === 'mr-white' ? (
            <>
              Take the final guess <ArrowRight aria-hidden="true" />
            </>
          ) : session.pendingWinner ? (
            <>
              See the result <ArrowRight aria-hidden="true" />
            </>
          ) : (
            <>
              Start round {session.round + 1} <ArrowRight aria-hidden="true" />
            </>
          )}
        </button>
      </section>
    </main>
  )
}

interface GuessScreenProps {
  session: GameSession
  guess: string
  onGuessChange: (guess: string) => void
  onSubmit: (event: FormEvent) => void
  onContinue: () => void
}

export function GuessScreen({
  session,
  guess,
  onGuessChange,
  onSubmit,
  onContinue,
}: GuessScreenProps) {
  const player = session.players.find((candidate) => candidate.id === session.eliminatedId)
  if (!player) return null

  return (
    <main className="game-stage guess-stage">
      <div className="stage-meta">
        <span>Mr. White / Last chance</span>
        <span>One guess</span>
      </div>
      {session.whiteGuessStatus === 'idle' ? (
        <form className="guess-board scene-enter" onSubmit={onSubmit}>
          <ShieldAlert aria-hidden="true" />
          <span className="eyebrow">Crack the Civilian word</span>
          <h1>
            {player.name},
            <br />
            <em>what is it?</em>
          </h1>
          <label>
            <span className="sr-only">Civilian word guess</span>
            <input
              autoFocus
              value={guess}
              maxLength={40}
              placeholder="Type one guess"
              onChange={(event) => onGuessChange(event.target.value)}
            />
          </label>
          <button className="button button-ink button-large" type="submit" disabled={!guess.trim()}>
            Make the guess <ArrowRight aria-hidden="true" />
          </button>
        </form>
      ) : (
        <section className="guess-board wrong-guess scene-enter">
          <X aria-hidden="true" />
          <span className="eyebrow">Not quite</span>
          <h1>
            The cover
            <br />
            <em>holds.</em>
          </h1>
          <p>Mr. White is out. The Civilian word stays secret.</p>
          <button className="button button-primary button-large" type="button" onClick={onContinue}>
            {session.pendingWinner ? 'See the result' : `Start round ${session.round + 1}`}
            <ArrowRight aria-hidden="true" />
          </button>
        </section>
      )}
    </main>
  )
}

interface ResultScreenProps {
  session: GameSession
  onReplay: () => void
  onSetup: () => void
}

export function ResultScreen({ session, onReplay, onSetup }: ResultScreenProps) {
  if (!session.winner) return null

  const copy = winnerCopy(session.winner)
  const activePack = wordPacks.find((pack) => pack.id === session.packId)

  return (
    <main className={`game-stage result-stage winner-${session.winner.team}`}>
      <section className="result-hero scene-enter">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p>{copy.note}</p>
      </section>
      <section className="case-file">
        <div className="case-heading">
          <span>Case file / {activePack?.name}</span>
          <strong>Round {session.round}</strong>
        </div>
        <div className="word-recap">
          <div>
            <span>Civilian word</span>
            <strong>{session.pair.civilian}</strong>
          </div>
          <div>
            <span>Undercover word</span>
            <strong>{session.pair.undercover}</strong>
          </div>
        </div>
        <div className="lineup">
          {session.players.map((player, index) => (
            <div key={player.id}>
              <PlayerAvatar name={player.name} index={index} eliminated={player.isEliminated} />
              <span>
                <strong>{player.name}</strong>
                <small>{roleName(player.role)}</small>
              </span>
            </div>
          ))}
        </div>
      </section>
      <div className="result-actions">
        <button className="button button-primary button-large" type="button" onClick={onReplay}>
          <RotateCcw aria-hidden="true" /> Same crew, new words
        </button>
        <button className="button button-ghost button-large" type="button" onClick={onSetup}>
          <Users aria-hidden="true" /> Change setup
        </button>
      </div>
    </main>
  )
}