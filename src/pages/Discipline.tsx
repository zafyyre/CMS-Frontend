import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ChevronDown, Gavel, Scale, Search, Square } from 'lucide-react'
import { Badge, Chip, Container, EmptyState, SectionHeading } from '@/components/ui'
import { Crest } from '@/components/Crest'
import { DISCIPLINE_FAQ, FINE_SCHEDULE, SUSPENSION_MATRIX } from '@/data/content'
import { getDiscipline, playerById, teamById } from '@/data/engine'
import { DIVISIONS } from '@/data/league'
import { cx } from '@/lib/format'
import { useDebounced } from '@/lib/hooks'

type Tab = 'suspensions' | 'offences' | 'fines' | 'faq'

const TABS: { id: Tab; label: string; icon: typeof Gavel }[] = [
  { id: 'suspensions', label: 'Active suspensions', icon: AlertTriangle },
  { id: 'offences', label: 'Offence codes', icon: Scale },
  { id: 'fines', label: 'Fine schedule', icon: Gavel },
  { id: 'faq', label: 'FAQ', icon: Square },
]

export default function Discipline() {
  const [tab, setTab] = useState<Tab>('suspensions')
  const [division, setDivision] = useState('all')
  const [query, setQuery] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const debounced = useDebounced(query)

  const suspensions = useMemo(() => {
    const divisions = division === 'all' ? DIVISIONS.map((d) => d.id) : [division]
    const rows = divisions.flatMap((d) =>
      getDiscipline(d)
        .filter((r) => r.suspended > 0)
        .map((r) => ({ ...r, divisionId: d })),
    )
    const q = debounced.trim().toLowerCase()
    return rows
      .filter((r) => {
        if (!q) return true
        const name = playerById.get(r.playerId)?.name.toLowerCase() ?? ''
        const team = teamById.get(r.teamId)?.name.toLowerCase() ?? ''
        return name.includes(q) || team.includes(q)
      })
      .sort((a, b) => b.suspended - a.suspended || b.reds - a.reds)
      .slice(0, 60)
  }, [division, debounced])

  return (
    <>
      <div className="relative overflow-hidden border-b border-[var(--border)] bg-app-alt">
        <div aria-hidden className="pitch-grid absolute inset-0" />
        <Container className="relative py-12 sm:py-16">
          <Badge tone="accent" className="mb-4">
            Discipline
          </Badge>
          <h1 className="max-w-2xl text-3xl sm:text-4xl lg:text-5xl">Suspensions, offences and fines</h1>
          <p className="mt-4 max-w-xl text-[1.02rem] leading-relaxed text-muted">
            Everything a team official needs before naming a squad — who is available, what an offence carries,
            and how the appeal process works.
          </p>
        </Container>
      </div>

      <Container className="py-10 sm:py-14">
        <div
          role="tablist"
          className="no-scrollbar fade-x flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-surface-2 p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cx(
                'relative flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                tab === t.id ? 'text-base-c' : 'text-faint hover:text-muted',
              )}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="discipline-tab"
                  className="absolute inset-0 rounded-lg bg-surface shadow-sm"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <t.icon size={14} className="relative" />
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === 'suspensions' && (
            <>
              <div className="mb-5 space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by player or team…"
                    aria-label="Search suspensions"
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-surface-2 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-faint focus:border-[var(--accent)]"
                  />
                </div>
                <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                  <Chip active={division === 'all'} onClick={() => setDivision('all')}>
                    All divisions
                  </Chip>
                  {DIVISIONS.map((d) => (
                    <Chip key={d.id} active={division === d.id} onClick={() => setDivision(d.id)}>
                      {d.name}
                    </Chip>
                  ))}
                </div>
              </div>

              {suspensions.length === 0 ? (
                <EmptyState
                  icon={<AlertTriangle size={36} />}
                  title="No active suspensions"
                  description="Nothing outstanding for this selection."
                />
              ) : (
                <div className="card overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-[var(--border)] bg-surface-2 px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-wider text-faint sm:grid-cols-[1fr_80px_80px_120px]">
                    <span>Player</span>
                    <span className="hidden text-center sm:block">Yellows</span>
                    <span className="hidden text-center sm:block">Reds</span>
                    <span className="text-right">Matches left</span>
                  </div>
                  {suspensions.map((s) => (
                    <div
                      key={s.playerId}
                      className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0 transition-colors hover:bg-surface-2 sm:grid-cols-[1fr_80px_80px_120px]"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Crest teamId={s.teamId} size={28} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {playerById.get(s.playerId)?.name}
                          </span>
                          <span className="block truncate text-[0.68rem] text-faint">
                            {teamById.get(s.teamId)?.name}
                          </span>
                        </span>
                      </span>
                      <span className="tabular hidden text-center font-display text-sm font-extrabold text-amber-500 sm:block">
                        {s.yellows}
                      </span>
                      <span className="tabular hidden text-center font-display text-sm font-extrabold text-rose-500 sm:block">
                        {s.reds || '—'}
                      </span>
                      <span className="text-right">
                        <Badge tone="danger">
                          {s.suspended} {s.suspended === 1 ? 'match' : 'matches'}
                        </Badge>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-4 rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-3 text-xs leading-relaxed text-faint">
                Suspension totals update automatically once a match sheet is submitted. If you believe a record is
                wrong, contact the registrar before your next fixture — fielding a suspended player forfeits the
                match regardless of intent.
              </p>
            </>
          )}

          {tab === 'offences' && (
            <div className="card overflow-hidden">
              <div className="hidden grid-cols-[70px_1fr_130px_1fr] gap-4 border-b border-[var(--border)] bg-surface-2 px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-wider text-faint sm:grid">
                <span>Code</span>
                <span>Offence</span>
                <span>Suspension</span>
                <span>Notes</span>
              </div>
              {SUSPENSION_MATRIX.map((row) => (
                <div
                  key={row.code}
                  className="grid gap-2 border-b border-[var(--border)] px-4 py-3.5 last:border-0 transition-colors hover:bg-surface-2 sm:grid-cols-[70px_1fr_130px_1fr] sm:items-center sm:gap-4"
                >
                  <Badge tone="neutral" className="w-fit">
                    {row.code}
                  </Badge>
                  <span className="text-sm font-semibold">{row.offence}</span>
                  <span className="text-sm font-bold text-rose-500">{row.ban}</span>
                  <span className="text-xs leading-relaxed text-muted">{row.escalation}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'fines' && (
            <div className="card overflow-hidden">
              <div className="hidden grid-cols-[1fr_110px_1fr] gap-4 border-b border-[var(--border)] bg-surface-2 px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-wider text-faint sm:grid">
                <span>Offence</span>
                <span className="text-right">Amount</span>
                <span>Notes</span>
              </div>
              {FINE_SCHEDULE.map((row) => (
                <div
                  key={row.offence}
                  className="grid gap-2 border-b border-[var(--border)] px-4 py-3.5 last:border-0 transition-colors hover:bg-surface-2 sm:grid-cols-[1fr_110px_1fr] sm:items-center sm:gap-4"
                >
                  <span className="text-sm font-semibold">{row.offence}</span>
                  <span className="tabular font-display text-lg font-extrabold text-accent sm:text-right">
                    ${row.amount}
                  </span>
                  <span className="text-xs leading-relaxed text-muted">{row.note}</span>
                </div>
              ))}
              <p className="border-t border-[var(--border)] bg-surface-2 px-4 py-3 text-xs text-faint">
                Fines are invoiced to the club, not the individual, and must be settled before the club&rsquo;s
                next registration window opens.
              </p>
            </div>
          )}

          {tab === 'faq' && (
            <div className="card divide-y divide-[var(--border)] overflow-hidden">
              {DISCIPLINE_FAQ.map((item, i) => (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2"
                  >
                    <span className="font-display text-[0.95rem] font-bold">{item.q}</span>
                    <ChevronDown
                      size={17}
                      className={cx(
                        'shrink-0 text-faint transition-transform duration-200',
                        openFaq === i && 'rotate-180',
                      )}
                    />
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{item.a}</p>
                  </motion.div>
                </div>
              ))}
            </div>
          )}
        </div>

        <SectionHeading
          className="mt-16"
          eyebrow="Hearings"
          title="How a hearing works"
          description="Most cases are resolved on paper. A hearing is convened when the offence carries a mandatory referral or the club disputes the referee's report."
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: 1, title: 'Report filed', copy: 'The referee submits their report within 48 hours of the match.' },
            { n: 2, title: 'Notice issued', copy: 'The club receives written notice of the charge and the proposed sanction.' },
            { n: 3, title: 'Response window', copy: 'The club has five days to accept the sanction or request a hearing.' },
            { n: 4, title: 'Decision', copy: 'The panel issues a written decision. Appeals are due within seven days.' },
          ].map((s) => (
            <div key={s.n} className="card p-5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)]/12 font-display text-sm font-extrabold text-accent">
                {s.n}
              </span>
              <p className="mt-3 font-display text-base font-bold">{s.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.copy}</p>
            </div>
          ))}
        </div>
      </Container>
    </>
  )
}
