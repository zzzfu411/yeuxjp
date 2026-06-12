import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { hasBlockedBuildWarning } from "../../scripts/build.mjs"

const root = path.resolve(import.meta.dirname, "..", "..")

test("build warning filter blocks actionable Next image performance warnings", () => {
  assert.equal(
    hasBlockedBuildWarning('Image with src "/assets/hero.webp" has "fill" prop and "sizes" prop of "100vw"'),
    true
  )
  assert.equal(
    hasBlockedBuildWarning('Image with src "/assets/state.webp" was detected as the Largest Contentful Paint (LCP). Please add the `loading="eager"` property'),
    true
  )
})

test("build warning filter allows known dependency maintenance warnings", () => {
  const staleBrowserData = [
    "[baseline-browser-mapping] The data in this module is over two months old.",
    "Browserslist: browsers data (caniuse-lite) is 6 months old.",
  ].join("\n")

  assert.equal(hasBlockedBuildWarning(staleBrowserData), false)
})

test("build script keeps Next build behind the shared lock while scanning output", () => {
  const source = fs.readFileSync(path.join(root, "scripts/build.mjs"), "utf8")

  assert.match(source, /export async function runBuild/)
  assert.match(source, /withBuildLock\(\(\) => \{/)
  assert.match(source, /spawnSync\(process\.execPath, \[nextCli, "build"\]/)
  assert.match(source, /encoding: "utf8"/)
  assert.match(source, /process\.stdout\.write\(result\.stdout\)/)
  assert.match(source, /process\.stderr\.write\(result\.stderr\)/)
  assert.match(source, /hasBlockedBuildWarning\(output\)/)
  assert.match(source, /process\.argv\[1\] === fileURLToPath\(import\.meta\.url\)/)
})
