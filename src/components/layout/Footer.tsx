import { Link } from 'react-router-dom'
import { Facebook, Instagram, Mail, MapPin, Twitter } from 'lucide-react'
import { Container } from '../ui'
import { NAV } from './nav'
import { MATCHES, TEAMS } from '@/data/engine'
import { CLUBS, SEASON_ID, VENUES } from '@/data/league'

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

const SOCIALS = [
  { label: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/vmslsoccer/' },
  { label: 'X', icon: Twitter, href: 'https://x.com/vmslsoccer' },
  { label: 'Facebook', icon: Facebook, href: 'https://www.facebook.com/' },
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
                <p className="font-display text-lg font-extrabold">Vancouver Metro Soccer League</p>
                <p className="text-xs text-faint">Founded 1973 · {SEASON_ID} season</p>
              </div>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              British Columbia&rsquo;s premier amateur adult soccer league — five open divisions, an Under-21
              competition and Masters soccer, played across the Lower Mainland every weekend.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] bg-surface text-muted transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-accent"
                >
                  <s.icon size={17} />
                </a>
              ))}
              <a
                href="mailto:info@vmslsoccer.com"
                aria-label="Email the league"
                className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border)] bg-surface text-muted transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-accent"
              >
                <Mail size={17} />
              </a>
            </div>

            <p className="mt-5 flex items-start gap-2 text-sm text-faint">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              6501 Sprott Street, Burnaby, BC&nbsp;V5B 3B8
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
            © {new Date().getFullYear()} Vancouver Metro Soccer League. Affiliated with BC Soccer and Canada
            Soccer.
          </p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            {NAV.filter((n) => n.to).map((n) => (
              <Link key={n.to} to={n.to!} className="text-xs text-faint transition-colors hover:text-accent">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-6 rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-3 text-xs leading-relaxed text-faint">
          <strong className="font-semibold text-muted">Demonstration build.</strong> Fixtures, results, tables and
          player statistics on this site are simulated from a seeded dataset anchored to a mid-January 2026
          matchday, so the league always has a full season of history behind it and fixtures ahead of it.
        </p>
      </Container>
    </footer>
  )
}
