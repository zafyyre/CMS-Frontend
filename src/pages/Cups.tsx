import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { Badge, Chip, Container, EmptyState, SectionHeading } from '@/components/ui'
import { Crest } from '@/components/Crest'
import { CUPS } from '@/data/content'
import { teamById } from '@/data/engine'
import { venueById } from '@/data/league'
import { cx, formatDate } from '@/lib/format'
import type { CupTie } from '@/data/types'

function TieCard({ tie, index }: { tie: CupTie; index: number }) {
  const decided = tie.homeGoals !== null && tie.awayGoals !== null
  const homeWins = decided && tie.homeGoals! > tie.awayGoals!
  const awayWins = decided && tie.awayGoals! > tie.homeGoals!
  const venue = tie.venueId ? venueById.get(tie.venueId) : null

  const Side = ({ teamId, goals, winner }: { teamId: string | null; goals: number | null; winner: boolean }) => (
    <div className="flex items-center gap-2.5 px-3 py-2">
      {teamId ? (
        <>
          <Crest teamId={teamId} size={24} />
          <Link
            to={`/team/${teamId}`}
            className={cx(
              'min-w-0 flex-1 truncate text-[0.82rem] transition-colors hover:text-accent',
              winner ? 'font-bold' : 'font-medium text-muted',
            )}
          >
            {teamById.get(teamId)?.name}
          </Link>
        </>
      ) : (
        <>
          <span className="h-6 w-6 shrink-0 rounded-md border border-dashed border-[var(--border-strong)]" />
          <span className="min-w-0 flex-1 truncate text-[0.82rem] italic text-faint">To be decided</span>
        </>
      )}
      <span className={cx('tabular font-display text-sm font-extrabold', !winner && 'text-faint')}>
        {decided ? goals : '–'}
      </span>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
      className={cx(
        'card overflow-hidden transition-colors',
        !decided && tie.homeTeamId && 'border-[var(--accent)]/35',
      )}
    >
      <div className="divide-y divide-[var(--border)]">
        <Side teamId={tie.homeTeamId} goals={tie.homeGoals} winner={homeWins} />
        <Side teamId={tie.awayTeamId} goals={tie.awayGoals} winner={awayWins} />
      </div>
      <p className="flex items-center justify-between border-t border-[var(--border)] bg-surface-2 px-3 py-1.5 text-[0.65rem] text-faint">
        <span>{tie.kickoff ? formatDate(tie.kickoff, 'day') : 'TBD'}</span>
        <span className="truncate">{venue?.name ?? (decided ? 'Full time' : 'Venue TBD')}</span>
      </p>
    </motion.div>
  )
}

export default function Cups() {
  const { cupId } = useParams()
  const cup = CUPS.find((c) => c.id === cupId)

  if (!cup) {
    return (
      <Container className="py-20">
        <EmptyState
          icon={<Trophy size={36} />}
          title="Competition not found"
          description="Pick one of the league's cup competitions below."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {CUPS.map((c) => (
                <Link key={c.id} to={`/cups/${c.id}`}>
                  <Chip>{c.name}</Chip>
                </Link>
              ))}
            </div>
          }
        />
      </Container>
    )
  }

  const final = cup.ties.find((t) => t.round === 'Final')

  return (
    <>
      <div className="relative overflow-hidden border-b border-[var(--border)] bg-app-alt">
        <div aria-hidden className="pitch-grid absolute inset-0" />
        <div
          aria-hidden
          className="absolute left-1/2 top-[-14rem] h-[28rem] w-[38rem] -translate-x-1/2 rounded-full opacity-[0.14] blur-[110px]"
          style={{ background: 'radial-gradient(circle, var(--color-violet-500), transparent 68%)' }}
        />
        <Container className="relative py-12 sm:py-16">
          <div className="flex flex-wrap items-center gap-5">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-[var(--accent)] text-white">
              <Trophy size={30} />
            </span>
            <div className="min-w-0">
              <Badge tone="accent" className="mb-2">
                Since {cup.since}
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl">{cup.name}</h1>
              <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-muted">{cup.subtitle}</p>
            </div>
          </div>

          <div className="no-scrollbar fade-x -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {CUPS.map((c) => (
              <Link key={c.id} to={`/cups/${c.id}`}>
                <Chip active={c.id === cup.id}>{c.name}</Chip>
              </Link>
            ))}
          </div>
        </Container>
      </div>

      <Container className="py-10 sm:py-14">
        {/* Final spotlight */}
        {final && (
          <div className="card relative mb-10 overflow-hidden p-6 text-center sm:p-10">
            <div aria-hidden className="pitch-grid absolute inset-0" />
            <div className="relative">
              <Badge tone="accent" className="mb-3">
                The final
              </Badge>
              <h2 className="text-2xl sm:text-3xl">
                {final.kickoff ? formatDate(final.kickoff, 'long') : 'Date to be confirmed'}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {final.venueId ? venueById.get(final.venueId)?.name : 'Venue to be confirmed'} · the two semi-final
                winners meet for the trophy.
              </p>
              <div className="mt-6 flex items-center justify-center gap-6">
                {[final.homeTeamId, final.awayTeamId].map((id, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    {id ? (
                      <>
                        <Crest teamId={id} size={52} glow />
                        <span className="text-sm font-bold">{teamById.get(id)?.name}</span>
                      </>
                    ) : (
                      <>
                        <span className="grid h-[52px] w-[52px] place-items-center rounded-xl border-2 border-dashed border-[var(--border-strong)] text-faint">
                          ?
                        </span>
                        <span className="text-sm italic text-faint">Semi-final winner</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <SectionHeading
          eyebrow="Bracket"
          title="Road to the final"
          description="Winners carry forward automatically as each round is completed."
        />

        {/* Horizontally scrolling bracket on desktop, stacked on mobile */}
        <div className="no-scrollbar -mx-4 mt-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-[720px] gap-4 lg:min-w-0">
            {cup.rounds.map((round) => {
              const ties = cup.ties.filter((t) => t.round === round)
              return (
                <div key={round} className="flex min-w-[210px] flex-1 flex-col">
                  <p className="mb-3 text-center text-[0.68rem] font-bold uppercase tracking-[0.14em] text-faint">
                    {round}
                  </p>
                  <div className="flex flex-1 flex-col justify-around gap-3">
                    {ties.map((t, i) => (
                      <TieCard key={t.id} tie={t} index={i} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card mt-10 p-6">
          <h3 className="text-lg">How the competition works</h3>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              Every tie is a single match. Level after ninety minutes goes straight to penalties — there is no
              extra time before the semi-finals.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              Hosting rights go to the lower-ranked side in each pairing, which is how the cup keeps producing
              upsets.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              Cautions accumulate separately from league play. A straight red still carries across every
              competition.
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              The semi-finals and final are played at a neutral venue with appointed officials.
            </li>
          </ul>
        </div>
      </Container>
    </>
  )
}
