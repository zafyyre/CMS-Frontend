import { getStandings, teamById, teamsByDivision } from './engine'
import type { Cup, CupTie, NewsItem } from './types'

/* ────────────────────────────────────────────────────────────────
   News — original editorial copy written for this build.
   ──────────────────────────────────────────────────────────────── */
export const NEWS: NewsItem[] = [
  {
    id: 'n-01',
    title: 'Premier title race tightens as the winter break ends',
    excerpt:
      'Three points now separate the top four with fourteen matches still to play. We look at the run-in that will decide the trophy.',
    body: [
      'The gap at the summit has closed to a single win. What looked in November like a procession has turned into the tightest Premier race in years, and the fixtures ahead do nothing to settle it.',
      'Two of the top four meet before the end of February, and every side in the chasing pack still has both derbies to come. Goal difference is likely to matter more than it has in any recent campaign.',
      'Managers across the division have pointed to the same factor: squad depth through the wet months. The clubs who kept their rotation honest in the autumn are the ones still fresh now.',
    ],
    date: '2026-01-21',
    category: 'League',
    featured: true,
    readMinutes: 4,
  },
  {
    id: 'n-02',
    title: 'Imperial Cup quarter-final draw released',
    excerpt:
      'The last eight is set. Ties will be played across two weekends in February, with the final scheduled for the first weekend of April.',
    body: [
      'The draw has produced two all-Premier ties and one meeting between divisions three tiers apart — the kind of fixture the competition has been built on since 1913.',
      'All quarter-finals are single-leg. If scores are level after ninety minutes, ties go straight to penalties; there is no extra time at this stage.',
      'Hosting rights went to the lower-ranked side in each pairing. Full kickoff times and venues are published on the fixtures page.',
    ],
    date: '2026-01-18',
    category: 'Cup',
    featured: true,
    readMinutes: 3,
  },
  {
    id: 'n-03',
    title: 'Spring U21 registration is now open',
    excerpt:
      'Clubs can enter sides for the spring Under-21 campaign until 28 February. Rosters lock two weeks before the opening matchday.',
    body: [
      'The spring Under-21 competition runs from mid-March to late June and is open to players born on or after 1 January 2005.',
      'Entry is handled entirely through the club portal. Team officials should confirm their contact details are current before submitting, since all scheduling notices go to the address on file.',
      'Clubs entering a second side should flag it at the point of registration so the fixture generator can avoid same-day clashes.',
    ],
    date: '2026-01-15',
    category: 'Registration',
    readMinutes: 2,
  },
  {
    id: 'n-04',
    title: 'Referee development programme adds twelve new officials',
    excerpt:
      'A dozen officials completed the winter certification block and will begin taking middle appointments from February.',
    body: [
      'The intake is the largest in four seasons and follows a push to recruit from within the playing membership.',
      'New officials start on assistant duty in the lower divisions before moving to the middle. Mentors will attend a minimum of four matches each across the spring.',
      'Clubs are reminded that match-day abuse of officials carries an automatic administrative review, regardless of whether a card was shown.',
    ],
    date: '2026-01-12',
    category: 'Community',
    readMinutes: 3,
  },
  {
    id: 'n-05',
    title: 'Updated suspension thresholds take effect this month',
    excerpt:
      'Accumulation totals reset differently for cup competitions from February. Here is what team officials need to know.',
    body: [
      'Cautions picked up in league play and cup play are now tracked separately. A player who reaches five league cautions serves the ban in league fixtures only.',
      'Straight red cards remain competition-agnostic — a dismissal carries across every competition until the suspension is served in full.',
      'Team officials can see live accumulation totals for their roster in the discipline section.',
    ],
    date: '2026-01-08',
    category: 'Discipline',
    readMinutes: 3,
  },
  {
    id: 'n-06',
    title: 'Field allocations confirmed through to the end of March',
    excerpt:
      'Turf availability has improved at three complexes, letting us move several backlogged fixtures into midweek slots.',
    body: [
      'Additional evening allocations at Burnaby Lake, Newton and Town Centre give us roughly thirty extra slots between now and the end of March.',
      'Postponed fixtures will be rescheduled oldest-first. Clubs affected will receive notice at least ten days ahead of any midweek date.',
      'Field status on match day is published live on the fields page and updated as closures come in.',
    ],
    date: '2026-01-05',
    category: 'League',
    readMinutes: 2,
  },
  {
    id: 'n-07',
    title: 'Masters divisions expand for the 2026-27 season',
    excerpt:
      'Demand in the Over-45 bracket has prompted a second tier, with entries opening alongside general team registration in May.',
    body: [
      'Over-45 has run as a single division for six seasons. Sustained growth in entries now supports splitting it into a Premier and a Division 1.',
      'Placement for the first season will be based on the current table, with the top half seeded into the Premier tier.',
      'The Over-55 competition remains a single division and continues on its Sunday-morning schedule.',
    ],
    date: '2025-12-19',
    category: 'League',
    readMinutes: 3,
  },
  {
    id: 'n-08',
    title: 'Community fund opens applications for spring grants',
    excerpt:
      'Clubs can apply for equipment and access grants of up to $2,500. Applications close 15 March.',
    body: [
      'The fund exists to remove cost barriers to playing. Priority goes to applications that lower registration fees or supply kit for players who would otherwise not take part.',
      'Applications are reviewed by a three-person panel drawn from the board and the club membership.',
      'Successful applicants are announced in April and funds are released before the spring season begins.',
    ],
    date: '2025-12-11',
    category: 'Community',
    readMinutes: 2,
  },
]

