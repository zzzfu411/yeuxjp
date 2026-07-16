import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const kanaDataModule = await loadTsModule("src/data/kana-data.ts")
const kanaIds = await loadTsModule("src/lib/kana-id.ts")

test("canonical kana ids distinguish hiragana and katakana", () => {
  assert.equal(kanaIds.makeKanaId("hiragana", "a"), "hiragana:a")
  assert.equal(kanaIds.makeKanaId("katakana", "a"), "katakana:a")
  assert.equal(kanaIds.makeKanaId("hiragana", "missing"), null)

  assert.deepEqual(kanaIds.parseKanaId("katakana:ka"), {
    id: "katakana:ka",
    script: "katakana",
    romaji: "ka",
    kana: kanaDataModule.kanaData.find((item) => item.romaji === "ka"),
  })
  assert.equal(kanaIds.parseKanaId("a"), null)
  assert.equal(kanaIds.parseKanaId("kana:a"), null)
  assert.equal(kanaIds.parseKanaId("hiragana:sokuon:kitte"), null)
})

test("canonical kana ids cover every glyph exactly once", () => {
  assert.equal(kanaIds.ALL_KANA_IDS.length, kanaDataModule.kanaData.length * 2)
  assert.equal(new Set(kanaIds.ALL_KANA_IDS).size, kanaIds.ALL_KANA_IDS.length)
  assert.ok(kanaIds.ALL_KANA_IDS.every(kanaIds.isKanaId))
})

test("legacy romaji ids expand without overwriting explicit script state", () => {
  assert.deepEqual(kanaIds.expandLegacyKanaId("a"), ["hiragana:a", "katakana:a"])
  assert.deepEqual(kanaIds.expandLegacyKanaId("katakana:a"), ["katakana:a"])
  assert.deepEqual(kanaIds.expandLegacyKanaId("sokuon:kitte"), [])
  assert.deepEqual(kanaIds.normalizeKanaIdList(["a", "hiragana:a", "ka", "a"]), [
    "hiragana:a",
    "katakana:a",
    "hiragana:ka",
    "katakana:ka",
  ])

  const legacy = { box: 1 }
  const explicit = { box: 4 }
  assert.deepEqual(kanaIds.normalizeKanaIdRecord({ a: legacy, "katakana:a": explicit }), {
    "hiragana:a": legacy,
    "katakana:a": explicit,
  })
})

test("kana helpers resolve glyphs and infer script from visible text", () => {
  assert.equal(kanaIds.getKanaGlyph("hiragana:a"), "あ")
  assert.equal(kanaIds.getKanaGlyph("katakana:a"), "ア")
  assert.equal(kanaIds.inferKanaScriptFromText("ア 对应什么"), "katakana")
  assert.equal(kanaIds.inferKanaScriptFromText("あ 的读音"), "hiragana")
  assert.equal(kanaIds.inferKanaScriptFromText("a"), null)
  assert.equal(kanaIds.resolveKanaId("a"), "hiragana:a")
  assert.equal(kanaIds.resolveKanaId("a", "katakana"), "katakana:a")
})
