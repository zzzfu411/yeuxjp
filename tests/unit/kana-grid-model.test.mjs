import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const root = path.resolve(import.meta.dirname, "..", "..")
const model = await loadTsModule("src/lib/kana-grid-model.ts")

const sample = [
  { romaji: "ya", hiragana: "や", katakana: "ヤ", row: "ya", type: "seion" },
  { romaji: "yu", hiragana: "ゆ", katakana: "ユ", row: "ya", type: "seion" },
  { romaji: "yo", hiragana: "よ", katakana: "ヨ", row: "ya", type: "seion" },
  { romaji: "wa", hiragana: "わ", katakana: "ワ", row: "wa", type: "seion" },
  { romaji: "wo", hiragana: "を", katakana: "ヲ", row: "wa", type: "seion" },
  { romaji: "n", hiragana: "ん", katakana: "ン", row: "n", type: "seion" },
  { romaji: "kya", hiragana: "きゃ", katakana: "キャ", row: "ky", type: "yoon" },
]

function values(row) {
  return row.map((item) => item?.romaji ?? null)
}

test("kana grid model preserves five-column gojuon spacing", () => {
  assert.deepEqual(values(model.getKanaGridRowContent(sample, "ya", 5)), ["ya", null, "yu", null, "yo"])
  assert.deepEqual(values(model.getKanaGridRowContent(sample, "wa", 5)), ["wa", null, null, null, "wo"])
  assert.deepEqual(values(model.getKanaGridRowContent(sample, "n", 5)), ["n", null, null, null, null])
  assert.deepEqual(values(model.getKanaGridRowContent(sample, "ky", 3)), ["kya"])
})

test("kana grid model derives adjacent indexes without duplicates", () => {
  assert.deepEqual(model.getAdjacentKanaIndexes(null, 3), [])
  assert.deepEqual(model.getAdjacentKanaIndexes(0, 0), [])
  assert.deepEqual(model.getAdjacentKanaIndexes(0, 1), [0])
  assert.deepEqual(model.getAdjacentKanaIndexes(0, 3), [0, 1, 2])
  assert.deepEqual(model.getAdjacentKanaIndexes(2, 3), [2, 0, 1])
})

test("kana grid model checks and prefetches AnimCJK stroke SVG resources", async () => {
  const calls = []
  const okFetcher = async (url, init) => {
    calls.push({ url, init })
    return { ok: true, status: 200 }
  }

  assert.equal(await model.checkStrokeAvailability("きゃ", okFetcher), true)
  assert.equal(calls.length, 2)
  assert.equal(calls.every((call) => call.init.method === "HEAD"), true)

  const fallbackCalls = []
  const fallbackFetcher = async (url, init = {}) => {
    fallbackCalls.push({ url, init })
    return init.method === "HEAD" ? { ok: false, status: 405 } : { ok: true, status: 200 }
  }

  assert.equal(await model.checkStrokeAvailability("あ", fallbackFetcher), true)
  assert.deepEqual(fallbackCalls.map((call) => call.init.method ?? "GET"), ["HEAD", "GET"])

  const offlineCachedCalls = []
  const offlineCachedFetcher = async (url, init = {}) => {
    offlineCachedCalls.push({ url, init })
    if (init.method === "HEAD") throw new Error("HEAD unavailable offline")
    return { ok: true, status: 200 }
  }

  assert.equal(await model.checkStrokeAvailability("あ", offlineCachedFetcher), true)
  assert.deepEqual(offlineCachedCalls.map((call) => call.init.method ?? "GET"), ["HEAD", "GET"])

  const missingFetcher = async () => ({ ok: false, status: 404 })
  assert.equal(await model.checkStrokeAvailability("あ", missingFetcher), false)

  const prefetchCalls = []
  model.prefetchStrokeSvgs("きゃ", async (url, init) => {
    prefetchCalls.push({ url, init })
    return { ok: true, status: 200 }
  })
  assert.equal(prefetchCalls.length, 2)
  assert.equal(prefetchCalls.every((call) => call.init.cache === "force-cache"), true)
})

test("KanaGrid delegates stroke resources and row layout to kana-grid-model", () => {
  const source = fs.readFileSync(path.join(root, "src/components/kana/kana-grid.tsx"), "utf8")

  assert.match(source, /from "@\/lib\/kana-grid-model"/)
  assert.match(source, /getAdjacentKanaIndexes\(selectedIndex, data\.length\)/)
  assert.match(source, /getKanaGridRowContent\(data, row, columns\)/)
  assert.match(source, /checkStrokeAvailability\(currentChar\)/)
  assert.match(source, /prefetchStrokeSvgs\(char\)/)
  assert.doesNotMatch(source, /function cacheKeyForChar/)
  assert.doesNotMatch(source, /function prefetchStrokeSvgs/)
  assert.doesNotMatch(source, /const getRowContent =/)
})
