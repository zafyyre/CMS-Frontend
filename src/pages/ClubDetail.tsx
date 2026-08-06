import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Navigation } from 'lucide-react'
import { Badge, Button, Container, EmptyState, FormGuide } from '@/components/ui'
import { Crest } from '@/components/Crest'
import { MatchRow } from '@/components/MatchCard'
import { MATCHES, TEAMS, getStandings } from '@/data/engine'
import { DIVISIONS, clubById, divisionById, venueById } from '@/data/league'
import { ordinal } from '@/lib/format'

export default function ClubDetail() {
  const { clubId } = useParams()
  const club = clubId ? clubById.get(clubId) : undefined

  const sides = useMemo(() => TEAMS.filter((t) => t.clubId === clubId), [clubId])
  const standings = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getStandings>[number]>()
    for (const d of DIVISIONS) for (const r of getStandings(d.id)) map.set(r.teamId, r)
    return map
  }, [])

  const sideIds = useMemo(() => new Set(sides.map((s) => s.id)), [sides])
  const upcoming = useMemo(
    () =>
      MATCHES.filter(
        (m) => m.status !== 'final' && (sideIds.has(m.homeTeamId) || sideIds.has(m.awayTeamId)),
      ).slice(0, 6),
    [sideIds],
  )
  const recent = useMemo(
    () =>
      MATCHES.filter((m) => m.status === 'final' && (sideIds.has(m.homeTeamId) || sideIds.has(m.awayTeamId)))
        .slice(-6)
        .reverse(),
    [sideIds],
  )

  if (!club) {
    return (
      <Container className="py-20">
        <EmptyState
          title="Club not found"
          description="This club may no longer be registered with the league."
          action={<Button to="/teams">Back to directory</Button>}
        />
      </Container>
    )
  }

  const venue = venueById.get(club.homeVenueId)
  const mapsUrl = venue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name}, ${venue.address}`)}`
    : undefined

  return (
    <>
      <div
        className="relative overflow-hidden border-b border-[var(--border)]"
        style={{ background: `linear-gradient(135deg, ${club.colors[0]}26, transparent 58%)` }}
      >
        <div aria-hidden className="pitch-grid absolute inset-0" />
        <Container className="relative py-8 sm:py-12">
          <Link
            to="/teams"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-accent"
          >
            <ArrowLeft size={15} />
            All clubs
          </Link>

          <div className="flex flex-wrap items-center gap-5">
            <Crest clubId={club.id} size={88} glow />
            <div className="min-w-0 flex-1">
              <Badge tone="accent" className="mb-2">
                Founded {club.founded}
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl">{club.name}</h1>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
                <MapPin size={14} />
                {club.city}
                {venue && <> · plays at {venue.name}</>}
              </p>
            </div>
            <div className="text-center">
              <p className="tabular font-display text-4xl font-extrabold text-accent">{sides.length}</p>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-faint">
                {sides.length === 1 ? 'Side' : 'Sides'}
              </p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h2 className="mb-4 text-xl">Sides this season</h2>
            <div className="space-y-3">
              {sides.map((side) => {
                const row = standings.get(side.id)
                return (
                  <Link key={side.id} to={`/team/${side.id}`} className="card card-hover group flex items-center gap-4 p-4">
                    <Crest teamId={side.id} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base font-bold transition-colors group-hover:text-accent">
                        {side.name}
                      </p>
                      <p className="text-xs text-faint">{divisionById.get(side.divisionId)?.fullName}</p>
                      {row && (
                        <div className="mt-2">
                          <FormGuide form={row.form} size="sm" />
                        </div>
                      )}
                    </div>
                    {row && (
                      <div className="shrink-0 text-right">
                        <p className="tabular font-display text-xl font-extrabold">{row.points}</p>
                        <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-faint">
                          {ordinal(row.rank)}
                        </p>
                      </div>
                    )}
                    <ArrowRight
                      size={16}
                      className="shrink-0 text-faint transition-all group-hover:translate-x-0.5 group-hover:text-accent"
                    />
                  </Link>
                )
              })}
            </div>

            <h2 className="mb-4 mt-10 text-xl">Recent results</h2>
            <div className="card divide-y divide-[var(--border)] overflow-hidden">
              {recent.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
              {recent.length === 0 && <p className="py-10 text-center text-sm text-faint">No results yet.</p>}
            </div>
          </div>

          <div className="space-y-4">
            {venue && (
              <div className="card overflow-hidden">
                <div
                  className="relative h-28"
                  style={{ background: `linear-gradient(135deg, ${club.colors[0]}, ${club.colors[1]})` }}
                >
                  <div aria-hidden className="pitch-grid absolute inset-0 opacity-40" />
                  <MapPin size={64} className="absolute -bottom-2 right-3 text-white/20" />
                </div>
                <div className="p-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-wider text-faint">Home ground</p>
                  <p className="mt-1 font-display text-lg font-extrabold">{venue.name}</p>
                  <p className="mt-0.5 text-sm text-muted">{venue.address}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{venue.surface}</Badge>
                    <Badge>{venue.fields} fields</Badge>
                    {venue.lights && <Badge tone="warn">Floodlit</Badge>}
                  </div>
                  {mapsUrl && (
                    <Button href={mapsUrl} variant="outline" size="sm" className="mt-4 w-full">
                      <Navigation size={14} />
                      Get directions
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="card overflow-hidden">
              <p className="flex items-center gap-2 border-b border-[var(--border)] bg-surface-2 px-4 py-2.5 font-display text-sm font-bold">
                <CalendarDays size={15} className="text-accent" />
                Coming up
              </p>
              <div className="divide-y divide-[var(--border)]">
                {upcoming.map((m) => (
                  <MatchRow key={m.id} match={m} />
                ))}
                {upcoming.length === 0 && (
                  <p className="py-10 text-center text-sm text-faint">No fixtures scheduled.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  )
}
