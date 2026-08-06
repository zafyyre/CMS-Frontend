import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Crest } from './Crest'
import { Badge } from './ui'
import { teamById } from '@/data/engine'
import { divisionById, venueById } from '@/data/league'
import type { Match } from '@/data/types'
import { cx, formatDate, formatTime, relativeToNow } from '@/lib/format'

function TeamLine({
  teamId,
  goals,
  winner,
  align = 'left',
}: {
  teamId: string
  goals: number | null
  winner: boolean
  align?: 'left' | 'right'
}) {
  const team = teamById.get(teamId)
  return (
    <div
      className={cx(
        'flex min-w-0 flex-1 items-center gap-2.5',
        align === 'right' && 'flex-row-reverse text-right',
      )}
    >
      <Crest teamId={teamId} size={30} />
      <span
        className={cx(
          'min-w-0 truncate text-sm',
          winner ? 'font-bold text-base-c' : 'font-medium text-muted',
        )}
      >
        {team?.name ?? 'TBD'}
      </span>
      {goals !== null && (
        <span
          className={cx(
            'tabular ml-auto font-display text-lg font-extrabold',
            align === 'right' && 'ml-0 mr-auto',
            winner ? 'text-base-c' : 'text-faint',
          )}
        >
          {goals}
        </span>
      )}
    </div>
  )
}

export function MatchCard({ match, showDivision = true }: { match: Match; showDivision?: boolean }) {
  const venue = venueById.get(match.venueId)
  const division = divisionById.get(match.divisionId)
  const decided = match.homeGoals !== null && match.awayGoals !== null
  const homeWins = decided && match.homeGoals! > match.awayGoals!
  const awayWins = decided && match.awayGoals! > match.homeGoals!

  return (
    <Link
      to={`/match/${match.id}`}
      className="card card-hover group block p-4 focus-visible:border-[var(--accent)]"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {showDivision && (
            <span className="truncate text-[0.68rem] font-bold uppercase tracking-wider text-faint">
              {division?.name}
            </span>
          )}
          <span className="text-[0.68rem] text-faint">·</span>
          <span className="text-[0.68rem] font-semibold text-faint">Round {match.round}</span>
        </div>

        {match.status === 'live' ? (
          <Badge tone="danger" className="gap-1.5">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
            {match.minute}&rsquo;
          </Badge>
        ) : match.status === 'final' ? (
          <Badge tone="neutral">Full time</Badge>
        ) : (
          <span className="shrink-0 text-[0.7rem] font-semibold text-accent">{relativeToNow(match.kickoff)}</span>
        )}
      </div>

      <div className="space-y-2">
        <TeamLine teamId={match.homeTeamId} goals={match.homeGoals} winner={homeWins || !decided} />
        <TeamLine teamId={match.awayTeamId} goals={match.awayGoals} winner={awayWins || !decided} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3 text-[0.7rem] text-faint">
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{venue?.name ?? 'Venue TBD'}</span>
        </span>
        <span className="shrink-0 font-semibold">
          {match.status === 'scheduled'
            ? `${formatDate(match.kickoff, 'day')} · ${formatTime(match.kickoff)}`
            : formatDate(match.kickoff, 'day')}
        </span>
      </div>
    </Link>
  )
}

/** Dense one-line variant used inside schedule lists. */
export function MatchRow({ match }: { match: Match }) {
  const decided = match.homeGoals !== null && match.awayGoals !== null
  const homeWins = decided && match.homeGoals! > match.awayGoals!
  const awayWins = decided && match.awayGoals! > match.homeGoals!
  const venue = venueById.get(match.venueId)

  return (
    <Link
      to={`/match/${match.id}`}
      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-surface-2 sm:grid-cols-[64px_1fr_auto_1fr_auto] sm:gap-4"
    >
      {/* Time / status */}
      <div className="hidden text-center sm:block">
        {match.status === 'live' ? (
          <span className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-rose-500">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
            {match.minute}&rsquo;
          </span>
        ) : match.status === 'final' ? (
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-faint">FT</span>
        ) : (
          <span className="tabular text-xs font-bold text-base-c">{formatTime(match.kickoff)}</span>
        )}
      </div>

      {/* Home */}
      <div className="flex min-w-0 items-center gap-2 sm:justify-end">
        <span
          className={cx('min-w-0 truncate text-sm sm:text-right', homeWins ? 'font-bold' : 'font-medium text-muted')}
        >
          {teamById.get(match.homeTeamId)?.name}
        </span>
        <Crest teamId={match.homeTeamId} size={24} className="sm:order-last" />
      </div>

      {/* Score */}
      <div className="tabular flex items-center justify-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1 font-display text-sm font-extrabold">
        {decided ? (
          <>
            <span className={homeWins ? '' : 'text-faint'}>{match.homeGoals}</span>
            <span className="text-faint">–</span>
            <span className={awayWins ? '' : 'text-faint'}>{match.awayGoals}</span>
          </>
        ) : (
          <span className="text-xs font-semibold text-faint sm:hidden">{formatTime(match.kickoff)}</span>
        )}
        {!decided && <span className="hidden text-xs font-semibold text-faint sm:inline">vs</span>}
      </div>

      {/* Away */}
      <div className="flex min-w-0 items-center gap-2">
        <Crest teamId={match.awayTeamId} size={24} />
        <span className={cx('min-w-0 truncate text-sm', awayWins ? 'font-bold' : 'font-medium text-muted')}>
          {teamById.get(match.awayTeamId)?.name}
        </span>
      </div>

      <span className="hidden max-w-[160px] truncate text-right text-[0.7rem] text-faint lg:block">
        {venue?.name}
      </span>
    </Link>
  )
}
