import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Target, TrendingUp, Users } from 'lucide-react'
import { Badge, Button, Container, EmptyState, FormGuide } from '@/components/ui'
import { Crest } from '@/components/Crest'
import { MatchRow } from '@/components/MatchCard'
import { StandingsTable } from '@/components/StandingsTable'
import { playerById, playersByTeam, teamStats } from '@/data/engine'
import { clubById, divisionById, venueById } from '@/data/league'
import { cx, formatDate, ordinal } from '@/lib/format'

type Tab = 'overview' | 'fixtures' | 'results' | 'squad' | 'table'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'fixtures', label: 'Fixtures' },
  { id: 'results', label: 'Results' },
  { id: 'squad', label: 'Squad' },
  { id: 'table', label: 'Table' },
]

/** Points-per-game trend line built from the team's played matches. */
function FormChart({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const w = 260
  const h = 60
  const max = Math.max(...points, 1)
  const step = w / (points.length - 1)
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - (p / max) * (h - 8) - 4}`)
    .join(' ')
  const area = `${path} L ${w} ${h} L 0 ${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="form-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#form-fill)" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default function TeamDetail() {
  const { teamId } = useParams()
  const [tab, setTab] = useState<Tab>('overview')
  const data = useMemo(() => (teamId ? teamStats(teamId) : null), [teamId])

  if (!data || !data.team) {
    return (
      <Container className="py-20">
        <EmptyState
          title="Team not found"
          description="This side may have moved division or left the league."
          action={<Button to="/teams">Back to directory</Button>}
        />
      </Container>
    )
  }

  const { team, row, played, upcoming, topScorers, table } = data
  const club = clubById.get(team.clubId)
  const division = divisionById.get(team.divisionId)
  const venue = venueById.get(club?.homeVenueId ?? '')
  const squad = playersByTeam.get(team.id) ?? []

  const cumulative = played.reduce<number[]>((acc, m) => {
    const isHome = m.homeTeamId === team.id
    const gf = isHome ? m.homeGoals! : m.awayGoals!
    const ga = isHome ? m.awayGoals! : m.homeGoals!
    const pts = gf > ga ? 3 : gf === ga ? 1 : 0
    acc.push((acc[acc.length - 1] ?? 0) + pts)
    return acc
  }, [])

  const stats = [
    { label: 'Position', value: row ? ordinal(row.rank) : '—', sub: `of ${table.length}` },
    { label: 'Points', value: row?.points ?? 0, sub: `${row?.played ?? 0} played` },
    { label: 'Goals for', value: row?.goalsFor ?? 0, sub: `${row?.goalsAgainst ?? 0} against` },
    { label: 'Points/game', value: row?.ppg ?? 0, sub: 'season average' },
  ]

  return (
    <>
      {/* Team header */}
      <div
        className="relative overflow-hidden border-b border-[var(--border)]"
        style={{
          background: club
            ? `linear-gradient(135deg, ${club.colors[0]}22, transparent 55%)`
            : undefined,
        }}
      >
        <div aria-hidden className="pitch-grid absolute inset-0" />
        <Container className="relative py-8 sm:py-12">
          <Link
            to="/teams"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-accent"
          >
            <ArrowLeft size={15} />
            All teams
          </Link>

          <div className="flex flex-wrap items-center gap-5">
            <Crest teamId={team.id} size={80} glow />
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone="accent">{division?.fullName}</Badge>
                {row?.rank === 1 && <Badge tone="success">Division leaders</Badge>}
                {club && (
                  <Link to={`/club/${club.id}`} className="text-xs font-semibold text-muted hover:text-accent">
                    {club.name}
                  </Link>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl">{team.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <Users size={14} />
                  {team.manager}
                </span>
                {venue && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    {venue.name}
                  </span>
                )}
                <span>Est. {team.founded}</span>
              </div>
            </div>

            {row && (
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="tabular font-display text-4xl font-extrabold text-accent">{row.points}</p>
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-faint">Points</p>
                </div>
                <div className="text-center">
                  <p className="tabular font-display text-4xl font-extrabold">{ordinal(row.rank)}</p>
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-faint">Position</p>
                </div>
              </div>
            )}
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {/* Stat strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="card p-4"
            >
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-faint">{s.label}</p>
              <p className="tabular mt-1 font-display text-2xl font-extrabold">{s.value}</p>
              <p className="text-xs text-faint">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          className="no-scrollbar fade-x mt-6 flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-surface-2 p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cx(
                'relative shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                tab === t.id ? 'text-base-c' : 'text-faint hover:text-muted',
              )}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="team-tab"
                  className="absolute inset-0 rounded-lg bg-surface shadow-sm"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5">
          {tab === 'overview' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-base">
                    <TrendingUp size={16} className="text-accent" />
                    Points accumulated
                  </h3>
                  {row && <FormGuide form={row.form} size="sm" />}
                </div>
                <FormChart points={cumulative} />
                <p className="mt-2 text-xs text-faint">
                  {cumulative.length} matches played · {row?.ppg ?? 0} points per game
                </p>
              </div>

              <div className="card p-5">
                <h3 className="mb-3 flex items-center gap-2 text-base">
                  <Target size={16} className="text-accent" />
                  Leading scorers
                </h3>
                {topScorers.length === 0 ? (
                  <p className="py-6 text-center text-sm text-faint">No goals recorded yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {topScorers.map((s) => {
                      const max = topScorers[0].goals || 1
                      return (
                        <div key={s.playerId} className="flex items-center gap-3">
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                            {playerById.get(s.playerId)?.name}
                          </span>
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-3">
                            <div
                              className="h-full rounded-full bg-[var(--accent)]"
                              style={{ width: `${(s.goals / max) * 100}%` }}
                            />
                          </div>
                          <span className="tabular w-6 text-right font-display text-sm font-extrabold">
                            {s.goals}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="card overflow-hidden lg:col-span-2">
                <p className="border-b border-[var(--border)] bg-surface-2 px-4 py-2.5 font-display text-sm font-bold">
                  Next fixtures
                </p>
                <div className="divide-y divide-[var(--border)]">
                  {upcoming.slice(0, 5).map((m) => (
                    <MatchRow key={m.id} match={m} />
                  ))}
                  {upcoming.length === 0 && (
                    <p className="py-10 text-center text-sm text-faint">Season complete.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {(tab === 'fixtures' || tab === 'results') && (
            <div className="card divide-y divide-[var(--border)] overflow-hidden">
              {(tab === 'fixtures' ? upcoming : [...played].reverse()).map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
              {(tab === 'fixtures' ? upcoming : played).length === 0 && (
                <p className="py-12 text-center text-sm text-faint">Nothing to show.</p>
              )}
            </div>
          )}

          {tab === 'squad' && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(['GK', 'DF', 'MF', 'FW'] as const).map((pos) => {
                const group = squad.filter((p) => p.position === pos)
                if (!group.length) return null
                return (
                  <div key={pos} className="card overflow-hidden">
                    <p className="border-b border-[var(--border)] bg-surface-2 px-4 py-2.5 text-[0.68rem] font-bold uppercase tracking-wider text-faint">
                      {{ GK: 'Goalkeepers', DF: 'Defenders', MF: 'Midfielders', FW: 'Forwards' }[pos]}
                    </p>
                    {group.map((p) => {
                      const goals = topScorers.find((s) => s.playerId === p.id)?.goals
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 last:border-0"
                        >
                          <span className="tabular grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-bold text-muted">
                            {p.number}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                          {goals ? (
                            <span className="shrink-0 rounded-md bg-[var(--accent)]/15 px-1.5 py-0.5 text-[0.65rem] font-bold text-accent">
                              {goals}
                            </span>
                          ) : (
                            <span className="text-xs text-faint">{p.age}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'table' && <StandingsTable rows={table} highlightTeamId={team.id} />}
        </div>

        {played.length > 0 && (
          <p className="mt-6 text-center text-xs text-faint">
            Last match {formatDate(played[played.length - 1].kickoff, 'long')}
          </p>
        )}
      </Container>
    </>
  )
}
