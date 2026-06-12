import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const root = path.resolve(import.meta.dirname, "..", "..")
const devLog = await loadTsModule("src/lib/dev-log.ts")

test("warnInDevelopment is the only runtime console warning wrapper", () => {
  const source = fs.readFileSync(path.join(root, "src/lib/dev-log.ts"), "utf8")

  assert.match(source, /export function warnInDevelopment/)
  assert.match(source, /process\.env\.NODE_ENV !== "development"/)
  assert.match(source, /console\.warn\(message, \.\.\.args\)/)
})

test("warnInDevelopment is quiet outside development", () => {
  const originalEnv = process.env.NODE_ENV
  const originalWarn = console.warn
  const calls = []
  process.env.NODE_ENV = "production"
  console.warn = (...args) => calls.push(args)

  try {
    devLog.warnInDevelopment("hidden", { detail: true })
    assert.deepEqual(calls, [])
  } finally {
    console.warn = originalWarn
    process.env.NODE_ENV = originalEnv
  }
})

test("warnInDevelopment preserves diagnostics during development", () => {
  const originalEnv = process.env.NODE_ENV
  const originalWarn = console.warn
  const calls = []
  process.env.NODE_ENV = "development"
  console.warn = (...args) => calls.push(args)

  try {
    devLog.warnInDevelopment("visible", { detail: true })
    assert.deepEqual(calls, [["visible", { detail: true }]])
  } finally {
    console.warn = originalWarn
    process.env.NODE_ENV = originalEnv
  }
})
