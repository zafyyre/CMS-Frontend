import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Award, ShieldCheck, Target, TrendingUp } from 'lucide-react'
import { Chip, Container, SectionHeading, Select } from '@/components/ui'
import { StandingsTable } from '@/components/StandingsTable'
import { MatchRow } from '@/components/MatchCard'
import { Crest } from '@/components/Crest'
import {
  getScorers,
  getShutouts,
  getStandings,
  matchesByDivision,
  playerById,
  seasonProgress,
  teamById,
} from '@/data/engine'
import { DIVISIONS, SEASONS, SEASON_ID, divisionById } from '@/data/league'
import { cx, formatDate } from '@/lib/format'

type Tab = 'table' | 'results' | 'fixtures' | 'scorers' | 'shutouts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'table', label: 'Table' },
  { id: 'results', label: 'Results' },
  { id: 'fixtures', label: 'Fixtures' },
  { id: 'scorers', label: 'Scorers' },
  { id: 'shutouts', label: 'Shutouts' },
]

function LeadCard({
  icon: Icon,
  label,
  value,
  sub,
  teamId,
}: {
  icon: typeof Award
  label: string
  value: string
  sub: string
  teamId?: string
}) {
  return (
    <div className="card flex items-center gap-3.5 p-4">
      {teamId ? (
        <Crest teamId={teamId} size={38} />
      ) : (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)]/12 text-accent">
          <Icon size={18} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[0.68rem] font-bold uppercase tracking-wider text-faint">{label}</p>
        <p className="truncate font-display text-base font-extrabold">{value}</p>
        <p className="truncate text-xs text-muted">{sub}</p>
      </div>
    </div>
  )
}

