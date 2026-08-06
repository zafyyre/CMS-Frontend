import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, ChevronDown, Clock, FileText, HelpCircle } from 'lucide-react'
import { Badge, Button, Container, SectionHeading } from '@/components/ui'
import { FAQ_GENERAL, REGISTRATION_PATHS } from '@/data/content'
import { cx } from '@/lib/format'

function PathSteps({ pathId }: { pathId: string }) {
  const path = REGISTRATION_PATHS.find((p) => p.id === pathId)!
  const [done, setDone] = useState<Set<number>>(new Set())

  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  const progress = (done.size / path.steps.length) * 100

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div>
        {/* Progress */}
        <div className="card mb-5 p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-muted">
              {done.size} of {path.steps.length} steps done
            </span>
            <span className="tabular font-bold text-accent">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full bg-[var(--accent)]"
            />
          </div>
          <p className="mt-2 text-[0.7rem] text-faint">
            Tick steps off as you go — your progress is kept while you&rsquo;re on this page.
          </p>
        </div>

        <ol className="relative space-y-3">
          <span aria-hidden className="absolute bottom-6 left-[19px] top-6 w-px bg-[var(--border)]" />
          {path.steps.map((step, i) => {
            const complete = done.has(i)
            return (
              <li key={step.title} className="relative">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-pressed={complete}
                  className={cx(
                    'card card-hover flex w-full items-start gap-4 p-4 text-left',
                    complete && 'border-[var(--accent)]/45',
                  )}
                >
                  <span
                    className={cx(
                      'relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 font-display text-sm font-extrabold transition-all duration-300',
                      complete
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                        : 'border-[var(--border-strong)] bg-surface text-muted',
                    )}
                  >
                    {complete ? <Check size={17} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cx(
                        'block font-display text-base font-bold transition-colors',
                        complete && 'text-faint line-through',
                      )}
                    >
                      {step.title}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{step.detail}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <div className="card mt-5 flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-display text-base font-bold">Ready to submit?</p>
            <p className="mt-1 text-sm text-muted">Roughly {path.minutes} minutes once you have your documents.</p>
          </div>
          <Button>
            Open the portal
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-accent">
            <Clock size={15} />
            <p className="text-[0.68rem] font-bold uppercase tracking-wider">Window</p>
          </div>
          <p className="mt-1.5 font-display text-lg font-extrabold">{path.window}</p>
          <p className="mt-1 text-sm text-muted">{path.summary}</p>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2 text-accent">
            <FileText size={15} />
            <p className="text-[0.68rem] font-bold uppercase tracking-wider">What you&rsquo;ll need</p>
          </div>
          <ul className="space-y-2.5">
            {path.requirements.map((r) => (
              <li key={r} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                <Check size={15} className="mt-0.5 shrink-0 text-accent" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="card border-dashed p-5">
          <div className="mb-2 flex items-center gap-2">
            <HelpCircle size={15} className="text-accent" />
            <p className="font-display text-sm font-bold">Stuck on something?</p>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            The registrar answers email within one business day during the registration window.
          </p>
          <Button href="mailto:registrar@vmslsoccer.com" variant="outline" size="sm" className="mt-3 w-full">
            Email the registrar
          </Button>
        </div>
      </div>
    </div>
  )
}

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="card divide-y divide-[var(--border)] overflow-hidden">
      {items.map((item, i) => (
        <div key={item.q}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2"
          >
            <span className="font-display text-[0.95rem] font-bold">{item.q}</span>
            <ChevronDown
              size={17}
              className={cx('shrink-0 text-faint transition-transform duration-200', open === i && 'rotate-180')}
            />
          </button>
          <motion.div
            initial={false}
            animate={{ height: open === i ? 'auto' : 0, opacity: open === i ? 1 : 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{item.a}</p>
          </motion.div>
        </div>
      ))}
    </div>
  )
}

export default function Register() {
  const [pathId, setPathId] = useState(REGISTRATION_PATHS[0].id)

  return (
    <>
      <div className="relative overflow-hidden border-b border-[var(--border)] bg-app-alt">
        <div aria-hidden className="pitch-grid absolute inset-0" />
        <Container className="relative py-12 sm:py-16">
          <Badge tone="accent" className="mb-4">
            Registration
          </Badge>
          <h1 className="max-w-2xl text-3xl sm:text-4xl lg:text-5xl">
            Get on the pitch in a handful of steps
          </h1>
          <p className="mt-4 max-w-xl text-[1.02rem] leading-relaxed text-muted">
            Pick the path that fits you. Each one lays out exactly what&rsquo;s needed, how long it takes, and
            who to contact if something goes sideways.
          </p>
        </Container>
      </div>

      <Container className="py-10 sm:py-14">
        {/* Path picker */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REGISTRATION_PATHS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPathId(p.id)}
              className={cx(
                'card card-hover p-4 text-left transition-colors',
                pathId === p.id && 'border-[var(--accent)] bg-[var(--accent)]/[0.06]',
              )}
            >
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-accent">{p.audience}</p>
              <p className="mt-1 font-display text-base font-bold">{p.title}</p>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{p.summary}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[0.68rem] font-semibold text-faint">
                <Clock size={11} />
                {p.minutes} min · {p.steps.length} steps
              </p>
            </button>
          ))}
        </div>

        <div className="mt-10">
          <PathSteps key={pathId} pathId={pathId} />
        </div>

        <div className="mt-16">
          <SectionHeading eyebrow="Questions" title="Before you register" />
          <div className="mt-6">
            <Accordion items={FAQ_GENERAL} />
          </div>
        </div>

        <div className="card relative mt-12 overflow-hidden p-8 text-center">
          <div aria-hidden className="pitch-grid absolute inset-0" />
          <div className="relative">
            <h3 className="text-2xl">Still not sure where you fit?</h3>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
              Browse the club directory by city and division — most clubs list a contact and run open sessions
              before the season starts.
            </p>
            <Button to="/teams" size="lg" className="mt-6">
              Find a club near you
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </Container>
    </>
  )
}
