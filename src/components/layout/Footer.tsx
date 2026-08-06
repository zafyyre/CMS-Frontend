import { Link } from 'react-router-dom'
import { Facebook, Instagram, Mail, MapPin, Twitter } from 'lucide-react'
import { Container } from '../ui'
import { NAV } from './nav'
import { MATCHES, TEAMS } from '@/data/engine'
import { CLUBS, LEAGUE_FOUNDED, LEAGUE_NAME, SEASON_ID, VENUES } from '@/data/league'

const FOOTER_LINKS = [
  {
    title: 'Compete',
    links: [
      { label: 'Fixtures & results', to: '/fixtures' },
      { label: 'Standings', to: '/standings' },
      { label: 'Statistics', to: '/stats' },
      { label: 'Cup competitions', to: '/cups/imperial' },
    ],
  },
  {
    title: 'Participate',
    links: [
      { label: 'Register to play', to: '/register' },
      { label: 'Teams & clubs', to: '/teams' },
      { label: 'Fields', to: '/fields' },
      { label: 'Discipline', to: '/discipline' },
    ],
  },
  {
    title: 'League',
    links: [
      { label: 'About', to: '/about' },
      { label: 'News', to: '/news' },
      { label: 'Board of directors', to: '/about#board' },
      { label: 'Documents', to: '/about#documents' },
    ],
  },
]

/* Placeholders only — this demo has no real social accounts behind it, so
   these render as inert badges rather than links to somewhere real. */
const SOCIALS = [
  { label: 'Instagram', icon: Instagram },
  { label: 'X', icon: Twitter },
  { label: 'Facebook', icon: Facebook },
]

export function Footer() {
  const stats = [
    { value: TEAMS.length, label: 'Teams' },
    { value: CLUBS.length, label: 'Clubs' },
    { value: VENUES.length, label: 'Fields' },
    { value: MATCHES.length.toLocaleString('en-CA'), label: 'Fixtures' },
  ]

  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-app-alt">
      <Container className="py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)]">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M12 2.6 20 6v9c0 4.6-3.6 7.8-8 9.4C7.6 22.8 4 19.6 4 15V6z" strokeLinejoin="round" />
                  <circle cx="12" cy="12.6" r="3.4" />
                </svg>
              </span>
              <div className="leading-tight">
                <p className="font-display text-lg font-extrabold">{LEAGUE_NAME}</p>
                <p className="text-xs text-faint">
                  Est. {LEAGUE_FOUNDED} (fictional) · {SEASON_ID} season
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              A made-up amateur adult soccer league — five open divisions, an Under-21 competition and Masters
              soccer, played across an imagined Okanagan valley every weekend.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {SOCIALS.map((s) => (
                <span
                  key={s.label}
                  title={`${s.label} — placeholder, no account linked`}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-dashed border-[var(--border)] bg-surface text-faint opacity-60"
                >
                  <s.icon size={17} />
                </span>
              ))}
              <span
                title="Placeholder address — not a real mailbox"
                className="grid h-10 w-10 place-items-center rounded-xl border border-dashed border-[var(--border)] bg-surface text-faint opacity-60"
              >
                <Mail size={17} />
              </span>
            </div>

            <p className="mt-5 flex items-start gap-2 text-sm text-faint">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              100 Example Sports Way, Kelowna, BC (sample address)
            </p>
          </div>

          <div>
            <div className="mb-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-surface px-4 py-3.5">
                  <p className="font-display text-2xl font-extrabold text-accent">{s.value}</p>
                  <p className="mt-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-faint">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {FOOTER_LINKS.map((col) => (
                <div key={col.title}>
                  <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-faint">
                    {col.title}
                  </p>
                  <ul className="space-y-2.5">
                    {col.links.map((l) => (
                      <li key={l.to}>
                        <Link
                          to={l.to}
                          className="text-sm text-muted transition-colors hover:text-accent"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-faint">
            {LEAGUE_NAME} — a fictional league. Not affiliated with any real organization.
          </p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            {NAV.filter((n) => n.to).map((n) => (
              <Link key={n.to} to={n.to!} className="text-xs text-faint transition-colors hover:text-accent">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 space-y-2 rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-4 text-xs leading-relaxed text-faint">
          <p>
            <strong className="font-semibold text-muted">Not affiliated with anyone.</strong> This site is an
            independent demo. It is not affiliated with, endorsed by, sponsored by, or connected to any real
            soccer league, club, association, business or person. The {LEAGUE_NAME} does not exist — it was
            invented for this project.
          </p>
          <p>
            <strong className="font-semibold text-muted">Everything here is fake.</strong> Every club, team,
            player, manager, fixture, result, statistic, standing, field, address, email and phone number is
            randomly generated or made-up sample data. Nothing on this site describes real people, real places
            or real events, and none of it should be relied on for anything.
          </p>
          <p>
            <strong className="font-semibold text-muted">Built as a demo with Claude by me, for testing
            purposes.</strong> It exists to try out frontend ideas — layout, motion, theming and a simulated
            data layer — and for no other reason.
          </p>
        </div>
      </Container>
    </footer>
  )
}
