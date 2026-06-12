# Yasashi Japanese

Yasashi Japanese is a gentle Japanese learning app for beginners. It covers kana, vocabulary, grammar, semantic nuance, pragmatics, quizzes, a 14-day starter path, local progress tracking, SRS review, and a mistake notebook. Course practice, quiz practice, and review now share the same question/result rules so progress, SRS enrollment, and mistake recording stay consistent across pages.

## Project Layout

- `web/` is the real Next.js app.
- The repository root keeps convenience scripts that forward into `web/`.
- Runtime and development dependencies belong in `web/package.json` and are locked by `web/package-lock.json`.
- Learning data lives under `web/src/data/`; vocabulary has a single source of truth in `web/src/data/vocabulary/*`.
- Data validation is self-contained in `web/scripts/validate-data.mjs`.

## Install And Run

From the repository root:

```bash
npm ci --prefix web
npm run dev
```

The dev server defaults to `http://localhost:3000`.
If you are already inside `web/`, use the same script names without `--prefix web`, for example `npm run check`.

## Verification

```bash
npm run validate:data  # data integrity, lesson refs, PWA/license files, legacy-source guard
npm run lint           # ESLint + Next/TypeScript rules
npm run test           # Node built-in unit tests
npm run build          # production Next build
npm run check          # validate:data + lint + test + build + HTTP smoke
npm run check:release  # check + strict browser/PWA Playwright E2E
npm run e2e            # HTTP smoke test for key routes
npm run e2e:install    # install Playwright Chromium for browser/PWA E2E
npm run e2e:install:ci # install Playwright Chromium plus Linux system dependencies for CI
npm run e2e:browser    # optional real browser click-flow E2E; skips if Playwright is unavailable
npm run e2e:browser:required # strict browser E2E; fails if Playwright is unavailable
npm run e2e:pwa        # optional production PWA/offline E2E; skips if Playwright is unavailable
npm run e2e:pwa:required # strict production PWA/offline E2E
```

The current merge gate is `npm run check`; it includes the HTTP smoke E2E gate. The GitHub Actions workflow in `.github/workflows/quality.yml` runs this gate on push and pull request. Use `npm run check:release` for release environments that have Playwright and its Chromium browser installed; it runs the merge gate plus strict browser click-flow and PWA/offline checks. The workflow also exposes a manual `workflow_dispatch` release run that provisions Chromium plus Linux system dependencies with `e2e:install:ci` before running `check:release`. `npm run e2e` verifies HTTP route health for the core top-level pages plus the first lesson. `npm run e2e:browser` exercises real interactions with Playwright, including lesson resume persistence, lesson answer recording, kana stroke playback, vocabulary search, quiz mistakes, review queue startup, and learning data backup/restore/reset. `npm run e2e:pwa` runs against a production build, waits for the service worker, simulates offline navigation, verifies the pre-cached home page, a previously visited lesson page, and a real AnimCJK kana SVG can be served offline, and verifies the fallback page does not overwrite local learning state. Optional browser scripts exit cleanly with a skip message when the Playwright package or Chromium browser binary is missing. After `npm ci --prefix web`, run `npm run e2e:install --prefix web` to provision Chromium for local strict browser/PWA gates; in CI Linux runners use `npm run e2e:install:ci --prefix web` so Playwright can install required system dependencies too. Use the `:required` variants or `check:release` in local release checks that must fail when the browser stack is missing.

Builds may warn that `baseline-browser-mapping` or `caniuse-lite` data is stale. Treat that as dependency maintenance, not a functional failure.

## Implemented Features

- Kana charts for hiragana/katakana, seion, dakuon, handakuon, yoon, and sokuon.
- AnimCJK stroke-order animation loaded from `web/public/animcjk/kana`.
- Vocabulary cards grouped by level and category, with search, learned-state tracking, and TTS.
- Grammar, semantics, and pragmatics reference pages.
- Quiz modes for kana recognition, audio recognition, sokuon/long-vowel contrast, particles, verb conjugation, and vocabulary meaning.
- Local SRS review for kana, vocabulary, and mistakes, with today queue priority of mistakes first and due-time sorting for kana/vocabulary.
- A 14-day starter path with practice steps, step feedback, local progress, SRS enrollment for correct kana/vocab practice, and automatic mistake notebook capture for wrong answers.
- Shared learning-session helpers in `web/src/lib/learning-session.ts` and shared question helpers in `web/src/lib/questions.ts`.
- Learning backup/restore/reset helpers in `web/src/lib/learning-store.ts`; storage keys remain compatible with existing localStorage data.
- Learning backup export/import normalizes active kana/vocabulary indexes and SRS maps, removing stale vocabulary ids and non-reviewable kana ids while preserving practice history.
- Practice writes use the shared learning-store transaction helper so progress history, item mastery, SRS enrollment, and mistake notebook writes do not leave partial managed state after failures.
- Quiz and review routes use shared runner components plus pure question builders, so the route files stay focused on URL/session entry state.
- AnimCJK rendering is split into parser/timeline helpers (`web/src/lib/animcjk.ts`) and a glyph-board component, keeping SVG parsing testable outside React.
- Dynamic vocabulary loading helpers (`loadVocabularyLevel`, `loadVocabularyScope`) live in `web/src/data/vocabulary/loader.ts`; import that module when a route can avoid loading every level at once.
- Basic PWA installability via `manifest.webmanifest`, 192/512 app icons, and a production service worker that caches the static shell, images, scripts/styles, AnimCJK SVGs, and successful navigation responses for pages the learner has already visited. Offline navigation first tries a visited-page cache, then the pre-cached static shell, then `/offline.html`. Learning state stays in `localStorage` and is not cached by the service worker.
- A dedicated offline fallback page at `/offline.html` for navigation requests that have not been visited/cached before the network is unavailable.

## Extending Content

- Add vocabulary to `web/src/data/vocabulary/survival.ts`, `daily.ts`, or `fluent.ts`.
- Add grammar to `web/src/data/grammar-data.ts`.
- Add lesson steps to `web/src/data/lessons.ts` and run `npm run validate:data`.
- Practice steps should include stable `itemId`, `itemType`, and `mode` fields so progress/SRS/mistake recording can identify the learned item.
- Do not recreate `web/src/data/vocab-data.ts`, `kanaHira.json`, or `kanaKata.json`; validation fails if those legacy sources return.

## Assets And Licenses

AnimCJK SVG files are stored in `web/public/animcjk/`. Keep `web/public/animcjk/licenses/` when distributing the app.
