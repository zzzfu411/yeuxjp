import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const lessons = await loadTsModule("src/data/lessons.ts")
const model = await loadTsModule("src/lib/home-page-model.ts")

const item = (overrides) => ({
  itemId: "item",
  itemType: "vocab",
  recognition: 0,
  listening: 0,
  meaning: 0,
  recall: 0,
  production: 0,
  attempts: 0,
  correct: 0,
  updatedAt: 1,
  ...overrides,
})

test("home page model counts both scripts of a as independent visible due work", () => {
  const home = model.buildHomePageModel({
    completedLessonIds: new Set(),
    items: {
      "hiragana:a": item({ itemId: "hiragana:a", itemType: "kana", recognition: 18, attempts: 1, correct: 1 }),
      "katakana:a": item({ itemId: "katakana:a", itemType: "kana", recognition: 18, attempts: 1, correct: 1 }),
      "sur-g-1": item({ itemId: "sur-g-1", itemType: "vocab", meaning: 18, attempts: 1, correct: 1 }),
    },
    kanaDueIds: ["hiragana:a", "katakana:a", "katakana:ka", "sokuon:kitte"],
    vocabDueIds: ["sur-g-1", "sur-g-999"],
    mistakeDueIds: ["m1", "ghost"],
    mistakeIds: ["m1"],
  })

  assert.deepEqual(home.dueMistakeIds, ["m1"])
  assert.equal(home.totalDue, 4)
  assert.equal(home.nextLesson.id, lessons.STARTER_LESSONS[0].id)
  assert.equal(home.learningEntry.href, `/learn/${lessons.STARTER_LESSONS[0].id}`)
  assert.equal(home.completedCount, 0)
  assert.deepEqual(home.weakest, { id: "hiragana:a", display: "あ (a)", label: "\u5047\u540d", score: 4 })
})

test("home page model includes explicit mastered and learned ids in visible due work", () => {
  const home = model.buildHomePageModel({
    completedLessonIds: new Set(),
    items: {},
    masteredKanaIds: ["katakana:ka"],
    learnedVocabIds: ["sur-g-2"],
    kanaDueIds: ["katakana:ka", "hiragana:ta"],
    vocabDueIds: ["sur-g-2", "sur-g-999"],
    mistakeDueIds: [],
    mistakeIds: [],
  })

  assert.equal(home.totalDue, 2)
})

test("home page model ignores stale vocabulary ids when counting due work", () => {
  const home = model.buildHomePageModel({
    completedLessonIds: new Set(),
    items: {
      "sur-g-999": item({ itemId: "sur-g-999", itemType: "vocab", meaning: 18, attempts: 1, correct: 1 }),
    },
    learnedVocabIds: ["sur-g-999"],
    kanaDueIds: [],
    vocabDueIds: ["sur-g-999"],
    mistakeDueIds: [],
    mistakeIds: [],
  })

  assert.equal(home.totalDue, 0)
})

test("home page weakest item ignores stale vocabulary, non-reviewable kana, and unattempted items", () => {
  const home = model.buildHomePageModel({
    completedLessonIds: new Set(),
    items: {
      "sur-g-999": item({ itemId: "sur-g-999", itemType: "vocab", recognition: 1, attempts: 1, correct: 0 }),
      "sokuon:kitte": item({ itemId: "sokuon:kitte", itemType: "kana", recognition: 1, attempts: 1, correct: 0 }),
      "sur-g-1": item({ itemId: "sur-g-1", itemType: "vocab", recognition: 0, attempts: 0, correct: 0 }),
      "sur-g-2": item({ itemId: "sur-g-2", itemType: "vocab", recognition: 30, meaning: 40, recall: 50, attempts: 2, correct: 1 }),
    },
    kanaDueIds: [],
    vocabDueIds: [],
    mistakeDueIds: [],
    mistakeIds: [],
  })

  assert.deepEqual(home.weakest, { id: "sur-g-2", display: "sur-g-2", label: "\u8bcd\u6c47", score: 24 })
})

test("home page model resolves completed starter courses to review and finds the weakest item", () => {
  const completed = new Set(lessons.STARTER_LESSONS.map((lesson) => lesson.id))
  const home = model.buildHomePageModel({
    completedLessonIds: completed,
    items: {
      strong: item({ itemId: "hiragana:a", itemType: "kana", recognition: 80, listening: 80, meaning: 80, recall: 80, production: 80, attempts: 5 }),
      weak: item({ itemId: "weak", itemType: "grammar", recognition: 10, listening: 20, meaning: 30, recall: 40, production: 50, attempts: 5 }),
    },
    kanaDueIds: [],
    vocabDueIds: [],
    mistakeDueIds: [],
    mistakeIds: [],
  })

  assert.equal(home.nextLesson, null)
  assert.equal(home.learningEntry.kind, "review")
  assert.equal(home.completedCount, lessons.STARTER_LESSONS.length)
  assert.deepEqual(home.weakest, { id: "weak", display: "weak", label: "\u8bed\u6cd5", score: 30 })
})

test("home page model falls back to recommended skills after starter courses", () => {
  const completed = new Set(lessons.STARTER_LESSONS.map((lesson) => lesson.id))
  const skill = {
    title: "Kana drill",
    short: "Practice the next kana set",
    href: "/kana?set=seion",
  }
  const home = model.buildHomePageModel({
    completedLessonIds: completed,
    items: {},
    skill,
    kanaDueIds: [],
    vocabDueIds: [],
    mistakeDueIds: [],
    mistakeIds: [],
  })

  assert.equal(home.nextLesson, null)
  assert.equal(home.learningEntry.kind, "skill")
  assert.equal(home.learningEntry.title, skill.title)
  assert.equal(home.learningEntry.subtitle, skill.short)
  assert.equal(home.learningEntry.href, skill.href)
})
