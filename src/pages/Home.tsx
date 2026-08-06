import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  MapPin,
  Newspaper,
  Shield,
  Trophy,
  Users,
} from 'lucide-react'
import { Button, Chip, Container, FormGuide, SectionHeading } from '@/components/ui'
import { Crest } from '@/components/Crest'
import { MatchCard } from '@/components/MatchCard'
import {
  MATCHES,
  TEAMS,
  currentMatchdayRange,
  getScorers,
  getStandings,
  liveMatches,
  matchesBetween,
  recentResults,
  teamById,
} from '@/data/engine'
import { CLUBS, DIVISIONS, NOW, SEASON_ID, VENUES, divisionById } from '@/data/league'
import { NEWS } from '@/data/content'
import { playerById } from '@/data/engine'
import { cx, formatDate, relativeToNow } from '@/lib/format'
import { useCountUp, useInView } from '@/lib/hooks'

/* ── Hero ───────────────────────────────────────────────────── */
function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const display = useCountUp(value, 1200, inView)
  return (
    <div ref={ref}>
      <p className="tabular font-display text-3xl font-extrabold sm:text-4xl">
        {Math.round(display).toLocaleString('en-CA')}
        {suffix}
      </p>
      <p className="mt-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-faint">{label}</p>
    </div>
  )
}

function Hero() {
  const live = liveMatches()
  const [from, to] = currentMatchdayRange()
  const weekendCount = matchesBetween(from, to).length

  return (
    <section className="relative overflow-hidden border-b border-[var(--border)]">
      <div aria-hidden className="pitch-grid absolute inset-0" />
      <div
        aria-hidden
        className="absolute left-1/2 top-[-18rem] h-[36rem] w-[46rem] -translate-x-1/2 rounded-full opacity-[0.16] blur-[120px]"
        style={{ background: 'radial-gradient(circle, var(--accent), transparent 68%)' }}
      />

      <Container className="relative py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-surface px-3 py-1.5 text-xs font-semibold"
            >
              {live.length > 0 ? (
                <>
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-rose-500" />
                  <span className="text-rose-500">{live.length} matches live right now</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  <span className="text-muted">{SEASON_ID} season · matchday in progress</span>
                </>
              )}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.1rem]"
            >
              Every kickoff.
              <br />
              <span className="text-gradient">Every table.</span>
              <br />
              One place.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-muted"
            >
              A fictional amateur adult soccer league, built as a demo. Fixtures, live scores, standings
              and stats for {TEAMS.length} teams across {DIVISIONS.length} divisions — updated the moment the
              final whistle goes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button to="/fixtures" size="lg">
                This weekend&rsquo;s fixtures
                <ArrowRight size={17} />
              </Button>
              <Button to="/standings" size="lg" variant="outline">
                View standings
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-12 grid max-w-lg grid-cols-2 gap-6 border-t border-[var(--border)] pt-8 sm:grid-cols-4"
            >
              <StatCounter value={TEAMS.length} label="Teams" />
              <StatCounter value={CLUBS.length} label="Clubs" />
              <StatCounter value={weekendCount} label="This weekend" />
              <StatCounter value={VENUES.length} label="Fields" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:pl-4"
          >
            <LivePanel />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}