/* ────────────────────────────────────────────────────────────────
   Cups — bracket generated from real division standings so the
   qualifiers are consistent with the rest of the dataset.
   ──────────────────────────────────────────────────────────────── */
function buildCup(id: string, name: string, subtitle: string, since: number, sourceDivisions: string[]): Cup {
  const rounds = ['Round of 16', 'Quarter-final', 'Semi-final', 'Final']

  // Seed the bracket with the strongest sides from the contributing divisions.
  const seeds: string[] = []
  for (const divisionId of sourceDivisions) {
    const table = getStandings(divisionId)
    const take = Math.ceil(16 / sourceDivisions.length)
    for (const row of table.slice(0, take)) seeds.push(row.teamId)
  }
  const entrants = seeds.slice(0, 16)
  while (entrants.length < 16) {
    const filler = (teamsByDivision.get(sourceDivisions[0]) ?? [])[entrants.length]
    if (!filler) break
    entrants.push(filler.id)
  }

  const ties: CupTie[] = []
  const dates = ['2025-11-15', '2026-02-07', '2026-03-07', '2026-04-04']

  // Round of 16 — 1v16, 2v15, … keeps the bracket readable.
  let advancing: string[] = []
  for (let i = 0; i < 8; i++) {
    const home = entrants[i]
    const away = entrants[15 - i]
    const homeTeam = teamById.get(home)
    const awayTeam = teamById.get(away)
    const hg = homeTeam && awayTeam ? (homeTeam.rating >= awayTeam.rating ? 2 : 1) : null
    const ag = homeTeam && awayTeam ? (homeTeam.rating >= awayTeam.rating ? 1 : 2) : null
    ties.push({
      id: `${id}-r16-${i}`,
      round: rounds[0],
      homeTeamId: home ?? null,
      awayTeamId: away ?? null,
      homeGoals: hg,
      awayGoals: ag,
      kickoff: `${dates[0]}T14:00:00`,
      venueId: null,
      slot: i,
      nextSlot: Math.floor(i / 2),
    })
    advancing.push((hg ?? 0) > (ag ?? 0) ? home : away)
  }

  // Quarter-finals are played; semis and the final are still to come.
  const qfWinners: string[] = []
  for (let i = 0; i < 4; i++) {
    const home = advancing[i * 2]
    const away = advancing[i * 2 + 1]
    const homeTeam = teamById.get(home)
    const awayTeam = teamById.get(away)
    const decided = i < 2
    const homeWins = homeTeam && awayTeam ? homeTeam.rating >= awayTeam.rating : true
    ties.push({
      id: `${id}-qf-${i}`,
      round: rounds[1],
      homeTeamId: home ?? null,
      awayTeamId: away ?? null,
      homeGoals: decided ? (homeWins ? 3 : 0) : null,
      awayGoals: decided ? (homeWins ? 1 : 2) : null,
      kickoff: `${dates[1]}T14:00:00`,
      venueId: null,
      slot: i,
      nextSlot: Math.floor(i / 2),
    })
    qfWinners.push(decided ? (homeWins ? home : away) : '')
  }

  for (let i = 0; i < 2; i++) {
    ties.push({
      id: `${id}-sf-${i}`,
      round: rounds[2],
      homeTeamId: qfWinners[i * 2] || null,
      awayTeamId: qfWinners[i * 2 + 1] || null,
      homeGoals: null,
      awayGoals: null,
      kickoff: `${dates[2]}T14:00:00`,
      venueId: null,
      slot: i,
      nextSlot: 0,
    })
  }

  ties.push({
    id: `${id}-final`,
    round: rounds[3],
    homeTeamId: null,
    awayTeamId: null,
    homeGoals: null,
    awayGoals: null,
    kickoff: `${dates[3]}T15:00:00`,
    venueId: 'swangard',
    slot: 0,
    nextSlot: null,
  })

  return { id, name, subtitle, since, ties, rounds }
}

