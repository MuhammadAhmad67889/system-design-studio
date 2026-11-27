# Development Status — System Design Studio

Updated: 2026-11-27 (end of Phases 1–4 build). Status is recomputed from
test runs and page checks in this file's log, never carried forward
from memory.

## Completed

- [x] Phase 1 — Foundation: Next.js 16.4.6 + React 19.3 + TypeScript
      strict + Tailwind v4.3.3, Zustand 5.1, React Flow 13 (@xyflow/react),
      lucide-react, Vitest 5 + jsdom + Testing Library, playwright-core
      (dev-only, for the verification scripts).
- [x] Design tokens in `app/globals.css` (cream/paper/leaf/ink/amber/
      blue/purple, light + dark themes, reduced-motion rules).
- [x] Core types (`lib/types.ts`), curriculum catalog (9 chapters,
      40 lessons), pure math helpers (`lib/progress.ts`), content
      access layer (`lib/content.ts` — merged chapters so finished
      lessons never show "Coming soon"), progress store (localStorage),
      simulation store, theme provider.
- [x] Phase 2 — UI: homepage (hero, continue learning, progress,
      chapter grid), TopNav + mobile drawer + footer, Learn dashboard,
      lesson layout (sidebar, breadcrumb, metrics, step navigator,
      explanation blocks, prev/next, mark complete, bookmark),
      global search page.
- [x] Phase 3 — Simulation engine: SVG diagram canvas (11 node kinds,
      status dots + text, edge particles via animateMotion, flow lines),
      playback controls (play/pause/restart/prev/next/fullscreen/speed),
      reduce-motion toggle, text caption under every diagram, Zustand
      playback store, deterministic step data.
