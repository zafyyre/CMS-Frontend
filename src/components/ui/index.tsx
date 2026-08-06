import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cx } from '@/lib/format'

/* ── Button ─────────────────────────────────────────────────── */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 ' +
  'active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--accent-contrast)] hover:brightness-110 shadow-[0_8px_24px_-10px_var(--accent)]',
  secondary: 'bg-surface-3 text-base-c hover:bg-[var(--border-strong)]',
  outline: 'border border-[var(--border-strong)] text-base-c hover:bg-surface-2',
  ghost: 'text-muted hover:text-base-c hover:bg-surface-2',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3.5 text-xs',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-7 text-[0.95rem]',
}

interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  to?: string
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  'aria-label'?: string
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  to,
  href,
  onClick,
  type = 'button',
  disabled,
  ...rest
}: ButtonProps) {
  const classes = cx(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </a>
    )
  }
  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}

/* ── Chip / segmented filter ────────────────────────────────── */
export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'shrink-0 rounded-full px-3.5 h-8 text-[0.8rem] font-semibold transition-all duration-200 border',
        active
          ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-transparent shadow-[0_6px_18px_-8px_var(--accent)]'
          : 'bg-surface-2 text-muted border-[var(--border)] hover:text-base-c hover:border-[var(--border-strong)]',
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ── Badge ──────────────────────────────────────────────────── */
type BadgeTone = 'neutral' | 'success' | 'danger' | 'warn' | 'info' | 'accent'

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-3 text-muted',
  success: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400',
  danger: 'bg-rose-500/15 text-rose-500 dark:text-rose-400',
  warn: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  info: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  accent: 'bg-[var(--accent)]/15 text-accent',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ── Select ─────────────────────────────────────────────────── */
export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  label?: string
  className?: string
}) {
  return (
    <label className={cx('relative block', className)}>
      {label && (
        <span className="mb-1.5 block text-[0.7rem] font-bold uppercase tracking-wider text-faint">{label}</span>
      )}
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full appearance-none rounded-xl border border-[var(--border)] bg-surface-2 py-2.5 pl-3.5 pr-10 text-sm font-semibold text-base-c transition-colors hover:border-[var(--border-strong)] focus:border-[var(--accent)]"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-faint"
        />
      </span>
    </label>
  )
}

/* ── Section scaffolding ────────────────────────────────────── */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        )}
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8', className)}>{children}</div>
}

/* ── Empty + loading states ─────────────────────────────────── */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] px-6 py-16 text-center">
      {icon && <div className="mb-4 text-faint">{icon}</div>}
      <p className="font-display text-lg font-bold">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('shimmer rounded-lg', className)} />
}

/* ── Form guide pills ───────────────────────────────────────── */
export function FormGuide({ form, size = 'md' }: { form: ('W' | 'D' | 'L')[]; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-5 w-5 text-[0.6rem]' : 'h-6 w-6 text-[0.68rem]'
  const tone = {
    W: 'bg-emerald-500 text-white',
    D: 'bg-[var(--border-strong)] text-[var(--text)]',
    L: 'bg-rose-500 text-white',
  }
  return (
    <div className="flex gap-1" aria-label={`Recent form: ${form.join(', ') || 'no matches played'}`}>
      {form.length === 0 && <span className="text-xs text-faint">—</span>}
      {form.map((r, i) => (
        <span
          key={i}
          className={cx(
            'inline-flex items-center justify-center rounded-md font-bold',
            dim,
            tone[r],
            i === form.length - 1 && 'ring-2 ring-[var(--accent)]/40',
          )}
          title={r === 'W' ? 'Win' : r === 'D' ? 'Draw' : 'Loss'}
        >
          {r}
        </span>
      ))}
    </div>
  )
}

/* ── Movement arrow for table position changes ──────────────── */
export function Movement({ value }: { value: number }) {
  if (value === 0) return <span className="text-faint" aria-label="No change">·</span>
  const up = value > 0
  return (
    <span
      className={cx('inline-flex items-center text-[0.7rem] font-bold', up ? 'text-emerald-500' : 'text-rose-500')}
      aria-label={`${up ? 'Up' : 'Down'} ${Math.abs(value)}`}
    >
      {up ? '▲' : '▼'}
      {Math.abs(value)}
    </span>
  )
}
