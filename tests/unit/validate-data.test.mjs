import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..", "..")

test("data validation script passes for the current repository", () => {
  const result = spawnSync("node", ["scripts/validate-data.mjs"], {
    cwd: root,
    encoding: "utf8",
  })

  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /Data validation passed/)
})
