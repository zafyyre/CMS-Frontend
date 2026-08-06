import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, CornerDownLeft, Search, Shield, Table2, Trophy } from 'lucide-react'
import { Crest } from '../Crest'
import { TEAMS } from '@/data/engine'
import { CLUBS, DIVISIONS, VENUES } from '@/data/league'
import { cx } from '@/lib/format'
import { useScrollLock } from '@/lib/hooks'

interface Entry {
  id: string
  label: string
  sub: string
  to: string
  group: 'Teams' | 'Divisions' | 'Clubs' | 'Fields' | 'Pages'
  teamId?: string
  clubId?: string
}

const PAGES: Entry[] = [
  { id: 'p-fixtures', label: 'Fixtures & results', sub: 'Every match, filterable by weekend', to: '/fixtures', group: 'Pages' },
  { id: 'p-standings', label: 'Standings', sub: 'League tables for all divisions', to: '/standings', group: 'Pages' },
  { id: 'p-teams', label: 'Teams & clubs', sub: 'Browse the full directory', to: '/teams', group: 'Pages' },
  { id: 'p-stats', label: 'Statistics', sub: 'Scorers, shutouts and discipline', to: '/stats', group: 'Pages' },
  { id: 'p-fields', label: 'Fields', sub: 'Venues, surfaces and directions', to: '/fields', group: 'Pages' },
  { id: 'p-register', label: 'Registration', sub: 'Players, teams and new clubs', to: '/register', group: 'Pages' },
  { id: 'p-discipline', label: 'Discipline', sub: 'Suspensions, fines and appeals', to: '/discipline', group: 'Pages' },
  { id: 'p-news', label: 'News', sub: 'League announcements', to: '/news', group: 'Pages' },
  { id: 'p-about', label: 'About the league', sub: 'Board, documents and honours', to: '/about', group: 'Pages' },
]

const GROUP_ICON = {
  Teams: Shield,
  Divisions: Table2,
  Clubs: Trophy,
  Fields: CalendarDays,
  Pages: Search,
} as const

function buildIndex(): Entry[] {
  return [
    ...PAGES,
    ...DIVISIONS.map<Entry>((d) => ({
      id: `d-${d.id}`,
      label: d.fullName,
      sub: 'Standings and fixtures',
      to: `/standings?division=${d.id}`,
      group: 'Divisions',
    })),
    ...TEAMS.map<Entry>((t) => ({
      id: `t-${t.id}`,
      label: t.name,
      sub: DIVISIONS.find((d) => d.id === t.divisionId)?.fullName ?? '',
      to: `/team/${t.id}`,
      group: 'Teams',
      teamId: t.id,
    })),
    ...CLUBS.map<Entry>((c) => ({
      id: `c-${c.id}`,
      label: c.name,
      sub: `${c.city} · founded ${c.founded}`,
      to: `/club/${c.id}`,
      group: 'Clubs',
      clubId: c.id,
    })),
    ...VENUES.map<Entry>((v) => ({
      id: `v-${v.id}`,
      label: v.name,
      sub: `${v.city} · ${v.surface}`,
      to: `/fields#${v.id}`,
      group: 'Fields',
    })),
  ]
}

/** Subsequence match — "bb5 a" finds "BB5 United A". */
function score(query: string, text: string): number {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (!q) return 0
  const direct = t.indexOf(q)
  if (direct === 0) return 1000
  if (direct > 0) return 700 - direct

  let qi = 0
  let hits = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      qi++
      hits++
    }
  }
  return qi === q.length ? 200 + hits : -1
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useScrollLock(open)

  const index = useMemo(buildIndex, [])

  const results = useMemo(() => {
    if (!query.trim()) {
      return PAGES.slice(0, 7)
    }
    return index
      .map((e) => ({ e, s: Math.max(score(query, e.label), score(query, e.sub) - 120) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 24)
      .map((r) => r.e)
  }, [query, index])

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      // Focus after the entry animation begins so the caret lands correctly.
      const id = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [open])

  useEffect(() => setCursor(0), [query])

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  const commit = (entry: Entry) => {
    navigate(entry.to)
    onClose()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => (c + 1) % Math.max(results.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => (c - 1 + results.length) % Math.max(results.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const entry = results[cursor]
      if (entry) commit(entry)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  let lastGroup = ''

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[10vh] sm:pt-[14vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
          />

          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="Search"
            className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-surface shadow-[0_32px_90px_-24px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
              <Search size={18} className="shrink-0 text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search teams, clubs, divisions, fields…"
                className="h-14 flex-1 bg-transparent text-[0.95rem] outline-none placeholder:text-faint"
                aria-label="Search"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="hidden rounded border border-[var(--border-strong)] px-1.5 py-0.5 text-[0.65rem] font-semibold text-faint sm:inline">
                ESC
              </kbd>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain p-2">
              {results.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-faint">
                  Nothing matched &ldquo;{query}&rdquo;.
                </p>
              ) : (
                results.map((entry, i) => {
                  const showGroup = entry.group !== lastGroup
                  lastGroup = entry.group
                  const Icon = GROUP_ICON[entry.group]
                  return (
                    <div key={entry.id}>
                      {showGroup && (
                        <p className="px-3 pb-1 pt-3 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-faint">
                          {entry.group}
                        </p>
                      )}
                      <button
                        type="button"
                        data-active={i === cursor}
                        onMouseMove={() => setCursor(i)}
                        onClick={() => commit(entry)}
                        className={cx(
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                          i === cursor ? 'bg-[var(--accent)]/12' : 'hover:bg-surface-2',
                        )}
                      >
                        {entry.teamId || entry.clubId ? (
                          <Crest teamId={entry.teamId} clubId={entry.clubId} size={26} />
                        ) : (
                          <span className="grid h-[26px] w-[26px] place-items-center rounded-lg bg-surface-3 text-faint">
                            <Icon size={14} />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{entry.label}</span>
                          <span className="block truncate text-xs text-faint">{entry.sub}</span>
                        </span>
                        {i === cursor && <CornerDownLeft size={14} className="shrink-0 text-accent" />}
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-[var(--border)] bg-surface-2 px-4 py-2.5 text-[0.68rem] text-faint">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-[var(--border-strong)] px-1 py-0.5 font-semibold">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-[var(--border-strong)] px-1 py-0.5 font-semibold">↵</kbd>
                open
              </span>
              <span className="ml-auto">{results.length} results</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
