import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Newspaper, Search } from 'lucide-react'
import { Chip, Container, EmptyState, SectionHeading } from '@/components/ui'
import { NEWS } from '@/data/content'
import { formatDate } from '@/lib/format'
import { useDebounced } from '@/lib/hooks'
import type { NewsItem } from '@/data/types'

const CATEGORIES = ['All', 'League', 'Cup', 'Registration', 'Discipline', 'Community'] as const

function FeatureCard({ item }: { item: NewsItem }) {
  return (
    <Link to={`/news/${item.id}`} className="card card-hover group block overflow-hidden">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[var(--accent)]/25 via-[var(--surface-3)] to-transparent sm:h-52">
        <div aria-hidden className="pitch-grid absolute inset-0" />
        <Newspaper
          size={130}
          className="absolute -bottom-6 right-4 text-[var(--accent)] opacity-[0.13] transition-transform duration-500 group-hover:scale-110"
        />
        <span className="absolute left-4 top-4 rounded-full bg-[var(--accent)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--accent-contrast)]">
          {item.category}
        </span>
      </div>
      <div className="p-5">
        <h3 className="text-xl leading-snug transition-colors group-hover:text-accent">{item.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{item.excerpt}</p>
        <p className="mt-4 flex items-center gap-3 text-xs text-faint">
          <span>{formatDate(item.date, 'long')}</span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {item.readMinutes} min
          </span>
        </p>
      </div>
    </Link>
  )
}

export default function News() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All')
  const [query, setQuery] = useState('')
  const debounced = useDebounced(query)

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    return NEWS.filter((n) => {
      if (category !== 'All' && n.category !== category) return false
      if (q && !`${n.title} ${n.excerpt}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [category, debounced])

  const [lead, ...rest] = filtered

  return (
    <Container className="py-10 sm:py-14">
      <SectionHeading
        eyebrow="Notice board"
        title="League news"
        description="Competition updates, cup draws, registration windows and everything else clubs need to know."
      />

      <div className="mt-8 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search announcements…"
            aria-label="Search news"
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-surface-2 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-faint focus:border-[var(--accent)]"
          />
        </div>
        <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<Newspaper size={36} />}
            title="Nothing here yet"
            description="Try another category or clear your search."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            {lead && <FeatureCard item={lead} />}
          </motion.div>

          <div className="space-y-3">
            {rest.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06 + i * 0.05 }}
              >
                <Link to={`/news/${n.id}`} className="card card-hover group flex items-start gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-accent">
                      {n.category}
                    </span>
                    <h3 className="mt-1 text-[0.95rem] font-bold leading-snug transition-colors group-hover:text-accent">
                      {n.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{n.excerpt}</p>
                    <p className="mt-2.5 flex items-center gap-3 text-[0.68rem] text-faint">
                      <span>{formatDate(n.date)}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {n.readMinutes} min
                      </span>
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="mt-1 shrink-0 text-faint transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}
