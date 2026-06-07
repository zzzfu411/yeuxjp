import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")
const sw = fs.readFileSync(path.join(root, "public/sw.js"), "utf8")
const layout = fs.readFileSync(path.join(root, "src/app/layout.tsx"), "utf8")
const register = fs.readFileSync(path.join(root, "src/components/pwa-register.tsx"), "utf8")

test("PWA registers a production service worker and exposes install metadata", () => {
  assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/)
  assert.match(layout, /appleWebApp:\s*\{/)
  assert.match(layout, /themeColor:\s*"#ffb7b2"/)
  assert.match(register, /process\.env\.NODE_ENV !== "production"/)
  assert.match(register, /navigator\.serviceWorker\.register\("\/sw\.js"\)/)
})

test("service worker caches only static shell resources and AnimCJK SVGs", () => {
  assert.match(sw, /const CACHE_NAME = "yasashi-static-v\d+"/)
  assert.match(sw, /const OFFLINE_FALLBACK_URL = "\/offline\.html"/)
  assert.match(sw, /const requestUrl = new URL\(request\.url\)/)
  assert.match(sw, /requestUrl\.origin !== self\.location\.origin/)
  assert.match(sw, /request\.method !== "GET"/)
  assert.match(sw, /request\.mode === "navigate"/)
  assert.match(sw, /caches\.match\(OFFLINE_FALLBACK_URL\)/)
  assert.match(sw, /request\.destination === "image"/)
  assert.match(sw, /request\.destination === "style"/)
  assert.match(sw, /request\.destination === "script"/)
  assert.match(sw, /requestUrl\.pathname\.startsWith\("\/animcjk\/"\)/)
  assert.match(sw, /requestUrl\.pathname\.endsWith\("\.svg"\)/)
  assert.doesNotMatch(sw, /localStorage/)
  assert.doesNotMatch(sw, /yasashi\.learning/)
  assert.doesNotMatch(sw, /yasashi\.srs/)
  assert.doesNotMatch(sw, /yasashi\.mistakes/)
})
