import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpDown, Info } from 'lucide-react'
import { Crest } from './Crest'
import { FormGuide, Movement } from './ui'
import { teamById } from '@/data/engine'
import type { StandingRow } from '@/data/types'
import { cx } from '@/lib/format'

type SortKey = 'rank' | 'played' | 'won' | 'drawn' | 'lost' | 'goalsFor' | 'goalsAgainst' | 'goalDiff' | 'points'

const COLUMNS: { key: SortKey; label: string; full: string; hideOnMobile?: boolean }[] = [
  { key: 'played', label: 'P', full: 'Played' },
  { key: 'won', label: 'W', full: 'Won', hideOnMobile: true },
  { key: 'drawn', label: 'D', full: 'Drawn', hideOnMobile: true },
  { key: 'lost', label: 'L', full: 'Lost', hideOnMobile: true },
  { key: 'goalsFor', label: 'GF', full: 'Goals for', hideOnMobile: true },
  { key: 'goalsAgainst', label: 'GA', full: 'Goals against', hideOnMobile: true },
  { key: 'goalDiff', label: 'GD', full: 'Goal difference' },
  { key: 'points', label: 'PTS', full: 'Points' },
]

interface Props {
  rows: StandingRow[]
  /** Highlights a single team, used on team pages. */
  highlightTeamId?: string
  /** Number of top places treated as promotion/qualification. */
  promotionSlots?: number
  relegationSlots?: number
  compact?: boolean
}

export function StandingsTable({
  rows,
  highlightTeamId,
  promotionSlots = 1,
  relegationSlots = 2,
  compact = false,
}: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'rank', dir: 'asc' })

  const sorted = useMemo(() => {
    if (sort.key === 'rank') return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      const diff = (a[sort.key] as number) - (b[sort.key] as number)
      return sort.dir === 'asc' ? diff : -diff
    })
    return copy
  }, [rows, sort])

  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  }

  const maxPoints = Math.max(...rows.map((r) => r.points), 1)

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-surface-2">
              <th className="w-10 py-3 pl-3 text-left text-[0.68rem] font-bold uppercase tracking-wider text-faint">
                #
              </th>
              <th className="py-3 pl-1 text-left text-[0.68rem] font-bold uppercase tracking-wider text-faint">
                Team
              </th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={cx(
                    'px-1.5 py-3 text-center text-[0.68rem] font-bold uppercase tracking-wider text-faint sm:px-2.5',
                    c.hideOnMobile && 'hidden md:table-cell',
                    c.key === 'points' && 'text-base-c',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(c.key)}
                    className="inline-flex items-center gap-1 transition-colors hover:text-base-c"
                    title={`Sort by ${c.full}`}
                  >
                    {c.label}
                    {sort.key === c.key && <ArrowUpDown size={10} />}
                  </button>
                </th>
              ))}
              {!compact && (
                <th className="hidden px-3 py-3 text-left text-[0.68rem] font-bold uppercase tracking-wider text-faint lg:table-cell">
                  Form
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const team = teamById.get(row.teamId)
              const isHighlight = row.teamId === highlightTeamId
              const promotion = row.rank <= promotionSlots
              const relegation = row.rank > rows.length - relegationSlots

              return (
                <tr
                  key={row.teamId}
                  className={cx(
                    'group border-b border-[var(--border)] transition-colors last:border-0 hover:bg-surface-2',
                    isHighlight && 'bg-[var(--accent)]/[0.07]',
                  )}
                  style={{ animationDelay: `${Math.min(i * 22, 500)}ms` }}
                >
                  <td className="relative py-2.5 pl-3">
                    <span
                      aria-hidden
                      className={cx(
                        'absolute left-0 top-1/2 h-[68%] w-[3px] -translate-y-1/2 rounded-r',
                        promotion && 'bg-emerald-500',
                        relegation && 'bg-rose-500',
                        !promotion && !relegation && 'bg-transparent',
                      )}
                    />
                    <div className="flex items-center gap-1.5">
                      <span className="tabular font-display text-sm font-bold">{row.rank}</span>
                      <Movement value={row.movement} />
                    </div>
                  </td>

                  <td className="py-2.5 pl-1 pr-2">
                    <Link
                      to={`/team/${row.teamId}`}
                      className="flex min-w-0 items-center gap-2.5 transition-colors hover:text-accent"
                    >
                      <Crest teamId={row.teamId} size={26} />
                      <span className="min-w-0 truncate font-semibold">{team?.name}</span>
                    </Link>
                  </td>

                  {COLUMNS.map((c) => (
                    <td
                      key={c.key}
                      className={cx(
                        'tabular px-1.5 py-2.5 text-center sm:px-2.5',
                        c.hideOnMobile && 'hidden md:table-cell',
                        c.key === 'points'
                          ? 'font-display text-base font-extrabold'
                          : c.key === 'goalDiff'
                            ? row.goalDiff > 0
                              ? 'font-semibold text-emerald-500'
                              : row.goalDiff < 0
                                ? 'font-semibold text-rose-500'
                                : 'text-muted'
                            : 'text-muted',
                      )}
                    >
                      {c.key === 'goalDiff' && row.goalDiff > 0 ? '+' : ''}
                      {row[c.key]}
                    </td>
                  ))}

                  {!compact && (
                    <td className="hidden px-3 py-2.5 lg:table-cell">
                      <FormGuide form={row.form} size="sm" />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Points-share bar strip — a quick visual read of the gap at the top */}
      {!compact && (
        <div className="flex items-end gap-[3px] border-t border-[var(--border)] bg-surface-2 px-3 py-3">
          {rows.map((r) => (
            <div
              key={r.teamId}
              className={cx(
                'group/bar relative flex-1 rounded-t-sm transition-all duration-300 hover:opacity-100',
                r.teamId === highlightTeamId ? 'bg-[var(--accent)]' : 'bg-[var(--border-strong)] opacity-70',
              )}
              style={{ height: `${Math.max(4, (r.points / maxPoints) * 34)}px` }}
              title={`${teamById.get(r.teamId)?.name}: ${r.points} pts`}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--border)] px-4 py-3 text-[0.7rem] text-faint">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-1 rounded bg-emerald-500" /> Champion / promotion
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-1 rounded bg-rose-500" /> Relegation
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <Info size={12} /> Tap any column to re-sort
        </span>
      </div>
    </div>
  )
}
