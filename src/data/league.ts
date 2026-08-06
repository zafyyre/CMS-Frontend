import type { Club, Division, Venue } from './types'

/* ────────────────────────────────────────────────────────────────
   Season anchoring

   The dataset is entirely fictional. `SEASON_START` → `SEASON_END`
   frames the 2025-26 campaign and `NOW` places us mid-season so the UI
   always has played matches behind it and fixtures ahead of it.
   ──────────────────────────────────────────────────────────────── */
export const LEAGUE_NAME = 'Kelowna Metro Soccer League'
export const LEAGUE_SHORT = 'KMSL'
export const LEAGUE_FOUNDED = 1979

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
    blurb: 'The top flight — the highest standard of adult soccer played anywhere in the league.',
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
    blurb: 'Established clubs and ambitious newcomers, playing across the valley every weekend.',
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
    blurb: 'Over-45 soccer at its sharpest, played Sunday mornings across the valley.',
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

/* Sample venues. Every name, address and coordinate below is invented for
   this demo and does not describe a real facility. */
export const VENUES: Venue[] = [
  { id: 'okanagan-complex', name: 'Okanagan Sports Complex', city: 'Kelowna', surface: 'Turf', lights: true, lat: 49.888, lng: -119.496, address: '1385 Sample Water Way, Kelowna', fields: 4 },
  { id: 'mission-rec', name: 'Mission Recreation Fields', city: 'Kelowna', surface: 'Turf', lights: true, lat: 49.8452, lng: -119.4701, address: '4075 Example Gordon Rd, Kelowna', fields: 3 },
  { id: 'rutland-fields', name: 'Rutland Community Fields', city: 'Kelowna', surface: 'Turf', lights: true, lat: 49.8921, lng: -119.3952, address: '715 Sample Rutland Rd, Kelowna', fields: 3 },
  { id: 'glenmore-grounds', name: 'Glenmore Recreation Grounds', city: 'Kelowna', surface: 'Grass', lights: false, lat: 49.9163, lng: -119.4718, address: '525 Example Glenmore Rd, Kelowna', fields: 2 },
  { id: 'knox-turf', name: 'Knox Ridge Turf Park', city: 'Kelowna', surface: 'Turf', lights: true, lat: 49.9012, lng: -119.4884, address: '800 Sample Summit Dr, Kelowna', fields: 2 },
  { id: 'blackmountain', name: 'Black Mountain Athletic Park', city: 'Kelowna', surface: 'Turf', lights: true, lat: 49.8853, lng: -119.3481, address: '1130 Example Ridge Dr, Kelowna', fields: 2 },
  { id: 'kettle-valley', name: 'Kettle Valley Park', city: 'Kelowna', surface: 'Grass', lights: false, lat: 49.8331, lng: -119.4372, address: '4600 Sample Perimeter Way, Kelowna', fields: 2 },
  { id: 'pandosy-grounds', name: 'Pandosy Sports Grounds', city: 'Kelowna', surface: 'Turf', lights: true, lat: 49.8631, lng: -119.4942, address: '2870 Example Pandosy St, Kelowna', fields: 2 },
  { id: 'dilworth', name: 'Dilworth Mountain Field', city: 'Kelowna', surface: 'Grass', lights: false, lat: 49.9021, lng: -119.4432, address: '1450 Sample Dilworth Dr, Kelowna', fields: 1 },
  { id: 'springfield', name: 'Springfield Athletic Field', city: 'Kelowna', surface: 'Turf', lights: true, lat: 49.8802, lng: -119.4392, address: '1815 Example Springfield Rd, Kelowna', fields: 2 },
  { id: 'benvoulin', name: 'Benvoulin Athletic Park', city: 'Kelowna', surface: 'Grass', lights: false, lat: 49.8712, lng: -119.4562, address: '2279 Sample Benvoulin Rd, Kelowna', fields: 2 },
  { id: 'guisachan', name: 'Guisachan Recreation Field', city: 'Kelowna', surface: 'Turf', lights: true, lat: 49.8672, lng: -119.4712, address: '1060 Example Cameron Ave, Kelowna', fields: 1 },
  { id: 'quail-ridge', name: 'Quail Ridge Sports Park', city: 'Kelowna', surface: 'Turf', lights: true, lat: 49.9312, lng: -119.4082, address: '1980 Sample Quail Ridge Blvd, Kelowna', fields: 2 },
  { id: 'wilden', name: 'Wilden Park Turf', city: 'Kelowna', surface: 'Turf', lights: true, lat: 49.9232, lng: -119.4622, address: '1580 Example Wilden Pl, Kelowna', fields: 1 },
  { id: 'ellison', name: 'Ellison Turf Fields', city: 'Kelowna', surface: 'Turf', lights: true, lat: 49.9552, lng: -119.3752, address: '4970 Sample Airport Way, Kelowna', fields: 2 },
  { id: 'shannon-lake', name: 'Shannon Lake Sports Complex', city: 'West Kelowna', surface: 'Turf', lights: true, lat: 49.8362, lng: -119.6112, address: '2600 Example Shannon Lake Rd, West Kelowna', fields: 3 },
  { id: 'westside-fields', name: 'Westside Athletic Fields', city: 'West Kelowna', surface: 'Turf', lights: true, lat: 49.8622, lng: -119.5832, address: '2760 Sample Westlake Rd, West Kelowna', fields: 2 },
  { id: 'peachland-memorial', name: 'Peachland Memorial Field', city: 'Peachland', surface: 'Grass', lights: false, lat: 49.7772, lng: -119.7402, address: '4408 Example Beach Ave, Peachland', fields: 1 },
  { id: 'lakecountry', name: 'Lake Country Recreation Park', city: 'Lake Country', surface: 'Turf', lights: true, lat: 50.0482, lng: -119.4122, address: '10241 Sample Woodlake Rd, Lake Country', fields: 3 },
  { id: 'winfield', name: 'Winfield Community Field', city: 'Lake Country', surface: 'Grass', lights: false, lat: 50.0432, lng: -119.4072, address: '9830 Example Bottom Wood Rd, Lake Country', fields: 2 },
  { id: 'vernon-valley', name: 'Vernon Valley Sports Park', city: 'Vernon', surface: 'Turf', lights: true, lat: 50.2672, lng: -119.2722, address: '3800 Sample Valley St, Vernon', fields: 3 },
  { id: 'summerland', name: 'Summerland Athletic Grounds', city: 'Summerland', surface: 'Grass', lights: false, lat: 49.6002, lng: -119.6712, address: '8820 Example Jubilee Rd, Summerland', fields: 2 },
]

