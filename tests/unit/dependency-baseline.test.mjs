import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")
const workspaceRoot = path.resolve(root, "..")

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, "utf8"))
}

function maybeReadJson(absPath) {
  return fs.existsSync(absPath) ? readJson(absPath) : null
}

const rootPackage = maybeReadJson(path.join(workspaceRoot, "package.json"))
const rootLock = maybeReadJson(path.join(workspaceRoot, "package-lock.json"))
const webPackage = readJson(path.join(root, "package.json"))
const webLock = readJson(path.join(root, "package-lock.json"))
const webGitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8")

test("wrapper package and lock remain dependency-free forwarding metadata when present", () => {
  if (!rootPackage || !rootLock) return

  assert.deepEqual(rootPackage.dependencies ?? {}, {})
  assert.deepEqual(rootPackage.devDependencies ?? {}, {})
  assert.deepEqual(rootLock.packages?.[""]?.dependencies ?? {}, {})
  assert.deepEqual(rootLock.packages?.[""]?.devDependencies ?? {}, {})
})

test("wrapper package quality gates forward directly to the web app", () => {
  if (!rootPackage) return

  assert.equal(rootPackage.scripts.check, "npm run check --prefix web")
  assert.equal(rootPackage.scripts["check:release"], "npm run check:release --prefix web")
})

test("web package dependency declarations match the package lock root entry", () => {
  const lockedRoot = webLock.packages?.[""]

  assert.ok(lockedRoot, "package-lock.json should contain the root package entry")
  assert.deepEqual(lockedRoot.dependencies, webPackage.dependencies)
  assert.deepEqual(lockedRoot.devDependencies, webPackage.devDependencies)
})

test("Playwright browser E2E dependency and install script stay declared", () => {
  assert.equal(webPackage.devDependencies.playwright, "^1.60.0")
  assert.equal(webPackage.scripts["e2e:install"], "playwright install chromium")
  assert.equal(webPackage.scripts["e2e:install:ci"], "playwright install --with-deps chromium")
  assert.ok(webLock.packages?.["node_modules/playwright"], "package lock should include playwright")
  assert.ok(webLock.packages?.["node_modules/playwright-core"], "package lock should include playwright-core")
})

test("dependency baseline tests support app-only CI checkouts", () => {
  assert.equal(webPackage.private, true)
  assert.equal(webPackage.scripts.build, "node scripts/build.mjs")
  assert.ok(webLock.packages?.[""], "web lock should be valid from the app repository root")
})

test("browser-generated debug logs stay out of the app repository", () => {
  assert.match(webGitignore, /^debug\.log$/m)
  assert.match(webGitignore, /^npm-debug\.log\*/m)
  assert.match(webGitignore, /^\.pnpm-debug\.log\*/m)
})
