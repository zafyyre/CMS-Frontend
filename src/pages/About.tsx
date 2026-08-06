import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FileText, Mail, MapPin, Phone, Trophy, Users } from 'lucide-react'
import { Badge, Button, Chip, Container, SectionHeading } from '@/components/ui'
import { BOARD, DOCUMENTS, HONOURS } from '@/data/content'
import { MATCHES, TEAMS } from '@/data/engine'
import { CLUBS, VENUES } from '@/data/league'
import { cx, initials } from '@/lib/format'
import { useCountUp, useInView } from '@/lib/hooks'

const DOC_CATEGORIES = ['All', 'Governance', 'Registration', 'Compliance', 'Match day'] as const

function Milestone({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const display = useCountUp(value, 1200, inView)
  return (
    <div ref={ref} className="card p-5 text-center">
      <p className="tabular font-display text-3xl font-extrabold text-accent sm:text-4xl">
        {Math.round(display).toLocaleString('en-CA')}
        {suffix}
      </p>
      <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-wider text-faint">{label}</p>
    </div>
  )
}

export default function About() {
  const [docCategory, setDocCategory] = useState<(typeof DOC_CATEGORIES)[number]>('All')
  const docs = docCategory === 'All' ? DOCUMENTS : DOCUMENTS.filter((d) => d.category === docCategory)

  return (
    <>
      <div className="relative overflow-hidden border-b border-[var(--border)] bg-app-alt">
        <div aria-hidden className="pitch-grid absolute inset-0" />
        <div
          aria-hidden
          className="absolute left-1/2 top-[-16rem] h-[32rem] w-[42rem] -translate-x-1/2 rounded-full opacity-[0.13] blur-[110px]"
          style={{ background: 'radial-gradient(circle, var(--accent), transparent 68%)' }}
        />
        <Container className="relative py-14 sm:py-20">
          <Badge tone="accent" className="mb-4">
            Since 1973
          </Badge>
          <h1 className="max-w-3xl text-3xl leading-tight sm:text-4xl lg:text-[3.4rem]">
            Fifty years of Saturday afternoons
          </h1>
          <p className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
            The Vancouver Metro Soccer League exists to develop, promote and safeguard adult soccer across
            British Columbia&rsquo;s Lower Mainland — from the Premier Division down to Over-55s, and every
            club, field and volunteer in between.
          </p>
        </Container>
      </div>

      <Container className="py-12 sm:py-16">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Milestone value={CLUBS.length} label="Member clubs" />
          <Milestone value={TEAMS.length} label="Registered teams" />
          <Milestone value={VENUES.length} label="Fields in use" />
          <Milestone value={MATCHES.length} label="Fixtures a season" />
        </div>

        {/* Mission */}
        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="What we do" title="Running the competition" />
            <div className="mt-5 space-y-4 text-[0.98rem] leading-relaxed text-muted">
              <p>
                The league schedules and administers competition across ten divisions, appoints and develops
                match officials, and maintains the discipline process that keeps the game fair.
              </p>
              <p>
                Everything is run by volunteers drawn from the playing membership. The board is elected annually
                at the general meeting, and every club in good standing holds a vote.
              </p>
              <p>
                We are a member of the British Columbia Soccer Association and, through it, Canada Soccer. That
                affiliation is what makes fixtures sanctioned, players insured, and the pathway to provincial
                competition open to clubs that earn it.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Trophy, title: 'Competition', copy: 'Ten divisions, four cup competitions and provincial qualification.' },
              { icon: Users, title: 'Officials', copy: 'Recruitment, certification and mentoring for match officials.' },
              { icon: FileText, title: 'Governance', copy: 'Rules, discipline, appeals and club standing.' },
              { icon: MapPin, title: 'Fields', copy: 'Allocation, permits and match-day closure notices.' },
            ].map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="card p-5"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)]/12 text-accent">
                  <c.icon size={18} />
                </span>
                <p className="mt-3 font-display text-base font-bold">{c.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.copy}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Board */}
        <div id="board" className="mt-20 scroll-mt-24">
          <SectionHeading
            eyebrow="Governance"
            title="Board of directors"
            description="Elected annually by the club membership. Every director is a volunteer."
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BOARD.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.35) }}
                className="card card-hover p-5"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-sky-500 font-display text-base font-extrabold text-[var(--accent-contrast)]">
                  {initials(member.name)}
                </span>
                <p className="mt-3.5 font-display text-base font-bold">{member.name}</p>
                <p className="text-sm font-semibold text-accent">{member.role}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{member.focus}</p>
                <p className="mt-3 text-[0.68rem] text-faint">Serving since {member.since}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div id="documents" className="mt-20 scroll-mt-24">
          <SectionHeading
            eyebrow="Reference"
            title="Documents"
            description="Rules, forms and policies. Everything here is the current version — check the date before relying on a saved copy."
          />

          <div className="no-scrollbar fade-x -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {DOC_CATEGORIES.map((c) => (
              <Chip key={c} active={docCategory === c} onClick={() => setDocCategory(c)}>
                {c}
              </Chip>
            ))}
          </div>

          <div className="card mt-4 divide-y divide-[var(--border)] overflow-hidden">
            {docs.map((doc) => (
              <button
                key={doc.name}
                type="button"
                className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
              >
                <span
                  className={cx(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[0.6rem] font-bold',
                    doc.kind === 'PDF' ? 'bg-rose-500/12 text-rose-500' : 'bg-emerald-500/12 text-emerald-500',
                  )}
                >
                  {doc.kind}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{doc.name}</span>
                  <span className="block text-[0.7rem] text-faint">
                    {doc.category} · {doc.size} · updated {doc.updated}
                  </span>
                </span>
                <Download size={16} className="shrink-0 text-faint" />
              </button>
            ))}
          </div>
        </div>

        {/* Honours */}
        <div id="honours" className="mt-20 scroll-mt-24">
          <SectionHeading eyebrow="History" title="Roll of honour" description="Champions season by season." />
          <div className="card mt-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-surface-2 text-left">
                    {['Season', 'Premier', 'Imperial Cup', 'Division 1', 'Golden boot'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[0.65rem] font-bold uppercase tracking-wider text-faint"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HONOURS.map((h) => (
                    <tr
                      key={h.season}
                      className="border-b border-[var(--border)] transition-colors last:border-0 hover:bg-surface-2"
                    >
                      <td className="px-4 py-3 font-display font-bold">{h.season}</td>
                      <td className="px-4 py-3 font-semibold">{h.premier}</td>
                      <td className="px-4 py-3 text-muted">{h.imperial}</td>
                      <td className="px-4 py-3 text-muted">{h.div1}</td>
                      <td className="px-4 py-3 text-muted">{h.goldenBoot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div id="contact" className="mt-20 scroll-mt-24">
          <SectionHeading eyebrow="Get in touch" title="Contact the league" />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Mail, label: 'General enquiries', value: 'info@vmslsoccer.com', href: 'mailto:info@vmslsoccer.com' },
              { icon: Mail, label: 'Registration', value: 'registrar@vmslsoccer.com', href: 'mailto:registrar@vmslsoccer.com' },
              { icon: Phone, label: 'Office', value: '(604) 555-0142', href: 'tel:+16045550142' },
            ].map((c) => (
              <a key={c.label} href={c.href} className="card card-hover flex items-center gap-4 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)]/12 text-accent">
                  <c.icon size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.68rem] font-bold uppercase tracking-wider text-faint">
                    {c.label}
                  </span>
                  <span className="block truncate text-sm font-semibold">{c.value}</span>
                </span>
              </a>
            ))}
          </div>

          <div className="card mt-3 flex flex-wrap items-center justify-between gap-4 p-5">
            <p className="flex items-start gap-2.5 text-sm text-muted">
              <MapPin size={16} className="mt-0.5 shrink-0 text-accent" />
              6501 Sprott Street, Burnaby, British Columbia&nbsp;V5B 3B8
            </p>
            <Button
              href="https://www.google.com/maps/search/?api=1&query=6501%20Sprott%20Street%2C%20Burnaby%2C%20BC"
              variant="outline"
              size="sm"
            >
              Open in maps
            </Button>
          </div>
        </div>
      </Container>
    </>
  )
}
