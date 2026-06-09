import assert from "node:assert/strict"
import fs from "node:fs"
import { spawnSync } from "node:child_process"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..", "..")

test("data validation script passes for the current repository", () => {
  const result = spawnSync("node", ["scripts/validate-data.mjs"], {
    cwd: path.join(root, "web"),
    encoding: "utf8",
  })

  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /Data validation passed/)
})

test("data validation scans source and docs for common mojibake fragments", () => {
  const source = fs.readFileSync(path.join(root, "web/scripts/validate-data.mjs"), "utf8")

  assert.match(source, /function validateNoMojibakeMarkers/)
  assert.match(source, /walkFiles\(srcDir/)
  assert.match(source, /README\.md/)
  assert.match(source, /workspaceRoot/)
  assert.match(source, /CLAUDE\.md/)
  assert.match(source, /README_CODEX\.md/)
  for (const marker of ["绗旈", "寰楀", "褰撳", "瀛︿", "澶囦", "鏃犳", "娓呯", "閿欓", "瀵煎", "銇裤"]) {
    assert.ok(source.includes(marker), `validator should detect ${marker}`)
  }
  assert.match(source, /source\/docs text contains likely mojibake markers/)
})

test("data validation checks lesson practice metadata and references", () => {
  const source = fs.readFileSync(path.join(root, "web/scripts/validate-data.mjs"), "utf8")

  assert.match(source, /function validateLessonPracticeMetadata/)
  assert.match(source, /lesson practice metadata checked/)
  assert.match(source, /itemType/)
  assert.match(source, /mode/)
  assert.match(source, /references missing kana itemId/)
  assert.match(source, /references missing vocabulary itemId/)
  assert.match(source, /references missing grammar itemId/)
  assert.match(source, /answer is not present in options/)
  assert.match(source, /sentence itemId must start with sentence-/)
})

test("data validation requires explicit vocabulary fields and matching levels", () => {
  const source = fs.readFileSync(path.join(root, "web/scripts/validate-data.mjs"), "utf8")

  assert.match(source, /requiredString\(block, file, id, "kana"\)/)
  assert.match(source, /requiredString\(block, file, id, "romaji"\)/)
  assert.match(source, /requiredString\(block, file, id, "meaning"\)/)
  assert.match(source, /requiredString\(block, file, id, "category"\)/)
  assert.match(source, /requiredString\(block, file, id, "level"\)/)
  assert.match(source, /level must match file level/)
  assert.doesNotMatch(source, /prop\(block, "level"\) \?\? defaultLevel/)
})
