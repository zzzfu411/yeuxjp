import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")
const harness = fs.readFileSync(path.join(root, "tests/e2e/harness.mjs"), "utf8")

test("E2E harness owns shared Playwright optional dependency handling", () => {
  assert.match(harness, /export async function importPlaywrightOrSkip/)
  assert.match(harness, /await import\("playwright"\)/)
  assert.match(harness, /Cannot find package 'playwright'/)
  assert.match(harness, /process\.exit\(0\)/)
  assert.match(harness, /process\.exit\(2\)/)
})

test("E2E harness owns server lifecycle and storage helpers", () => {
  assert.match(harness, /export function createServerController/)
  assert.match(harness, /spawnSync\("taskkill"/)
  assert.match(harness, /export async function reuseOrStartDevServer/)
  assert.match(harness, /export async function startProductionServer/)
  assert.match(harness, /npmCommand\(\), \["run", "build"\]/)
  assert.match(harness, /npmCommand\(\), \["run", "start"/)
  assert.match(harness, /export async function readJsonStorage/)
})
