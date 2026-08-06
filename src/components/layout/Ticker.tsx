import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { MATCHES, liveMatches, teamById } from '@/data/engine'
import { NOW } from '@/data/league'
import { cx, formatTime } from '@/lib/format'
import type { Match } from '@/data/types'

function TickerItem({ match }: { match: Match }) {
  const home = teamById.get(match.homeTeamId)
  const away = teamById.get(match.awayTeamId)
  const decided = match.homeGoals !== null && match.awayGoals !== null

  return (
    <Link
      to={`/match/${match.id}`}
      className="group flex shrink-0 items-center gap-2.5 border-r border-[var(--border)] px-4 py-2 transition-colors hover:bg-surface-2"
    >
      {match.status === 'live' && (
        <span className="live-dot h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden />
      )}
      <span className="whitespace-nowrap text-xs font-semibold text-muted transition-colors group-hover:text-base-c">
        {home?.name.replace(/ (A|B|Athletic|United|Rangers|Rovers|Reserves|Legends|City)$/, '')}
      </span>
      <span
        className={cx(
          'tabular whitespace-nowrap rounded px-1.5 py-0.5 font-display text-xs font-extrabold',
          match.status === 'live' ? 'bg-rose-500/15 text-rose-500' : 'bg-surface-3',
        )}
      >
        {decided ? `${match.homeGoals}–${match.awayGoals}` : formatTime(match.kickoff)}
      </span>
      <span className="whitespace-nowrap text-xs font-semibold text-muted transition-colors group-hover:text-base-c">
        {away?.name.replace(/ (A|B|Athletic|United|Rangers|Rovers|Reserves|Legends|City)$/, '')}
      </span>
    </Link>
  )
}

/**
 * Score ticker across the top of the site. Live matches lead, then the most
 * recent results, then whatever kicks off next.
 */
export function Ticker() {
  const items = useMemo(() => {
    const live = liveMatches()
    const recent = MATCHES.filter((m) => m.status === 'final').slice(-14).reverse()
    const next = MATCHES.filter((m) => new Date(m.kickoff) > NOW).slice(0, 8)
    return [...live, ...recent, ...next].slice(0, 22)
  }, [])

  if (!items.length) return null

  return (
    <div className="marquee-host relative overflow-hidden border-b border-[var(--border)] bg-app-alt">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[var(--bg-alt)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[var(--bg-alt)] to-transparent" />
      <div
        className="marquee-track flex w-max"
        style={{ ['--marquee-duration' as string]: `${items.length * 4.5}s` }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex" aria-hidden={copy === 1}>
            {items.map((m) => (
              <TickerItem key={`${copy}-${m.id}`} match={m} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