export const CUPS: Cup[] = [
  buildCup('imperial', 'Imperial Cup', 'The league’s open knockout, contested since 1913.', 1913, ['premier', 'div1']),
  buildCup('u21-cup', 'U21 Cup', 'Knockout football for the Under-21 division.', 1996, ['u21']),
  buildCup('challenge', 'Challenge Cup', 'Open to every side in Divisions 2 through 4.', 1974, ['div2', 'div3', 'div4']),
  buildCup('masters-a', 'Masters A Cup', 'The headline Masters knockout competition.', 1988, ['o35-premier', 'o35-div1']),
]

/* ────────────────────────────────────────────────────────────────
   Registration
   ──────────────────────────────────────────────────────────────── */
export interface RegPath {
  id: string
  audience: string
  title: string
  summary: string
  window: string
  minutes: number
  steps: { title: string; detail: string }[]
  requirements: string[]
}

export const REGISTRATION_PATHS: RegPath[] = [
  {
    id: 'player',
    audience: 'Players',
    title: 'Register as a player',
    summary: 'Join a roster for the current season. Most players finish this in under ten minutes.',
    window: 'Open until 28 February',
    minutes: 10,
    steps: [
      { title: 'Find your club', detail: 'Search the club directory and request to join the team you have agreed terms with.' },
      { title: 'Confirm your details', detail: 'Full legal name, date of birth and a current photo for your player card.' },
      { title: 'Complete the safety module', detail: 'A short online module covering concussion protocol and code of conduct.' },
      { title: 'Pay your fee', detail: 'Fees vary by club and division. Your club sets the amount and collects it directly.' },
      { title: 'Wait for approval', detail: 'Your club official approves the request, then the league validates eligibility. Usually same-day.' },
    ],
    requirements: [
      'Government-issued photo ID',
      'A headshot on a plain background',
      'Criminal record check if you are 18 or older and hold a team official role',
    ],
  },
  {
    id: 'team',
    audience: 'Team officials',
    title: 'Register a team',
    summary: 'Enter a side into a division for the coming season, or renew an existing entry.',
    window: 'Opens 1 May',
    minutes: 25,
    steps: [
      { title: 'Confirm club standing', detail: 'Your club must be in good standing with no outstanding fines or fees.' },
      { title: 'Choose a division', detail: 'Renewing sides keep their placement. New entries are placed by the competitions committee.' },
      { title: 'Nominate officials', detail: 'A manager and at least one alternate contact, both with valid record checks.' },
      { title: 'Declare your home field', detail: 'Provide a field permit covering your allocated home dates.' },
      { title: 'Pay the entry bond', detail: 'The bond is refunded at season end provided all obligations are met.' },
    ],
    requirements: [
      'Valid field permit for the full season',
      'Two nominated officials with current record checks',
      'Proof of club insurance',
    ],
  },
  {
    id: 'club',
    audience: 'New clubs',
    title: 'Apply as a new club',
    summary: 'Bring a new club into the league, or record a change to an existing club’s details.',
    window: 'Reviewed quarterly',
    minutes: 45,
    steps: [
      { title: 'Submit an expression of interest', detail: 'Tell us about your club, where you play, and how many sides you intend to enter.' },
      { title: 'Meet the committee', detail: 'A short meeting to walk through governance, field access and financial standing.' },
      { title: 'Provide documentation', detail: 'Society registration, insurance, constitution and a signed code of conduct.' },
      { title: 'Board vote', detail: 'New club applications are voted on at the next scheduled board meeting.' },
    ],
    requirements: [
      'Registered society or incorporation documents',
      'Liability insurance naming the league',
      'Secured field access for a full season',
    ],
  },
  {
    id: 'transfer',
    audience: 'Players',
    title: 'Transfer or permit',
    summary: 'Move between clubs mid-season, or play up temporarily on a permit.',
    window: 'Transfer window closes 31 January',
    minutes: 15,
    steps: [
      { title: 'Get a release', detail: 'Your current club must release you in writing before a transfer can be processed.' },
      { title: 'Submit the request', detail: 'Both clubs confirm the move through the portal.' },
      { title: 'League review', detail: 'We check for outstanding discipline or fees on either side.' },
      { title: 'Confirmation', detail: 'Once approved you are eligible from the next scheduled fixture.' },
    ],
    requirements: ['Written release from your current club', 'No outstanding suspensions or fees'],
  },
]

