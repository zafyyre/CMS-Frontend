import { CLUBS, DIVISIONS, NOW, SEASON_START, VENUES, clubById } from './league'
import type {
  DisciplineRow,
  Match,
  MatchEvent,
  Player,
  ScorerRow,
  StandingRow,
  Team,
} from './types'

/* ────────────────────────────────────────────────────────────────
   Deterministic PRNG — the same dataset renders on every load, which
   keeps standings, stats and fixtures internally consistent.
   ──────────────────────────────────────────────────────────────── */
function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rngFor = (key: string) => mulberry32(hashSeed(key))
const pick = <T,>(rand: () => number, arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const range = (n: number) => Array.from({ length: n }, (_, i) => i)

/* ────────────────────────────────────────────────────────────────
   Squad + staff names
   ──────────────────────────────────────────────────────────────── */
const FIRST_NAMES = [
  'Liam', 'Noah', 'Mateo', 'Amir', 'Jayden', 'Diego', 'Kai', 'Ravi', 'Owen', 'Marco',
  'Andre', 'Hugo', 'Nikola', 'Sohail', 'Tomas', 'Elias', 'Jonah', 'Ethan', 'Devon', 'Luca',
  'Aaron', 'Malik', 'Simon', 'Ivan', 'Gurpreet', 'Nathan', 'Felix', 'Rafael', 'Cameron', 'Emre',
  'Dario', 'Julian', 'Kenji', 'Samir', 'Bruno', 'Callum', 'Theo', 'Isaac', 'Hassan', 'Mika',
  'Adrian', 'Reza', 'Colin', 'Pedro', 'Anton', 'Wesley', 'Jamal', 'Stefan', 'Manuel', 'Tyler',
]

const LAST_NAMES = [
  'Nguyen', 'Silva', 'Kaur', 'Martins', 'OConnell', 'Petrovic', 'Chen', 'Alvarez', 'Baptiste', 'Kowalski',
  'Ferreira', 'Singh', 'Novak', 'Fraser', 'Mendes', 'Hoffman', 'Vasquez', 'Delacroix', 'Bianchi', 'Reyes',
  'Okafor', 'Lindqvist', 'Haddad', 'Moreau', 'Castillo', 'Yamada', 'Brennan', 'Kovac', 'Duarte', 'Whitfield',
  'Rahman', 'Sorensen', 'Marchetti', 'Bergeron', 'Tanaka', 'Grant', 'Almeida', 'Vukovic', 'Ellis', 'Serrano',
  'Bashir', 'Lindgren', 'Cardoso', 'Hutchinson', 'Farrell', 'Zhang', 'Marino', 'Osei', 'Pires', 'Halvorsen',
]

const SUFFIX_POOL = ['A', 'B', 'Athletic', 'United', 'Rangers', 'Rovers', 'Reserves', 'Legends', 'City']

function makeName(rand: () => number): string {
  return `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`
}

/* ────────────────────────────────────────────────────────────────
   Teams — clubs are dealt into divisions, larger clubs field more sides.
   ──────────────────────────────────────────────────────────────── */
const DIVISION_SIZES: Record<string, number> = {
  premier: 12,
  div1: 14,
  div2: 16,
  div3: 16,
  div4: 18,
  u21: 12,
  'o35-premier': 12,
  'o35-div1': 12,
  'o45-premier': 10,
  o55: 8,
}

function buildTeams(): Team[] {
  const teams: Team[] = []
  const usagePerClub = new Map<string, number>()

  for (const division of DIVISIONS) {
    const size = DIVISION_SIZES[division.id]
    const rand = rngFor(`teams:${division.id}`)

    // Rotate the club list per division so each division gets a distinct mix.
    const offset = Math.floor(rand() * CLUBS.length)
    const ordered = range(CLUBS.length).map((i) => CLUBS[(i + offset) % CLUBS.length])

    for (let i = 0; i < size; i++) {
      const club = ordered[i % ordered.length]
      const used = usagePerClub.get(club.id) ?? 0
      usagePerClub.set(club.id, used + 1)

      const suffix =
        division.tier === 'masters'
          ? `M-${SUFFIX_POOL[used % 2]}`
          : division.id === 'u21'
            ? 'U21'
            : SUFFIX_POOL[used % SUFFIX_POOL.length]

      // Ratings cluster by tier, with real spread inside each division.
      const tierBase = { premier: 78, div1: 72, div2: 66, div3: 60, div4: 54 }[division.id] ?? 64
      const rating = Math.round(tierBase + (rand() - 0.35) * 22)

      teams.push({
        id: `${division.id}--${club.id}--${used}`,
        clubId: club.id,
        suffix,
        name: `${club.name} ${suffix}`,
        divisionId: division.id,
        rating: Math.max(35, Math.min(95, rating)),
        manager: makeName(rngFor(`mgr:${division.id}:${club.id}:${used}`)),
        founded: club.founded,
      })
    }
  }
  return teams
}

export const TEAMS: Team[] = buildTeams()
export const teamById = new Map(TEAMS.map((t) => [t.id, t]))
export const teamsByDivision = new Map(
  DIVISIONS.map((d) => [d.id, TEAMS.filter((t) => t.divisionId === d.id)]),
)

/* ────────────────────────────────────────────────────────────────
   Players
   ──────────────────────────────────────────────────────────────── */
const FORMATION: Player['position'][] = [
  'GK', 'GK',
  'DF', 'DF', 'DF', 'DF', 'DF', 'DF',
  'MF', 'MF', 'MF', 'MF', 'MF', 'MF',
  'FW', 'FW', 'FW', 'FW',
]

function buildPlayers(): Player[] {
  const players: Player[] = []
  for (const team of TEAMS) {
    const rand = rngFor(`squad:${team.id}`)
    const ageFloor = team.divisionId === 'u21' ? 17 : team.divisionId.startsWith('o55') ? 55 : team.divisionId.startsWith('o45') ? 45 : team.divisionId.startsWith('o35') ? 35 : 19
    FORMATION.forEach((position, i) => {
      players.push({
        id: `${team.id}--p${i}`,
        name: makeName(rand),
        teamId: team.id,
        position,
        number: i + 1,
        age: ageFloor + Math.floor(rand() * (team.divisionId === 'u21' ? 5 : 14)),
      })
    })
  }
  return players
}

export const PLAYERS: Player[] = buildPlayers()
export const playerById = new Map(PLAYERS.map((p) => [p.id, p]))
export const playersByTeam = new Map<string, Player[]>()
for (const p of PLAYERS) {
  const list = playersByTeam.get(p.teamId)
  if (list) list.push(p)
  else playersByTeam.set(p.teamId, [p])
}

/* ────────────────────────────────────────────────────────────────
   Fixtures — circle-method double round robin, laid onto weekends.
   ──────────────────────────────────────────────────────────────── */
function roundRobin(ids: string[]): [string, string][][] {
  const list = [...ids]
  if (list.length % 2 === 1) list.push('__BYE__')
  const half = list.length / 2
  const rounds: [string, string][][] = []

  for (let r = 0; r < list.length - 1; r++) {
    const pairs: [string, string][] = []
    for (let i = 0; i < half; i++) {
      const home = list[i]
      const away = list[list.length - 1 - i]
      if (home !== '__BYE__' && away !== '__BYE__') {
        // Alternate venue by round so home/away stays balanced.
        pairs.push(r % 2 === 0 ? [home, away] : [away, home])
      }
    }
    rounds.push(pairs)
    // Rotate everything except the first entry.
    list.splice(1, 0, list.pop()!)
  }
  return rounds
}

/** Poisson sample via Knuth, used for goal counts. */
function poisson(rand: () => number, lambda: number): number {
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= rand()
  } while (p > L)
  return k - 1
}

