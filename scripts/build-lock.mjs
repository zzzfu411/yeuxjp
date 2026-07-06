import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const appDir = fileURLToPath(new URL("..", import.meta.url))
export const defaultBuildLockDir = path.join(appDir, ".test-cache", "next-build.lock")

const DEFAULT_TIMEOUT_MS = 180_000
const DEFAULT_STALE_MS = 15 * 60_000
const DEFAULT_POLL_MS = 250

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readOwner(lockDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(lockDir, "owner.json"), "utf8"))
  } catch {
    return null
  }
}

function writeOwner(lockDir, owner) {
  fs.writeFileSync(path.join(lockDir, "owner.json"), JSON.stringify(owner, null, 2))
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false

  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (error?.code === "ESRCH") return false
    if (error?.code === "EPERM") return true
    return false
  }
}

function removeDeadOwnerLock(lockDir, ownerProcessExists = isProcessAlive) {
  const owner = readOwner(lockDir)
  if (!owner || !Number.isInteger(owner.pid) || owner.pid <= 0) return false
  if (ownerProcessExists(owner.pid)) return false

  fs.rmSync(lockDir, { recursive: true, force: true })
  return true
}

function removeStaleLock(lockDir, staleMs) {
  const stats = fs.statSync(lockDir)
  if (Date.now() - stats.mtimeMs < staleMs) return false
  fs.rmSync(lockDir, { recursive: true, force: true })
  return true
}

export async function acquireBuildLock({
  lockDir = defaultBuildLockDir,
  label = "next-build",
  timeoutMs = numberFromEnv("YASASHI_BUILD_LOCK_TIMEOUT_MS", DEFAULT_TIMEOUT_MS),
  staleMs = numberFromEnv("YASASHI_BUILD_LOCK_STALE_MS", DEFAULT_STALE_MS),
  pollMs = numberFromEnv("YASASHI_BUILD_LOCK_POLL_MS", DEFAULT_POLL_MS),
  ownerProcessExists = isProcessAlive,
} = {}) {
  const startedAt = Date.now()
  const token = `${process.pid}-${startedAt}-${Math.random().toString(36).slice(2)}`
  const owner = {
    token,
    pid: process.pid,
    label,
    createdAt: new Date(startedAt).toISOString(),
  }

  fs.mkdirSync(path.dirname(lockDir), { recursive: true })

  while (true) {
    try {
      fs.mkdirSync(lockDir)
      writeOwner(lockDir, owner)

      return function releaseBuildLock() {
        const currentOwner = readOwner(lockDir)
        if (currentOwner?.token !== token) return
        fs.rmSync(lockDir, { recursive: true, force: true })
      }
    } catch (error) {
      if (error?.code !== "EEXIST") throw error

      if (removeStaleLock(lockDir, staleMs)) continue
      if (removeDeadOwnerLock(lockDir, ownerProcessExists)) continue

      if (Date.now() - startedAt > timeoutMs) {
        const currentOwner = readOwner(lockDir)
        const ownerLabel = currentOwner?.label ? ` held by ${currentOwner.label}` : ""
        throw new Error(`Timed out waiting for Next.js build lock${ownerLabel}`)
      }

      await sleep(pollMs)
    }
  }
}

export async function withBuildLock(callback, options) {
  const release = await acquireBuildLock(options)
  try {
    return await callback()
  } finally {
    release()
  }
}
