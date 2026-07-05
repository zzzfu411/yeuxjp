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

test("GitHub Actions workflow runs merge and release quality gates", () => {
  assert.equal(fs.existsSync(workflowPath), true)

  const workflow = fs.readFileSync(workflowPath, "utf8")

  assert.match(workflow, /name: Quality Gates/)
  assert.match(workflow, /pull_request:/)
  assert.match(workflow, /push:/)
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /release:/)
  assert.match(workflow, /actions\/checkout@v4/)
  assert.match(workflow, /actions\/setup-node@v4/)
  assert.match(workflow, /node-version: 20/)
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

test("GitHub Actions workflow automatically runs strict PWA gates for PWA-impacting changes", () => {
  assert.equal(fs.existsSync(workflowPath), true)

  const workflow = fs.readFileSync(workflowPath, "utf8")

  assert.match(workflow, /detect-pwa-changes:/)
  assert.match(workflow, /pwa-check:/)
  assert.match(workflow, /needs: detect-pwa-changes/)
  assert.match(workflow, /needs\.detect-pwa-changes\.outputs\.pwa == 'true'/)
  assert.match(workflow, /public\/\(sw\\\.js/)
  assert.match(workflow, /manifest\\\.webmanifest/)
  assert.match(workflow, /offline\\\.html/)
  assert.match(workflow, /apple-touch-icon\\\.png/)
  assert.match(workflow, /favicon\\\.ico/)
  assert.match(workflow, /icons\//)
  assert.match(workflow, /brand\//)
  assert.match(workflow, /assets\//)
  assert.match(workflow, /animcjk\//)
  assert.match(workflow, /src\/app\/\(globals\\\.css\|layout\\\.tsx\|page\\\.tsx\|\(path\|grammar\|learn\|kana\|vocabulary\|quiz\|review\|semantics\|pragmatics\)\/\.\*\)/)
  assert.match(workflow, /src\/components\/\(home\|path\|layout\|learning\|lesson\|kana\|vocabulary\|quiz\|review\|reference\|ui\)\/\.\*/)
  assert.match(workflow, /src\/components\/\(mode-toggle\|theme-provider\|pwa-register\)\\\.tsx/)
  assert.match(workflow, /src\/lib\/\(animcjk\|answer-option-feedback[\s\S]*\|path[\s\S]*\|skill-tree[\s\S]*\|vocabulary\)\.\*\\\.ts/)
  assert.match(workflow, /src\/data\/\(lessons\\\.ts\|kana-data\\\.ts\|vocabulary\/\.\*\|grammar-data\\\.ts\|semantics-data\\\.ts\|pragmatics-data\\\.ts\)/)
  assert.match(workflow, /tests\/e2e\/\(pwa-offline\\\.mjs\|harness\\\.mjs\|storage-keys\\\.mjs\|browser-fixtures\\\.mjs\|browser-fixture-\.\*\\\.mjs\)/)
  assert.match(workflow, /package\\\.json/)
  assert.match(workflow, /package-lock\\\.json/)
  assert.match(workflow, /run: npm run e2e:install:ci/)
  assert.match(workflow, /run: npm run e2e:pwa:required/)
  assert.doesNotMatch(workflow, /run: npm run e2e:pwa\s*$/m)

  const { pwa } = extractChangeFilters(workflow)
  assertPathsMatch(pwa, [
    "public/sw.js",
    "public/icons/icon-192.png",
    "public/assets/kana/kana-seion.webp",
    "public/animcjk/kana/12354.svg",
    "src/app/layout.tsx",
    "src/app/path/page.tsx",
    "src/app/grammar/page.tsx",
    "src/app/kana/page.tsx",
    "src/components/path/skill-tree-page.tsx",
    "src/components/learning/next-step-card.tsx",
    "src/components/kana/kana-page.tsx",
    "src/components/theme-provider.tsx",
    "src/lib/path-page-model.ts",
    "src/lib/skill-tree.ts",
    "src/lib/learning-progress.ts",
    "src/lib/pwa-navigation.ts",
    "src/data/vocabulary/daily.ts",
    "tests/e2e/pwa-offline.mjs",
    "tests/e2e/browser-fixture-review.mjs",
    "package-lock.json",
  ])
  assertPathsDoNotMatch(pwa, [
    "README.md",
    "scripts/build.mjs",
    "tests/e2e/browser-flow-lesson.mjs",
  ])
})

test("GitHub Actions workflow automatically runs strict browser gates for learning-flow changes", () => {
  assert.equal(fs.existsSync(workflowPath), true)

  const workflow = fs.readFileSync(workflowPath, "utf8")

  assert.match(workflow, /detect-browser-changes:/)
  assert.match(workflow, /browser: \$\{\{ steps\.filter\.outputs\.browser \}\}/)
  assert.match(workflow, /browser-check:/)
  assert.match(workflow, /needs: detect-browser-changes/)
  assert.match(workflow, /needs\.detect-browser-changes\.outputs\.browser == 'true'/)
  assert.match(workflow, /src\/app\/\(globals\\\.css\|layout\\\.tsx\|page\\\.tsx\|\(path\|learn\|kana\|vocabulary\|quiz\|review\|grammar\|semantics\|pragmatics\)\/\.\*\)/)
  assert.match(workflow, /src\/components\/\(home\|path\|layout\|learning\|lesson\|practice\|kana\|vocabulary\|quiz\|review\|reference\|ui\)\/\.\*/)
  assert.match(workflow, /src\/components\/\(mode-toggle\|theme-provider\|pwa-register\)\\\.tsx/)
  assert.match(workflow, /src\/lib\/\(animcjk\|answer-option-feedback[\s\S]*\|path[\s\S]*\|skill-tree[\s\S]*\|vocabulary\)\.\*\\\.ts/)
  assert.match(workflow, /src\/data\/\(lessons\\\.ts\|kana-data\\\.ts\|vocabulary\/\.\*\|grammar-data\\\.ts\|semantics-data\\\.ts\|pragmatics-data\\\.ts\)/)
  assert.match(workflow, /tests\/e2e\/\(browser\\\.mjs\|browser-\.\*\\\.mjs\|harness\\\.mjs\|storage-keys\\\.mjs\)/)
  assert.match(workflow, /package\\\.json/)
  assert.match(workflow, /package-lock\\\.json/)
  assert.match(workflow, /run: npm run e2e:install:ci/)
  assert.match(workflow, /run: npm run e2e:browser:required/)
  assert.doesNotMatch(workflow, /run: npm run e2e:browser\s*$/m)

  const { browser } = extractChangeFilters(workflow)
  assertPathsMatch(browser, [
    "src/app/layout.tsx",
    "src/app/path/page.tsx",
    "src/app/grammar/page.tsx",
    "src/app/kana/page.tsx",
    "src/components/path/skill-tree-page.tsx",
    "src/components/learning/next-step-card.tsx",
    "src/components/kana/kana-page.tsx",
    "src/components/theme-provider.tsx",
    "src/lib/path-page-model.ts",
    "src/lib/skill-tree.ts",
    "src/lib/learning-progress.ts",
    "src/lib/question-options.ts",
    "src/data/vocabulary/daily.ts",
    "tests/e2e/browser-flow-lesson.mjs",
    "tests/e2e/browser-fixtures.mjs",
    "package-lock.json",
  ])
  assertPathsDoNotMatch(browser, [
    "README.md",
    "public/icons/icon-192.png",
    "scripts/build.mjs",
  ])
})
