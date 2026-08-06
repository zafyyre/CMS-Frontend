import { Suspense, lazy, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { Ticker } from './components/layout/Ticker'
import { CommandPalette } from './components/layout/CommandPalette'
import { Container, Skeleton } from './components/ui'

const Home = lazy(() => import('./pages/Home'))
const Fixtures = lazy(() => import('./pages/Fixtures'))
const Standings = lazy(() => import('./pages/Standings'))
const Teams = lazy(() => import('./pages/Teams'))
const TeamDetail = lazy(() => import('./pages/TeamDetail'))
const ClubDetail = lazy(() => import('./pages/ClubDetail'))
const MatchDetail = lazy(() => import('./pages/MatchDetail'))
const Stats = lazy(() => import('./pages/Stats'))
const Cups = lazy(() => import('./pages/Cups'))
const Fields = lazy(() => import('./pages/Fields'))
const Register = lazy(() => import('./pages/Register'))
const Discipline = lazy(() => import('./pages/Discipline'))
const News = lazy(() => import('./pages/News'))
const NewsDetail = lazy(() => import('./pages/NewsDetail'))
const About = lazy(() => import('./pages/About'))
const NotFound = lazy(() => import('./pages/NotFound'))

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])
  return null
}

function PageFallback() {
  return (
    <Container className="py-14">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-full max-w-md" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </Container>
  )
}

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()

  // "/" and ⌘K / Ctrl-K both open search, as long as focus isn't in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ScrollToTop />
      <Ticker />
      <Header onOpenSearch={() => setSearchOpen(true)} />

      <main id="main" className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/fixtures" element={<Fixtures />} />
                <Route path="/standings" element={<Standings />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/team/:teamId" element={<TeamDetail />} />
                <Route path="/club/:clubId" element={<ClubDetail />} />
                <Route path="/match/:matchId" element={<MatchDetail />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/cups/:cupId" element={<Cups />} />
                <Route path="/fields" element={<Fields />} />
                <Route path="/register" element={<Register />} />
                <Route path="/discipline" element={<Discipline />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:newsId" element={<NewsDetail />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>

      <Footer />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