- [x] Phase 4 — Core lessons with full content: l1 Request Lifecycle
      (6 steps), l2 Latency & Throughput (5 steps, Little's Law),
      l5 Vertical vs Horizontal Scaling (6 steps, 1→3 servers),
      l11 Database Replication (6 steps, lag + failover).
- [x] Phase 5 — Full curriculum: the remaining 36 lessons written in
      full (data/lessons-part-a.ts through data/lessons-part-g.ts),
      so all 40 lessons are complete with steps, diagrams, formulas
      where they fit, and summaries. Zero lessons marked "Coming soon".
      One defect found and fixed in integration: l35 step 5 referenced
      a node id that did not exist in its diagram.
- [x] Practice landing + 10-question quiz runner (hints, explanations,
      scoring, results, best-score saved).
- [x] Cheatsheets landing + 4 real cheatsheets (Networking, Caching,
      Database Scaling, Reliability) with copyable formulas.
- [x] Case Studies landing + 1 full case study (URL shortener).
- [x] Capacity calculator (8 inputs, 8 outputs, formulas shown,
      labelled estimates).
- [x] Design Lab: React Flow canvas, 19 components in 5 groups,
      drag/drop + tap-to-add, properties panel, undo/redo, save/load
      in localStorage, traffic + failure scenarios, event log.
- [x] SPEC.md, DEVELOPMENT_STATUS.md (this file), README.md,
      verification scripts in `scripts/` (verify.mjs, focus-verify.mjs).

## In progress

- None — this build's scope is complete.

## Pending (later phases — NOT in this build)

- [ ] Phase 6 — full practice bank + interview challenges.
- [ ] Phase 8 (rest) — more case studies.
- [ ] Phase 9 — Supabase: auth, synced progress, saved projects.
- [ ] Phase 10 — Admin CMS.
- [ ] Phase 11 — full test suite incl. Playwright e2e (Vitest unit
      tests exist; browser verification was manual scripts, not a
      committed e2e suite).
- [x] Phase 12 — GitHub repo + Vercel deployment (LIVE 2026-11-27:
      https://system-design-studio-five.vercel.app/).

## Test status (verified 2026-11-27, after final rebuild)

- Unit tests (Vitest): **45 passed, 0 failed** (4 files:
      lib/progress.test.ts 15, lib/content.test.ts 14,
      store/simulation-store.test.ts 11,
      components/simulation/DiagramCanvas.test.tsx 5).
- Typecheck (`pnpm exec tsc --noEmit`): **pass, exit 0**.
- Lint (`pnpm lint`): **pass, exit 0**.
- Production build (`pnpm build`): **pass** — all routes prerendered;
      `/search` is partial prerender (dynamic).
- Production server curls: **all 200** — /, /learn, /learn/l1, /learn/l2,
      /learn/l5, /learn/l11, /learn/l3 (coming soon), /practice,
      /practice/quiz, /design-lab, /cheatsheets,
      /cheatsheets/caching-patterns, /case-studies,
      /case-studies/url-shortener, /calculator, /search?q=cache.
      (Before the curriculum completion; see the 2026-11-27 evening
      run log entry for the all-40-lessons check.)
      KNOWN BUG (parent-verified 2026-11-27): unknown ids on /learn,
      /cheatsheets, /case-studies show the not-found page but return HTTP
      200 instead of 404 (soft 404 — likely the cacheComponents setting in
      next.config.ts interacting with notFound()). Visible behaviour is
      correct; fix the status code before launch. Fix attempt 2026-11-27
      (ship subagent): adding a styled app/not-found.tsx did NOT change the
      status — still 200 on all three routes, with the custom page rendering
      correctly. Reverted per plan; do not guess at cacheComponents changes
      without evidence.
- Browser checks (Playwright, headless shell, production build):
      14 pages at 1440px and 390px — **no horizontal overflow, no page
      errors, no console errors** on any page. Click-throughs verified:
      lesson step next (Step 1→2), simulation auto-play (Step 1→3 in
      ~6s), mark complete persisted to localStorage, quiz completed
      end-to-end (results screen shown), calculator Peak RPS 694.44 →
      1,388.89 when DAU doubled, theme toggle adds `.dark`, Design Lab
      add-node 5→6 nodes + save round-trip in localStorage.
- Screenshots: `screenshots/desktop/` and `screenshots/mobile/`
      (14 pages each + lesson-playing, quiz-results, home-dark,
      design-lab).

## Known bugs / limitations

- Design Lab export (PNG/SVG) is NOT implemented. React Flow renders
      nodes as HTML and only edges as SVG, so serializing the SVG layer
      would export arrows without boxes. Deliberately left out rather
      than shipping a broken button. Save/load works.
- The cheatsheet copy button is wired by a small delegated
      `next/script` click handler (the page must stay a server component
      for `generateStaticParams`). It works; a shared client component
      would be cleaner if the page is ever refactored.
- Mobile Design Lab palette is a horizontal scroll strip by design;
      its inner sections legitimately extend past 390px inside that
      scroller (page itself does not overflow).
- `pnpm lint` shows an eslint deprecation warning for eslint 9.39.5;
      harmless.

## Run log

- 2026-11-27: scaffold created with create-next-app (Next 16.4.6,
  Tailwind v4.3.3). The tool's final step failed writing its own
  config (EPERM chown on ~/.config) — the app files and install were
  already complete, so the scaffold was kept and verified by listing
  package.json + node_modules. Removed the scaffold's AGENTS.md
  (human-made rule: no AGENTS.md in the repo).
- 2026-11-27: five parallel build streams (UI, simulation engine,
  content, practice+lab, cheatsheets/cases/calculator), then
  integration fixes by the coordinator: /search Suspense boundary
  (build was failing on prerender), theme-provider setState-in-effect
  lint fix, merged-chapters fix (finished lessons were wrongly
  labelled "Coming soon" in sidebars), SVG `height="auto"` console
  error fix, diagram sublabel overflow fix.
- 2026-11-27 evening: full curriculum completed. The 36 stub lessons
  were written in full by 7 parallel writers (one file per chapter
  group, data/lessons-part-a.ts through data/lessons-part-g.ts, plus
  shared helpers in data/lesson-helpers.ts), merged into
  data/lessons-full.ts. Integration found and fixed one defect:
  l35 step 5 referenced a node id ('deploy') that did not exist in
  its diagram (node renamed to match). Content test updated to expect
  all 40 lessons. Verified: typecheck clean, lint clean, Vitest
  45/45 pass, production build pass (all 40 lesson routes
  prerendered), prod-server curls 200 on all 40 lesson pages with
  real step content and zero "Coming soon", spot-checked l6, l17,
  l26, l37, l40 rendering SVG diagrams (27–30 svg tags each) with
  the expected key terms. Pushed to main; Vercel auto-deploy
  verified live (see Deployment status).

## Deployment status (2026-11-27 evening)

- GitHub repo: **DONE** — https://github.com/MuhammadAhmad67889/system-design-studio
  (public). All 97 project files on main in 7 commits: initial README
  (browser), 3 connector pushes (27fdec3, 57cb7da, 33c9198 — 65 text
  files), 3 browser uploads for binary files (60ca378 favicon.ico,
  83b1372 17 desktop screenshots, 75babf1 14 mobile screenshots).
  Verified via API: 123 tree entries, favicon + 17 + 14 screenshots
  present, upload SHAs match.
- Vercel deploy: **LIVE 2026-11-27** — https://system-design-studio-five.vercel.app/
  (status Ready, deployed in 33s; "system-design-studio.vercel.app" was
  taken, so Vercel assigned "-five"). Parent-verified live: 12 routes
  return 200 (/, /learn, /learn/l2, /learn/l5, /practice, /practice/quiz,
  /design-lab, /calculator, /cheatsheets, /case-studies,
  /case-studies/url-shortener, /search). The Vercel GitHub App
  installation only covers selected repos — system-design-studio was
  added to it (6 repos now) via GitHub sudo-mode code + Vercel identity
  code, both supplied by the user.
- Soft-404 fix attempt: adding a styled `app/not-found.tsx` did NOT
  change the status (unknown ids still return HTTP 200 on all three
  routes, though the custom page renders). File reverted; bug remains
  open — fix before launch, do not guess at `cacheComponents`.
- `package.json` gained `test` and `typecheck` scripts (README
  referenced them but they did not exist).

## Guided labs (built 2026-11-27 evening, NOT yet pushed)

- 9 guided labs, one per chapter, in plain language with a goal,
  4–5 steps + hints, a starter template that loads onto the Design Lab
  canvas, checks, and a revealable/loadable solution:
  1 Trace a Request (Foundations, 15 min), 2 Survive a Traffic Spike
  (Scaling, 20 min), 3 Make Reads Fast (Data & Storage, 25 min),
  4 Decouple with a Queue (Communication, 20 min), 5 Break It on
  Purpose (Reliability, 20 min), 6 Split the Monolith (Architecture,
  25 min), 7 Lock the Front Door (Security, 20 min), 8 Ship It and
  Watch It (Shipping, 15 min), 9 Design a URL Shortener (Whole
  Systems, 30 min).
- Checks read the real canvas state (`lib/labs.ts`: has-node, has-edge,
  has-path, no-direct-edge) plus self-checks labelled as such. Tests
  enforce that every auto check fails on the starter and passes on the
  solution. `/labs` listing + `/labs/[id]` runner reuse the Design Lab
  canvas; progress persists in the existing Zustand store
  (`sds-progress-v1`); Labs linked from TopNav, MobileDrawer, home.
- Parent-verified locally: typecheck clean, lint clean, Vitest 63/63
  (was 45), prod build passes, `/labs` + all 9 lab routes prerendered
  and 200 on the prod server, Playwright spot-checks (checks flip on a
  real drag, solution loads, step persistence across reload).
- PUSHED + LIVE 2026-11-27 ~23:55 PKT (user said "Do it"; three
  connector pushes, all approved promptly): batch A 4f80b3cb (lab data,
  checker, tests), batch B 18d2666f (listing + runner UI), status doc
  8d055785. New main head: 8d055785. Parent-verified live: /labs +
  all 9 lab pages 200, listing shows all 9 lab links, lab-1 "Trace a
  Request" and lab-9 "URL Shortener" render; soft-404 still proper
  404 on all three unknown-id routes after the labs deploy; lessons +
  Design Lab still 200 (no regression).
