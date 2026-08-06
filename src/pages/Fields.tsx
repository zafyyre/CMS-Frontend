import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Lightbulb, MapPin, Navigation, Search } from 'lucide-react'
import { Badge, Button, Chip, Container, EmptyState, SectionHeading } from '@/components/ui'
import { MATCHES, teamById } from '@/data/engine'
import { NOW, VENUES } from '@/data/league'
import { cx, formatDate, formatTime } from '@/lib/format'
import { useDebounced } from '@/lib/hooks'
import type { Venue } from '@/data/types'

const CITIES = [...new Set(VENUES.map((v) => v.city))].sort()

/**
 * Venue map. Rather than pulling map tiles from a third party, positions are
 * projected from each field's coordinates onto a stylised canvas — it loads
 * instantly, works offline and matches the site's theme in both modes.
 */
function VenueMap({
  venues,
  activeId,
  onSelect,
}: {
  venues: Venue[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  const bounds = useMemo(() => {
    const lats = VENUES.map((v) => v.lat)
    const lngs = VENUES.map((v) => v.lng)
    return {
      minLat: Math.min(...lats) - 0.03,
      maxLat: Math.max(...lats) + 0.03,
      minLng: Math.min(...lngs) - 0.05,
      maxLng: Math.max(...lngs) + 0.05,
    }
  }, [])

  const project = (v: Venue) => ({
    x: ((v.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100,
    // Latitude increases northward, SVG y increases downward.
    y: (1 - (v.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100,
  })

  return (
    <div className="card relative aspect-[16/10] overflow-hidden sm:aspect-[16/8]">
      <div aria-hidden className="pitch-grid absolute inset-0 opacity-70" />

      {/* Stylised water + landmass wash so the dots have context */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-azure-500)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--color-azure-500)" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {/* Burrard Inlet / Georgia Strait suggestion across the north-west */}
        <path d="M0 0 L100 0 L100 12 Q66 22 40 18 Q18 15 0 30 Z" fill="url(#water)" />
        {/* Fraser River suggestion across the south */}
        <path d="M0 78 Q30 70 58 76 Q80 81 100 74 L100 100 L0 100 Z" fill="url(#water)" />
      </svg>

      {venues.map((v, i) => {
        const { x, y } = project(v)
        const active = v.id === activeId
        return (
          <motion.button
            key={v.id}
            type="button"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.5), ease: [0.34, 1.56, 0.64, 1] }}
            onClick={() => onSelect(v.id)}
            style={{ left: `${x}%`, top: `${y}%` }}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            aria-label={`${v.name}, ${v.city}`}
          >
            <span
              className={cx(
                'block rounded-full border-2 border-[var(--bg)] transition-all duration-300',
                active
                  ? 'h-4 w-4 bg-[var(--accent)] ring-4 ring-[var(--accent)]/30'
                  : 'h-3 w-3 bg-[var(--text-faint)] group-hover:h-4 group-hover:w-4 group-hover:bg-[var(--accent)]',
              )}
            />
            <span
              className={cx(
                'pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--border)] bg-surface px-2 py-1 text-[0.65rem] font-bold shadow-lg transition-opacity',
                active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
              )}
            >
              {v.name}
            </span>
          </motion.button>
        )
      })}

      <p className="absolute bottom-3 left-3 rounded-lg bg-surface/85 px-2.5 py-1 text-[0.62rem] text-faint backdrop-blur">
        {venues.length} fields · positioned by coordinates
      </p>
    </div>
  )
}

export default function Fields() {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('all')
  const [surface, setSurface] = useState<'all' | 'Turf' | 'Grass'>('all')
  const [active, setActive] = useState<string | null>(null)
  const debounced = useDebounced(query)

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    return VENUES.filter((v) => {
      if (city !== 'all' && v.city !== city) return false
      if (surface !== 'all' && v.surface !== surface) return false
      if (q && !`${v.name} ${v.city} ${v.address}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [debounced, city, surface])

  const upcomingByVenue = useMemo(() => {
    const map = new Map<string, typeof MATCHES>()
    for (const m of MATCHES) {
      if (new Date(m.kickoff) < NOW) continue
      const list = map.get(m.venueId)
      if (list) {
        if (list.length < 3) list.push(m)
      } else map.set(m.venueId, [m])
    }
    return map
  }, [])

  return (
    <Container className="py-10 sm:py-14">
      <SectionHeading
        eyebrow="Where we play"
        title="Fields"
        description={`${VENUES.length} venues across the Lower Mainland. Tap any pin for directions and what's on next.`}
      />

      <div className="mt-8">
        <VenueMap venues={filtered} activeId={active} onSelect={setActive} />
      </div>

      {/* Filters */}
      <div className="mt-6 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fields by name, city or address…"
            aria-label="Search fields"
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-surface-2 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-faint focus:border-[var(--accent)]"
          />
        </div>

        <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Chip active={city === 'all'} onClick={() => setCity('all')}>
            All cities
          </Chip>
          {CITIES.map((c) => (
            <Chip key={c} active={city === c} onClick={() => setCity(c)}>
              {c}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 bg-[var(--border)]" />
          {(['all', 'Turf', 'Grass'] as const).map((s) => (
            <Chip key={s} active={surface === s} onClick={() => setSurface(s)}>
              {s === 'all' ? 'Any surface' : s}
            </Chip>
          ))}
        </div>
      </div>

      <p className="mt-5 text-sm text-faint">{filtered.length} fields</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v, i) => {
          const next = upcomingByVenue.get(v.id) ?? []
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${v.name}, ${v.address}`,
          )}`
          return (
            <motion.div
              key={v.id}
              id={v.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.3) }}
              onMouseEnter={() => setActive(v.id)}
              className={cx(
                'card overflow-hidden transition-colors',
                active === v.id && 'border-[var(--accent)]',
              )}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base">{v.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-faint">
                      <MapPin size={11} />
                      {v.address}
                    </p>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--accent)]/12 text-accent">
                    <MapPin size={16} />
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone={v.surface === 'Turf' ? 'success' : 'neutral'}>{v.surface}</Badge>
                  <Badge>{v.fields} fields</Badge>
                  {v.lights && (
                    <Badge tone="warn">
                      <Lightbulb size={10} />
                      Floodlit
                    </Badge>
                  )}
                </div>

                {next.length > 0 && (
                  <div className="mt-4 border-t border-[var(--border)] pt-3">
                    <p className="mb-2 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-faint">
                      <CalendarDays size={11} />
                      Next up here
                    </p>
                    <ul className="space-y-1.5">
                      {next.map((m) => (
                        <li key={m.id}>
                          <Link
                            to={`/match/${m.id}`}
                            className="flex items-center gap-2 text-[0.72rem] text-muted transition-colors hover:text-accent"
                          >
                            <span className="tabular shrink-0 font-semibold text-faint">
                              {formatDate(m.kickoff, 'day')} {formatTime(m.kickoff)}
                            </span>
                            <span className="min-w-0 truncate">
                              {teamById.get(m.homeTeamId)?.name} v {teamById.get(m.awayTeamId)?.name}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 border-t border-[var(--border)] bg-surface-2 py-2.5 text-xs font-semibold text-muted transition-colors hover:bg-surface-3 hover:text-accent"
              >
                <Navigation size={13} />
                Directions
              </a>
            </motion.div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={<MapPin size={36} />}
          title="No fields match"
          description="Try a different city or surface."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCity('all')
                setSurface('all')
                setQuery('')
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}

      <div className="card mt-10 p-6">
        <h3 className="text-lg">Field closures</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Fields are closed by the municipality, not by the league. Closures are posted here as soon as we are
          notified — usually by 7:00 am on match day for morning kickoffs, and by noon for afternoon fixtures. If
          nothing is posted, assume the match is on. Referees make the final call on playability once they are at
          the ground.
        </p>
      </div>
    </Container>
  )
}
