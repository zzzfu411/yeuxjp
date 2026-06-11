import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")
const workspaceRoot = path.resolve(root, "..")

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, "utf8"))
}

const rootPackage = readJson(path.join(workspaceRoot, "package.json"))
const rootLock = readJson(path.join(workspaceRoot, "package-lock.json"))
const webPackage = readJson(path.join(root, "package.json"))
const webLock = readJson(path.join(root, "package-lock.json"))

test("root package and lock remain dependency-free forwarding metadata", () => {
  assert.deepEqual(rootPackage.dependencies ?? {}, {})
  assert.deepEqual(rootPackage.devDependencies ?? {}, {})
  assert.deepEqual(rootLock.packages?.[""]?.dependencies ?? {}, {})
  assert.deepEqual(rootLock.packages?.[""]?.devDependencies ?? {}, {})
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
  assert.ok(webLock.packages?.["node_modules/playwright"], "package lock should include playwright")
  assert.ok(webLock.packages?.["node_modules/playwright-core"], "package lock should include playwright-core")
})
