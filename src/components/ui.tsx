import { useEffect, type ReactNode } from 'react'
import {
  Check,
  CircleHelp,
  Download,
  Minus,
  Plus,
  ShieldQuestion,
  X,
} from 'lucide-react'
import type { WordPack } from '../game/types'

interface AppHeaderProps {
  onHelp: () => void
  onInstall?: () => void
  onExit?: () => void
}

export function AppHeader({ onHelp, onInstall, onExit }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-lockup" aria-label="Undercover">
        <img src="/undercover-mark.svg" alt="" />
        <div>
          <strong>UNDERCOVER</strong>
          <span>Pass & play</span>
        </div>
      </div>
      <div className="header-actions">
        {onInstall && (
          <button
            className="icon-button"
            type="button"
            onClick={onInstall}
            aria-label="Install app"
            title="Install app"
          >
            <Download aria-hidden="true" />
          </button>
        )}
        <button
          className="icon-button"
          type="button"
          onClick={onHelp}
          aria-label="How to play"
          title="How to play"
        >
          <CircleHelp aria-hidden="true" />
        </button>
        {onExit && (
          <button
            className="icon-button"
            type="button"
            onClick={onExit}
            aria-label="Leave game"
            title="Leave game"
          >
            <X aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  )
}

interface StepperProps {
  label: string
  note: string
  value: number
  onDecrease: () => void
  onIncrease: () => void
  decreaseDisabled?: boolean
  increaseDisabled?: boolean
}

export function Stepper({
  label,
  note,
  value,
  onDecrease,
  onIncrease,
  decreaseDisabled,
  increaseDisabled,
}: StepperProps) {
  return (
    <div className="stepper">
      <div className="stepper-copy">
        <strong>{label}</strong>
        <span>{note}</span>
      </div>
      <div className="stepper-control">
        <button
          type="button"
          onClick={onDecrease}
          disabled={decreaseDisabled}
          aria-label={`Remove one ${label}`}
        >
          <Minus aria-hidden="true" />
        </button>
        <output aria-label={`${label} count`}>{value}</output>
        <button
          type="button"
          onClick={onIncrease}
          disabled={increaseDisabled}
          aria-label={`Add one ${label}`}
        >
          <Plus aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

interface PackCardProps {
  pack: WordPack
  selected: boolean
  onToggle: () => void
}

export function PackCard({ pack, selected, onToggle }: PackCardProps) {
  return (
    <button
      className={`pack-card pack-${pack.tone}${selected ? ' is-selected' : ''}`}
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
    >
      <span className="pack-stamp" aria-hidden="true">
        {pack.stamp}
      </span>
      <span className="pack-copy">
        <strong>{pack.name}</strong>
        <span>{pack.description}</span>
      </span>
      <span className="pack-meta">{pack.pairs.length} pairs</span>
      <span className="pack-check" aria-hidden="true">
        <Check />
      </span>
    </button>
  )
}

interface ModalProps {
  title: string
  children: ReactNode
  onClose: () => void
  actions?: ReactNode
}

export function Modal({ title, children, onClose, actions }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <ShieldQuestion aria-hidden="true" />
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </section>
    </div>
  )
}

interface PlayerAvatarProps {
  name: string
  index: number
  eliminated?: boolean
}

export function PlayerAvatar({ name, index, eliminated }: PlayerAvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <span
      className={`player-avatar avatar-${(index % 5) + 1}${eliminated ? ' is-out' : ''}`}
      aria-hidden="true"
    >
      {initials || index + 1}
    </span>
  )
}