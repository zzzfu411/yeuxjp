import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const root = path.resolve(import.meta.dirname, "..", "..")
const model = await loadTsModule("src/lib/path-page-model.ts")

function stat(done, total) {
  return { done, total, ratio: total ? done / total : 0 }
}

function kanaStats({
  seion = stat(50, 50),
  dakuon = stat(25, 25),
  yoon = stat(30, 30),
  special = stat(1, 1),
} = {}) {
  return { seion, dakuon, yoon, special }
}

function vocabStats({ survival = stat(200, 505), daily = stat(0, 240), fluent = stat(0, 195) } = {}) {
  return { survival, daily, fluent }
}

test("path page model derives kana skill stats by learning group", () => {
  const data = [
    { romaji: "a", hiragana: "a", katakana: "A", type: "seion" },
    { romaji: "ka", hiragana: "ka", katakana: "KA", type: "seion" },
    { romaji: "ga", hiragana: "ga", katakana: "GA", type: "dakuon" },
    { romaji: "pa", hiragana: "pa", katakana: "PA", type: "handakuon" },
    { romaji: "kya", hiragana: "kya", katakana: "KYA", type: "yoon" },
    { romaji: "sokuon", hiragana: "sokuon", katakana: "SOKUON", type: "special" },
  ]

  const stats = model.getKanaSkillStats(data, (romaji) => romaji === "a" || romaji === "pa" || romaji === "sokuon")

  assert.deepEqual(stats.seion, { total: 2, done: 1, ratio: 0.5 })
  assert.deepEqual(stats.dakuon, { total: 2, done: 1, ratio: 0.5 })
  assert.deepEqual(stats.yoon, { total: 1, done: 0, ratio: 0 })
  assert.deepEqual(stats.special, { total: 1, done: 1, ratio: 1 })
})

test("path page model recommends the next skill from shared thresholds", () => {
  assert.equal(model.getRecommendedSkillId(kanaStats({ seion: stat(34, 50) }), vocabStats()), "kana-seion")
  assert.equal(model.getRecommendedSkillId(kanaStats({ dakuon: stat(8, 25) }), vocabStats()), "kana-dakuon")
  assert.equal(model.getRecommendedSkillId(kanaStats({ yoon: stat(10, 30) }), vocabStats()), "kana-yoon")
  assert.equal(model.getRecommendedSkillId(kanaStats({ special: stat(0, 1) }), vocabStats()), "kana-sokuon")
  assert.equal(model.getRecommendedSkillId(kanaStats(), vocabStats({ survival: stat(120, 505) })), "vocab-survival")
  assert.equal(model.getRecommendedSkillId(kanaStats(), vocabStats()), "particles-basic")
})

test("path page model soft-locks skills and formats progress badges", () => {
  const lockedKana = kanaStats({ seion: stat(10, 50), special: stat(0, 1) })
  assert.equal(model.isSkillUnlocked("listen-kana", lockedKana, vocabStats()), false)
  assert.equal(model.isSkillUnlocked("kana-seion", lockedKana, vocabStats()), true)
  assert.deepEqual(model.getSkillStatus("listen-kana", lockedKana, vocabStats()), {
    status: "locked",
    badge: "\u5efa\u8bae\u7a0d\u540e",
  })

  assert.deepEqual(model.getSkillStatus("kana-seion", kanaStats({ seion: stat(0, 50) }), vocabStats()), {
    status: "available",
    badge: "\u4ece\u8fd9\u91cc\u5f00\u59cb",
  })
  assert.deepEqual(model.getSkillStatus("kana-seion", kanaStats({ seion: stat(20, 50) }), vocabStats()), {
    status: "in-progress",
    badge: "\u8fdb\u5ea6 20/50",
  })
  assert.deepEqual(model.getSkillStatus("kana-seion", kanaStats({ seion: stat(45, 50) }), vocabStats()), {
    status: "done",
    badge: "\u5df2\u638c\u63e1 45/50",
  })
  assert.deepEqual(model.getSkillStatus("vocab-survival", kanaStats(), vocabStats({ survival: stat(303, 505) })), {
    status: "done",
    badge: "\u5df2\u638c\u63e1 303/505",
  })
  assert.equal(model.ratioText(Number.POSITIVE_INFINITY, Number.NaN), "0/0")
  assert.equal(model.ratioText(12, 10), "10/10")
  assert.deepEqual(
    model.getSkillStatus("kana-seion", kanaStats({ seion: { done: 999, total: 50, ratio: Number.NaN } }), vocabStats()),
    {
      status: "in-progress",
      badge: "\u8fdb\u5ea6 50/50",
    }
  )
  assert.equal(
    model.isSkillUnlocked("listen-kana", kanaStats({ seion: { done: 50, total: 50, ratio: Number.POSITIVE_INFINITY } }), vocabStats()),
    false
  )
})

