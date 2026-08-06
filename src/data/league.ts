import type { Club, Division, Venue } from './types'

/* ────────────────────────────────────────────────────────────────
   Season anchoring

   The dataset is simulated. `SEASON_START` → `SEASON_END` frames the
   2025-26 campaign and `NOW` places us mid-season so the UI always has
   played matches behind it and fixtures ahead of it.
   ──────────────────────────────────────────────────────────────── */
export const SEASON_ID = '2025-26'
export const SEASON_START = new Date('2025-09-06T00:00:00')
export const SEASON_END = new Date('2026-04-05T00:00:00')
export const NOW = new Date('2026-01-24T15:20:00')

export const SEASONS = [
  '2025-26',
  '2024-25',
  '2023-24',
  '2022-23',
  '2021-22',
  '2019-20',
  '2018-19',
  '2017-18',
] as const

export const DIVISIONS: Division[] = [
  {
    id: 'premier',
    name: 'Premier',
    fullName: 'Premier Division',
    tier: 'open',
    order: 1,
    blurb: 'The top flight — the highest level of amateur soccer played anywhere in British Columbia.',
  },
  {
    id: 'div1',
    name: 'Division 1',
    fullName: 'Division 1',
    tier: 'open',
    order: 2,
    blurb: 'One step from the Premier. Champions earn promotion; the bottom two drop to Division 2.',
  },
  {
    id: 'div2',
    name: 'Division 2',
    fullName: 'Division 2',
    tier: 'open',
    order: 3,
    blurb: 'A deep, competitive tier where a strong autumn can set up a promotion run after Christmas.',
  },
  {
    id: 'div3',
    name: 'Division 3',
    fullName: 'Division 3',
    tier: 'open',
    order: 4,
    blurb: 'Established clubs and ambitious newcomers, playing across the region every weekend.',
  },
  {
    id: 'div4',
    name: 'Division 4',
    fullName: 'Division 4',
    tier: 'open',
    order: 5,
    blurb: 'The entry point to the league — and the widest division on the ladder.',
  },
  {
    id: 'u21',
    name: 'U21',
    fullName: 'Under-21 Division',
    tier: 'u21',
    order: 6,
    blurb: 'The bridge from youth soccer to the adult game, for players aged 21 and under.',
  },
  {
    id: 'o35-premier',
    name: 'O35 Premier',
    fullName: 'Masters Over-35 Premier',
    tier: 'masters',
    order: 7,
    blurb: 'Top-tier Masters soccer for players 35 and over. Same intensity, better banter.',
  },
  {
    id: 'o35-div1',
    name: 'O35 Division 1',
    fullName: 'Masters Over-35 Division 1',
    tier: 'masters',
    order: 8,
    blurb: 'The second rung of the Over-35 ladder.',
  },
  {
    id: 'o45-premier',
    name: 'O45 Premier',
    fullName: 'Masters Over-45 Premier',
    tier: 'masters',
    order: 9,
    blurb: 'Over-45 soccer at its sharpest, played Sunday mornings across the Lower Mainland.',
  },
  {
    id: 'o55',
    name: 'O55',
    fullName: 'Masters Over-55',
    tier: 'masters',
    order: 10,
    blurb: 'Proof that the season never really has to end.',
  },
]