function weekendSlot(rand: () => number, roundIndex: number): { dayOffset: number; hour: number; minute: number } {
  // Rounds land on the weekend of week `roundIndex`; masters lean to Sunday morning.
  const sunday = rand() > 0.55
  const hour = sunday ? pick(rand, [9, 10, 11, 12, 13]) : pick(rand, [12, 13, 14, 15, 16, 18, 19])
  return { dayOffset: roundIndex * 7 + (sunday ? 1 : 0), hour, minute: pick(rand, [0, 15, 30, 45]) }
}

function buildEvents(
  rand: () => number,
  homeTeamId: string,
  awayTeamId: string,
  homeGoals: number,
  awayGoals: number,
): MatchEvent[] {
  const events: MatchEvent[] = []
  const scorersFor = (teamId: string, goals: number) => {
    const squad = playersByTeam.get(teamId) ?? []
    // Weight forwards heavily, midfielders next — keeps the golden-boot race believable.
    const weighted = squad.flatMap((p) =>
      p.position === 'FW' ? [p, p, p, p] : p.position === 'MF' ? [p, p] : p.position === 'DF' ? [p] : [],
    )
    for (let i = 0; i < goals; i++) {
      const scorer = pick(rand, weighted)
      events.push({
        minute: 1 + Math.floor(rand() * 90),
        teamId,
        playerId: scorer.id,
        type: rand() > 0.97 ? 'own-goal' : 'goal',
      })
    }
  }
  scorersFor(homeTeamId, homeGoals)
  scorersFor(awayTeamId, awayGoals)

  // Cards
  for (const teamId of [homeTeamId, awayTeamId]) {
    const squad = playersByTeam.get(teamId) ?? []
    const yellows = poisson(rand, 1.4)
    for (let i = 0; i < yellows; i++) {
      events.push({
        minute: 1 + Math.floor(rand() * 90),
        teamId,
        playerId: pick(rand, squad).id,
        type: 'yellow',
      })
    }
    if (rand() > 0.9) {
      events.push({
        minute: 40 + Math.floor(rand() * 50),
        teamId,
        playerId: pick(rand, squad).id,
        type: 'red',
      })
    }
  }

  return events.sort((a, b) => a.minute - b.minute)
}

