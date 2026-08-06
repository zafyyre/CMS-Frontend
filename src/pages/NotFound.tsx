import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button, Container } from '@/components/ui'

const SUGGESTIONS = [
  { to: '/fixtures', label: 'Fixtures & results' },
  { to: '/standings', label: 'Standings' },
  { to: '/teams', label: 'Teams & clubs' },
  { to: '/register', label: 'Registration' },
]

export default function NotFound() {
  return (
    <Container className="relative overflow-hidden py-24 text-center sm:py-32">
      <div aria-hidden className="pitch-grid absolute inset-0" />
      <div className="relative mx-auto max-w-lg">
        <p className="font-display text-[6rem] font-extrabold leading-none text-accent sm:text-[8rem]">404</p>
        <h1 className="mt-2 text-2xl sm:text-3xl">Wide of the post</h1>
        <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">
          That page isn&rsquo;t here. It may have moved with the new season, or the link might have a typo.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/" size="lg">
            Back to the homepage
            <ArrowRight size={16} />
          </Button>
        </div>

        <div className="mt-10">
          <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-faint">
            Or try one of these
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="rounded-full border border-[var(--border)] bg-surface px-4 py-2 text-sm font-semibold text-muted transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-accent"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-10 text-sm text-faint">
          Tip: press <kbd className="rounded border border-[var(--border-strong)] px-1.5 py-0.5 font-sans text-xs font-semibold">/</kbd>{' '}
          anywhere to search the whole site.
        </p>
      </div>
    </Container>
  )
}
