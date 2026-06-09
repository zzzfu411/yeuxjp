import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const root = path.resolve(import.meta.dirname, "..", "..")
const model = await loadTsModule("src/lib/kana-page-model.ts")

const sample = [
  { romaji: "a", hiragana: "あ", katakana: "ア", row: "a", type: "seion" },
  { romaji: "ka", hiragana: "か", katakana: "カ", row: "ka", type: "seion" },
  { romaji: "ga", hiragana: "が", katakana: "ガ", row: "ga", type: "dakuon" },
  { romaji: "pa", hiragana: "ぱ", katakana: "パ", row: "pa", type: "handakuon" },
  { romaji: "kya", hiragana: "きゃ", katakana: "キャ", row: "ky", type: "yoon" },
  { romaji: "small-tsu", hiragana: "っ", katakana: "ッ", row: "special", type: "special" },
]

test("kana page model parses only known kana set URL values", () => {
  assert.equal(model.parseKanaSet("seion"), "seion")
  assert.equal(model.parseKanaSet("dakuon"), "dakuon")
  assert.equal(model.parseKanaSet("yoon"), "yoon")
  assert.equal(model.parseKanaSet("special"), "special")
  assert.equal(model.parseKanaSet("all"), "all")
  assert.equal(model.parseKanaSet("unknown"), null)
  assert.equal(model.parseKanaSet(null), null)
})

test("kana page model returns data for each kana set", () => {
  assert.deepEqual(model.getKanaSetData(sample, "seion").map((item) => item.romaji), ["a", "ka"])
  assert.deepEqual(model.getKanaSetData(sample, "dakuon").map((item) => item.romaji), ["ga", "pa"])
  assert.deepEqual(model.getKanaSetData(sample, "yoon").map((item) => item.romaji), ["kya"])
  assert.deepEqual(model.getKanaSetData(sample, "special").map((item) => item.romaji), ["small-tsu"])
  assert.deepEqual(model.getKanaSetData(sample, "all").map((item) => item.romaji), sample.map((item) => item.romaji))
})

test("kana page model filters progress, derives visible rows, and counts mastery", () => {
  const mastered = new Set(["a", "pa"])
  const isMastered = (romaji) => mastered.has(romaji)

  assert.deepEqual(model.filterKanaByProgress(sample, true, isMastered).map((item) => item.romaji), [
    "ka",
    "ga",
    "kya",
    "small-tsu",
  ])
  assert.deepEqual(model.getKanaRowsForData(["a", "ka", "sa", "ga"], model.getKanaSetData(sample, "all")), ["a", "ka", "ga"])
  assert.deepEqual(model.getKanaProgress(sample, isMastered), { learned: 2, total: 6 })
})

test("kana page delegates reusable data derivation to kana-page-model", () => {
  const source = fs.readFileSync(path.join(root, "src/app/kana/page.tsx"), "utf8")
  const hook = fs.readFileSync(path.join(root, "src/components/kana/use-kana-page-data.ts"), "utf8")
  const controls = fs.readFileSync(path.join(root, "src/components/kana/use-kana-page-controls.ts"), "utf8")

  assert.match(source, /from "@\/components\/kana\/use-kana-page-controls"/)
  assert.match(source, /useKanaPageControls\(\)/)
  assert.match(controls, /useSearchParams\(\)/)
  assert.match(controls, /parseKanaSet\(urlSet\)/)
  assert.match(controls, /setMode\(urlMode\)/)
  assert.match(controls, /setShowRomaji\(\(value\) => !value\)/)
  assert.match(controls, /setOnlyUnmastered\(\(value\) => !value\)/)
  assert.match(source, /from "@\/components\/kana\/use-kana-page-data"/)
  assert.match(source, /useKanaPageData\(kanaSet, onlyUnmastered, isMastered\)/)
  assert.match(hook, /from "@\/lib\/kana-page-model"/)
  assert.match(hook, /getKanaSetData\(kanaData, kanaSet\)/)
  assert.match(hook, /filterKanaByProgress\(seion, onlyUnmastered, isMastered\)/)
  assert.match(hook, /getKanaRowsForData\(KANA_ROWS\.seion, visibleSeion\)/)
  assert.match(hook, /getKanaProgress\(activeData, isMastered\)/)
  assert.doesNotMatch(source, /const allowed: KanaSet\[\]/)
  assert.doesNotMatch(source, /const seionRows =/)
  assert.doesNotMatch(source, /filterKanaByProgress/)
  assert.doesNotMatch(source, /getKanaRowsForData/)
  assert.doesNotMatch(source, /activeData\.reduce/)
  assert.doesNotMatch(source, /useSearchParams/)
  assert.doesNotMatch(source, /parseKanaSet\(urlSet\)/)
})
