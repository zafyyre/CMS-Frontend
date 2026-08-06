import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Search, Shield, X } from 'lucide-react'
import { Button, Chip, Container, EmptyState, FormGuide, SectionHeading } from '@/components/ui'
import { Crest } from '@/components/Crest'
import { TEAMS, getStandings, teamsByDivision } from '@/data/engine'
import { CLUBS, DIVISIONS, clubById, divisionById, venueById } from '@/data/league'
import { cx } from '@/lib/format'
import { useDebounced } from '@/lib/hooks'

type Mode = 'teams' | 'clubs'

const CITIES = [...new Set(CLUBS.map((c) => c.city))].sort()

export default function Teams() {
  const [mode, setMode] = useState<Mode>('clubs')
  const [query, setQuery] = useState('')
  const [division, setDivision] = useState('all')
  const [city, setCity] = useState('all')
  const debounced = useDebounced(query)

  const standingsByTeam = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getStandings>[number]>()
    for (const d of DIVISIONS) {
      for (const row of getStandings(d.id)) map.set(row.teamId, row)
    }
    return map
  }, [])

  const filteredTeams = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    return TEAMS.filter((t) => {
      if (division !== 'all' && t.divisionId !== division) return false
      const club = clubById.get(t.clubId)
      if (city !== 'all' && club?.city !== city) return false
      if (q && !t.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [debounced, division, city])

  const filteredClubs = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    return CLUBS.filter((c) => {
      if (city !== 'all' && c.city !== city) return false
      if (q && !c.name.toLowerCase().includes(q)) return false
      if (division !== 'all') {
        const hasSide = (teamsByDivision.get(division) ?? []).some((t) => t.clubId === c.id)
        if (!hasSide) return false
      }
      return true
    })
  }, [debounced, division, city])

  const activeFilters = (division !== 'all' ? 1 : 0) + (city !== 'all' ? 1 : 0) + (query ? 1 : 0)
  const reset = () => {
    setDivision('all')
    setCity('all')
    setQuery('')
  }

  return (
    <Container className="py-10 sm:py-14">
      <SectionHeading
        eyebrow="Directory"
        title="Teams & clubs"
        description={`${CLUBS.length} sample clubs field ${TEAMS.length} sides across the valley. All fictional.`}
      />

      {/* Mode switch */}
      <div className="mt-8 inline-flex rounded-xl border border-[var(--border)] bg-surface-2 p-1">
        {(['clubs', 'teams'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={cx(
              'relative rounded-lg px-5 py-2 text-sm font-semibold capitalize transition-colors',
              mode === m ? 'text-base-c' : 'text-faint hover:text-muted',
            )}
          >
            {mode === m && (
              <motion.span
                layoutId="teams-mode"
                className="absolute inset-0 rounded-lg bg-surface shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{m}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-5 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'clubs' ? 'Search clubs…' : 'Search teams…'}
            aria-label="Search"
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-surface-2 pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-faint focus:border-[var(--accent)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-base-c"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Chip active={division === 'all'} onClick={() => setDivision('all')}>
            All divisions
          </Chip>
          {DIVISIONS.map((d) => (
            <Chip key={d.id} active={division === d.id} onClick={() => setDivision(d.id)}>
              {d.name}
            </Chip>
          ))}
        </div>

        <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Chip active={city === 'all'} onClick={() => setCity('all')}>
            Everywhere
          </Chip>
          {CITIES.map((c) => (
            <Chip key={c} active={city === c} onClick={() => setCity(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-faint">
          {mode === 'clubs' ? filteredClubs.length : filteredTeams.length}{' '}
          {mode === 'clubs' ? 'clubs' : 'teams'}
        </p>
        {activeFilters > 0 && (
          <button type="button" onClick={reset} className="text-sm font-semibold text-accent hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      <div className="mt-4">
        {mode === 'clubs' ? (
          filteredClubs.length === 0 ? (
            <EmptyState icon={<Shield size={36} />} title="No clubs match" description="Try widening your filters." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClubs.map((club, i) => {
                const sides = TEAMS.filter((t) => t.clubId === club.id)
                const venue = venueById.get(club.homeVenueId)
                return (
                  <motion.div
                    key={club.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(i * 0.02, 0.25) }}
                  >
                    <Link to={`/club/${club.id}`} className="card card-hover group block overflow-hidden">
                      <div
                        className="h-1.5 w-full"
                        style={{ background: `linear-gradient(90deg, ${club.colors[0]}, ${club.colors[1]})` }}
                      />
                      <div className="flex items-start gap-3.5 p-4">
                        <Crest clubId={club.id} size={46} />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base transition-colors group-hover:text-accent">
                            {club.name}
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-faint">
                            <MapPin size={11} />
                            {club.city} · est. {club.founded}
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-1">
                            {sides.slice(0, 4).map((s) => (
                              <span
                                key={s.id}
                                className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-muted"
                              >
                                {divisionById.get(s.divisionId)?.name}
                              </span>
                            ))}
                            {sides.length > 4 && (
                              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[0.62rem] font-bold text-faint">
                                +{sides.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="truncate border-t border-[var(--border)] px-4 py-2.5 text-[0.7rem] text-faint">
                        Home: {venue?.name}
                      </p>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )
        ) : filteredTeams.length === 0 ? (
          <EmptyState icon={<Shield size={36} />} title="No teams match" description="Try widening your filters." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team, i) => {
              const row = standingsByTeam.get(team.id)
              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.015, 0.25) }}
                >
                  <Link to={`/team/${team.id}`} className="card card-hover group flex items-center gap-3.5 p-4">
                    <Crest teamId={team.id} size={42} />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold transition-colors group-hover:text-accent">
                        {team.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-faint">{divisionById.get(team.divisionId)?.fullName}</p>
                      {row && (
                        <div className="mt-2 flex items-center gap-2">
                          <FormGuide form={row.form} size="sm" />
                        </div>
                      )}
                    </div>
                    {row && (
                      <div className="shrink-0 text-right">
                        <p className="tabular font-display text-xl font-extrabold">{row.points}</p>
                        <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-faint">
                          {row.rank === 1 ? '1st' : `${row.rank}th`}
                        </p>
                      </div>
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <div className="card mt-10 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h3 className="text-lg">Don&rsquo;t see a club near you?</h3>
          <p className="mt-1 text-sm text-muted">
            New clubs are welcomed every season. We&rsquo;ll walk you through what&rsquo;s needed.
          </p>
        </div>
        <Button to="/register">Apply as a new club</Button>
      </div>
    </Container>
  )
}