/* ────────────────────────────────────────────────────────────────
   Discipline reference
   ──────────────────────────────────────────────────────────────── */
export const FINE_SCHEDULE = [
  { offence: 'Failure to appear for a scheduled fixture', amount: 350, note: 'Plus forfeiture of the match 3–0.' },
  { offence: 'Late submission of a match sheet', amount: 50, note: 'Per occurrence, waived once per season.' },
  { offence: 'Fielding an ineligible player', amount: 250, note: 'Match awarded to the opposition.' },
  { offence: 'Failure to provide a qualified official', amount: 100, note: 'Applies to home clubs only.' },
  { offence: 'Team dissent — mass confrontation', amount: 200, note: 'Escalates on repeat within the same season.' },
  { offence: 'Abandonment caused by a club', amount: 500, note: 'Referred to the discipline committee.' },
  { offence: 'Unregistered spectator conduct breach', amount: 150, note: 'Home club is responsible for its supporters.' },
  { offence: 'Failure to attend a discipline hearing', amount: 175, note: 'Hearing proceeds in the club’s absence.' },
]

export const SUSPENSION_MATRIX = [
  { code: 'C1', offence: 'Serious foul play', ban: '3 matches', escalation: 'Committee may extend for violent contact.' },
  { code: 'C2', offence: 'Violent conduct', ban: '5 matches', escalation: 'Mandatory hearing.' },
  { code: 'C3', offence: 'Spitting at an opponent or any other person', ban: '6 matches', escalation: 'Mandatory hearing.' },
  { code: 'C4', offence: 'Denying an obvious goalscoring opportunity', ban: '1 match', escalation: 'No hearing required.' },
  { code: 'C5', offence: 'Offensive or abusive language', ban: '2 matches', escalation: 'Extended if directed at an official.' },
  { code: 'C6', offence: 'Second caution in the same match', ban: '1 match', escalation: 'No hearing required.' },
  { code: 'C7', offence: 'Physical contact with a match official', ban: '12 months minimum', escalation: 'Referred to the provincial association.' },
]

export const DISCIPLINE_FAQ = [
  {
    q: 'When does a suspension start?',
    a: 'Suspensions begin at your team’s next scheduled fixture in the competition where the offence occurred. A straight red carries across all competitions.',
  },
  {
    q: 'How many cautions trigger a ban?',
    a: 'Five cautions in league play brings a one-match ban. The count resets after the ban is served. Cup cautions are tracked separately.',
  },
  {
    q: 'Can a decision be appealed?',
    a: 'Yes. Appeals must be filed by the club, in writing, within seven days of the written decision, and are heard by a panel that did not sit on the original case.',
  },
  {
    q: 'What happens if a suspended player is fielded anyway?',
    a: 'The match is awarded to the opposition, the club is fined for fielding an ineligible player, and the original suspension restarts.',
  },
  {
    q: 'Do suspensions carry over between seasons?',
    a: 'Outstanding matches carry into the following season if they cannot be served in the current one. Time-based bans run continuously.',
  },
]

/* ────────────────────────────────────────────────────────────────
   Governance
   ──────────────────────────────────────────────────────────────── */
