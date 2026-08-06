import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CalendarDays, MapPin, Navigation, Square, Users } from 'lucide-react'
import { Badge, Button, Container, EmptyState, FormGuide } from '@/components/ui'
import { Crest } from '@/components/Crest'
import { MatchRow } from '@/components/MatchCard'
import { MATCHES, getStandings, matchById, playerById, teamById } from '@/data/engine'
import { divisionById, venueById } from '@/data/league'
import { cx, formatDate, formatTime, relativeToNow } from '@/lib/format'
import type { MatchEvent } from '@/data/types'

function EventIcon({ type }: { type: MatchEvent['type'] }) {
  if (type === 'goal' || type === 'own-goal') {
    return (
      <span
        className={cx(
          'grid h-6 w-6 place-items-center rounded-full',
          type === 'goal' ? 'bg-[var(--accent)]/15 text-accent' : 'bg-rose-500/15 text-rose-500',
        )}
        title={type === 'goal' ? 'Goal' : 'Own goal'}
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2.2 3.4 2.5-1.3 4H9.9l-1.3-4L12 4.2zM5.1 9.3l2.7 2-1.3 4-3-.4a8 8 0 011.6-5.6zm13.8 0a8 8 0 011.6 5.6l-3 .4-1.3-4 2.7-2zM8.4 19.4l-1-2.9 2.6-1.9h4l2.6 1.9-1 2.9a8 8 0 01-7.2 0z" />
        </svg>
      </span>
    )
  }
  return (
    <span
      className={cx(
        'grid h-6 w-6 place-items-center rounded-full',
        type === 'yellow' ? 'text-amber-500' : 'text-rose-500',
      )}
      title={type === 'yellow' ? 'Yellow card' : 'Red card'}
    >
      <Square size={12} fill="currentColor" strokeWidth={0} />
    </span>
  )
}

