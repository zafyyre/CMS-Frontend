import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { NAV } from './nav'
import { Button } from '../ui'
import { cx } from '@/lib/format'
import { useScrollLock, useScrollY, useTheme } from '@/lib/hooks'

function Wordmark() {
  return (
    <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="VMSL home">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M12 2.6 20 6v9c0 4.6-3.6 7.8-8 9.4C7.6 22.8 4 19.6 4 15V6z" strokeLinejoin="round" />
          <circle cx="12" cy="12.6" r="3.4" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-extrabold tracking-tight">VMSL</span>
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-faint">
          Metro Soccer
        </span>
      </span>
    </Link>
  )
}

function DesktopNav() {
  const [open, setOpen] = useState<string | null>(null)
  const closeTimer = useRef<number>(0)

  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(null), 140)
  }
  const cancelClose = () => window.clearTimeout(closeTimer.current)

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  return (
    <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
      {NAV.map((item) =>
        item.children ? (
          <div
            key={item.label}
            className="relative"
            onMouseEnter={() => {
              cancelClose()
              setOpen(item.label)
            }}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              aria-expanded={open === item.label}
              aria-haspopup="true"
              onClick={() => setOpen((o) => (o === item.label ? null : item.label))}
              className={cx(
                'flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-semibold transition-colors',
                open === item.label ? 'bg-surface-2 text-base-c' : 'text-muted hover:text-base-c',
              )}
            >
              {item.label}
              <ChevronDown
                size={14}
                className={cx('transition-transform duration-200', open === item.label && 'rotate-180')}
              />
            </button>

            <AnimatePresence>
              {open === item.label && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-0 top-full z-50 mt-1.5 w-72 overflow-hidden rounded-2xl border border-[var(--border)] bg-surface p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]"
                >
                  {item.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      onClick={() => setOpen(null)}
                      className={({ isActive }) =>
                        cx(
                          'block rounded-xl px-3 py-2.5 transition-colors',
                          isActive ? 'bg-[var(--accent)]/10 text-accent' : 'hover:bg-surface-2',
                        )
                      }
                    >
                      <span className="block text-sm font-semibold">{child.label}</span>
                      {child.description && (
                        <span className="mt-0.5 block text-xs text-faint">{child.description}</span>
                      )}
                    </NavLink>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <NavLink
            key={item.to}
            to={item.to!}
            className={({ isActive }) =>
              cx(
                'relative flex h-9 items-center rounded-lg px-3 text-sm font-semibold transition-colors',
                isActive ? 'text-base-c' : 'text-muted hover:text-base-c',
              )
            }
          >
            {({ isActive }) => (
              <>
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-2.5 -bottom-px h-[2px] rounded-full bg-[var(--accent)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ),
      )}
    </nav>
  )
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  useScrollLock(open)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed right-0 top-0 z-50 flex h-[100dvh] w-[86vw] max-w-sm flex-col border-l border-[var(--border)] bg-app lg:hidden"
            role="dialog"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <Wordmark />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-base-c"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-3">
              {NAV.map((item) =>
                item.children ? (
                  <div key={item.label} className="mb-0.5">
                    <button
                      type="button"
                      onClick={() => setExpanded((e) => (e === item.label ? null : item.label))}
                      aria-expanded={expanded === item.label}
                      className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left font-display text-base font-bold transition-colors hover:bg-surface-2"
                    >
                      {item.label}
                      <ChevronDown
                        size={17}
                        className={cx(
                          'text-faint transition-transform duration-200',
                          expanded === item.label && 'rotate-180',
                        )}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {expanded === item.label && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="ml-4 border-l border-[var(--border)] pl-2">
                            {item.children.map((child) => (
                              <NavLink
                                key={child.to}
                                to={child.to}
                                onClick={onClose}
                                className={({ isActive }) =>
                                  cx(
                                    'block rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                                    isActive ? 'text-accent' : 'text-muted hover:text-base-c',
                                  )
                                }
                              >
                                {child.label}
                              </NavLink>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to!}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cx(
                        'mb-0.5 block rounded-xl px-4 py-3.5 font-display text-base font-bold transition-colors',
                        isActive ? 'bg-[var(--accent)]/10 text-accent' : 'hover:bg-surface-2',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ),
              )}
            </div>

            <div className="border-t border-[var(--border)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button to="/register" size="lg" className="w-full" onClick={onClose}>
                Register for the season
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function Header({ onOpenSearch }: { onOpenSearch: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const scrolled = useScrollY(10)
  const { dark, toggle } = useTheme()
  const location = useLocation()

  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:font-semibold focus:text-[var(--accent-contrast)]"
      >
        Skip to content
      </a>

      <header
        className={cx(
          'sticky top-0 z-40 transition-shadow duration-300',
          scrolled ? 'glass border-b border-[var(--border)] shadow-sm' : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Wordmark />

          <div className="mx-auto">
            <DesktopNav />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-surface-2 pl-3 pr-2 text-sm text-faint transition-colors hover:border-[var(--border-strong)] hover:text-muted sm:flex"
              aria-label="Search teams, fixtures and pages"
            >
              <Search size={15} />
              <span className="hidden md:inline">Search</span>
              <kbd className="ml-1 hidden rounded border border-[var(--border-strong)] px-1.5 py-0.5 font-sans text-[0.65rem] font-semibold md:inline">
                /
              </kbd>
            </button>

            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-base-c sm:hidden"
            >
              <Search size={19} />
            </button>

            <button
              type="button"
              onClick={toggle}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-base-c"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Button to="/register" size="sm" className="ml-1 hidden xl:inline-flex">
              Register
            </Button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-base-c lg:hidden"
            >
              <Menu size={21} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