function buildMatches(): Match[] {
  const matches: Match[] = []

  for (const division of DIVISIONS) {
    const teams = teamsByDivision.get(division.id) ?? []
    const rand = rngFor(`fixtures:${division.id}`)
    const firstHalf = roundRobin(teams.map((t) => t.id))
    // Second half of the season mirrors the first with venues reversed.
    const secondHalf = firstHalf.map((round) => round.map(([h, a]) => [a, h] as [string, string]))
    const allRounds = [...firstHalf, ...secondHalf]

    allRounds.forEach((pairs, roundIndex) => {
      const slot = weekendSlot(rand, roundIndex)
      pairs.forEach(([homeTeamId, awayTeamId], i) => {
        const kickoffDate = new Date(SEASON_START)
        kickoffDate.setDate(kickoffDate.getDate() + slot.dayOffset)
        kickoffDate.setHours(slot.hour + ((i * 2) % 6), slot.minute, 0, 0)

        const home = teamById.get(homeTeamId)!
        const away = teamById.get(awayTeamId)!
        const venue = clubById.get(home.clubId)?.homeVenueId ?? VENUES[0].id

        const id = `${division.id}-r${roundIndex + 1}-${i}`
        const diff = (home.rating - away.rating) / 22
        const homeLambda = Math.max(0.25, 1.42 + diff * 0.55)
        const awayLambda = Math.max(0.2, 1.12 - diff * 0.55)

        const isPast = kickoffDate.getTime() < NOW.getTime() - 105 * 60 * 1000
        const isLive =
          !isPast &&
          kickoffDate.getTime() <= NOW.getTime() &&
          kickoffDate.getTime() > NOW.getTime() - 105 * 60 * 1000

        let homeGoals: number | null = null
        let awayGoals: number | null = null
        let events: MatchEvent[] = []
        let minute: number | undefined

        if (isPast || isLive) {
          const mRand = rngFor(`result:${id}`)
          if (isLive) {
            minute = Math.max(1, Math.floor((NOW.getTime() - kickoffDate.getTime()) / 60000))
            const played = Math.min(minute, 90) / 90
            homeGoals = poisson(mRand, homeLambda * played)
            awayGoals = poisson(mRand, awayLambda * played)
          } else {
            homeGoals = poisson(mRand, homeLambda)
            awayGoals = poisson(mRand, awayLambda)
          }
          events = buildEvents(mRand, homeTeamId, awayTeamId, homeGoals, awayGoals)
        }

        matches.push({
          id,
          divisionId: division.id,
          round: roundIndex + 1,
          kickoff: kickoffDate.toISOString(),
          homeTeamId,
          awayTeamId,
          venueId: venue,
          status: isLive ? 'live' : isPast ? 'final' : 'scheduled',
          homeGoals,
          awayGoals,
          minute,
          events,
          attendance: isPast ? 40 + Math.floor(rngFor(`att:${id}`)() * 320) : undefined,
        })
      })
    })
  }

  return matches.sort((a, b) => a.kickoff.localeCompare(b.kickoff))
}

export const MATCHES: Match[] = buildMatches()
export const matchById = new Map(MATCHES.map((m) => [m.id, m]))

export const matchesByDivision = new Map<string, Match[]>()
for (const m of MATCHES) {
  const list = matchesByDivision.get(m.divisionId)
  if (list) list.push(m)
  else matchesByDivision.set(m.divisionId, [m])
}

export function matchesForTeam(teamId: string): Match[] {
  return MATCHES.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
}

/* ────────────────────────────────────────────────────────────────
   Standings — computed from results, never hard-coded.
   ──────────────────────────────────────────────────────────────── */
