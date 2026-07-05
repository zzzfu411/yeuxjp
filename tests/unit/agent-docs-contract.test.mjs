import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const appRoot = path.resolve(import.meta.dirname, "..", "..")
const workspaceRoot = path.resolve(appRoot, "..")
const webReadme = fs.readFileSync(path.join(appRoot, "README.md"), "utf8")
const optionalDocs = ["CLAUDE.md", "README_CODEX.md", "PLAN.md"]
  .map((relPath) => ({ relPath, absPath: path.join(workspaceRoot, relPath) }))
  .filter(({ absPath }) => fs.existsSync(absPath))
  .map(({ relPath, absPath }) => [relPath, fs.readFileSync(absPath, "utf8")])

for (const [name, source] of [
  ["web/README.md", webReadme],
  ...optionalDocs,
]) {
  test(`${name} documents the current E2E quality gates`, () => {
    assert.match(source, /npm run e2e\b/)
    assert.match(source, /npm run check:release\b/)
    assert.match(source, /npm run e2e:install\b/)
    assert.match(source, /npm run e2e:install:ci\b|with-deps|system dependencies/)
    assert.match(source, /npm run e2e:browser\b/)
    assert.match(source, /npm run e2e:browser:required\b/)
    assert.match(source, /npm run e2e:pwa\b/)
    assert.match(source, /npm run e2e:pwa:required\b/)
    assert.match(source, /Chromium/)
    assert.match(source, /required/)
    assert.match(source, /release|CI/)
    assert.match(source, /PWA-impacting|strict PWA|e2e:pwa:required/)
  })
}

test("app README documents the current E2E coverage layers", () => {
  assert.match(webReadme, /inside `web\/`/)
  assert.match(webReadme, /npm run check/)
  assert.match(webReadme, /npm run check:release/)
  assert.match(webReadme, /HTTP route health/)
  assert.match(webReadme, /real interactions with Playwright/)
  assert.match(webReadme, /strict `npm run e2e:browser:required` release path builds the production app/)
  assert.match(webReadme, /runs the click-flow suite against `next start`/)
  assert.match(webReadme, /waiting-worker `SKIP_WAITING`/)
  assert.match(webReadme, /production build/)
  assert.match(webReadme, /service worker/)
  assert.match(webReadme, /offline/)
  assert.match(webReadme, /\/path/)
  assert.match(webReadme, /\/grammar\?level=N5/)
  assert.match(webReadme, /real cached kana\/vocabulary\/quiz\/path\/grammar\/semantics\/pragmatics content/)
})

test("product docs distinguish dependency freshness warnings from actionable build warnings", () => {
  for (const [name, source] of [
    ["web/README.md", webReadme],
    ...optionalDocs,
  ]) {
    assert.match(source, /baseline-browser-mapping/, name)
    assert.match(source, /caniuse-lite/, name)
    assert.match(source, /Next\.js image performance|sizes="100vw"|LCP/, name)
    assert.match(source, /blocked by `npm run build`|`npm run build` .*blocks/, name)
  }
})

test("product docs describe the current PWA navigation fallback strategy", () => {
  for (const [name, source] of [
    ["web/README.md", webReadme],
    ...optionalDocs,
  ]) {
    assert.match(source, /visited|already visited|previously visited|pages the learner has already visited/, name)
    assert.match(source, /canonical pathname|canonical pages|query deep links|query deep-link/, name)
    assert.match(source, /\/kana\?set=yoon|\/vocabulary\?level=daily|\/quiz\?mode=hiragana-romaji/, name)
    assert.match(source, /\/grammar\?level=N5/, name)
    assert.match(source, /service-worker-controlled|browser reports online|reports online|online navigation failure/, name)
    assert.match(source, /offline\.html/, name)
    assert.match(source, /localStorage|learning state/, name)
  }
})

test("product docs describe current learning-state hardening", () => {
  const plan = optionalDocs.find(([name]) => name === "PLAN.md")?.[1]
  const codex = optionalDocs.find(([name]) => name === "README_CODEX.md")?.[1]
  const claude = optionalDocs.find(([name]) => name === "CLAUDE.md")?.[1]

  assert.match(webReadme, /backup export\/import normalizes active kana\/vocabulary indexes and SRS maps/)
  assert.match(webReadme, /Practice writes use the shared learning-store transaction helper/)

  if (plan) {
    assert.match(plan, /Filtered stale and non-reviewable kana\/vocabulary ids/)
    assert.match(plan, /direct restore calls normalize managed entries/)
    assert.match(plan, /practice history, item progress, SRS enrollment, and mistake recording/)
    assert.match(plan, /currently below the 350-line target/)
    assert.doesNotMatch(plan, /Continue splitting `quiz-runner\.tsx`/)
  }

  if (codex) {
    assert.match(codex, /Managed learning writes should go through the existing facades and transaction helpers/)
  }

  if (claude) {
    assert.match(claude, /Managed writes that touch more than one learning key should use the shared learning-store transaction helper/)
  }
})

test("CLAUDE.md documents the shared E2E harness when the wrapper doc exists", () => {
  const claude = optionalDocs.find(([name]) => name === "CLAUDE.md")?.[1]
  if (!claude) return

  assert.match(claude, /web\/tests\/e2e/)
  assert.match(claude, /smoke\.mjs/)
  assert.match(claude, /browser\.mjs/)
  assert.match(claude, /pwa-offline\.mjs/)
  assert.match(claude, /harness\.mjs/)
  assert.match(claude, /server startup\/shutdown/)
  assert.match(claude, /optional Playwright handling/)
})

test("agent docs describe centralized test storage keys", () => {
  const plan = optionalDocs.find(([name]) => name === "PLAN.md")?.[1]
  const codex = optionalDocs.find(([name]) => name === "README_CODEX.md")?.[1]
  const claude = optionalDocs.find(([name]) => name === "CLAUDE.md")?.[1]

  if (plan) {
    assert.match(plan, /Centralized E2E\/unit-test learning storage key usage/)
    assert.match(plan, /yasashi\.\*\.v1/)
  }

  if (codex) {
    assert.match(codex, /web\/tests\/e2e\/storage-keys\.mjs/)
    assert.match(codex, /web\/src\/lib\/storage-keys\.ts/)
    assert.match(codex, /Do not hard-code versioned `yasashi\.\*\.v1` keys in tests/)
  }

  if (claude) {
    assert.match(claude, /storage-keys\.mjs/)
    assert.match(claude, /only E2E file that should hard-code versioned `yasashi\.\*\.v1`/)
    assert.match(claude, /web\/src\/lib\/storage-keys\.ts/)
  }
})

test("agent docs contract supports nested workspaces and app-only CI checkouts", () => {
  assert.equal(fs.existsSync(path.join(appRoot, "package.json")), true)
  assert.equal(fs.existsSync(path.join(appRoot, "README.md")), true)

  for (const [name] of optionalDocs) {
    assert.ok(["CLAUDE.md", "README_CODEX.md", "PLAN.md"].includes(name))
  }
})
