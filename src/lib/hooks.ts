import { useCallback, useEffect, useRef, useState } from 'react'

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage unavailable — fall back to in-memory only */
    }
  }, [key, value])
  return [value, setValue] as const
}

/**
 * Fires once when the element first scrolls into view.
 *
 * IntersectionObserver is the fast path, but it only delivers callbacks while
 * the page is actually being painted — a backgrounded or non-compositing tab
 * can leave it silent indefinitely. Since a stalled reveal here means counters
 * stay frozen at zero, a geometry check backs it up: layout is computed even
 * when nothing is painted, so the rect comparison always resolves.
 */
export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return

    let done = false
    const reveal = () => {
      if (done) return
      done = true
      cleanup()
      setInView(true)
    }

    const isVisible = () => {
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      return rect.top < vh * 0.92 && rect.bottom > 0
    }

    const check = () => {
      if (isVisible()) reveal()
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) reveal()
    }, options ?? { rootMargin: '0px 0px -12% 0px', threshold: 0.1 })
    observer.observe(el)

    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check, { passive: true })
    // Timers rather than rAF: rAF is suspended whenever the tab isn't painting.
    const timers = [setTimeout(check, 0), setTimeout(check, 350)]

    function cleanup() {
      observer.disconnect()
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      timers.forEach(clearTimeout)
    }

    return cleanup
  }, [inView, options])

  return [ref, inView] as const
}

/**
 * Animates a number up to `value` once it is visible.
 *
 * `display` stays null until the animation actually starts, and null renders
 * as the real figure. The count-up is therefore a pure enhancement: if the
 * reveal never fires the element still shows the correct number rather than a
 * stranded zero. There's no visible jump, because the pre-animation state is
 * only ever on screen when the reveal is broken.
 */
export function useCountUp(value: number, duration = 1100, start = true) {
  const [display, setDisplay] = useState<number | null>(null)
  const frame = useRef(0)

  useEffect(() => {
    if (!start) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    setDisplay(0)
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(value * eased)
      if (p < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)

    // rAF is suspended while the tab isn't painting, which would otherwise
    // strand the counter on its starting value. Land it regardless.
    const settle = setTimeout(() => setDisplay(value), duration + 150)

    return () => {
      cancelAnimationFrame(frame.current)
      clearTimeout(settle)
    }
  }, [value, duration, start])

  return display ?? value
}

export function useScrollY(threshold = 8) {
  const [past, setPast] = useState(false)
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return past
}

/** Locks body scroll while `locked` is true (mobile menu, command palette). */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const previous = document.body.style.overflow
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
    return () => {
      document.body.style.overflow = previous
      document.body.style.paddingRight = ''
    }
  }, [locked])
}

export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggle = useCallback(() => {
    setDark((d) => {
      const next = !d
      document.documentElement.classList.toggle('dark', next)
      document.documentElement.style.colorScheme = next ? 'dark' : 'light'
      try {
        localStorage.setItem('vmsl-theme', next ? 'dark' : 'light')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  return { dark, toggle }
}

/** Debounced value, used for search inputs. */
export function useDebounced<T>(value: T, delay = 180) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
