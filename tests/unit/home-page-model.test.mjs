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

test("home page model filters due mistakes to existing notebook entries and totals visible due work", () => {
  const home = model.buildHomePageModel({
    completedLessonIds: new Set(),
    items: {},
    kanaDueIds: ["a", "ka"],
    vocabDueIds: ["v1"],
    mistakeDueIds: ["m1", "ghost"],
    mistakeIds: ["m1"],
  })

  assert.deepEqual(home.dueMistakeIds, ["m1"])
  assert.equal(home.totalDue, 4)
  assert.equal(home.nextLesson.id, lessons.STARTER_LESSONS[0].id)
  assert.equal(home.learningEntry.href, `/learn/${lessons.STARTER_LESSONS[0].id}`)
  assert.equal(home.completedCount, 0)
  assert.equal(home.weakest, null)
})

test("home page model resolves completed starter courses to review and finds the weakest item", () => {
  const completed = new Set(lessons.STARTER_LESSONS.map((lesson) => lesson.id))
  const home = model.buildHomePageModel({
    completedLessonIds: completed,
    items: {
      strong: item({ itemId: "strong", itemType: "kana", recognition: 80, listening: 80, meaning: 80, recall: 80, production: 80 }),
      weak: item({ itemId: "weak", itemType: "grammar", recognition: 10, listening: 20, meaning: 30, recall: 40, production: 50 }),
    },
    kanaDueIds: [],
    vocabDueIds: [],
    mistakeDueIds: [],
    mistakeIds: [],
  })

  assert.equal(home.nextLesson, null)
  assert.equal(home.learningEntry.kind, "review")
  assert.equal(home.completedCount, lessons.STARTER_LESSONS.length)
  assert.deepEqual(home.weakest, { id: "weak", label: "\u8bed\u6cd5", score: 30 })
})
