import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { loadTsModule } from "./load-ts-module.mjs"

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const levels = await loadTsModule("src/data/vocabulary/levels.ts")
const safeId = await loadTsModule("src/lib/safe-id.ts")
const progressModel = await loadTsModule("src/lib/learning-progress-model.ts")
const stageKanji = await loadTsModule("src/data/stage-kanji.ts")

test("getVocabLevelForId resolves every stage kanji vocabulary item to its vocabulary level", () => {
  assert.equal(levels.getVocabLevelForId("sur-g-1"), "survival")
  assert.equal(levels.getVocabLevelForId("day-10"), "daily")
  assert.equal(levels.getVocabLevelForId("flu-3"), "fluent")
  assert.equal(levels.getVocabLevelForId("unknown-1"), null)
  assert.equal(levels.getVocabLevelForId(null), null)

  for (const questions of Object.values(stageKanji.STAGE_KANJI)) {
    for (const question of questions) {
      assert.notEqual(
        levels.getVocabLevelForId(question.id),
        null,
        `Stage kanji ${question.id} should resolve to a vocabulary level`
      )
    }
  }
})

test("generateSafeId returns unique non-empty ids and isSafeRecordKey rejects prototype keys", () => {
  const a = safeId.generateSafeId()
  const b = safeId.generateSafeId()
  assert.ok(typeof a === "string" && a.length >= 12)
  assert.notEqual(a, b)
  assert.equal(safeId.isSafeRecordKey("__proto__"), false)
  assert.equal(safeId.isSafeRecordKey("constructor"), false)
  assert.equal(safeId.isSafeRecordKey("prototype"), false)
  assert.equal(safeId.isSafeRecordKey(""), false)
  assert.equal(safeId.isSafeRecordKey("day-1-a-row-hello"), true)
})

test("learning progress normalizers reject prototype-pollution keys", () => {
  const pollutedLessons = JSON.parse(
    '{"__proto__":{"lessonId":"__proto__","status":"completed","startedAt":1},"constructor":{"lessonId":"constructor","status":"completed","startedAt":1},"day-1":{"lessonId":"day-1","status":"started","startedAt":10}}'
  )
  const normalizedLessons = progressModel.normalizeLessonProgressMap(pollutedLessons, 100)
  assert.deepEqual(Object.keys(normalizedLessons), ["day-1"])

  const pollutedItems = JSON.parse(
    '{"__proto__":{"itemId":"__proto__","itemType":"vocab","attempts":1,"correct":1},"prototype":{"itemId":"prototype","itemType":"vocab","attempts":1,"correct":1},"sur-g-1":{"itemId":"sur-g-1","itemType":"vocab","attempts":2,"correct":2}}'
  )
  const normalizedItems = progressModel.normalizeItemProgressMap(pollutedItems, 100)
  assert.deepEqual(Object.keys(normalizedItems), ["sur-g-1"])
})

test("client review runner and vocab course appearances avoid eager heavy dataset imports", () => {
  const appearancesSrc = fs.readFileSync(
    path.join(webDir, "src/components/vocabulary/vocab-course-appearances.tsx"),
    "utf8"
  )
  assert.doesNotMatch(appearancesSrc, /import\(["']@\/data\/lessons["']\)/)
  assert.match(appearancesSrc, /import\(["']@\/data\/lesson-catalog["']\)/)

  const reviewRunnerSrc = fs.readFileSync(
    path.join(webDir, "src/components/review/review-runner.tsx"),
    "utf8"
  )
  assert.doesNotMatch(reviewRunnerSrc, /from ["']@\/lib\/knowledge-review-variant["']/)
  assert.match(reviewRunnerSrc, /from ["']@\/lib\/knowledge-review-snapshot["']/)

  const recentMistakesSrc = fs.readFileSync(
    path.join(webDir, "src/components/review/recent-mistakes.tsx"),
    "utf8"
  )
  assert.doesNotMatch(recentMistakesSrc, /from ["']@\/lib\/today-review-session["']/)
  assert.match(recentMistakesSrc, /from ["']@\/lib\/mistake-review-kind["']/)
})

test("KanaGlyphBoard renders pure React SVG geometry without dangerouslySetInnerHTML", async () => {
  const boardSrc = fs.readFileSync(
    path.join(webDir, "src/components/kana/kana-glyph-board.tsx"),
    "utf8"
  )
  assert.doesNotMatch(boardSrc, /dangerouslySetInnerHTML/)
  assert.doesNotMatch(boardSrc, /<style\b/)

  const animcjk = await loadTsModule("src/lib/animcjk.ts")
  const sampleSvg = fs.readFileSync(path.join(webDir, "public/animcjk/kana/12354.svg"), "utf8")
  const parsed = animcjk.parseAnimCJK(sampleSvg)
  assert.equal(parsed.strokeCount, 3)
  assert.ok(parsed.geometry)
  assert.equal(parsed.geometry.basePaths.length, 4)
  assert.equal(parsed.geometry.clipPaths.length, 4)
  assert.equal(parsed.geometry.strokes.length, 4)
  assert.deepEqual(
    parsed.geometry.strokes.map((s) => s.index),
    [1, 2, 3, 3]
  )
})
