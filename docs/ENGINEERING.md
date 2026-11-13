# Engineering & Verification Reference

Internal architecture, quality gates, PWA caching behavior, and content extension rules for Yasashi Japanese (`yeuxjp` — this Git repository is the Next.js app root).

## Quality Gates & E2E Coverage

```bash
npm run validate:data        # data integrity, lesson refs, PWA/license files, legacy-source guard
npm run lint                 # ESLint + Next/TypeScript rules
npm run test                 # Node built-in unit tests
npm run build                # production Next build
npm run check                # merge gate: validate:data + lint + test + build + HTTP smoke
npm run check:release        # release gate: check + strict browser/PWA Playwright E2E
npm run e2e                  # HTTP route health smoke against production next start
npm run e2e:install          # install Playwright Chromium for local browser/PWA E2E
npm run e2e:install:ci       # install Playwright Chromium plus Linux system dependencies for CI
npm run e2e:browser          # optional real interactions with Playwright on dev server
npm run e2e:browser:required # strict Playwright click-flow E2E against production next start
npm run e2e:pwa              # optional production PWA/offline E2E
npm run e2e:pwa:required     # strict production PWA/offline E2E
```

- **Merge & Release Gates**: `npm run check` builds the production build and verifies HTTP route health on an isolated port. The strict `npm run e2e:browser:required` release path builds the production app and runs the click-flow suite against `next start` (covering real interactions with Playwright, including waiting-worker `SKIP_WAITING`, lesson persistence, stroke playback, flashcard self-grading, and backup/restore), while `npm run e2e:pwa:required` verifies the production build, service worker, `/path`, `/grammar?level=N5`, and real cached kana/vocabulary/quiz/path/grammar/semantics/pragmatics content offline.
- **CI Path Filtering**: `.github/workflows/quality.yml` runs `npm run check` on pushes and pull requests, plus path-filtered `npm run e2e:browser:required` and `npm run e2e:pwa:required` jobs for learning-flow or PWA-impacting changes.
- **Build Warnings**: Builds may warn that `baseline-browser-mapping` or `caniuse-lite` data is stale (routine dependency maintenance). Actionable Next.js image performance warnings (`sizes="100vw"` misuse or missing LCP priority) are blocked by `npm run build`.

## PWA Navigation & Offline Caching

- A production service worker (`public/sw.js`) maintains shell, navigation, and bounded runtime-media caches while keeping all learning state in `localStorage`.
- Navigation waits up to 4 seconds for the network before falling back to an already visited exact page cache, then canonical pathname caches for query deep links (`/kana?set=yoon`, `/vocabulary?level=daily`, `/quiz?mode=hiragana-romaji`, `/grammar?level=N5`, `/path`), and finally `/offline.html`.
- Service-worker-controlled app links fall back to document navigation even when the browser reports online, recovering from transient online navigation failure and serving real cached kana/vocabulary/quiz/path/grammar/semantics/pragmatics content offline.

## Learning State & Content Rules

- Practice writes use the shared learning-store transaction helper (`src/lib/learning-store.ts`) so progress history, item mastery, SRS enrollment, and mistake records commit atomically across tabs.
- Learning backup export/import normalizes active kana/vocabulary indexes and SRS maps (schema v3; compatible with v1/v2 imports) and rejects malformed payloads before mutation.
- Add vocabulary under `src/data/vocabulary/{survival,daily,fluent}.ts`, grammar under `src/data/grammar-data.ts` (with matching `n5`–`n2` practice sets), and lessons under `src/data/lessons.ts` or `src/data/lessons/*.ts`, then run `npm run validate:data`. Do not recreate legacy `vocab-data.ts`, `kanaHira.json`, or `kanaKata.json`.