/** Right-hand hero panel — live matches if there are any, otherwise next up. */
function LivePanel() {
  const live = liveMatches()
  const upcoming = MATCHES.filter((m) => new Date(m.kickoff) > NOW).slice(0, 4)
  const showing = live.length > 0 ? live.slice(0, 4) : upcoming
  const isLive = live.length > 0

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-surface-2 px-4 py-3">
        <p className="flex items-center gap-2 font-display text-sm font-bold">
          {isLive ? (
            <>
              <span className="live-dot h-2 w-2 rounded-full bg-rose-500" />
              Live now
            </>
          ) : (
            <>
              <CalendarDays size={15} className="text-accent" />
              Next up
            </>
          )}
        </p>
        <Link to="/fixtures" className="text-xs font-semibold text-accent hover:underline">
          All fixtures
        </Link>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {showing.map((m) => {
          const decided = m.homeGoals !== null && m.awayGoals !== null
          return (
            <Link key={m.id} to={`/match/${m.id}`} className="block px-4 py-3.5 transition-colors hover:bg-surface-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[0.68rem] font-bold uppercase tracking-wider text-faint">
                  {divisionById.get(m.divisionId)?.name}
                </span>
                <span className={cx('text-[0.7rem] font-bold', m.status === 'live' ? 'text-rose-500' : 'text-accent')}>
                  {m.status === 'live' ? `${m.minute}'` : relativeToNow(m.kickoff)}
                </span>
              </div>
              {[
                { id: m.homeTeamId, goals: m.homeGoals },
                { id: m.awayTeamId, goals: m.awayGoals },
              ].map((side) => (
                <div key={side.id} className="flex items-center gap-2.5 py-1">
                  <Crest teamId={side.id} size={24} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {teamById.get(side.id)?.name}
                  </span>
                  <span className="tabular font-display text-base font-extrabold">
                    {decided ? side.goals : '–'}
                  </span>
                </div>
              ))}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* ── Quick actions ──────────────────────────────────────────── */
const ACTIONS = [
  { to: '/fixtures', icon: CalendarDays, title: 'Fixtures', copy: 'Kickoff times, fields and results by weekend' },
  { to: '/standings', icon: Trophy, title: 'Standings', copy: 'Live tables for every division' },
  { to: '/teams', icon: Shield, title: 'Find a team', copy: `${CLUBS.length} sample clubs across the valley` },
  { to: '/register', icon: ClipboardList, title: 'Register', copy: 'Players, teams and new club applications' },
  { to: '/fields', icon: MapPin, title: 'Fields', copy: 'Directions, surfaces and closure status' },
  { to: '/stats', icon: Users, title: 'Statistics', copy: 'Golden boot, shutouts and discipline' },
]

function QuickActions() {
  return (
    <Container className="py-14 sm:py-16">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map((a, i) => (
          <motion.div
            key={a.to}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link to={a.to} className="card card-hover group flex items-start gap-4 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--accent)]/12 text-accent transition-transform duration-300 group-hover:scale-110">
                <a.icon size={20} />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-display text-base font-bold">
                  {a.title}
                  <ArrowRight
                    size={15}
                    className="opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                  />
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{a.copy}</span>
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </Container>
  )
}

/* ── Matchday ───────────────────────────────────────────────── */
function Matchday() {
  const [from, to] = currentMatchdayRange()
  const [division, setDivision] = useState('all')

  const matches = useMemo(() => {
    const all = matchesBetween(from, to)
    return (division === 'all' ? all : all.filter((m) => m.divisionId === division)).slice(0, 9)
  }, [division, from, to])

  return (
    <section className="border-y border-[var(--border)] bg-app-alt py-14 sm:py-16">
      <Container>
        <SectionHeading
          eyebrow="Matchday"
          title={`${formatDate(from, 'day')} – ${formatDate(new Date(to.getTime() - 1), 'day')}`}
          description="Everything happening this weekend across the league."
          action={
            <Button to="/fixtures" variant="outline" size="sm">
              Full schedule
              <ArrowRight size={14} />
            </Button>
          }
        />

        <div className="no-scrollbar fade-x -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <Chip active={division === 'all'} onClick={() => setDivision('all')}>
            All divisions
          </Chip>
          {DIVISIONS.map((d) => (
            <Chip key={d.id} active={division === d.id} onClick={() => setDivision(d.id)}>
              {d.name}
            </Chip>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }}
            >
              <MatchCard match={m} />
            </motion.div>
          ))}
        </div>

        {matches.length === 0 && (
          <p className="mt-8 rounded-2xl border border-dashed border-[var(--border-strong)] py-12 text-center text-sm text-faint">
            No fixtures for this division this weekend.
          </p>
        )}
      </Container>
    </section>
  )
}

/* ── Table snapshot + golden boot ───────────────────────────── */
function TableSnapshot() {
  const [division, setDivision] = useState('premier')
  const rows = getStandings(division).slice(0, 6)
  const scorers = getScorers(division).slice(0, 5)

  return (
    <Container className="py-14 sm:py-16">
      <SectionHeading
        eyebrow="Where it stands"
        title="Top of the table"
        description="Positions update automatically as results come in."
        action={
          <Button to={`/standings?division=${division}`} variant="outline" size="sm">
            Full table
            <ArrowRight size={14} />
          </Button>
        }
      />

      <div className="no-scrollbar fade-x -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {DIVISIONS.slice(0, 6).map((d) => (
          <Chip key={d.id} active={division === d.id} onClick={() => setDivision(d.id)}>
            {d.name}
          </Chip>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="card overflow-hidden">
          {rows.map((row, i) => (
            <Link
              key={row.teamId}
              to={`/team/${row.teamId}`}
              className={cx(
                'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2',
                i > 0 && 'border-t border-[var(--border)]',
              )}
            >
              <span
                className={cx(
                  'tabular grid h-7 w-7 shrink-0 place-items-center rounded-lg font-display text-sm font-extrabold',
                  row.rank === 1 ? 'bg-[var(--accent)] text-[var(--accent-contrast)]' : 'bg-surface-3 text-muted',
                )}
              >
                {row.rank}
              </span>
              <Crest teamId={row.teamId} size={30} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {teamById.get(row.teamId)?.name}
              </span>
              <span className="hidden sm:block">
                <FormGuide form={row.form} size="sm" />
              </span>
              <span className="tabular w-9 text-right text-xs text-faint">{row.played}</span>
              <span className="tabular w-12 text-right font-display text-lg font-extrabold">{row.points}</span>
            </Link>
          ))}
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[var(--border)] bg-surface-2 px-4 py-3">
            <Trophy size={15} className="text-accent" />
            <p className="font-display text-sm font-bold">Golden boot race</p>
          </div>
          {scorers.map((s, i) => {
            const player = playerById.get(s.playerId)
            const leader = scorers[0]?.goals || 1
            return (
              <div key={s.playerId} className={cx('px-4 py-3', i > 0 && 'border-t border-[var(--border)]')}>
                <div className="flex items-center gap-2.5">
                  <Crest teamId={s.teamId} size={22} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{player?.name}</span>
                  <span className="tabular font-display text-base font-extrabold text-accent">{s.goals}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(s.goals / leader) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-[var(--accent)]"
                    />
                  </div>
                  <span className="w-24 shrink-0 truncate text-[0.68rem] text-faint">
                    {teamById.get(s.teamId)?.name}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Container>
  )
}

/* ── Results + news ─────────────────────────────────────────── */
function ResultsAndNews() {
  const results = recentResults(6)
  const featured = NEWS.filter((n) => n.featured).slice(0, 2)
  const rest = NEWS.filter((n) => !n.featured).slice(0, 3)

  return (
    <section className="border-t border-[var(--border)] bg-app-alt py-14 sm:py-16">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr]">
          <div>
            <SectionHeading eyebrow="Latest" title="Recent results" />
            <div className="card mt-6 divide-y divide-[var(--border)] overflow-hidden">
              {results.map((m) => (
                <Link
                  key={m.id}
                  to={`/match/${m.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {[
                      { id: m.homeTeamId, goals: m.homeGoals! },
                      { id: m.awayTeamId, goals: m.awayGoals! },
                    ].map((side) => {
                      const won = side.goals === Math.max(m.homeGoals!, m.awayGoals!) && m.homeGoals !== m.awayGoals
                      return (
                        <div key={side.id} className="flex items-center gap-2">
                          <Crest teamId={side.id} size={20} />
                          <span
                            className={cx(
                              'min-w-0 flex-1 truncate text-sm',
                              won ? 'font-bold' : 'font-medium text-muted',
                            )}
                          >
                            {teamById.get(side.id)?.name}
                          </span>
                          <span className={cx('tabular font-display font-extrabold', !won && 'text-faint')}>
                            {side.goals}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow="Notice board"
              title="League news"
              action={
                <Button to="/news" variant="ghost" size="sm">
                  All news
                  <ArrowRight size={14} />
                </Button>
              }
            />

            <div className="mt-6 space-y-3">
              {featured.map((n) => (
                <Link key={n.id} to={`/news/${n.id}`} className="card card-hover group block overflow-hidden">
                  <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[var(--accent)]/25 via-[var(--surface-3)] to-transparent">
                    <div aria-hidden className="pitch-grid absolute inset-0" />
                    <Newspaper
                      size={72}
                      className="absolute -bottom-3 right-4 text-[var(--accent)] opacity-15 transition-transform duration-500 group-hover:scale-110"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--accent-contrast)]">
                      {n.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base leading-snug transition-colors group-hover:text-accent">{n.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{n.excerpt}</p>
                    <p className="mt-3 text-[0.7rem] text-faint">
                      {formatDate(n.date)} · {n.readMinutes} min read
                    </p>
                  </div>
                </Link>
              ))}

              {rest.map((n) => (
                <Link
                  key={n.id}
                  to={`/news/${n.id}`}
                  className="card card-hover group flex items-center gap-4 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-accent">
                      {n.category}
                    </span>
                    <h3 className="mt-1 line-clamp-1 text-sm font-bold transition-colors group-hover:text-accent">
                      {n.title}
                    </h3>
                    <p className="mt-0.5 text-[0.7rem] text-faint">{formatDate(n.date)}</p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-faint transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ── CTA ────────────────────────────────────────────────────── */
function JoinCta() {
  return (
    <Container className="py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-surface px-6 py-14 text-center sm:px-12">
        <div aria-hidden className="pitch-grid absolute inset-0" />
        <div
          aria-hidden
          className="absolute left-1/2 top-0 h-72 w-[38rem] -translate-x-1/2 rounded-full opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl sm:text-4xl">Ready for next season?</h2>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">
            Whether you are looking for a team, entering a side, or bringing a whole new club into the league —
            registration takes minutes and we will walk you through every step.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/register" size="lg">
              Start registration
              <ArrowRight size={17} />
            </Button>
            <Button to="/teams" size="lg" variant="outline">
              Browse clubs near you
            </Button>
          </div>
        </div>
      </div>
    </Container>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <QuickActions />
      <Matchday />
      <TableSnapshot />
      <ResultsAndNews />
      <JoinCta />
    </>
  )
}