export default function Standings() {
  const [params, setParams] = useSearchParams()
  const [division, setDivision] = useState(params.get('division') ?? 'premier')
  const [season, setSeason] = useState<string>(SEASON_ID)
  const [tab, setTab] = useState<Tab>('table')

  const table = useMemo(() => getStandings(division), [division])
  const scorers = useMemo(() => getScorers(division).slice(0, 25), [division])
  const shutouts = useMemo(() => getShutouts(division).slice(0, 15), [division])
  const all = matchesByDivision.get(division) ?? []
  const results = useMemo(() => all.filter((m) => m.status === 'final').reverse().slice(0, 40), [all])
  const fixtures = useMemo(() => all.filter((m) => m.status !== 'final').slice(0, 40), [all])
  const progress = seasonProgress(division)
  const meta = divisionById.get(division)

  const isArchive = season !== SEASON_ID
  const leader = table[0]
  const topScorer = scorers[0]
  const bestDefence = shutouts[0]
  const inForm = useMemo(
    () =>
      [...table].sort(
        (a, b) =>
          b.form.filter((f) => f === 'W').length - a.form.filter((f) => f === 'W').length || b.points - a.points,
      )[0],
    [table],
  )

  const changeDivision = (id: string) => {
    setDivision(id)
    setParams({ division: id })
  }

  return (
    <Container className="py-10 sm:py-14">
      <SectionHeading eyebrow="Competition" title="Standings & schedule" description={meta?.blurb} />

      {/* Selectors */}
      <div className="mt-8 flex flex-wrap items-end gap-3">
        <Select
          label="Season"
          value={season}
          onChange={setSeason}
          options={SEASONS.map((s) => ({ value: s, label: s }))}
          className="w-36"
        />
        <Select
          label="Division"
          value={division}
          onChange={changeDivision}
          options={DIVISIONS.map((d) => ({ value: d.id, label: d.fullName }))}
          className="min-w-[220px] flex-1 sm:max-w-xs"
        />
      </div>

      <div className="no-scrollbar fade-x -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {DIVISIONS.map((d) => (
          <Chip key={d.id} active={division === d.id} onClick={() => changeDivision(d.id)}>
            {d.name}
          </Chip>
        ))}
      </div>

      {isArchive ? (
        <div className="card mt-8 px-6 py-16 text-center">
          <p className="font-display text-lg font-bold">Archive season</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Full tables and results for {season} are kept in the league archive. Select {SEASON_ID} to return to
            the current campaign.
          </p>
          <button
            type="button"
            onClick={() => setSeason(SEASON_ID)}
            className="mt-5 text-sm font-semibold text-accent hover:underline"
          >
            Back to {SEASON_ID}
          </button>
        </div>
      ) : (
        <>
          {/* Season progress */}
          <div className="card mt-6 p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-muted">Season progress</span>
              <span className="tabular font-bold text-accent">{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-sky-400"
              />
            </div>
            <p className="mt-2 text-[0.7rem] text-faint">
              {all.filter((m) => m.status === 'final').length} of {all.length} fixtures played
            </p>
          </div>

          {/* Division leaders */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {leader && (
              <LeadCard
                icon={Award}
                label="Top of the table"
                value={teamById.get(leader.teamId)?.name ?? ''}
                sub={`${leader.points} pts from ${leader.played} · GD ${leader.goalDiff > 0 ? '+' : ''}${leader.goalDiff}`}
                teamId={leader.teamId}
              />
            )}
            {topScorer && (
              <LeadCard
                icon={Target}
                label="Leading scorer"
                value={playerById.get(topScorer.playerId)?.name ?? ''}
                sub={`${topScorer.goals} goals · ${teamById.get(topScorer.teamId)?.name}`}
              />
            )}
            {bestDefence && (
              <LeadCard
                icon={ShieldCheck}
                label="Most shutouts"
                value={teamById.get(bestDefence.teamId)?.name ?? ''}
                sub={`${bestDefence.shutouts} clean sheets · ${bestDefence.conceded} conceded`}
                teamId={bestDefence.teamId}
              />
            )}
            {inForm && (
              <LeadCard
                icon={TrendingUp}
                label="Best recent form"
                value={teamById.get(inForm.teamId)?.name ?? ''}
                sub={`${inForm.form.join(' ')} in the last ${inForm.form.length}`}
                teamId={inForm.teamId}
              />
            )}
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Division views"
            className="no-scrollbar fade-x mt-8 flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-surface-2 p-1"
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
                    layoutId="standings-tab"
                    className="absolute inset-0 rounded-lg bg-surface shadow-sm"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-5">
            {tab === 'table' && (
              <StandingsTable
                rows={table}
                promotionSlots={division === 'premier' ? 1 : 2}
                relegationSlots={division === 'div4' ? 0 : 2}
              />
            )}

            {(tab === 'results' || tab === 'fixtures') && (
              <div className="card divide-y divide-[var(--border)] overflow-hidden">
                {(tab === 'results' ? results : fixtures).map((m) => (
                  <MatchRow key={m.id} match={m} />
                ))}
                {(tab === 'results' ? results : fixtures).length === 0 && (
                  <p className="py-12 text-center text-sm text-faint">Nothing scheduled here yet.</p>
                )}
              </div>
            )}

            {tab === 'scorers' && (
              <div className="card overflow-hidden">
                <div className="grid grid-cols-[36px_1fr_auto] gap-3 border-b border-[var(--border)] bg-surface-2 px-4 py-2.5 text-[0.68rem] font-bold uppercase tracking-wider text-faint sm:grid-cols-[36px_1fr_140px_auto]">
                  <span>#</span>
                  <span>Player</span>
                  <span className="hidden sm:block">Team</span>
                  <span className="text-right">Goals</span>
                </div>
                {scorers.map((s, i) => (
                  <div
                    key={s.playerId}
                    className="grid grid-cols-[36px_1fr_auto] items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 last:border-0 transition-colors hover:bg-surface-2 sm:grid-cols-[36px_1fr_140px_auto]"
                  >
                    <span
                      className={cx(
                        'tabular grid h-6 w-6 place-items-center rounded-md text-xs font-bold',
                        i === 0 ? 'bg-[var(--accent)] text-[var(--accent-contrast)]' : 'text-faint',
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Crest teamId={s.teamId} size={24} className="sm:hidden" />
                      <span className="truncate text-sm font-semibold">{playerById.get(s.playerId)?.name}</span>
                    </span>
                    <span className="hidden min-w-0 items-center gap-2 sm:flex">
                      <Crest teamId={s.teamId} size={20} />
                      <span className="truncate text-xs text-muted">{teamById.get(s.teamId)?.name}</span>
                    </span>
                    <span className="tabular text-right font-display text-base font-extrabold text-accent">
                      {s.goals}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {tab === 'shutouts' && (
              <div className="card overflow-hidden">
                {shutouts.map((s, i) => {
                  const max = shutouts[0]?.shutouts || 1
                  return (
                    <div
                      key={s.teamId}
                      className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0"
                    >
                      <span className="tabular w-6 text-xs font-bold text-faint">{i + 1}</span>
                      <Crest teamId={s.teamId} size={26} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {teamById.get(s.teamId)?.name}
                      </span>
                      <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-surface-3 sm:block">
                        <div
                          className="h-full rounded-full bg-[var(--accent)]"
                          style={{ width: `${(s.shutouts / max) * 100}%` }}
                        />
                      </div>
                      <span className="tabular w-10 text-right font-display text-base font-extrabold">
                        {s.shutouts}
                      </span>
                      <span className="tabular hidden w-20 text-right text-xs text-faint sm:block">
                        {s.conceded} conc.
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {results[0] && (
            <p className="mt-4 text-center text-xs text-faint">
              Last updated after {formatDate(results[0].kickoff, 'long')}
            </p>
          )}
        </>
      )}
    </Container>
  )
}
