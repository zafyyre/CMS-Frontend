import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, ShieldCheck, Square, Target, Trophy } from 'lucide-react'
import { Chip, Container, SectionHeading } from '@/components/ui'
import { Crest } from '@/components/Crest'
import {
  getDiscipline,
  getScorers,
  getShutouts,
  getStandings,
  matchesByDivision,
  playerById,
  teamById,
} from '@/data/engine'
import { DIVISIONS, divisionById } from '@/data/league'
import { cx } from '@/lib/format'

type Board = 'scorers' | 'shutouts' | 'discipline' | 'attack' | 'defence'

const BOARDS: { id: Board; label: string; icon: typeof Target }[] = [
  { id: 'scorers', label: 'Golden boot', icon: Target },
  { id: 'attack', label: 'Best attack', icon: Flame },
  { id: 'defence', label: 'Best defence', icon: ShieldCheck },
  { id: 'shutouts', label: 'Shutouts', icon: Trophy },
  { id: 'discipline', label: 'Discipline', icon: Square },
]

function Bar({ value, max, tone = 'accent' }: { value: number; max: number; tone?: 'accent' | 'rose' | 'amber' }) {
  const colors = { accent: 'bg-[var(--accent)]', rose: 'bg-rose-500', amber: 'bg-amber-500' }
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / (max || 1)) * 100}%` }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className={cx('h-full rounded-full', colors[tone])}
      />
    </div>
  )
}

/** Season-wide totals across every division. */
function LeagueSummary() {
  const summary = useMemo(() => {
    let played = 0
    let goals = 0
    let cards = 0
    let shutouts = 0
    for (const d of DIVISIONS) {
      for (const m of matchesByDivision.get(d.id) ?? []) {
        if (m.status !== 'final') continue
        played++
        goals += (m.homeGoals ?? 0) + (m.awayGoals ?? 0)
        cards += m.events.filter((e) => e.type === 'yellow' || e.type === 'red').length
        if (m.homeGoals === 0 || m.awayGoals === 0) shutouts++
      }
    }
    return [
      { label: 'Matches played', value: played.toLocaleString('en-CA') },
      { label: 'Goals scored', value: goals.toLocaleString('en-CA') },
      { label: 'Goals per game', value: played ? (goals / played).toFixed(2) : '0' },
      { label: 'Cards shown', value: cards.toLocaleString('en-CA') },
      { label: 'Clean sheets', value: shutouts.toLocaleString('en-CA') },
    ]
  }, [])

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {summary.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          className="card p-4"
        >
          <p className="tabular font-display text-2xl font-extrabold text-accent sm:text-3xl">{s.value}</p>
          <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-wider text-faint">{s.label}</p>
        </motion.div>
      ))}
    </div>
  )
}

export default function Stats() {
  const [division, setDivision] = useState('premier')
  const [board, setBoard] = useState<Board>('scorers')

  const scorers = useMemo(() => getScorers(division).slice(0, 20), [division])
  const shutouts = useMemo(() => getShutouts(division).slice(0, 15), [division])
  const discipline = useMemo(() => getDiscipline(division).slice(0, 20), [division])
  const table = useMemo(() => getStandings(division), [division])

  const attack = useMemo(() => [...table].sort((a, b) => b.goalsFor - a.goalsFor).slice(0, 15), [table])
  const defence = useMemo(
    () => [...table].sort((a, b) => a.goalsAgainst - b.goalsAgainst).slice(0, 15),
    [table],
  )

  return (
    <Container className="py-10 sm:py-14">
      <SectionHeading
        eyebrow="Numbers"
        title="Statistics"
        description="Every leaderboard is computed live from match results — nothing here is entered by hand."
      />

      <div className="mt-8">
        <LeagueSummary />
      </div>

      <div className="no-scrollbar fade-x -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {DIVISIONS.map((d) => (
          <Chip key={d.id} active={division === d.id} onClick={() => setDivision(d.id)}>
            {d.name}
          </Chip>
        ))}
      </div>

      <div
        role="tablist"
        className="no-scrollbar fade-x mt-4 flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-surface-2 p-1"
      >
        {BOARDS.map((b) => (
          <button
            key={b.id}
            role="tab"
            aria-selected={board === b.id}
            type="button"
            onClick={() => setBoard(b.id)}
            className={cx(
              'relative flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              board === b.id ? 'text-base-c' : 'text-faint hover:text-muted',
            )}
          >
            {board === b.id && (
              <motion.span
                layoutId="stats-tab"
                className="absolute inset-0 rounded-lg bg-surface shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <b.icon size={14} className="relative" />
            <span className="relative">{b.label}</span>
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted">{divisionById.get(division)?.blurb}</p>

      <div className="mt-5">
        {board === 'scorers' && (
          <div className="card overflow-hidden">
            {scorers.map((s, i) => (
              <div
                key={s.playerId}
                className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0 transition-colors hover:bg-surface-2"
              >
                <span
                  className={cx(
                    'tabular grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold',
                    i === 0
                      ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                      : i < 3
                        ? 'bg-[var(--accent)]/15 text-accent'
                        : 'text-faint',
                  )}
                >
                  {i + 1}
                </span>
                <Crest teamId={s.teamId} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{playerById.get(s.playerId)?.name}</p>
                  <Link
                    to={`/team/${s.teamId}`}
                    className="truncate text-xs text-faint transition-colors hover:text-accent"
                  >
                    {teamById.get(s.teamId)?.name}
                  </Link>
                </div>
                <div className="hidden w-32 sm:block">
                  <Bar value={s.goals} max={scorers[0]?.goals ?? 1} />
                </div>
                <span className="tabular w-9 text-right font-display text-lg font-extrabold">{s.goals}</span>
              </div>
            ))}
            {scorers.length === 0 && <p className="py-14 text-center text-sm text-faint">No goals recorded yet.</p>}
          </div>
        )}

        {(board === 'attack' || board === 'defence') && (
          <div className="card overflow-hidden">
            {(board === 'attack' ? attack : defence).map((row, i) => {
              const value = board === 'attack' ? row.goalsFor : row.goalsAgainst
              const max = board === 'attack' ? attack[0].goalsFor : defence[defence.length - 1].goalsAgainst
              return (
                <Link
                  key={row.teamId}
                  to={`/team/${row.teamId}`}
                  className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0 transition-colors hover:bg-surface-2"
                >
                  <span className="tabular w-6 shrink-0 text-xs font-bold text-faint">{i + 1}</span>
                  <Crest teamId={row.teamId} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {teamById.get(row.teamId)?.name}
                  </span>
                  <span className="tabular hidden w-16 text-right text-xs text-faint sm:block">
                    {row.played} played
                  </span>
                  <div className="hidden w-32 sm:block">
                    <Bar value={value} max={max} tone={board === 'attack' ? 'accent' : 'rose'} />
                  </div>
                  <span className="tabular w-9 text-right font-display text-lg font-extrabold">{value}</span>
                </Link>
              )
            })}
          </div>
        )}

        {board === 'shutouts' && (
          <div className="card overflow-hidden">
            {shutouts.map((s, i) => (
              <Link
                key={s.teamId}
                to={`/team/${s.teamId}`}
                className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0 transition-colors hover:bg-surface-2"
              >
                <span className="tabular w-6 shrink-0 text-xs font-bold text-faint">{i + 1}</span>
                <Crest teamId={s.teamId} size={28} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {teamById.get(s.teamId)?.name}
                </span>
                <div className="hidden w-32 sm:block">
                  <Bar value={s.shutouts} max={shutouts[0]?.shutouts ?? 1} />
                </div>
                <span className="tabular w-9 text-right font-display text-lg font-extrabold">{s.shutouts}</span>
              </Link>
            ))}
          </div>
        )}

        {board === 'discipline' && (
          <div className="card overflow-hidden">
            <div className="grid grid-cols-[28px_1fr_auto_auto] gap-3 border-b border-[var(--border)] bg-surface-2 px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-wider text-faint">
              <span>#</span>
              <span>Player</span>
              <span className="w-10 text-center">YC</span>
              <span className="w-10 text-center">RC</span>
            </div>
            {discipline.map((d, i) => (
              <div
                key={d.playerId}
                className="grid grid-cols-[28px_1fr_auto_auto] items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 last:border-0 transition-colors hover:bg-surface-2"
              >
                <span className="tabular text-xs font-bold text-faint">{i + 1}</span>
                <span className="flex min-w-0 items-center gap-2.5">
                  <Crest teamId={d.teamId} size={24} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {playerById.get(d.playerId)?.name}
                    </span>
                    <span className="block truncate text-[0.68rem] text-faint">
                      {teamById.get(d.teamId)?.name}
                      {d.suspended > 0 && (
                        <span className="ml-1.5 font-bold text-rose-500">
                          · suspended {d.suspended} {d.suspended === 1 ? 'match' : 'matches'}
                        </span>
                      )}
                    </span>
                  </span>
                </span>
                <span className="tabular w-10 text-center font-display text-sm font-extrabold text-amber-500">
                  {d.yellows}
                </span>
                <span className="tabular w-10 text-center font-display text-sm font-extrabold text-rose-500">
                  {d.reds || '—'}
                </span>
              </div>
            ))}
            {discipline.length === 0 && (
              <p className="py-14 text-center text-sm text-faint">A clean season so far.</p>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}
