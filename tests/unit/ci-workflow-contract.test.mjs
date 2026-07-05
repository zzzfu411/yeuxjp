import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")
const workflowPath = path.join(root, ".github/workflows/quality.yml")

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
  assert.match(workflow, /src\/app\/\(layout\\\.tsx\|page\\\.tsx\|learn\/\|kana\/\|vocabulary\/\|quiz\/\|semantics\/\|pragmatics\/\)/)
  assert.match(workflow, /src\/components\/\(home\|lesson\|kana\|vocabulary\|quiz\|reference\)\//)
  assert.match(workflow, /src\/components\/pwa-register\\\.tsx/)
  assert.match(workflow, /src\/lib\/pwa-navigation\\\.ts/)
  assert.match(workflow, /src\/data\/\(lessons\\\.ts\|kana-data\\\.ts\|vocabulary\/\|semantics-data\\\.ts\|pragmatics-data\\\.ts\)/)
  assert.match(workflow, /tests\/e2e\/pwa-offline\\\.mjs/)
  assert.match(workflow, /tests\/e2e\/harness\\\.mjs/)
  assert.match(workflow, /package\\\.json/)
  assert.match(workflow, /package-lock\\\.json/)
  assert.match(workflow, /run: npm run e2e:install:ci/)
  assert.match(workflow, /run: npm run e2e:pwa:required/)
  assert.doesNotMatch(workflow, /run: npm run e2e:pwa\s*$/m)
})

test("GitHub Actions workflow automatically runs strict browser gates for learning-flow changes", () => {
  assert.equal(fs.existsSync(workflowPath), true)

  const workflow = fs.readFileSync(workflowPath, "utf8")

  assert.match(workflow, /detect-browser-changes:/)
  assert.match(workflow, /browser: \$\{\{ steps\.filter\.outputs\.browser \}\}/)
  assert.match(workflow, /browser-check:/)
  assert.match(workflow, /needs: detect-browser-changes/)
  assert.match(workflow, /needs\.detect-browser-changes\.outputs\.browser == 'true'/)
  assert.match(workflow, /src\/app\/\(page\\\.tsx\|path\/\|learn\/\|kana\/\|vocabulary\/\|quiz\/\|review\/\|grammar\/\|semantics\/\|pragmatics\/\)/)
  assert.match(workflow, /src\/components\/\(home\|path\|learning\|lesson\|practice\|kana\|vocabulary\|quiz\|review\|reference\|ui\)\//)
  assert.match(workflow, /src\/components\/pwa-register\\\.tsx/)
  assert.match(workflow, /src\/lib\/\(animcjk\|answer-option-feedback\|kana\|keyboard-shortcuts\|learning\|lesson\|mistake\|pwa-navigation\|question-options\|questions\|quiz\|review\|srs\|use-indexed-modal-navigation\|verb-conjugation\|vocab\)/)
  assert.match(workflow, /src\/data\/\(lessons\\\.ts\|kana-data\\\.ts\|vocabulary\/\|grammar-data\\\.ts\|semantics-data\\\.ts\|pragmatics-data\\\.ts\)/)
  assert.match(workflow, /tests\/e2e\/\(browser\\\.mjs\|browser-\.\*\\\.mjs\|harness\\\.mjs\)/)
  assert.match(workflow, /package\\\.json/)
  assert.match(workflow, /package-lock\\\.json/)
  assert.match(workflow, /run: npm run e2e:install:ci/)
  assert.match(workflow, /run: npm run e2e:browser:required/)
  assert.doesNotMatch(workflow, /run: npm run e2e:browser\s*$/m)
})
