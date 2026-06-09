# Yasashi Japanese

Yasashi Japanese is a gentle Japanese learning app for beginners. It covers kana, vocabulary, grammar, semantic nuance, pragmatics, quizzes, a 14-day starter path, local progress tracking, SRS review, and a mistake notebook. Course practice, quiz practice, and review now share the same question/result rules so progress, SRS enrollment, and mistake recording stay consistent across pages.

## Project Layout

- `web/` is the real Next.js app.
- The repository root keeps convenience scripts that forward into `web/`.
- Runtime and development dependencies belong in `web/package.json` and are locked by `web/package-lock.json`.
- Learning data lives under `web/src/data/`; vocabulary has a single source of truth in `web/src/data/vocabulary/*`.

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
npm run validate:data  # data integrity, lesson refs, PWA files, legacy-source guard
npm run lint           # ESLint + Next/TypeScript rules
npm run test           # Node built-in unit tests
npm run build          # production Next build
npm run check          # validate:data + lint + test + build + HTTP smoke
npm run e2e            # HTTP smoke test for key routes
npm run e2e:browser    # optional real browser click-flow E2E; skips if Playwright is unavailable
npm run e2e:browser:required # strict browser E2E; fails if Playwright is unavailable
npm run e2e:pwa        # optional production PWA/offline E2E; skips if Playwright is unavailable
npm run e2e:pwa:required # strict production PWA/offline E2E
```

The current merge gate is `npm run check`; it includes the HTTP smoke E2E gate. `npm run e2e` verifies HTTP route health for the core top-level pages plus the first lesson. `npm run e2e:browser` exercises real interactions with Playwright, including lesson resume persistence, lesson answer recording, kana stroke playback, vocabulary search, quiz mistakes, and review queue startup. `npm run e2e:pwa` runs against a production build, waits for the service worker, simulates offline navigation, and verifies the fallback page does not overwrite local learning state. Optional browser scripts exit cleanly with a skip message when Playwright is not installed. Use the `:required` variants in CI or release checks that must fail when the browser stack is missing.

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
- Quiz and review routes use shared runner components plus pure question builders, so the route files stay focused on URL/session entry state.
- AnimCJK rendering is split into parser/timeline helpers (`web/src/lib/animcjk.ts`) and a glyph-board component, keeping SVG parsing testable outside React.
- Dynamic vocabulary loading helpers (`loadVocabularyLevel`, `loadVocabularyScope`) live in `web/src/data/vocabulary/loader.ts`; import that module when a route can avoid loading every level at once.
- Basic PWA installability via `manifest.webmanifest`, 192/512 app icons, and a production service worker that caches only the static shell, images, scripts/styles, and AnimCJK SVGs. Learning state stays in `localStorage` and is not cached by the service worker.
- A dedicated offline fallback page at `/offline.html` for navigation requests when the network is unavailable.

## Extending Content

- Add vocabulary to `web/src/data/vocabulary/survival.ts`, `daily.ts`, or `fluent.ts`.
- Add grammar to `web/src/data/grammar-data.ts`.
- Add lesson steps to `web/src/data/lessons.ts` and run `npm run validate:data`.
- Practice steps should include stable `itemId`, `itemType`, and `mode` fields so progress/SRS/mistake recording can identify the learned item.
- Do not recreate `web/src/data/vocab-data.ts`, `kanaHira.json`, or `kanaKata.json`; validation fails if those legacy sources return.

## Assets And Licenses

AnimCJK SVG files are stored in `web/public/animcjk/`. Keep `web/public/animcjk/licenses/` when distributing the app.