/* Sample clubs. These are invented for the demo — any resemblance to a real
   club is coincidental. Colours drive the generated crests, so every club
   reads distinctly. */
export const CLUBS: Club[] = [
  { id: 'okanagan-fc', name: 'Okanagan FC', short: 'OKF', colors: ['#0ea5e9', '#0b2a4a'], city: 'Kelowna', founded: 1994, homeVenueId: 'okanagan-complex' },
  { id: 'rutland', name: 'Rutland Rovers', short: 'RUT', colors: ['#e11d48', '#111827'], city: 'Kelowna', founded: 1981, homeVenueId: 'rutland-fields' },
  { id: 'glenmore', name: 'Glenmore Athletic', short: 'GLA', colors: ['#16a34a', '#052e16'], city: 'Kelowna', founded: 1976, homeVenueId: 'glenmore-grounds' },
  { id: 'mission-creek', name: 'Mission Creek SC', short: 'MCR', colors: ['#f59e0b', '#1c1917'], city: 'Kelowna', founded: 1969, homeVenueId: 'mission-rec' },
  { id: 'knox', name: 'Knox Ridge United', short: 'KNX', colors: ['#8b5cf6', '#1e1b4b'], city: 'Kelowna', founded: 1988, homeVenueId: 'knox-turf' },
  { id: 'black-mountain', name: 'Black Mountain FC', short: 'BMT', colors: ['#0284c7', '#f8fafc'], city: 'Kelowna', founded: 2001, homeVenueId: 'blackmountain' },
  { id: 'kettle-valley', name: 'Kettle Valley SC', short: 'KVS', colors: ['#1d4ed8', '#0f172a'], city: 'Kelowna', founded: 1997, homeVenueId: 'kettle-valley' },
  { id: 'pandosy', name: 'Pandosy Rangers', short: 'PAN', colors: ['#dc2626', '#fbbf24'], city: 'Kelowna', founded: 1972, homeVenueId: 'pandosy-grounds' },
  { id: 'dilworth', name: 'Dilworth Dynamo', short: 'DIL', colors: ['#059669', '#022c22'], city: 'Kelowna', founded: 2005, homeVenueId: 'dilworth' },
  { id: 'springfield', name: 'Springfield United', short: 'SPU', colors: ['#b91c1c', '#0c0a09'], city: 'Kelowna', founded: 1984, homeVenueId: 'springfield' },
  { id: 'benvoulin', name: 'Benvoulin SC', short: 'BEN', colors: ['#22c55e', '#14532d'], city: 'Kelowna', founded: 1965, homeVenueId: 'benvoulin' },
  { id: 'guisachan', name: 'Guisachan FC', short: 'GUI', colors: ['#2563eb', '#fef3c7'], city: 'Kelowna', founded: 1990, homeVenueId: 'guisachan' },
  { id: 'quail-ridge', name: 'Quail Ridge FC', short: 'QRF', colors: ['#0891b2', '#083344'], city: 'Kelowna', founded: 2008, homeVenueId: 'quail-ridge' },
  { id: 'wilden', name: 'Wilden Wanderers', short: 'WIL', colors: ['#15803d', '#f0fdf4'], city: 'Kelowna', founded: 2011, homeVenueId: 'wilden' },
  { id: 'ellison', name: 'Ellison Eagles', short: 'ELL', colors: ['#7c3aed', '#faf5ff'], city: 'Kelowna', founded: 2003, homeVenueId: 'ellison' },
  { id: 'shannon-lake', name: 'Shannon Lake United', short: 'SHL', colors: ['#ea580c', '#1c1917'], city: 'West Kelowna', founded: 1993, homeVenueId: 'shannon-lake' },
  { id: 'westside', name: 'Westside Athletic', short: 'WSA', colors: ['#ca8a04', '#450a0a'], city: 'West Kelowna', founded: 1979, homeVenueId: 'westside-fields' },
  { id: 'peachland', name: 'Peachland Pirates', short: 'PCH', colors: ['#0f766e', '#ecfeff'], city: 'Peachland', founded: 1986, homeVenueId: 'peachland-memorial' },
  { id: 'lake-country', name: 'Lake Country FC', short: 'LCF', colors: ['#e11d48', '#fff1f2'], city: 'Lake Country', founded: 1974, homeVenueId: 'lakecountry' },
  { id: 'winfield', name: 'Winfield Wolves', short: 'WNF', colors: ['#0369a1', '#e0f2fe'], city: 'Lake Country', founded: 1998, homeVenueId: 'winfield' },
  { id: 'vernon-valley', name: 'Vernon Valley FC', short: 'VVF', colors: ['#9333ea', '#111827'], city: 'Vernon', founded: 1967, homeVenueId: 'vernon-valley' },
  { id: 'summerland', name: 'Summerland Suns', short: 'SUM', colors: ['#334155', '#e2e8f0'], city: 'Summerland', founded: 1991, homeVenueId: 'summerland' },
  { id: 'cedar-creek', name: 'Cedar Creek FC', short: 'CDR', colors: ['#be123c', '#fecdd3'], city: 'Kelowna', founded: 2000, homeVenueId: 'kettle-valley' },
  { id: 'orchard-park', name: 'Orchard Park SC', short: 'ORP', colors: ['#047857', '#d1fae5'], city: 'Kelowna', founded: 1983, homeVenueId: 'springfield' },
  { id: 'myra-canyon', name: 'Myra Canyon FC', short: 'MYR', colors: ['#1e40af', '#fbbf24'], city: 'Kelowna', founded: 2009, homeVenueId: 'blackmountain' },
  { id: 'clifton', name: 'Clifton Heights SC', short: 'CLF', colors: ['#dc2626', '#f8fafc'], city: 'Kelowna', founded: 1996, homeVenueId: 'knox-turf' },
  { id: 'sunset-ridge', name: 'Sunset Ridge SC', short: 'SNR', colors: ['#1e293b', '#38bdf8'], city: 'West Kelowna', founded: 2006, homeVenueId: 'westside-fields' },
  { id: 'postill', name: 'Postill Lake SC', short: 'PST', colors: ['#b45309', '#fef3c7'], city: 'Lake Country', founded: 1999, homeVenueId: 'lakecountry' },
  { id: 'trepanier', name: 'Trepanier FC', short: 'TRP', colors: ['#4338ca', '#e0e7ff'], city: 'Peachland', founded: 2004, homeVenueId: 'peachland-memorial' },
  { id: 'casorso', name: 'Casorso Athletic', short: 'CAS', colors: ['#0d9488', '#134e4a'], city: 'Kelowna', founded: 1971, homeVenueId: 'guisachan' },
  { id: 'hollywood-rd', name: 'Hollywood Road United', short: 'HRU', colors: ['#1d4ed8', '#fef08a'], city: 'Kelowna', founded: 1987, homeVenueId: 'rutland-fields' },
  { id: 'mcculloch', name: 'McCulloch FC', short: 'MCC', colors: ['#7f1d1d', '#fca5a5'], city: 'Kelowna', founded: 2007, homeVenueId: 'mission-rec' },
  { id: 'gallaghers', name: 'Gallaghers Canyon SC', short: 'GAL', colors: ['#c2410c', '#fed7aa'], city: 'Kelowna', founded: 1992, homeVenueId: 'kettle-valley' },
  { id: 'bear-creek', name: 'Bear Creek SC', short: 'BCK', colors: ['#166534', '#bbf7d0'], city: 'West Kelowna', founded: 1980, homeVenueId: 'shannon-lake' },
  { id: 'north-glenmore', name: 'North Glenmore FC', short: 'NGL', colors: ['#6d28d9', '#ddd6fe'], city: 'Kelowna', founded: 2010, homeVenueId: 'glenmore-grounds' },
  { id: 'lakeshore', name: 'Lakeshore United', short: 'LKS', colors: ['#0c4a6e', '#7dd3fc'], city: 'Kelowna', founded: 1978, homeVenueId: 'pandosy-grounds' },
]

export const clubById = new Map(CLUBS.map((c) => [c.id, c]))
export const venueById = new Map(VENUES.map((v) => [v.id, v]))
export const divisionById = new Map(DIVISIONS.map((d) => [d.id, d]))
