import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..", "..")
const webReadme = fs.readFileSync(path.join(root, "web/README.md"), "utf8")
const optionalDocs = ["CLAUDE.md", "README_CODEX.md"]
  .map((relPath) => ({ relPath, absPath: path.join(root, relPath) }))
  .filter(({ absPath }) => fs.existsSync(absPath))
  .map(({ relPath, absPath }) => [relPath, fs.readFileSync(absPath, "utf8")])

for (const [name, source] of [
  ["web/README.md", webReadme],
  ...optionalDocs,
]) {
  test(`${name} documents the current E2E quality gates`, () => {
    assert.match(source, /npm run e2e\b/)
    assert.match(source, /npm run check:release\b/)
    assert.match(source, /npm run e2e:browser\b/)
    assert.match(source, /npm run e2e:browser:required\b/)
    assert.match(source, /npm run e2e:pwa\b/)
    assert.match(source, /npm run e2e:pwa:required\b/)
    assert.match(source, /Playwright is not installed/)
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
