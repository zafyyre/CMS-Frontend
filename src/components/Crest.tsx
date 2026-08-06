import { clubById } from '@/data/league'
import { teamById } from '@/data/engine'
import { contrastOn, cx } from '@/lib/format'

interface CrestProps {
  clubId?: string
  teamId?: string
  size?: number
  className?: string
  /** Adds a soft coloured glow behind the crest. */
  glow?: boolean
}

/**
 * Crests are generated from each club's colour pair rather than loaded as
 * images — no network requests, and every badge stays crisp at any size.
 */
export function Crest({ clubId, teamId, size = 40, className, glow = false }: CrestProps) {
  const resolvedClubId = clubId ?? (teamId ? teamById.get(teamId)?.clubId : undefined)
  const club = resolvedClubId ? clubById.get(resolvedClubId) : undefined

  if (!club) {
    return (
      <div
        className={cx('rounded-lg bg-surface-3 shrink-0', className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }

  const [primary, secondary] = club.colors
  const text = contrastOn(primary)
  const id = `crest-${club.id}`

  return (
    <span
      className={cx('relative inline-flex shrink-0', className)}
      style={{ width: size, height: size }}
      title={club.name}
    >
      {glow && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full blur-xl opacity-40"
          style={{ background: primary }}
        />
      )}
      <svg
        viewBox="0 0 48 52"
        width={size}
        height={size}
        className="relative"
        role="img"
        aria-label={`${club.name} crest`}
      >
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor={primary} />
            <stop offset="100%" stopColor={secondary} />
          </linearGradient>
          <clipPath id={`${id}-c`}>
            <path d="M24 1 L45 8 V27 C45 39 35.5 47.5 24 51 C12.5 47.5 3 39 3 27 V8 Z" />
          </clipPath>
        </defs>

        {/* Shield body */}
        <path
          d="M24 1 L45 8 V27 C45 39 35.5 47.5 24 51 C12.5 47.5 3 39 3 27 V8 Z"
          fill={`url(#${id}-g)`}
        />
        {/* Diagonal sash for a bit of depth */}
        <g clipPath={`url(#${id}-c)`}>
          <path d="M-10 34 L26 -6 L40 -6 L4 34 Z" fill={secondary} opacity="0.55" />
          <path d="M8 52 L46 10 L46 20 L18 52 Z" fill="#ffffff" opacity="0.08" />
        </g>
        {/* Outline */}
        <path
          d="M24 1 L45 8 V27 C45 39 35.5 47.5 24 51 C12.5 47.5 3 39 3 27 V8 Z"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5"
        />
        <text
          x="24"
          y="30"
          textAnchor="middle"
          fontFamily="Outfit, Inter, sans-serif"
          fontWeight="800"
          fontSize={club.short.length > 3 ? 12 : 14}
          fill={text}
          letterSpacing="0.5"
        >
          {club.short}
        </text>
      </svg>
    </span>
  )
}
