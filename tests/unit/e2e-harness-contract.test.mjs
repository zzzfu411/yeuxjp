import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")
const workspacePackagePath = path.join(root, "..", "package.json")
const rootPackage = fs.existsSync(workspacePackagePath)
  ? fs.readFileSync(workspacePackagePath, "utf8")
  : null
const webPackage = fs.readFileSync(path.join(root, "package.json"), "utf8")
const rootPackageJson = rootPackage ? JSON.parse(rootPackage) : null
const webPackageJson = JSON.parse(webPackage)
const harness = fs.readFileSync(path.join(root, "tests/e2e/harness.mjs"), "utf8")
const smoke = fs.readFileSync(path.join(root, "tests/e2e/smoke.mjs"), "utf8")

test("E2E harness owns shared Playwright optional dependency handling", () => {
  assert.match(harness, /export async function importPlaywrightOrSkip/)
  assert.match(harness, /await import\("playwright"\)/)
  assert.match(harness, /Cannot find package 'playwright'/)
  assert.match(harness, /process\.exit\(0\)/)
  assert.match(harness, /process\.exit\(2\)/)
  assert.match(harness, /export function skipOptionalPlaywrightRuntimeError/)
  assert.match(harness, /Executable doesn't exist/)
  assert.match(harness, /playwright install/)
  assert.match(harness, /if \(required\) return false/)
})

test("E2E harness owns server lifecycle and storage helpers", () => {
  const buildScript = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8")
  const buildLock = fs.readFileSync(path.join(root, "scripts/build-lock.mjs"), "utf8")

  assert.match(harness, /export function createServerController/)
  assert.match(harness, /spawnSync\("taskkill"/)
  assert.match(harness, /async stop\(\)/)
  assert.match(harness, /await waitForProcessExit\(runningServer\)/)
  assert.match(harness, /export async function reuseOrStartDevServer/)
  assert.match(harness, /await waitForNextDevLockRelease\(\)/)
  assert.match(harness, /export async function startProductionServer/)
  assert.match(harness, /import fs from "node:fs"/)
  assert.match(harness, /import net from "node:net"/)
  assert.match(harness, /export async function findAvailablePort/)
  assert.match(harness, /const selectedPort = await findAvailablePort\(port\)/)
  assert.match(harness, /const selectedBaseUrl = `http:\/\/127\.0\.0\.1:\$\{selectedPort\}`/)
  assert.match(harness, /import \{ acquireBuildLock \} from "\.\.\/\.\.\/scripts\/build-lock\.mjs"/)
  assert.match(harness, /export const nextCli = path\.join\(appDir, "node_modules", "next", "dist", "bin", "next"\)/)
  assert.match(harness, /function runNextBuildSync/)
  assert.match(harness, /spawnSync\(process\.execPath, \[nextCli, "build"\]/)
  assert.match(harness, /controller\.spawn\(process\.execPath, \[nextCli, "dev", "--hostname", "127\.0\.0\.1", "--port"/)
  assert.doesNotMatch(harness, /spawnSync\("cmd\.exe", \["\/d", "\/s", "\/c"/)
  assert.doesNotMatch(harness, /npm\.cmd run dev/)
  assert.match(harness, /const releaseBuildLock = await acquireBuildLock\(\{ label: "pwa production e2e" \}\)/)
  assert.match(harness, /controller\.holdRelease\(releaseBuildLock\)/)
  assert.match(harness, /controller\.spawn\(process\.execPath, \[nextCli, "start", "--hostname", "127\.0\.0\.1", "--port"/)
  assert.match(harness, /export async function readJsonStorage/)
  assert.match(buildScript, /withBuildLock/)
  assert.match(buildScript, /nextCli/)
  assert.match(buildLock, /export async function acquireBuildLock/)
  assert.match(buildLock, /defaultBuildLockDir/)
})

test("optional browser E2E scripts skip missing Playwright browser binaries", () => {
  const browser = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")
  const pwa = fs.readFileSync(path.join(root, "tests/e2e/pwa-offline.mjs"), "utf8")

  for (const source of [browser, pwa]) {
    assert.match(source, /skipOptionalPlaywrightRuntimeError/)
    assert.match(source, /browser binaries are not installed/)
    assert.match(source, /npm run e2e:install --prefix web/)
    assert.match(source, /failure = null/)
  }
})

test("browser-backed E2E scripts exit explicitly after cleanup", () => {
  const browser = fs.readFileSync(path.join(root, "tests/e2e/browser.mjs"), "utf8")
  const pwa = fs.readFileSync(path.join(root, "tests/e2e/pwa-offline.mjs"), "utf8")

  for (const source of [browser, pwa]) {
    assert.match(source, /process\.exit\(1\)/)
    assert.match(source, /process\.exit\(0\)/)
  }
  assert.match(pwa, /await context\?\.close\(\)/)
})

test("HTTP smoke reuses the shared E2E server harness", () => {
  assert.match(smoke, /createServerController/)
  assert.match(smoke, /reuseOrStartDevServer\(\{ baseUrl, port, controller: serverController \}\)/)
  assert.match(smoke, /await serverController\.stop\(\)/)
  assert.doesNotMatch(smoke, /from "node:child_process"/)
  assert.doesNotMatch(smoke, /spawnSync\("taskkill"/)
  assert.doesNotMatch(smoke, /waitForServer/)
})

test("root check command includes the browser-free HTTP smoke gate", () => {
  if (!rootPackage) return

  assert.match(rootPackage, /"check": "npm run validate:data && npm run lint && npm run test && npm run build && npm run e2e"/)
  assert.match(rootPackage, /"check:release": "npm run check:release --prefix web"/)
})

test("root package remains a dependency-free forwarding entrypoint", () => {
  if (!rootPackageJson) return

  assert.deepEqual(rootPackageJson.dependencies ?? {}, {})
  assert.deepEqual(rootPackageJson.devDependencies ?? {}, {})
  assert.equal(rootPackageJson.scripts["validate:data"], "npm run validate:data --prefix web")
  assert.equal(rootPackageJson.scripts["check:release"], "npm run check:release --prefix web")
  assert.equal(rootPackageJson.scripts["e2e"], "npm run e2e --prefix web")
  assert.equal(rootPackageJson.scripts["e2e:install"], "npm run e2e:install --prefix web")
  assert.equal(rootPackageJson.scripts["e2e:install:ci"], "npm run e2e:install:ci --prefix web")
  assert.equal(rootPackageJson.scripts["e2e:browser"], "npm run e2e:browser --prefix web")
  assert.equal(rootPackageJson.scripts["e2e:browser:required"], "npm run e2e:browser:required --prefix web")
  assert.equal(rootPackageJson.scripts["e2e:pwa"], "npm run e2e:pwa --prefix web")
  assert.equal(rootPackageJson.scripts["e2e:pwa:required"], "npm run e2e:pwa:required --prefix web")
  assert.equal(rootPackageJson.scripts["download:kana:animcjk"], "node scripts/download-animcjk-kana.mjs")
  assert.notEqual(rootPackageJson.scripts["validate:data"], webPackageJson.scripts["validate:data"])
})

test("app-local check command matches the root quality gate", () => {
  assert.match(webPackage, /"validate:data": "node scripts\/validate-data\.mjs"/)
  assert.equal(webPackageJson.scripts.build, "node scripts/build.mjs")
  assert.match(webPackage, /"check": "npm run validate:data && npm run lint && npm run test && npm run build && npm run e2e"/)
  assert.match(webPackage, /"check:release": "npm run check && npm run e2e:browser:required && npm run e2e:pwa:required"/)
  assert.match(webPackage, /"e2e:install": "playwright install chromium"/)
  assert.match(webPackage, /"e2e:install:ci": "playwright install --with-deps chromium"/)
  assert.match(webPackage, /"playwright": "\^1\.60\.0"/)
})

test("app-local lint command scans source-owned code instead of generated assets", () => {
  assert.equal(webPackageJson.scripts.lint, "eslint src scripts tests")
  assert.doesNotMatch(webPackageJson.scripts.lint, /eslint\s*$/)
  assert.doesNotMatch(webPackageJson.scripts.lint, /\bpublic\b/)
  assert.doesNotMatch(webPackageJson.scripts.lint, /\.git/)
})

test("E2E gate contracts support app-only CI checkouts", () => {
  assert.equal(webPackageJson.scripts.check, "npm run validate:data && npm run lint && npm run test && npm run build && npm run e2e")
  assert.equal(webPackageJson.scripts["check:release"], "npm run check && npm run e2e:browser:required && npm run e2e:pwa:required")
})
