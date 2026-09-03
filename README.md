# dsa-enforcer

A timed C++ DSA practice tracker. Click a problem, you get **60 minutes** —
mark it **Done** with a confidence rating (Low/Med/High), or the timer
auto-fails it. Tag problems, jot revision notes, and expand a reference C++
solution when you're stuck.

100% static, 100% client-side: your progress lives only in your browser's
`localStorage`. Nothing is ever sent to a server, so anyone can use this tool
just by opening the hosted page — no accounts, no backend.

## Features

- **Timed practice**: start a problem, get a live 60:00 countdown that
  survives page reloads (it's anchored to a stored timestamp, not the timer
  object). Auto-fails at 60:00 with no action needed.
- **Confidence rating**: Done problems are rated Low / Medium / High so you
  know what to revisit.
- **Custom tags**: add freeform tags to any problem (e.g. `revisit`,
  `two-pointer`, `asked-at-x`) and filter by them.
- **Notes**: a small per-problem notes field for what tripped you up.
- **Reference solutions**: expand a problem's "Details" to see an authored
  C++ approach, time/space complexity, and copyable code. Currently covers
  Week 1 of the built-in set (40 problems) — more are added the same way,
  see [Adding solutions](#adding-solutions).
- **Custom problem sets**: import your own CSV of problems (any topic, not
  just LeetCode) as a separate, switchable set — see
  [Importing your own problems](#importing-your-own-problems).
- **Export**: download your progress as JSON or CSV at any time.
- **Global reset**: wipes all progress, gated behind typing `reset` to
  confirm.

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # production build to dist/
npm run preview   # preview the production build
```

Type-checked with `tsc`, bundled with Vite, zero UI framework — just
TypeScript, DOM APIs, and `localStorage`.

## Deployment

Pushing to `main` builds the app and deploys `dist/` to GitHub Pages via
`.github/workflows/deploy.yml`. Enable Pages once per repo: **Settings →
Pages → Source: GitHub Actions**.

## Adding more problems to the built-in set

The default "Google Prep 2K26" catalog is generated from
`scripts/source-data/problems.csv`. To extend it:

1. Edit or replace that CSV (columns: `Week`, `Weekday #`, `Rank`, `Problem`,
   `URL`, `Topic`, `Difficulty`).
2. Run `npm run import-csv` to regenerate `src/data/problems.json`.
3. Commit both files.

## Importing your own problems

Anyone using the hosted site can import their own list without touching
code: click **"+ Import set"**, upload a CSV, and it becomes a new tab next
to the built-in set (switchable any time, deletable, own filters). A sample
CSV is downloadable from that same dialog.

Required columns: `Title`, `URL`. Optional: `Topic`, `Difficulty`
(`Easy`/`Medium`/`Hard`), `Week`, `Weekday #`, `Rank`. Column names are
case-insensitive and a few aliases are accepted (e.g. `Problem` for `Title`,
`Link` for `URL`). Rows missing a title or a valid `http(s)://` URL are
rejected with a line-numbered error before import; duplicate URLs are
skipped with a warning. Imported sets are stored in your browser only, same
as progress.

## Adding solutions

Reference solutions live in `src/data/solutions.ts`, keyed by the problem's
`id` (the LeetCode URL slug — see `id` in `src/data/problems.json`). Each
entry has `approach` (bullet points), `complexity` (`time`/`space`), and
`code` (a C++ `class Solution { ... };` snippet, LeetCode-paste-ready).

Run `npm run check-solutions` after editing — it compiles every snippet with
`g++ -fsyntax-only` (against a small standard-library header set) to catch
syntax errors before you ship them. It checks syntax only, not logical
correctness, so still sanity-check tricky ones against LeetCode.

## Architecture notes (for extending)

- `src/types.ts` — shared types (`Problem`, `ProgressEntry`, `ProblemSet`, …).
- `src/storage.ts` — the one place progress reads/writes `localStorage`;
  swap this out (e.g. for IndexedDB) without touching the rest of the app.
- `src/sets.ts` — built-in + custom problem sets, and CSV import/validation.
- `src/timer.ts` — pure functions for elapsed/remaining time and formatting.
- `src/export.ts` — JSON/CSV export and progress-JSON import.
- `src/app.ts` — all rendering and event handling (single-file, event
  delegation on `#app`, re-renders on every state change — simple over
  clever, since the dataset is small).