export const VENUES: Venue[] = [
  { id: 'burnaby-lake', name: 'Burnaby Lake Sports Complex', city: 'Burnaby', surface: 'Turf', lights: true, lat: 49.2452, lng: -122.9481, address: '3760 Sperling Ave, Burnaby', fields: 4 },
  { id: 'swangard', name: 'Swangard Stadium', city: 'Burnaby', surface: 'Turf', lights: true, lat: 49.2379, lng: -123.0159, address: '3883 Imperial St, Burnaby', fields: 1 },
  { id: 'newton', name: 'Newton Athletic Park', city: 'Surrey', surface: 'Turf', lights: true, lat: 49.1281, lng: -122.8479, address: '7395 128 St, Surrey', fields: 3 },
  { id: 'cloverdale', name: 'Cloverdale Athletic Park', city: 'Surrey', surface: 'Turf', lights: true, lat: 49.1063, lng: -122.7237, address: '6650 168 St, Surrey', fields: 3 },
  { id: 'bear-creek', name: 'Bear Creek Park', city: 'Surrey', surface: 'Grass', lights: false, lat: 49.1329, lng: -122.8577, address: '13750 88 Ave, Surrey', fields: 2 },
  { id: 'empire', name: 'Empire Field', city: 'Vancouver', surface: 'Turf', lights: true, lat: 49.2807, lng: -123.0335, address: '2901 E Hastings St, Vancouver', fields: 2 },
  { id: 'trillium', name: 'Trillium Park', city: 'Vancouver', surface: 'Turf', lights: true, lat: 49.2755, lng: -123.0872, address: '750 Malkin Ave, Vancouver', fields: 2 },
  { id: 'memorial-south', name: 'Memorial South Park', city: 'Vancouver', surface: 'Grass', lights: false, lat: 49.2312, lng: -123.0709, address: '5955 Ross St, Vancouver', fields: 3 },
  { id: 'killarney', name: 'Killarney Park', city: 'Vancouver', surface: 'Turf', lights: true, lat: 49.2251, lng: -123.0402, address: '6260 Killarney St, Vancouver', fields: 2 },
  { id: 'andy-livingstone', name: 'Andy Livingstone Park', city: 'Vancouver', surface: 'Turf', lights: true, lat: 49.2777, lng: -123.1057, address: '89 Expo Blvd, Vancouver', fields: 2 },
  { id: 'point-grey', name: 'Point Grey Secondary', city: 'Vancouver', surface: 'Turf', lights: true, lat: 49.2452, lng: -123.1712, address: '5350 East Blvd, Vancouver', fields: 1 },
  { id: 'confederation', name: 'Confederation Park', city: 'Burnaby', surface: 'Grass', lights: false, lat: 49.2848, lng: -123.0089, address: '4585 Albert St, Burnaby', fields: 2 },
  { id: 'mahon', name: 'Mahon Park', city: 'North Vancouver', surface: 'Turf', lights: true, lat: 49.3237, lng: -123.0836, address: '1170 W 17th St, North Vancouver', fields: 2 },
  { id: 'town-centre', name: 'Town Centre Park', city: 'Coquitlam', surface: 'Turf', lights: true, lat: 49.2795, lng: -122.7942, address: '1299 Pinetree Way, Coquitlam', fields: 3 },
  { id: 'percy-perry', name: 'Percy Perry Stadium', city: 'Coquitlam', surface: 'Turf', lights: true, lat: 49.2789, lng: -122.7975, address: '1210 Pinetree Way, Coquitlam', fields: 1 },
  { id: 'hume', name: 'Hume Park', city: 'New Westminster', surface: 'Turf', lights: true, lat: 49.2258, lng: -122.8896, address: '400 E Columbia St, New Westminster', fields: 2 },
  { id: 'minoru', name: 'Minoru Park', city: 'Richmond', surface: 'Turf', lights: true, lat: 49.1666, lng: -123.1379, address: '7191 Granville Ave, Richmond', fields: 3 },
  { id: 'south-arm', name: 'South Arm Park', city: 'Richmond', surface: 'Grass', lights: false, lat: 49.1425, lng: -123.1298, address: '8880 Williams Rd, Richmond', fields: 2 },
  { id: 'ambleside', name: 'Ambleside Park', city: 'West Vancouver', surface: 'Grass', lights: false, lat: 49.3255, lng: -123.1594, address: '1150 Marine Dr, West Vancouver', fields: 2 },
  { id: 'mcleod', name: 'McLeod Athletic Park', city: 'Langley', surface: 'Turf', lights: true, lat: 49.1051, lng: -122.6595, address: '20250 Fraser Hwy, Langley', fields: 3 },
  { id: 'north-delta', name: 'North Delta Recreation Centre', city: 'Delta', surface: 'Turf', lights: true, lat: 49.1489, lng: -122.9096, address: '11415 84 Ave, Delta', fields: 2 },
  { id: 'rotary', name: 'Rotary Stadium', city: 'Abbotsford', surface: 'Turf', lights: true, lat: 49.0399, lng: -122.3033, address: '32355 Bevan Ave, Abbotsford', fields: 1 },
]

