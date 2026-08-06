import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Filter, LayoutGrid, List, Search, X } from 'lucide-react'
import { Button, Chip, Container, EmptyState, SectionHeading } from '@/components/ui'
import { MatchCard, MatchRow } from '@/components/MatchCard'
import { MATCHES, currentMatchdayRange, matchdayWeekends, teamById } from '@/data/engine'
import { CLUBS, DIVISIONS, venueById } from '@/data/league'
import { cx, formatDate, formatTime } from '@/lib/format'
import { useDebounced, useLocalStorage } from '@/lib/hooks'

type View = 'list' | 'grid'

export default function Fixtures() {
  const [params, setParams] = useSearchParams()
  const weekends = useMemo(() => matchdayWeekends(), [])
  const [defaultFrom] = currentMatchdayRange()

  const initialIndex = Math.max(
    0,
    weekends.findIndex((w) => w.getTime() === defaultFrom.getTime()),
  )
  const [weekIndex, setWeekIndex] = useState(initialIndex)
  const [division, setDivision] = useState(params.get('division') ?? 'all')
  const [club, setClub] = useState(params.get('club') ?? 'all')
  const [query, setQuery] = useState('')
  const [view, setView] = useLocalStorage<View>('vmsl-fixtures-view', 'list')
  const [showFilters, setShowFilters] = useState(false)

  const debouncedQuery = useDebounced(query)
  const weekStart = weekends[weekIndex]

  const matches = useMemo(() => {
    if (!weekStart) return []
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 3)

    return MATCHES.filter((m) => {
      const t = new Date(m.kickoff).getTime()
      if (t < weekStart.getTime() || t >= end.getTime()) return false
      if (division !== 'all' && m.divisionId !== division) return false
      if (club !== 'all') {
        const home = teamById.get(m.homeTeamId)
        const away = teamById.get(m.awayTeamId)
        if (home?.clubId !== club && away?.clubId !== club) return false
      }
      if (debouncedQuery.trim()) {
        const q = debouncedQuery.toLowerCase()
        const haystack = `${teamById.get(m.homeTeamId)?.name} ${teamById.get(m.awayTeamId)?.name} ${
          venueById.get(m.venueId)?.name
        }`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [weekStart, division, club, debouncedQuery])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof matches>()
    for (const m of matches) {
      const key = new Date(m.kickoff).toDateString()
      const list = map.get(key)
      if (list) list.push(m)
      else map.set(key, [m])
    }
    return [...map.entries()]
  }, [matches])

  const activeFilters = (division !== 'all' ? 1 : 0) + (club !== 'all' ? 1 : 0) + (query ? 1 : 0)

  const reset = () => {
    setDivision('all')
    setClub('all')
    setQuery('')
    setParams({})
  }

  return (
    <Container className="py-10 sm:py-14">
      <SectionHeading
        eyebrow="Schedule"
        title="Fixtures & results"
        description="Pick a weekend, narrow by division or club, and jump straight into any match."
      />

      {/* Weekend navigator */}
      <div className="card mt-8 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-surface-2 px-3 py-2.5">
          <button
            type="button"
            onClick={() => setWeekIndex((i) => Math.max(0, i - 1))}
            disabled={weekIndex === 0}
            aria-label="Previous weekend"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-base-c disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="flex items-center justify-center gap-2 font-display text-sm font-bold sm:text-base">
              <CalendarDays size={15} className="shrink-0 text-accent" />
              {weekStart ? (
                <>
                  {formatDate(weekStart, 'day')} –{' '}
                  {formatDate(new Date(weekStart.getTime() + 2 * 86400000), 'short')}
                </>
              ) : (
                'No fixtures'
              )}
            </p>
            <p className="mt-0.5 text-[0.68rem] text-faint">
              Matchday {weekIndex + 1} of {weekends.length} · {matches.length} matches
            </p>
          </div>

          <button
            type="button"
            onClick={() => setWeekIndex((i) => Math.min(weekends.length - 1, i + 1))}
            disabled={weekIndex >= weekends.length - 1}
            aria-label="Next weekend"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-base-c disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekend strip */}
        <div className="no-scrollbar fade-x flex gap-1 overflow-x-auto px-3 py-2.5">
          {weekends.map((w, i) => {
            const isCurrent = w.getTime() === defaultFrom.getTime()
            return (
              <button
                key={w.toISOString()}
                type="button"
                onClick={() => setWeekIndex(i)}
                className={cx(
                  'relative shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors',
                  i === weekIndex
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                    : 'text-faint hover:bg-surface-2 hover:text-base-c',
                )}
              >
                {formatDate(w, 'day')}
                {isCurrent && i !== weekIndex && (
                  <span className="absolute -top-0.5 right-1 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams or fields…"
            aria-label="Search fixtures"
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-surface-2 pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-faint focus:border-[var(--accent)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-base-c"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className={cx(
            'flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition-colors',
            showFilters || activeFilters
              ? 'border-[var(--accent)] text-accent'
              : 'border-[var(--border)] text-muted hover:text-base-c',
          )}
        >
          <Filter size={15} />
          Filters
          {activeFilters > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--accent)] px-1 text-[0.65rem] font-bold text-[var(--accent-contrast)]">
              {activeFilters}
            </span>
          )}
        </button>

        <div className="flex h-10 items-center rounded-xl border border-[var(--border)] bg-surface-2 p-1">
          {(
            [
              ['list', List],
              ['grid', LayoutGrid],
            ] as const
          ).map(([v, Icon]) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-label={`${v} view`}
              aria-pressed={view === v}
              className={cx(
                'grid h-8 w-9 place-items-center rounded-lg transition-colors',
                view === v ? 'bg-surface text-base-c shadow-sm' : 'text-faint hover:text-muted',
              )}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      {showFilters && (
        <div className="card mt-3 space-y-4 p-4">
          <div>
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-wider text-faint">Division</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={division === 'all'} onClick={() => setDivision('all')}>
                All
              </Chip>
              {DIVISIONS.map((d) => (
                <Chip key={d.id} active={division === d.id} onClick={() => setDivision(d.id)}>
                  {d.name}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-wider text-faint">Club</p>
            <div className="no-scrollbar flex max-h-32 flex-wrap gap-2 overflow-y-auto">
              <Chip active={club === 'all'} onClick={() => setClub('all')}>
                All clubs
              </Chip>
              {CLUBS.map((c) => (
                <Chip key={c.id} active={club === c.id} onClick={() => setClub(c.id)}>
                  {c.name}
                </Chip>
              ))}
            </div>
          </div>

          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <X size={14} />
              Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Results */}
      <div className="mt-8">
        {matches.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={36} />}
            title="No fixtures match these filters"
            description="Try a different weekend, or widen your division and club selection."
            action={
              activeFilters > 0 ? (
                <Button variant="outline" size="sm" onClick={reset}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : view === 'grid' ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([day, dayMatches]) => (
              <div key={day}>
                <div className="sticky top-16 z-10 -mx-2 mb-1 flex items-center gap-3 bg-app/90 px-2 py-2 backdrop-blur">
                  <h3 className="font-display text-sm font-bold">{formatDate(new Date(day), 'long')}</h3>
                  <span className="h-px flex-1 bg-[var(--border)]" />
                  <span className="text-xs text-faint">{dayMatches.length} matches</span>
                </div>
                <div className="card divide-y divide-[var(--border)] overflow-hidden">
                  {dayMatches.map((m) => (
                    <MatchRow key={m.id} match={m} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Print-friendly summary for team officials */}
      {matches.length > 0 && (
        <details className="card mt-8 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-muted transition-colors hover:text-base-c">
            Copy this weekend as plain text
          </summary>
          <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-surface-2 p-4 text-xs leading-relaxed text-muted">
            {matches
              .map(
                (m) =>
                  `${formatDate(m.kickoff, 'weekday')} ${formatTime(m.kickoff)}  ${teamById.get(m.homeTeamId)
                    ?.name} vs ${teamById.get(m.awayTeamId)?.name}  @ ${venueById.get(m.venueId)?.name}`,
              )
              .join('\n')}
          </pre>
        </details>
      )}
    </Container>
  )
}
