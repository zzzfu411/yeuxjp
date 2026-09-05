import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")
const workflowPath = path.join(root, ".github/workflows/quality.yml")

function extractChangeFilters(workflow) {
  const patterns = Array.from(workflow.matchAll(/if grep -E '([^']+)' changed-files\.txt/g))
    .map((match) => new RegExp(match[1]))

  assert.equal(patterns.length, 2)
  return { pwa: patterns[0], browser: patterns[1] }
}

function assertPathsMatch(pattern, paths) {
  for (const filePath of paths) {
    assert.equal(pattern.test(filePath), true, `${filePath} should match ${pattern}`)
  }
}

function assertPathsDoNotMatch(pattern, paths) {
  for (const filePath of paths) {
    assert.equal(pattern.test(filePath), false, `${filePath} should not match ${pattern}`)
  }
}

function readWorkflow() {
  assert.equal(fs.existsSync(workflowPath), true)
  return fs.readFileSync(workflowPath, "utf8")
}

test("GitHub Actions workflow runs merge and release quality gates", () => {
  const workflow = readWorkflow()

  assert.match(workflow, /name: Quality Gates/)
  assert.match(workflow, /pull_request:/)
  assert.match(workflow, /push:/)
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /release:/)
  assert.match(workflow, /actions\/checkout@v4/)
  assert.match(workflow, /actions\/setup-node@v4/)
  assert.match(workflow, /node-version: 24/)
  assert.match(workflow, /cache-dependency-path: package-lock\.json/)
  assert.match(workflow, /run: npm ci/)
  assert.match(workflow, /run: npm run check/)
  assert.match(workflow, /Install Playwright Chromium and system dependencies/)
  assert.match(workflow, /run: npm run e2e:install:ci/)
  assert.doesNotMatch(workflow, /run: npm run e2e:install\s*$/m)
  assert.match(workflow, /run: npm run check:release/)
  assert.match(workflow, /github\.event_name != 'workflow_dispatch' \|\| !inputs\.release/)
  assert.match(workflow, /github\.event_name == 'workflow_dispatch' && inputs\.release/)
})

test("PWA changes use conservative source, public, and tooling coverage", () => {
  const workflow = readWorkflow()

  assert.match(workflow, /detect-pwa-changes:/)
  assert.match(workflow, /pwa-check:/)
  assert.match(workflow, /needs: detect-pwa-changes/)
  assert.match(workflow, /needs\.detect-pwa-changes\.outputs\.pwa == 'true'/)
  assert.ok(workflow.includes("public/.*"))
  assert.ok(workflow.includes("src/.*"))
  assert.ok(workflow.includes("scripts/.*"))
  assert.ok(workflow.includes("tests/e2e/.*"))
  assert.ok(workflow.includes(".github/workflows/.*"))
  assert.ok(workflow.includes("components\\.json"))
  assert.match(workflow, /run: npm run e2e:install:ci/)
  assert.match(workflow, /run: npm run e2e:pwa:required/)
  assert.doesNotMatch(workflow, /run: npm run e2e:pwa\s*$/m)

  const { pwa } = extractChangeFilters(workflow)
  assertPathsMatch(pwa, [
    "public/sw.js",
    "public/manifest.webmanifest",
    "public/offline.html",
    "public/icons/icon-192.png",
    "public/fonts/ma-shan-zheng/font.woff2",
    "public/assets/brand/yasashi-og.webp",
    "public/assets/kana/kana-seion.webp",
    "public/assets/review/review-streak.webp",
    "public/animcjk/kana/12354.svg",
    "src/app/layout.tsx",
    "src/app/path/page.tsx",
    "src/app/grammar/page.tsx",
    "src/app/kana/page.tsx",
    "src/components/home/home-page.tsx",
    "src/components/path/skill-tree-page.tsx",
    "src/components/learning/next-step-card.tsx",
    "src/components/kana/kana-page.tsx",
    "src/components/kana/kana-glyph-board.tsx",
    "src/components/kana/kana-stroke-animcjk.tsx",
    "src/components/kana/kana-stroke-controls.tsx",
    "src/components/kana/use-animcjk-playback.ts",
    "src/components/kana/use-animcjk-svgs.ts",
    "src/components/pwa-register.tsx",
    "src/components/theme-provider.tsx",
    "src/lib/animcjk.ts",
    "src/lib/dev-log.ts",
    "src/lib/glossary-model.ts",
    "src/lib/path-page-model.ts",
    "src/lib/skill-tree.ts",
    "src/lib/today-review-session.ts",
    "src/lib/learning-session.ts",
    "src/lib/learning-status.ts",
    "src/lib/learning-store.ts",
    "src/lib/learning-progress.ts",
    "src/lib/managed-learning-keys.ts",
    "src/lib/managed-learning-storage.ts",
    "src/lib/pwa-navigation.ts",
    "src/lib/progress-list-storage.ts",
    "src/lib/review-answer-recording.ts",
    "src/lib/review-dashboard-model.ts",
    "src/lib/review-questions.ts",
    "src/lib/review-session.ts",
    "src/lib/storage-keys.ts",
    "src/lib/utils.ts",
    "src/data/glossary.ts",
    "src/data/vocabulary/daily.ts",
    "src/data/lessons/days-46-90.ts",
    "src/data/grammar-practice-n4.ts",
    "tests/e2e/pwa-offline.mjs",
    "tests/e2e/harness.mjs",
    "tests/e2e/storage-keys.mjs",
    "tests/e2e/browser-fixture-review.mjs",
    "next.config.ts",
    "postcss.config.mjs",
    "tailwind.config.ts",
    "eslint.config.mjs",
    "tsconfig.json",
    "scripts/validate-data.mjs",
    "scripts/build.mjs",
    "scripts/build-lock.mjs",
    "package.json",
    "package-lock.json",
    ".github/workflows/quality.yml",
  ])
  assertPathsDoNotMatch(pwa, [
    "README.md",
    "docs/screenshots/home.jpg",
    "tests/unit/learning-store.test.mjs",
  ])
})