function tableFrom(matches: Match[], teamIds: string[]): StandingRow[] {
  const base = new Map<string, StandingRow>(
    teamIds.map((id) => [
      id,
      {
        teamId: id,
        rank: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
        form: [],
        movement: 0,
        ppg: 0,
      },
    ]),
  )

  for (const m of matches) {
    if (m.status !== 'final' || m.homeGoals === null || m.awayGoals === null) continue
    const home = base.get(m.homeTeamId)
    const away = base.get(m.awayTeamId)
    if (!home || !away) continue

    home.played++
    away.played++
    home.goalsFor += m.homeGoals
    home.goalsAgainst += m.awayGoals
    away.goalsFor += m.awayGoals
    away.goalsAgainst += m.homeGoals

    if (m.homeGoals > m.awayGoals) {
      home.won++, away.lost++, (home.points += 3)
      home.form.push('W'), away.form.push('L')
    } else if (m.homeGoals < m.awayGoals) {
      away.won++, home.lost++, (away.points += 3)
      away.form.push('W'), home.form.push('L')
    } else {
      home.drawn++, away.drawn++, (home.points += 1), (away.points += 1)
      home.form.push('D'), away.form.push('D')
    }
  }

  const rows = [...base.values()]
  for (const r of rows) {
    r.goalDiff = r.goalsFor - r.goalsAgainst
    r.form = r.form.slice(-5)
    r.ppg = r.played ? Number((r.points / r.played).toFixed(2)) : 0
  }

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      (teamById.get(a.teamId)?.name ?? '').localeCompare(teamById.get(b.teamId)?.name ?? ''),
  )
  rows.forEach((r, i) => (r.rank = i + 1))
  return rows
}

const standingsCache = new Map<string, StandingRow[]>()

export function getStandings(divisionId: string): StandingRow[] {
  const cached = standingsCache.get(divisionId)
  if (cached) return cached

  const teamIds = (teamsByDivision.get(divisionId) ?? []).map((t) => t.id)
  const played = (matchesByDivision.get(divisionId) ?? []).filter((m) => m.status === 'final')
  const current = tableFrom(played, teamIds)

  // Movement = change vs. the table as it stood one round earlier.
  const lastRound = played.reduce((max, m) => Math.max(max, m.round), 0)
  const previous = tableFrom(
    played.filter((m) => m.round < lastRound),
    teamIds,
  )
  const prevRank = new Map(previous.map((r) => [r.teamId, r.rank]))
  for (const row of current) {
    row.movement = (prevRank.get(row.teamId) ?? row.rank) - row.rank
  }

  standingsCache.set(divisionId, current)
  return current
}

/* ────────────────────────────────────────────────────────────────
   Player statistics, derived from match events.
   ──────────────────────────────────────────────────────────────── */
const scorersCache = new Map<string, ScorerRow[]>()

export function getScorers(divisionId: string): ScorerRow[] {
  const cached = scorersCache.get(divisionId)
  if (cached) return cached

  const tally = new Map<string, ScorerRow>()
  const appearances = new Map<string, number>()

  for (const m of matchesByDivision.get(divisionId) ?? []) {
    if (m.status === 'scheduled') continue
    for (const teamId of [m.homeTeamId, m.awayTeamId]) {
      appearances.set(teamId, (appearances.get(teamId) ?? 0) + 1)
    }
    for (const e of m.events) {
      if (e.type !== 'goal') continue
      const row = tally.get(e.playerId)
      if (row) row.goals++
      else tally.set(e.playerId, { playerId: e.playerId, teamId: e.teamId, goals: 1, appearances: 0 })
    }
  }

  const rows = [...tally.values()]
  for (const r of rows) r.appearances = appearances.get(r.teamId) ?? 0
  rows.sort((a, b) => b.goals - a.goals || a.appearances - b.appearances)

  scorersCache.set(divisionId, rows)
  return rows
}

const disciplineCache = new Map<string, DisciplineRow[]>()

export function getDiscipline(divisionId: string): DisciplineRow[] {
  const cached = disciplineCache.get(divisionId)
  if (cached) return cached

  const tally = new Map<string, DisciplineRow>()
  for (const m of matchesByDivision.get(divisionId) ?? []) {
    for (const e of m.events) {
      if (e.type !== 'yellow' && e.type !== 'red') continue
      let row = tally.get(e.playerId)
      if (!row) {
        row = { playerId: e.playerId, teamId: e.teamId, yellows: 0, reds: 0, suspended: 0 }
        tally.set(e.playerId, row)
      }
      if (e.type === 'yellow') row.yellows++
      else row.reds++
    }
  }

  const rows = [...tally.values()]
  for (const r of rows) {
    // Five yellows or a red triggers a ban; we surface what's still outstanding.
    const earned = Math.floor(r.yellows / 5) + r.reds
    r.suspended = earned > 0 && (r.yellows % 5 >= 3 || r.reds > 0) ? Math.min(earned, 3) : 0
  }
  rows.sort((a, b) => b.reds - a.reds || b.yellows - a.yellows)

  disciplineCache.set(divisionId, rows)
  return rows
}

