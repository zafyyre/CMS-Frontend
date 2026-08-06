# KMSL — Kelowna Metro Soccer League (Demo)

A modern, mobile-first soccer league frontend: fixtures, live scores, standings, statistics, cup brackets, fields, registration and discipline — in one responsive, accessible app.

## ⚠️ This is a demo. Nothing here is real.

- **Not affiliated with anyone.** This project is not affiliated with, endorsed by, sponsored by, or connected to any real soccer league, club, association, business or person.
- **The league does not exist.** The "Kelowna Metro Soccer League" was invented for this project.
- **All data is fake.** Every club, team, player, manager, fixture, result, statistic, standing, venue, address, email and phone number is randomly generated or made-up sample data. Contact details use the reserved `example.com` domain and the reserved `555` phone range, so none of them reach anything real.
- **Built as a demo with Claude, by me, for testing purposes.** It exists to try out frontend ideas — layout, motion, theming and a simulated data layer — and for no other reason.

Any resemblance to a real organization, person or place is coincidental.

## Getting started

```bash
npm install
```

```bash
npm run dev
```

The dev server runs at `http://localhost:5173`.

### Other scripts

```bash
npm run build
```

```bash
npm run preview
```

```bash
npm run typecheck
```

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 18 + TypeScript 5.7 (strict) |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens) |
| Routing | React Router 6 |
| Motion | Framer Motion 11 |
| Icons | lucide-react |

Twelve packages total. There is deliberately **no** state-management library, UI component kit, charting library or mapping library — see [Design decisions](#design-decisions).

## How the data works

Rather than shipping static mock screens, the app runs a **deterministic simulation** in [`src/data/engine.ts`](src/data/engine.ts):

1. Sample clubs are dealt into ten divisions, each team carrying a latent quality rating.
2. A circle-method double round-robin generates the full fixture list across the season.
3. Results are Poisson-sampled from the two teams' ratings, producing goals and cards.
4. Standings, form guides, scorer charts, shutouts and suspensions are **computed from those results**.

A seeded PRNG (`mulberry32`) means the same dataset renders on every load, so every figure reconciles — a team's league position always ties out against its own fixture list. The season is anchored to a mid-January matchday, so there is always a played season behind and fixtures ahead.

To wire up a real backend, replace `engine.ts`. The component layer reads through typed accessors (`getStandings`, `getScorers`, `matchesForTeam`, …) and should not need to change.

## Project structure

```
src/
  data/        Types, league reference data, simulation engine, editorial content
  components/  Crest, MatchCard, StandingsTable, UI primitives, layout + nav
  pages/       15 route components (lazy-loaded)
  lib/         Formatting helpers and hooks
```

## Design decisions

- **Crests are generated SVG** built from each club's colour pair — no image assets, crisp at any size, zero extra requests.
- **The venue map is hand-authored SVG**, projecting coordinates onto a stylised canvas. No map tiles, no API key, works offline, themes correctly in dark mode. There are no "get directions" links, since the venues are invented and a map search would only mislead.
- **Charts are hand-rolled** SVG and CSS (form trend line, points-share strip, stat bars), avoiding ~100 kB gzip of charting library.
- **No state library** — data is a synchronous in-memory module, so `useState`/`useMemo` suffice until a real API exists.
- **Count-ups degrade safely**: the pre-animation state renders the true figure, so a stalled reveal can never strand a stat at zero.

## Accessibility

Keyboard-navigable throughout, with a command palette (<kbd>/</kbd> or <kbd>⌘K</kbd>), skip-to-content link, ARIA on tabs and dialogs, visible focus rings, and full `prefers-reduced-motion` support. Dark and light themes are applied before first paint to avoid a flash.

## Performance

Every route is code-split. Main chunk ~347 kB (113 kB gzip); the largest page chunk is ~16 kB (4.7 kB gzip). Only external requests are the Inter and Outfit webfonts.
