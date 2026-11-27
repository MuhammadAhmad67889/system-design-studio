# System Design Studio — SPEC

Interactive system design learning web app. Next.js 16 (App Router) +
React 19 + TypeScript strict + Tailwind CSS v4, Zustand, React Flow
(`@xyflow/react`), Lucide icons. Local-first: curriculum content is typed
data files in `data/`; guest progress lives in localStorage. No backend
yet — Supabase integration is a later phase (see DEVELOPMENT_STATUS.md).

## Architecture

```
app/                    Routes (App Router)
  page.tsx              Homepage: hero, continue learning, progress, path
  learn/                Learn dashboard + /learn/[lessonId] lesson pages
  practice/             Practice landing + quiz runner
  design-lab/           React Flow architecture canvas
  cheatsheets/          Cheatsheet library + /cheatsheets/[id]
  case-studies/         Case study library + /case-studies/[id]
  calculator/           Capacity calculator
  search/               Global search results
components/
  layout/               TopNav, MobileDrawer, Footer, ThemeToggle
  ui/                   Button, Card, Badge, MetricCard, ProgressBar, SearchBox
  simulation/           SimulationPlayer, DiagramCanvas, nodes, particles, controls
  lab/                  Design Lab palette, properties panel, canvas wrapper
lib/
  types.ts              All content types (the contract every page reads)
  content.ts            Content access — the only place data files are imported
  progress.ts           Pure math: progress %, Little's Law, capacity calc
  search.ts             (in content.ts) client-side search index
data/
  curriculum.ts         9 chapters, 40 lessons (catalog: titles, intros, objectives)
  lessons-full.ts       4 fully-written lessons (1, 2, 5, 11)
  lessons-part-a..g.ts  the other 36 fully-written lessons, by chapter group
  lesson-helpers.ts     shared helpers for writing lessons (metric/node/edge/step)
  cheatsheets.ts        Cheatsheet library
  case-studies.ts       Case studies (URL shortener full)
  quiz.ts               Practice quiz bank
store/
  progress-store.ts     Zustand + localStorage: completed, bookmarks, quiz scores
  simulation-store.ts   Zustand: step, playing, speed (per simulation)
```

## ER diagram (text) — data model for the future Supabase phase

```
profiles        (id PK, display_name, created_at)
chapters        (id PK, number, title, tagline, color)
lessons         (id PK, chapter_id FK, number, title, duration_min,
                 difficulty, intro, objectives JSONB, steps JSONB,
                 summary, coming_soon)
lesson_progress (profile_id FK, lesson_id FK, completed_at, PK(profile, lesson))
bookmarks       (profile_id FK, lesson_id FK, PK(profile, lesson))
practice_questions (id PK, topic, difficulty, question, options JSONB,
                 answer_index, explanation, hint, lesson_id FK)
practice_attempts  (id PK, profile_id FK, question_id FK, correct, created_at)
cheatsheets     (id PK, title, category, summary, difficulty, read_min,
                 sections JSONB)
case_studies    (id PK, title, difficulty, est_min, problem,
                 requirements JSONB, estimates JSONB, apis JSONB,
                 data_model JSONB, architecture JSONB, tradeoffs JSONB,
                 bottlenecks JSONB)
design_projects (id PK, profile_id FK, name, document JSONB, updated_at)
user_preferences(profile_id PK FK, theme, updated_at)
```

Local-first mapping: `profiles` → guest (no row); `lesson_progress` →
`progress-store` localStorage key `sds-progress-v1`; `design_projects` →
localStorage key `sds-lab-projects`; `user_preferences.theme` →
localStorage key `sds-theme`. RLS and auth arrive with the Supabase phase.

## Component hierarchy (key screens)

```
RootLayout (fonts, ThemeProvider)
└─ TopNav (Learn / Practice / Design Lab / Cheatsheets / Search / theme)
└─ <page>
   ├─ HomePage: Hero, ContinueLearningCard, ProgressCard, ChapterGrid
   ├─ LearnDashboard: ChapterAccordion > LessonRow
   ├─ LessonPage: CourseSidebar, LessonHeader, MetricStrip,
   │   SimulationPlayer > DiagramCanvas + PlaybackControls,
   │   StepNavigator, ExplanationBlocks, PrevNextNav
   ├─ PracticePage: QuizRunner (question, options, hint, feedback, results)
   ├─ DesignLabPage: Palette, FlowCanvas, PropertiesPanel, SimBar
   ├─ CheatsheetsPage / CheatsheetPage
   ├─ CaseStudiesPage / CaseStudyPage
   └─ CalculatorPage
```

## Simulation engine design

- Data-driven: every step is a `DiagramConfig` (nodes with x/y in a
  720×360 viewBox, edges, active nodes/edges, caption). No step is
  hardcoded in a component.
- `SimulationPlayer` owns playback: play/pause/restart/prev/next,
  step dots, fullscreen (requestFullscreen on the panel), auto-advance
  timer driven by `simulation-store` speed.
- `DiagramCanvas` renders SVG: nodes as rounded rects with kind color
  + icon + label, edges as lines with arrowheads, active edges carry
  `RequestParticle` dots animated with CSS `offset-path` along the edge
  path. Status dot per node (healthy/busy/degraded/failed).
- Every diagram ships a `caption` — a plain-text alternative rendered
  in a `<details>`/visually-hidden block and as visible text under the
  canvas, so no information exists only in animation.
- Reduced motion: `prefers-reduced-motion` disables particle/pulse
  animation in CSS; the player also offers a "Reduce motion" toggle
  that stops auto-play.
- Deterministic: steps are fixed data; the same step always shows the
  same metrics. All metric values are labelled illustrative.

## Design tokens

Cream `#F3EBDD`, paper `#FCF9F1`, leaf `#D0E5B6`, ink `#242323`,
amber `#EBAF49`, blue `#C8DCEF`, purple `#DCCEF2`, muted `#756F65`,
line `#D9D0C1`, healthy `#8DBB83`. Type: Space Mono (headings/labels),
IBM Plex Mono (technical data), Inter (body). Rounded cards (12px),
strong outlined buttons, 3px offset shadows, pale-green active states.
Light + dark themes via `.dark` class on `<html>`.

## Decisions recorded

- No Supabase credentials exist, so Phase 9 is deferred; the data layer
  is structured so Supabase can be plugged in later (see
  `lib/content.ts` header). Documented in README.
- No shadcn/Radix/RHF/Zod: the UI is simple enough for hand-rolled
  components; fewer deps, smaller bundle.
- No framer-motion: simulation motion is CSS + SVG, which is enough
  for deterministic step animations and respects reduced-motion.
- React Flow v13 (`@xyflow/react`) for the Design Lab canvas only.