/* Clubs. Colours drive the generated crests, so every club reads distinctly. */
export const CLUBS: Club[] = [
  { id: 'bb5', name: 'BB5 United', short: 'BB5', colors: ['#0ea5e9', '#0b2a4a'], city: 'Burnaby', founded: 1998, homeVenueId: 'burnaby-lake' },
  { id: 'croatia', name: 'Croatia SC', short: 'CRO', colors: ['#e11d48', '#111827'], city: 'Vancouver', founded: 1957, homeVenueId: 'memorial-south' },
  { id: 'cmfsc', name: 'Coquitlam Metro-Ford', short: 'CMF', colors: ['#16a34a', '#052e16'], city: 'Coquitlam', founded: 1973, homeVenueId: 'town-centre' },
  { id: 'rinos', name: "Rino's Tigers", short: 'RIN', colors: ['#f59e0b', '#1c1917'], city: 'Vancouver', founded: 1979, homeVenueId: 'trillium' },
  { id: 'pegasus', name: 'Pegasus FC', short: 'PEG', colors: ['#8b5cf6', '#1e1b4b'], city: 'Vancouver', founded: 1988, homeVenueId: 'killarney' },
  { id: 'westvan', name: 'West Van FC', short: 'WVN', colors: ['#0284c7', '#f8fafc'], city: 'West Vancouver', founded: 1961, homeVenueId: 'ambleside' },
  { id: 'clubinter', name: 'Club Inter EDC', short: 'INT', colors: ['#1d4ed8', '#0f172a'], city: 'Burnaby', founded: 1994, homeVenueId: 'burnaby-lake' },
  { id: 'guildford', name: 'Guildford FC', short: 'GLD', colors: ['#dc2626', '#fbbf24'], city: 'Surrey', founded: 1985, homeVenueId: 'newton' },
  { id: 'norvan', name: 'North Van FC', short: 'NVN', colors: ['#059669', '#022c22'], city: 'North Vancouver', founded: 1966, homeVenueId: 'mahon' },
  { id: 'surrey-utd', name: 'Surrey United', short: 'SUR', colors: ['#b91c1c', '#0c0a09'], city: 'Surrey', founded: 1971, homeVenueId: 'cloverdale' },
  { id: 'green-devils', name: 'Vancouver Green Devils', short: 'VGD', colors: ['#22c55e', '#14532d'], city: 'Vancouver', founded: 1990, homeVenueId: 'empire' },
  { id: 'columbus', name: 'ICSF Columbus', short: 'ICS', colors: ['#2563eb', '#fef3c7'], city: 'Vancouver', founded: 1954, homeVenueId: 'trillium' },
  { id: 'portmoody', name: 'Port Moody SC', short: 'PMD', colors: ['#0891b2', '#083344'], city: 'Port Moody', founded: 1975, homeVenueId: 'town-centre' },
  { id: 'hibernian', name: 'Richmond Hibernian', short: 'RHB', colors: ['#15803d', '#f0fdf4'], city: 'Richmond', founded: 1968, homeVenueId: 'minoru' },
  { id: 'langley-utd', name: 'Langley United', short: 'LGY', colors: ['#7c3aed', '#faf5ff'], city: 'Langley', founded: 1980, homeVenueId: 'mcleod' },
  { id: 'mount-pleasant', name: 'Mount Pleasant FC', short: 'MPL', colors: ['#ea580c', '#1c1917'], city: 'Vancouver', founded: 2002, homeVenueId: 'memorial-south' },
  { id: 'aztec', name: 'Aztec MFC', short: 'AZT', colors: ['#ca8a04', '#450a0a'], city: 'Vancouver', founded: 1992, homeVenueId: 'andy-livingstone' },
  { id: 'dunbar', name: 'Dunbar SC', short: 'DUN', colors: ['#0f766e', '#ecfeff'], city: 'Vancouver', founded: 1964, homeVenueId: 'point-grey' },
  { id: 'steve-nash', name: 'Steve Nash FC', short: 'SNF', colors: ['#e11d48', '#fff1f2'], city: 'Vancouver', founded: 2007, homeVenueId: 'andy-livingstone' },
  { id: 'coastal', name: 'Coastal FC', short: 'CST', colors: ['#0369a1', '#e0f2fe'], city: 'Surrey', founded: 2013, homeVenueId: 'cloverdale' },
  { id: 'fusion', name: 'Fusion FC', short: 'FUS', colors: ['#9333ea', '#111827'], city: 'Richmond', founded: 2005, homeVenueId: 'minoru' },
  { id: 'metropolitan', name: 'Metropolitan FC', short: 'MET', colors: ['#334155', '#e2e8f0'], city: 'Burnaby', founded: 1996, homeVenueId: 'confederation' },
  { id: 'westside', name: 'Westside FC', short: 'WST', colors: ['#be123c', '#fecdd3'], city: 'Vancouver', founded: 1983, homeVenueId: 'point-grey' },
  { id: 'delta-fc', name: 'Delta FC', short: 'DEL', colors: ['#047857', '#d1fae5'], city: 'Delta', founded: 1977, homeVenueId: 'north-delta' },
  { id: 'abbotsford', name: 'Abbotsford SC', short: 'ABB', colors: ['#1e40af', '#fbbf24'], city: 'Abbotsford', founded: 1969, homeVenueId: 'rotary' },
  { id: 'white-eagles', name: 'Serbian White Eagles', short: 'SWE', colors: ['#dc2626', '#f8fafc'], city: 'Vancouver', founded: 1959, homeVenueId: 'killarney' },
  { id: 'kerrisdale', name: 'Kerrisdale SC', short: 'KER', colors: ['#1e293b', '#38bdf8'], city: 'Vancouver', founded: 1972, homeVenueId: 'point-grey' },
  { id: 'firefighters', name: 'Vancouver Firefighters', short: 'VFF', colors: ['#b45309', '#fef3c7'], city: 'Vancouver', founded: 1948, homeVenueId: 'empire' },
  { id: 'nw-royals', name: 'New West Royals', short: 'NWR', colors: ['#4338ca', '#e0e7ff'], city: 'New Westminster', founded: 1986, homeVenueId: 'hume' },
  { id: 'tsawwassen', name: 'Tsawwassen FC', short: 'TSW', colors: ['#0d9488', '#134e4a'], city: 'Delta', founded: 1991, homeVenueId: 'north-delta' },
  { id: 'thunderbirds', name: 'Vancouver Thunderbirds', short: 'VTB', colors: ['#1d4ed8', '#fef08a'], city: 'Vancouver', founded: 1974, homeVenueId: 'memorial-south' },
  { id: 'sapperton', name: 'Sapperton Rovers', short: 'SAP', colors: ['#7f1d1d', '#fca5a5'], city: 'New Westminster', founded: 1963, homeVenueId: 'hume' },
  { id: 'lions-gate', name: 'Lions Gate FC', short: 'LGT', colors: ['#c2410c', '#fed7aa'], city: 'North Vancouver', founded: 2001, homeVenueId: 'mahon' },
  { id: 'fraser-valley', name: 'Fraser Valley Athletic', short: 'FVA', colors: ['#166534', '#bbf7d0'], city: 'Abbotsford', founded: 1999, homeVenueId: 'rotary' },
  { id: 'burnaby-selects', name: 'Burnaby Selects', short: 'BSL', colors: ['#6d28d9', '#ddd6fe'], city: 'Burnaby', founded: 2004, homeVenueId: 'confederation' },
  { id: 'south-slope', name: 'South Slope United', short: 'SSU', colors: ['#0c4a6e', '#7dd3fc'], city: 'Burnaby', founded: 2009, homeVenueId: 'burnaby-lake' },
]

export const clubById = new Map(CLUBS.map((c) => [c.id, c]))
export const venueById = new Map(VENUES.map((v) => [v.id, v]))
export const divisionById = new Map(DIVISIONS.map((d) => [d.id, d]))
