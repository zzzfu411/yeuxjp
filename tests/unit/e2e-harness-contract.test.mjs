import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")
const rootPackage = fs.readFileSync(path.join(root, "..", "package.json"), "utf8")
const webPackage = fs.readFileSync(path.join(root, "package.json"), "utf8")
const rootPackageJson = JSON.parse(rootPackage)
const webPackageJson = JSON.parse(webPackage)
const harness = fs.readFileSync(path.join(root, "tests/e2e/harness.mjs"), "utf8")
const smoke = fs.readFileSync(path.join(root, "tests/e2e/smoke.mjs"), "utf8")

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

test("HTTP smoke reuses the shared E2E server harness", () => {
  assert.match(smoke, /createServerController/)
  assert.match(smoke, /reuseOrStartDevServer\(\{ baseUrl, port, controller: serverController \}\)/)
  assert.match(smoke, /serverController\.stop\(\)/)
  assert.doesNotMatch(smoke, /from "node:child_process"/)
  assert.doesNotMatch(smoke, /spawnSync\("taskkill"/)
  assert.doesNotMatch(smoke, /waitForServer/)
})

test("root check command includes the browser-free HTTP smoke gate", () => {
  assert.match(rootPackage, /"check": "npm run validate:data && npm run lint && npm run test && npm run build && npm run e2e"/)
  assert.match(rootPackage, /"check:release": "npm run check:release --prefix web"/)
})

test("root package remains a dependency-free forwarding entrypoint", () => {
  assert.deepEqual(rootPackageJson.dependencies ?? {}, {})
  assert.deepEqual(rootPackageJson.devDependencies ?? {}, {})
  assert.equal(rootPackageJson.scripts["validate:data"], "npm run validate:data --prefix web")
  assert.equal(rootPackageJson.scripts["check:release"], "npm run check:release --prefix web")
  assert.notEqual(rootPackageJson.scripts["validate:data"], webPackageJson.scripts["validate:data"])
})

test("app-local check command matches the root quality gate", () => {
  assert.match(webPackage, /"validate:data": "node scripts\/validate-data\.mjs"/)
  assert.match(webPackage, /"check": "npm run validate:data && npm run lint && npm run test && npm run build && npm run e2e"/)
  assert.match(webPackage, /"check:release": "npm run check && npm run e2e:browser:required && npm run e2e:pwa:required"/)
})

test("app-local lint command scans source-owned code instead of generated assets", () => {
  assert.equal(webPackageJson.scripts.lint, "eslint src scripts tests")
  assert.doesNotMatch(webPackageJson.scripts.lint, /eslint\s*$/)
  assert.doesNotMatch(webPackageJson.scripts.lint, /\bpublic\b/)
  assert.doesNotMatch(webPackageJson.scripts.lint, /\.git/)
})
