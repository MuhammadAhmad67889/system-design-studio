# System Design Studio

**Live demo:** https://system-design-studio-five.vercel.app/

Interactive system design learning: guided lessons with animated
architecture simulations, practice quizzes, a visual Design Lab,
cheatsheets, case studies and a capacity calculator.

Learn visually. Experiment. Design better systems.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Other commands:

```bash
pnpm build      # production build
pnpm start      # serve the production build
pnpm lint       # ESLint
pnpm test       # Vitest unit tests
pnpm typecheck  # tsc --noEmit
```

Requires Node 20+ and pnpm.

## What is in this build

- **Learn** — 9 chapters, 40 lessons, all fully written with working
  simulations (guided steps, diagrams, formulas where they fit).
- **Practice** — quiz runner with hints, explanations and scoring.
- **Design Lab** — drag-and-drop architecture canvas (React Flow),
  save/load in the browser. (PNG/SVG export is not implemented —
  React Flow renders nodes as HTML, so an export would miss them.)
- **Cheatsheets** — searchable reference library.
- **Case Studies** — full URL shortener walkthrough.
- **Calculator** — capacity planning with formulas shown.
- **Search** — client-side search across lessons, cheatsheets and
  case studies.
- **Themes** — light (cream editorial) and dark. Progress is saved
  in the browser; no account needed.

## Local-first mode (Supabase later)

There is no backend in this build and no account system. Curriculum
content lives in typed data files under `data/`; progress, bookmarks
and Design Lab projects live in localStorage
(`sds-progress-v1`, `sds-lab-projects`, `sds-theme`).

To plug in Supabase later, replace the imports in `lib/content.ts`
with Supabase queries returning the same shapes, and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Required tables (see `SPEC.md` for the full ER diagram): profiles,
chapters, lessons, lesson_progress, bookmarks, practice_questions,
practice_attempts, cheatsheets, case_studies, design_projects,
user_preferences. Never commit real keys — use `.env.local`, which
is gitignored.

## Project layout

See `SPEC.md` for architecture, the ER diagram, component hierarchy
and the simulation-engine design. `DEVELOPMENT_STATUS.md` tracks
what is done, what is pending, test status and known bugs.

## Notes

- All lesson numbers, metrics and estimates are illustrative unless
  a source is stated. The calculator labels its outputs as estimates.
- Case studies are original educational designs, not the real
  architectures of commercial companies.
