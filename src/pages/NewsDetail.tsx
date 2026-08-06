import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, Newspaper } from 'lucide-react'
import { Badge, Button, Container, EmptyState } from '@/components/ui'
import { NEWS } from '@/data/content'
import { formatDate } from '@/lib/format'

export default function NewsDetail() {
  const { newsId } = useParams()
  const index = NEWS.findIndex((n) => n.id === newsId)
  const item = index >= 0 ? NEWS[index] : undefined

  if (!item) {
    return (
      <Container className="py-20">
        <EmptyState
          icon={<Newspaper size={36} />}
          title="Article not found"
          description="This announcement may have been archived."
          action={<Button to="/news">Back to news</Button>}
        />
      </Container>
    )
  }

  const related = NEWS.filter((n) => n.id !== item.id && n.category === item.category).slice(0, 3)
  const next = NEWS[index + 1]

  return (
    <>
      <div className="relative overflow-hidden border-b border-[var(--border)] bg-app-alt">
        <div aria-hidden className="pitch-grid absolute inset-0" />
        <Container className="relative py-10 sm:py-14">
          <Link
            to="/news"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-accent"
          >
            <ArrowLeft size={15} />
            All news
          </Link>
          <Badge tone="accent" className="mb-4">
            {item.category}
          </Badge>
          <h1 className="max-w-3xl text-3xl leading-tight sm:text-4xl lg:text-5xl">{item.title}</h1>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-faint">
            <span>{formatDate(item.date, 'long')}</span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              {item.readMinutes} min read
            </span>
          </p>
        </Container>
      </div>

      <Container className="py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
          <article className="max-w-2xl">
            <p className="text-lg font-semibold leading-relaxed text-base-c">{item.excerpt}</p>
            <div className="mt-6 space-y-5">
              {item.body.map((para, i) => (
                <p key={i} className="text-[1.02rem] leading-[1.75] text-muted">
                  {para}
                </p>
              ))}
            </div>

            {next && (
              <Link
                to={`/news/${next.id}`}
                className="card card-hover group mt-12 flex items-center gap-4 p-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-faint">Next article</p>
                  <p className="mt-1 truncate font-display text-base font-bold transition-colors group-hover:text-accent">
                    {next.title}
                  </p>
                </div>
                <ArrowRight
                  size={18}
                  className="shrink-0 text-faint transition-all group-hover:translate-x-1 group-hover:text-accent"
                />
              </Link>
            )}
          </article>

          <aside className="space-y-4">
            {related.length > 0 && (
              <div className="card p-5">
                <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-wider text-faint">
                  More in {item.category}
                </p>
                <div className="space-y-3.5">
                  {related.map((r) => (
                    <Link key={r.id} to={`/news/${r.id}`} className="group block">
                      <p className="text-sm font-semibold leading-snug transition-colors group-hover:text-accent">
                        {r.title}
                      </p>
                      <p className="mt-1 text-[0.68rem] text-faint">{formatDate(r.date)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="card border-dashed p-5">
              <p className="font-display text-sm font-bold">Club notices</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Team officials receive every announcement by email. Check your contact details are current in the
                club portal.
              </p>
              <Button to="/register" variant="outline" size="sm" className="mt-3 w-full">
                Open registration
              </Button>
            </div>
          </aside>
        </div>
      </Container>
    </>
  )
}