test("path page model summarizes five-dimension mastery", () => {
  const summary = model.getPathMasterySummary({
    a: {
      itemId: "a",
      itemType: "kana",
      recognition: 100,
      listening: 50,
      meaning: 0,
      recall: 25,
      production: 25,
      attempts: 3,
      correct: 2,
      updatedAt: 1,
    },
    b: {
      itemId: "b",
      itemType: "vocab",
      recognition: 40,
      listening: 40,
      meaning: 40,
      recall: 40,
      production: 80,
      attempts: 2,
      correct: 2,
      updatedAt: 2,
    },
  })

  assert.deepEqual(summary, { avg: 44, attempts: 5, production: 53 })
  assert.deepEqual(
    model.getPathMasterySummary({
      broken: {
        itemId: "broken",
        itemType: "kana",
        recognition: Number.NaN,
        listening: 100,
        meaning: 100,
        recall: 100,
        production: Number.POSITIVE_INFINITY,
        attempts: Number.NaN,
        correct: 0,
        updatedAt: 1,
      },
      clamped: {
        itemId: "clamped",
        itemType: "vocab",
        recognition: 100,
        listening: 100,
        meaning: 100,
        recall: 100,
        production: 120,
        attempts: 2.9,
        correct: 2,
        updatedAt: 2,
      },
    }),
    { avg: 80, attempts: 2, production: 50 }
  )
  assert.deepEqual(model.getPathMasterySummary({}), { avg: 0, attempts: 0, production: 0 })
})

test("path and next-step surfaces consume the shared recommendation hook", () => {
  const pathRoute = fs.readFileSync(path.join(root, "src/app/path/page.tsx"), "utf8")
  const pathPage = fs.readFileSync(path.join(root, "src/components/path/skill-tree-page.tsx"), "utf8")
  const nextStep = fs.readFileSync(path.join(root, "src/components/learning/next-step-card.tsx"), "utf8")

  assert.doesNotMatch(pathRoute, /"use client"/)
  assert.match(pathRoute, /from "@\/components\/path\/skill-tree-page"/)
  assert.match(pathRoute, /<SkillTreePage \/>/)
  assert.doesNotMatch(pathRoute, /useLearningRecommendation\(\)/)

  for (const source of [pathPage, nextStep]) {
    assert.match(source, /from "@\/lib\/learning-recommendation"/)
    assert.match(source, /useLearningRecommendation\(\)/)
    assert.doesNotMatch(source, /useKanaProgress/)
    assert.doesNotMatch(source, /useVocabProgress/)
    assert.doesNotMatch(source, /useLearningStatus/)
    assert.doesNotMatch(source, /getKanaSkillStats\(kanaData/)
    assert.doesNotMatch(source, /summarizeLearnedVocabIds/)
    assert.doesNotMatch(source, /getRecommendedSkillId\(kanaStats, vocabStats\)/)
    assert.doesNotMatch(source, /if \(kanaStats\.seion\.ratio < 0\.7\)/)
  }

  assert.match(pathPage, /from "@\/lib\/path-page-model"/)
  assert.match(pathPage, /getSkillStatus\(skill\.id, kanaStats, vocabStats\)/)
  assert.match(pathPage, /getPathMasterySummary\(learning\.items\)/)
  assert.match(pathPage, /from "@\/components\/path\/path-starter-lessons"/)
  assert.match(pathPage, /<PathStarterLessons completedLessonIds=\{learning\.completedLessonIds\} activeLessonId=\{nextLesson\?\.id\} \/>/)
  assert.doesNotMatch(pathPage, /STARTER_LESSONS\.slice/)
})

test("PathStarterLessons renders the complete starter course", () => {
  const source = fs.readFileSync(path.join(root, "src/components/path/path-starter-lessons.tsx"), "utf8")

  assert.match(source, /export function PathStarterLessons/)
  assert.match(source, /completedLessonIds: ReadonlySet<string>/)
  assert.match(source, /activeLessonId: string \| null \| undefined/)
  assert.match(source, /STARTER_LESSONS\.map/)
  assert.doesNotMatch(source, /STARTER_LESSONS\.slice/)
  assert.match(source, /getLessonEntryStatus\(lesson, completedLessonIds, activeLessonId\)/)
  assert.match(source, /getLessonEntryBadge\(status\)/)
  assert.match(source, /completedLessonIds\.size/)
  assert.match(source, /STARTER_LESSONS\.length/)
})