export default function MatchDetail() {
  const { matchId } = useParams()
  const match = matchId ? matchById.get(matchId) : undefined

  const context = useMemo(() => {
    if (!match) return null
    const table = getStandings(match.divisionId)
    const homeRow = table.find((r) => r.teamId === match.homeTeamId)
    const awayRow = table.find((r) => r.teamId === match.awayTeamId)

    // Head-to-head across the season.
    const h2h = MATCHES.filter(
      (m) =>
        m.status === 'final' &&
        m.id !== match.id &&
        ((m.homeTeamId === match.homeTeamId && m.awayTeamId === match.awayTeamId) ||
          (m.homeTeamId === match.awayTeamId && m.awayTeamId === match.homeTeamId)),
    )
    return { homeRow, awayRow, h2h }
  }, [match])

  if (!match || !context) {
    return (
      <Container className="py-20">
        <EmptyState
          title="Match not found"
          description="This fixture may have been rescheduled."
          action={<Button to="/fixtures">Back to fixtures</Button>}
        />
      </Container>
    )
  }

  const home = teamById.get(match.homeTeamId)
  const away = teamById.get(match.awayTeamId)
  const venue = venueById.get(match.venueId)
  const division = divisionById.get(match.divisionId)
  const decided = match.homeGoals !== null && match.awayGoals !== null
  const { homeRow, awayRow, h2h } = context

  const goals = match.events.filter((e) => e.type === 'goal' || e.type === 'own-goal')
  const cards = match.events.filter((e) => e.type === 'yellow' || e.type === 'red')
  const mapsUrl = venue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name}, ${venue.address}`)}`
    : undefined

  return (
    <>
      <div className="relative overflow-hidden border-b border-[var(--border)] bg-app-alt">
        <div aria-hidden className="pitch-grid absolute inset-0" />
        <Container className="relative py-8 sm:py-10">
          <Link
            to="/fixtures"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-accent"
          >
            <ArrowLeft size={15} />
            All fixtures
          </Link>

          <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-center">
            <Badge tone="accent">{division?.fullName}</Badge>
            <span className="text-xs font-semibold text-faint">Round {match.round}</span>
            {match.status === 'live' && (
              <Badge tone="danger" className="gap-1.5">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-rose-500" />
                Live · {match.minute}&rsquo;
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
            <Link to={`/team/${match.homeTeamId}`} className="group flex flex-col items-center gap-3 text-center">
              <Crest teamId={match.homeTeamId} size={64} glow />
              <span className="font-display text-sm font-bold leading-tight transition-colors group-hover:text-accent sm:text-lg">
                {home?.name}
              </span>
              {homeRow && <span className="text-xs text-faint">{homeRow.rank}th · {homeRow.points} pts</span>}
            </Link>

            <div className="text-center">
              {decided ? (
                <motion.p
                  initial={{ scale: 0.86, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  className="tabular font-display text-4xl font-extrabold sm:text-6xl"
                >
                  {match.homeGoals}
                  <span className="mx-2 text-faint">–</span>
                  {match.awayGoals}
                </motion.p>
              ) : (
                <div className="rounded-xl border border-[var(--border)] bg-surface px-4 py-3">
                  <p className="font-display text-xl font-extrabold sm:text-2xl">{formatTime(match.kickoff)}</p>
                  <p className="mt-0.5 text-[0.68rem] font-semibold text-accent">
                    {relativeToNow(match.kickoff)}
                  </p>
                </div>
              )}
              <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-wider text-faint">
                {match.status === 'final' ? 'Full time' : match.status === 'live' ? 'In play' : 'Kickoff'}
              </p>
            </div>

            <Link to={`/team/${match.awayTeamId}`} className="group flex flex-col items-center gap-3 text-center">
              <Crest teamId={match.awayTeamId} size={64} glow />
              <span className="font-display text-sm font-bold leading-tight transition-colors group-hover:text-accent sm:text-lg">
                {away?.name}
              </span>
              {awayRow && <span className="text-xs text-faint">{awayRow.rank}th · {awayRow.points} pts</span>}
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} />
              {formatDate(match.kickoff, 'long')}
            </span>
            {venue && (
              <span className="flex items-center gap-1.5">
                <MapPin size={14} />
                {venue.name}
              </span>
            )}
            {match.attendance && (
              <span className="flex items-center gap-1.5">
                <Users size={14} />
                {match.attendance} attending
              </span>
            )}
          </div>
        </Container>
      </div>

      <Container className="py-10">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            {/* Timeline */}
            {match.events.length > 0 && (
              <div className="card overflow-hidden">
                <p className="border-b border-[var(--border)] bg-surface-2 px-4 py-3 font-display text-sm font-bold">
                  Match events
                </p>
                <div className="relative p-4">
                  <span
                    aria-hidden
                    className="absolute bottom-4 left-1/2 top-4 w-px -translate-x-1/2 bg-[var(--border)]"
                  />
                  <div className="space-y-3">
                    {match.events.map((e, i) => {
                      const isHome = e.teamId === match.homeTeamId
                      const player = playerById.get(e.playerId)
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: isHome ? -12 : 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                          className={cx(
                            'flex items-center gap-3',
                            isHome ? 'justify-start pr-[52%]' : 'flex-row-reverse justify-start pl-[52%]',
                          )}
                        >
                          <EventIcon type={e.type} />
                          <div className={cx('min-w-0', !isHome && 'text-right')}>
                            <p className="truncate text-sm font-semibold">{player?.name}</p>
                            <p className="text-[0.68rem] text-faint">
                              {e.minute}&rsquo;{e.type === 'own-goal' && ' · own goal'}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Summary numbers */}
            {decided && (
              <div className="card p-5">
                <p className="mb-4 font-display text-sm font-bold">By the numbers</p>
                {[
                  { label: 'Goals', home: match.homeGoals!, away: match.awayGoals! },
                  {
                    label: 'Yellow cards',
                    home: cards.filter((c) => c.type === 'yellow' && c.teamId === match.homeTeamId).length,
                    away: cards.filter((c) => c.type === 'yellow' && c.teamId === match.awayTeamId).length,
                  },
                  {
                    label: 'Red cards',
                    home: cards.filter((c) => c.type === 'red' && c.teamId === match.homeTeamId).length,
                    away: cards.filter((c) => c.type === 'red' && c.teamId === match.awayTeamId).length,
                  },
                  {
                    label: 'Scorers used',
                    home: new Set(goals.filter((g) => g.teamId === match.homeTeamId).map((g) => g.playerId)).size,
                    away: new Set(goals.filter((g) => g.teamId === match.awayTeamId).map((g) => g.playerId)).size,
                  },
                ].map((stat) => {
                  const total = stat.home + stat.away || 1
                  return (
                    <div key={stat.label} className="mb-3.5 last:mb-0">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="tabular font-bold">{stat.home}</span>
                        <span className="text-faint">{stat.label}</span>
                        <span className="tabular font-bold">{stat.away}</span>
                      </div>
                      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(stat.home / total) * 100}%` }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="rounded-l-full bg-[var(--accent)]"
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(stat.away / total) * 100}%` }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="rounded-r-full bg-sky-500"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Form comparison */}
            <div className="card p-5">
              <p className="mb-4 font-display text-sm font-bold">Form coming in</p>
              {[
                { row: homeRow, teamId: match.homeTeamId },
                { row: awayRow, teamId: match.awayTeamId },
              ].map(({ row, teamId }) => (
                <div key={teamId} className="mb-4 last:mb-0">
                  <div className="mb-2 flex items-center gap-2">
                    <Crest teamId={teamId} size={22} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {teamById.get(teamId)?.name}
                    </span>
                  </div>
                  {row ? (
                    <div className="flex items-center justify-between">
                      <FormGuide form={row.form} size="sm" />
                      <span className="text-xs text-faint">{row.ppg} ppg</span>
                    </div>
                  ) : (
                    <p className="text-xs text-faint">No data</p>
                  )}
                </div>
              ))}
            </div>

            {/* Venue */}
            {venue && (
              <div className="card p-5">
                <p className="mb-3 font-display text-sm font-bold">Venue</p>
                <p className="font-semibold">{venue.name}</p>
                <p className="mt-0.5 text-sm text-muted">{venue.address}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{venue.surface}</Badge>
                  {venue.lights && <Badge tone="warn">Floodlit</Badge>}
                  <Badge>{venue.fields} fields</Badge>
                </div>
                {mapsUrl && (
                  <Button href={mapsUrl} variant="outline" size="sm" className="mt-4 w-full">
                    <Navigation size={14} />
                    Directions
                  </Button>
                )}
              </div>
            )}

            {/* Head to head */}
            {h2h.length > 0 && (
              <div className="card overflow-hidden">
                <p className="border-b border-[var(--border)] bg-surface-2 px-4 py-2.5 font-display text-sm font-bold">
                  Earlier meeting
                </p>
                <div className="divide-y divide-[var(--border)]">
                  {h2h.map((m) => (
                    <MatchRow key={m.id} match={m} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  )
}
