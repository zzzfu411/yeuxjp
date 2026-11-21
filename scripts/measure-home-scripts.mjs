import fs from "node:fs"
import path from "node:path"
import { gzipSync } from "node:zlib"
import { fileURLToPath } from "node:url"

// Measure the scripts actually referenced by the home document. This excludes
// prefetched routes and later dynamic imports; gzip is an offline estimate.
const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const baseUrl = new URL(process.env.E2E_BASE_URL ?? "http://127.0.0.1:3217")
const outputFile = path.resolve(appDir, process.env.BUNDLE_REPORT ?? "output/home-script-size.json")
const requestedBudget = process.env.HOME_SCRIPT_GZIP_BUDGET
const budget = requestedBudget === undefined ? null : Number(requestedBudget)
if (budget !== null && (!Number.isSafeInteger(budget) || budget <= 0)) {
  throw new Error("HOME_SCRIPT_GZIP_BUDGET must be a positive integer in bytes")
}
const response = await fetch(new URL("/", baseUrl))
if (!response.ok) throw new Error(`Home returned HTTP ${response.status}`)
const html = await response.text()
const scripts = [...new Set([...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)]
  .map(match => match[1])
  .filter(src => src.includes("/_next/static/") && src.endsWith(".js")))]
if (!scripts.length) throw new Error("No production Next.js scripts found in the home document")
const files = []
for (const src of scripts) {
  const url = new URL(src, baseUrl)
  const scriptResponse = await fetch(url)
  if (!scriptResponse.ok) throw new Error(`${src}: HTTP ${scriptResponse.status}`)
  const bytes = Buffer.from(await scriptResponse.arrayBuffer())
  files.push({ url: src, raw: bytes.length, gzip: gzipSync(bytes).length })
}
const result = {
  base: baseUrl.origin,
  capturedAt: new Date().toISOString(),
  raw: files.reduce((sum, file) => sum + file.raw, 0),
  gzip: files.reduce((sum, file) => sum + file.gzip, 0),
  files,
}
fs.mkdirSync(path.dirname(outputFile), { recursive: true })
fs.writeFileSync(outputFile, JSON.stringify(result, null, 2) + "\n")
console.log(JSON.stringify({ raw: result.raw, gzip: result.gzip, scripts: files.length, outputFile }))
if (budget !== null && result.gzip > budget) {
  throw new Error(`Home scripts gzip estimate ${result.gzip} B exceeds budget ${budget} B`)
}