/** Clean sheets by team, used for the shutouts leaderboard. */
export function getShutouts(divisionId: string): { teamId: string; shutouts: number; conceded: number }[] {
  const tally = new Map<string, { teamId: string; shutouts: number; conceded: number }>()
  for (const t of teamsByDivision.get(divisionId) ?? []) {
    tally.set(t.id, { teamId: t.id, shutouts: 0, conceded: 0 })
  }
  for (const m of matchesByDivision.get(divisionId) ?? []) {
    if (m.status !== 'final' || m.homeGoals === null || m.awayGoals === null) continue
    const h = tally.get(m.homeTeamId)
    const a = tally.get(m.awayTeamId)
    if (h) {
      h.conceded += m.awayGoals
      if (m.awayGoals === 0) h.shutouts++
    }
    if (a) {
      a.conceded += m.homeGoals
      if (m.homeGoals === 0) a.shutouts++
    }
  }
  return [...tally.values()].sort((a, b) => b.shutouts - a.shutouts || a.conceded - b.conceded)
}

/* ────────────────────────────────────────────────────────────────
   Matchday helpers
   ──────────────────────────────────────────────────────────────── */
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** The weekend bracketing `NOW` — Saturday through Sunday. */
export function currentMatchdayRange(): [Date, Date] {
  const d = startOfDay(NOW)
  const day = d.getDay() // 0 Sun … 6 Sat
  const backToSaturday = day === 0 ? 1 : (day + 1) % 7
  const from = new Date(d)
  from.setDate(d.getDate() - backToSaturday)
  const to = new Date(from)
  to.setDate(from.getDate() + 2)
  return [from, to]
}

export function matchesBetween(from: Date, to: Date, divisionId?: string): Match[] {
  return MATCHES.filter((m) => {
    if (divisionId && m.divisionId !== divisionId) return false
    const t = new Date(m.kickoff).getTime()
    return t >= from.getTime() && t < to.getTime()
  })
}

export function liveMatches(): Match[] {
  return MATCHES.filter((m) => m.status === 'live')
}

export function recentResults(limit = 12, divisionId?: string): Match[] {
  return MATCHES.filter((m) => m.status === 'final' && (!divisionId || m.divisionId === divisionId))
    .slice(-limit)
    .reverse()
}

export function upcomingFixtures(limit = 12, divisionId?: string): Match[] {
  return MATCHES.filter((m) => m.status === 'scheduled' && (!divisionId || m.divisionId === divisionId)).slice(
    0,
    limit,
  )
}

/** All distinct weekends that have fixtures, for the schedule date navigator. */
export function matchdayWeekends(divisionId?: string): Date[] {
  const seen = new Set<string>()
  const out: Date[] = []
  for (const m of MATCHES) {
    if (divisionId && m.divisionId !== divisionId) continue
    const d = new Date(m.kickoff)
    const day = d.getDay()
    const back = day === 0 ? 1 : (day + 1) % 7
    const sat = startOfDay(d)
    sat.setDate(sat.getDate() - back)
    const key = sat.toISOString().slice(0, 10)
    if (!seen.has(key)) {
      seen.add(key)
      out.push(sat)
    }
  }
  return out.sort((a, b) => a.getTime() - b.getTime())
}

/** Season progress 0–1, drives the header progress bar. */
export function seasonProgress(divisionId: string): number {
  const all = matchesByDivision.get(divisionId) ?? []
  if (!all.length) return 0
  return all.filter((m) => m.status === 'final').length / all.length
}

export function teamStats(teamId: string) {
  const team = teamById.get(teamId)
  if (!team) return null
  const table = getStandings(team.divisionId)
  const row = table.find((r) => r.teamId === teamId)
  const fixtures = matchesForTeam(teamId)
  const played = fixtures.filter((m) => m.status === 'final')
  const upcoming = fixtures.filter((m) => m.status !== 'final')

  const goalsByPlayer = new Map<string, number>()
  for (const m of played) {
    for (const e of m.events) {
      if (e.type === 'goal' && e.teamId === teamId) {
        goalsByPlayer.set(e.playerId, (goalsByPlayer.get(e.playerId) ?? 0) + 1)
      }
    }
  }
  const topScorers = [...goalsByPlayer.entries()]
    .map(([playerId, goals]) => ({ playerId, goals }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5)

  return { team, row, played, upcoming, topScorers, table }
}
