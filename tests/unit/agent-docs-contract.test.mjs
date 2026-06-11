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
  })
}

test("app README documents the current E2E coverage layers", () => {
  assert.match(webReadme, /inside `web\/`/)
  assert.match(webReadme, /npm run check/)
  assert.match(webReadme, /npm run check:release/)
  assert.match(webReadme, /HTTP route health/)
  assert.match(webReadme, /real interactions with Playwright/)
  assert.match(webReadme, /production build/)
  assert.match(webReadme, /service worker/)
  assert.match(webReadme, /offline/)
})

test("product docs describe the current visited-page PWA fallback strategy", () => {
  for (const [name, source] of [
    ["web/README.md", webReadme],
    ...optionalDocs,
  ]) {
    assert.match(source, /visited|already visited|previously visited|pages the learner has already visited/, name)
    assert.match(source, /offline\.html/, name)
    assert.match(source, /localStorage|learning state/, name)
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

test("agent docs contract supports nested workspaces and app-only CI checkouts", () => {
  assert.equal(fs.existsSync(path.join(appRoot, "package.json")), true)
  assert.equal(fs.existsSync(path.join(appRoot, "README.md")), true)

  for (const [name] of optionalDocs) {
    assert.ok(["CLAUDE.md", "README_CODEX.md", "PLAN.md"].includes(name))
  }
})
