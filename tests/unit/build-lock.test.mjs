import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { acquireBuildLock, withBuildLock } from "../../scripts/build-lock.mjs"

function tempLockDir(name) {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "yasashi-build-lock-")), name)
}

test("build lock serializes concurrent critical sections", async () => {
  const lockDir = tempLockDir("next-build.lock")
  const events = []
  const releaseFirst = await acquireBuildLock({ lockDir, label: "first", timeoutMs: 1000, pollMs: 10 })

  const second = withBuildLock(async () => {
    events.push("second entered")
  }, { lockDir, label: "second", timeoutMs: 1000, pollMs: 10 })

  await new Promise((resolve) => setTimeout(resolve, 50))
  assert.deepEqual(events, [], "second lock holder should wait until the first lock is released")

  releaseFirst()
  await second
  assert.deepEqual(events, ["second entered"])
  assert.equal(fs.existsSync(lockDir), false, "lock directory should be removed after release")
})

test("build lock removes stale lock directories", async () => {
  const lockDir = tempLockDir("stale-next-build.lock")
  fs.mkdirSync(lockDir, { recursive: true })
  fs.writeFileSync(path.join(lockDir, "owner.json"), JSON.stringify({ label: "stale" }))

  const staleTime = new Date(Date.now() - 60_000)
  fs.utimesSync(lockDir, staleTime, staleTime)

  const release = await acquireBuildLock({ lockDir, label: "fresh", staleMs: 10, timeoutMs: 1000, pollMs: 10 })
  const owner = JSON.parse(fs.readFileSync(path.join(lockDir, "owner.json"), "utf8"))

  assert.equal(owner.label, "fresh")
  release()
})
