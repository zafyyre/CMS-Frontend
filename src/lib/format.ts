import { NOW } from '@/data/league'

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

const DAY = 86400000

export function formatDate(input: string | Date, style: 'short' | 'long' | 'weekday' | 'day' = 'short') {
  const d = typeof input === 'string' ? new Date(input) : input
  switch (style) {
    case 'long':
      return d.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    case 'weekday':
      return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
    case 'day':
      return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
    default:
      return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
  }
}

export function formatTime(input: string | Date) {
  const d = typeof input === 'string' ? new Date(input) : input
  return d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })
}

/** Relative phrasing anchored to the dataset's "now", e.g. "in 3 days". */
export function relativeToNow(input: string | Date) {
  const d = typeof input === 'string' ? new Date(input) : input
  const diff = d.getTime() - NOW.getTime()
  const days = Math.round(diff / DAY)

  if (Math.abs(diff) < 3600000) {
    const mins = Math.round(diff / 60000)
    if (Math.abs(mins) < 2) return 'now'
    return mins > 0 ? `in ${mins} min` : `${Math.abs(mins)} min ago`
  }
  if (Math.abs(days) < 1) {
    const hours = Math.round(diff / 3600000)
    return hours > 0 ? `in ${hours}h` : `${Math.abs(hours)}h ago`
  }
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  if (Math.abs(days) < 7) return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`
  const weeks = Math.round(days / 7)
  if (Math.abs(weeks) < 5) return weeks > 0 ? `in ${weeks} wk` : `${Math.abs(weeks)} wk ago`
  return formatDate(d)
}

export function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

/** Readable text colour for an arbitrary background. */
export function contrastOn(hex: string) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#0b1220' : '#ffffff'
}

export function pluralize(n: number, one: string, many = one + 's') {
  return `${n} ${n === 1 ? one : many}`
}