export const BOARD = [
  { name: 'Alana Whitcombe', role: 'President', focus: 'Governance and provincial liaison', since: 2021 },
  { name: 'Devon Marchetti', role: 'Vice President', focus: 'Competitions and scheduling', since: 2019 },
  { name: 'Priya Sandhu', role: 'Treasurer', focus: 'Finance and club bonds', since: 2022 },
  { name: 'Colin Baptiste', role: 'Registrar', focus: 'Player eligibility and transfers', since: 2018 },
  { name: 'Marisol Reyes', role: 'Discipline Chair', focus: 'Hearings and appeals', since: 2020 },
  { name: 'Tomas Novak', role: 'Referee Liaison', focus: 'Official assignment and development', site: '', since: 2023 },
  { name: 'Grace Okafor', role: 'Masters Coordinator', focus: 'Over-35, Over-45 and Over-55 divisions', since: 2022 },
  { name: 'Ellis Hutchinson', role: 'Communications', focus: 'Website, media and club notices', since: 2024 },
]

export const DOCUMENTS = [
  { name: 'Rules and Regulations 2025-26', kind: 'PDF', size: '1.4 MB', updated: '2025-08-14', category: 'Governance' },
  { name: 'League Constitution', kind: 'PDF', size: '620 KB', updated: '2024-06-02', category: 'Governance' },
  { name: 'Team Registration Form', kind: 'PDF', size: '210 KB', updated: '2025-05-01', category: 'Registration' },
  { name: 'Player Transfer Request', kind: 'PDF', size: '180 KB', updated: '2025-09-11', category: 'Registration' },
  { name: 'Permit Player Declaration', kind: 'PDF', size: '145 KB', updated: '2025-09-11', category: 'Registration' },
  { name: 'Criminal Record Check Guide', kind: 'PDF', size: '320 KB', updated: '2025-07-20', category: 'Compliance' },
  { name: 'Match Sheet Template', kind: 'XLSX', size: '48 KB', updated: '2025-08-30', category: 'Match day' },
  { name: 'Field Closure Policy', kind: 'PDF', size: '190 KB', updated: '2025-10-04', category: 'Match day' },
  { name: 'Concussion Protocol', kind: 'PDF', size: '410 KB', updated: '2025-08-14', category: 'Compliance' },
  { name: 'Code of Conduct', kind: 'PDF', size: '160 KB', updated: '2025-08-14', category: 'Governance' },
]

export const HONOURS = [
  { season: '2024-25', premier: 'BB5 United A', imperial: 'Croatia SC A', div1: 'Rino’s Tigers A', goldenBoot: 'M. Ferreira — 27' },
  { season: '2023-24', premier: 'BB5 United A', imperial: 'Coquitlam Metro-Ford A', div1: 'Pegasus FC A', goldenBoot: 'D. Alvarez — 24' },
  { season: '2022-23', premier: 'BB5 United A', imperial: 'BB5 United A', div1: 'Club Inter EDC A', goldenBoot: 'A. Haddad — 22' },
  { season: '2021-22', premier: 'Croatia SC A', imperial: 'Rino’s Tigers A', div1: 'Guildford FC A', goldenBoot: 'L. Nguyen — 25' },
  { season: '2019-20', premier: 'Coquitlam Metro-Ford A', imperial: 'West Van FC A', div1: 'North Van FC A', goldenBoot: 'S. Petrovic — 21' },
  { season: '2018-19', premier: 'Rino’s Tigers A', imperial: 'ICSF Columbus A', div1: 'Surrey United A', goldenBoot: 'K. Marino — 26' },
  { season: '2017-18', premier: 'Croatia SC A', imperial: 'Croatia SC A', div1: 'Dunbar SC A', goldenBoot: 'R. Mendes — 23' },
]

export const FAQ_GENERAL = [
  {
    q: 'When does the season run?',
    a: 'The main season runs from early September to early April. A separate spring Under-21 competition runs from March to June.',
  },
  {
    q: 'How do I find a team to play for?',
    a: 'Start with the club directory — filter by city and division to find clubs near you, then contact them directly. Most clubs hold open trials in July and August.',
  },
  {
    q: 'What level should I register at?',
    a: 'Premier and Division 1 are highly competitive with former professional and university players. Divisions 3 and 4 are where most recreational players start.',
  },
  {
    q: 'Are matches played in the rain?',
    a: 'Almost always. Fixtures are only called off when a field is closed by the municipality or the referee deems it unsafe. Check the fields page on match day.',
  },
  {
    q: 'Do I need my own insurance?',
    a: 'Registered players are covered under the provincial association’s policy for sanctioned fixtures. That coverage does not extend to friendlies or training.',
  },
  {
    q: 'Can I play in more than one division?',
    a: 'Yes, provided you meet the age criteria and your clubs agree. You may only be rostered to one team per competition.',
  },
]
