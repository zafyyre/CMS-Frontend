export type DivisionTier = 'open' | 'u21' | 'masters' | 'cup'

export interface Division {
  id: string
  /** Short label used in chips and tables, e.g. "Premier". */
  name: string
  /** Full label including the sponsor/trophy name where one exists. */
  fullName: string
  tier: DivisionTier
  /** Sort order within the league table of contents. */
  order: number
  /** Marketing blurb shown on division landing headers. */
  blurb: string
}

export interface Club {
  id: string
  name: string
  /** Two or three letter monogram used on the generated crest. */
  short: string
  /** Primary + secondary crest colours. */
  colors: [string, string]
  city: string
  founded: number
  homeVenueId: string
}

export interface Team {
  id: string
  clubId: string
  /** Suffix distinguishing sides from the same club, e.g. "A", "Athletic". */
  suffix: string
  /** Display name — club name plus suffix. */
  name: string
  divisionId: string
  /** 0–100 latent quality, drives the match simulation. */
  rating: number
  manager: string
  founded: number
}

export interface Venue {
  id: string
  name: string
  city: string
  surface: 'Turf' | 'Grass'
  lights: boolean
  lat: number
  lng: number
  address: string
  fields: number
}

export type MatchStatus = 'scheduled' | 'live' | 'final' | 'postponed'

export interface Match {
  id: string
  divisionId: string
  round: number
  /** ISO date-time of kickoff. */
  kickoff: string
  homeTeamId: string
  awayTeamId: string
  venueId: string
  status: MatchStatus
  homeGoals: number | null
  awayGoals: number | null
  /** Minute of play — only present while status is "live". */
  minute?: number
  events: MatchEvent[]
  attendance?: number
}

export interface MatchEvent {
  minute: number
  teamId: string
  playerId: string
  type: 'goal' | 'yellow' | 'red' | 'own-goal'
}

export interface Player {
  id: string
  name: string
  teamId: string
  position: 'GK' | 'DF' | 'MF' | 'FW'
  number: number
  age: number
}

export interface StandingRow {
  teamId: string
  rank: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  /** Most recent results, oldest → newest, max 5. */
  form: ('W' | 'D' | 'L')[]
  /** Movement vs. the previous matchday. */
  movement: number
  /** Points per game, used for the sparkline + projections. */
  ppg: number
}

export interface ScorerRow {
  playerId: string
  teamId: string
  goals: number
  appearances: number
}

export interface DisciplineRow {
  playerId: string
  teamId: string
  yellows: number
  reds: number
  /** Games remaining on an active suspension, 0 if available. */
  suspended: number
}

export interface NewsItem {
  id: string
  title: string
  excerpt: string
  body: string[]
  date: string
  category: 'League' | 'Cup' | 'Discipline' | 'Registration' | 'Community'
  featured?: boolean
  readMinutes: number
}

export interface CupTie {
  id: string
  round: string
  homeTeamId: string | null
  awayTeamId: string | null
  homeGoals: number | null
  awayGoals: number | null
  kickoff: string | null
  venueId: string | null
  /** Winner advances into this slot in the next round. */
  nextSlot: number | null
  slot: number
}

export interface Cup {
  id: string
  name: string
  subtitle: string
  since: number
  ties: CupTie[]
  rounds: string[]
}
