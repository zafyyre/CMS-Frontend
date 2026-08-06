export interface NavChild {
  label: string
  to: string
  description?: string
}

export interface NavItem {
  label: string
  to?: string
  children?: NavChild[]
}

export const NAV: NavItem[] = [
  { label: 'Fixtures', to: '/fixtures' },
  { label: 'Standings', to: '/standings' },
  { label: 'Teams', to: '/teams' },
  {
    label: 'Cups',
    children: [
      { label: 'Imperial Cup', to: '/cups/imperial', description: 'The open knockout, running since 1913' },
      { label: 'Challenge Cup', to: '/cups/challenge', description: 'Divisions 2 through 4' },
      { label: 'U21 Cup', to: '/cups/u21-cup', description: 'Under-21 knockout' },
      { label: 'Masters A Cup', to: '/cups/masters-a', description: 'The headline Masters competition' },
    ],
  },
  { label: 'Stats', to: '/stats' },
  { label: 'Fields', to: '/fields' },
  {
    label: 'More',
    children: [
      { label: 'Register', to: '/register', description: 'Players, teams and new clubs' },
      { label: 'Discipline', to: '/discipline', description: 'Suspensions, fines and appeals' },
      { label: 'News', to: '/news', description: 'League announcements and reports' },
      { label: 'About', to: '/about', description: 'Board, documents and honours' },
    ],
  },
]