test("Browser changes use conservative source and harness coverage", () => {
  const workflow = readWorkflow()

  assert.match(workflow, /detect-browser-changes:/)
  assert.match(workflow, /browser: \$\{\{ steps\.filter\.outputs\.browser \}\}/)
  assert.match(workflow, /browser-check:/)
  assert.match(workflow, /needs: detect-browser-changes/)
  assert.match(workflow, /needs\.detect-browser-changes\.outputs\.browser == 'true'/)
  assert.ok(workflow.includes("public/.*"))
  assert.ok(workflow.includes("src/.*"))
  assert.ok(workflow.includes("scripts/.*"))
  assert.ok(workflow.includes("tests/e2e/.*"))
  assert.ok(workflow.includes(".github/workflows/.*"))
  assert.ok(workflow.includes("components\\.json"))
  assert.match(workflow, /run: npm run e2e:install:ci/)
  assert.match(workflow, /run: npm run e2e:browser:required/)
  assert.doesNotMatch(workflow, /run: npm run e2e:browser\s*$/m)

  const { browser } = extractChangeFilters(workflow)
  assertPathsMatch(browser, [
    "src/app/page.tsx",
    "src/app/layout.tsx",
    "src/app/path/page.tsx",
    "src/app/grammar/page.tsx",
    "src/app/kana/page.tsx",
    "src/components/lesson/lesson-runner.tsx",
    "src/components/path/skill-tree-page.tsx",
    "src/components/learning/next-step-card.tsx",
    "src/components/kana/kana-page.tsx",
    "src/components/kana/kana-glyph-board.tsx",
    "src/components/kana/kana-stroke-animcjk.tsx",
    "src/components/kana/kana-stroke-controls.tsx",
    "src/components/kana/use-animcjk-playback.ts",
    "src/components/pwa-register.tsx",
    "src/components/practice/practice-save-error.tsx",
    "src/components/theme-provider.tsx",
    "src/lib/animcjk.ts",
    "src/lib/dev-log.ts",
    "src/lib/glossary-model.ts",
    "src/lib/path-page-model.ts",
    "src/lib/skill-tree.ts",
    "src/lib/learning-progress.ts",
    "src/lib/learning-session.ts",
    "src/lib/learning-status.ts",
    "src/lib/managed-learning-keys.ts",
    "src/lib/managed-learning-storage.ts",
    "src/lib/progress-list-storage.ts",
    "src/lib/question-options.ts",
    "src/lib/review-answer-recording.ts",
    "src/lib/review-dashboard-model.ts",
    "src/lib/review-questions.ts",
    "src/lib/review-session.ts",
    "src/lib/storage-keys.ts",
    "src/lib/utils.ts",
    "src/data/glossary.ts",
    "src/data/vocabulary/daily.ts",
    "src/data/lessons/days-136-175.ts",
    "src/data/grammar-practice-types.ts",
    "public/fonts/lxgw/lxgwwenkaiscreen.css",
    "tests/e2e/browser-flow-quiz.mjs",
    "tests/e2e/browser.mjs",
    "tests/e2e/browser-flow-lesson.mjs",
    "tests/e2e/browser-flow-pwa.mjs",
    "tests/e2e/browser-fixtures.mjs",
    "tests/e2e/browser-fixture-learning-data.mjs",
    "tests/e2e/harness.mjs",
    "tests/e2e/storage-keys.mjs",
    "next.config.ts",
    "postcss.config.mjs",
    "tailwind.config.ts",
    "eslint.config.mjs",
    "tsconfig.json",
    "scripts/build.mjs",
    "scripts/build-lock.mjs",
    "package-lock.json",
    ".github/workflows/quality.yml",
  ])
  assertPathsDoNotMatch(browser, [
    "README.md",
    "docs/screenshots/home.jpg",
    "tests/unit/learning-store.test.mjs",
  ])
})
