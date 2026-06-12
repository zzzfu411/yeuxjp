import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const model = await loadTsModule("src/lib/learning-progress-model.ts")

test("profile normalization clamps preferences and preserves timestamps", () => {
  assert.equal(model.normalizeProfile(null, 10), null)
  assert.deepEqual(
    model.normalizeProfile(
      {
        goal: "unknown",
        minutesPerDay: 99,
        kanaLevel: "solid",
        romajiMode: "hidden",
        createdAt: 1,
      },
      20
    ),
    {
      goal: "balanced",
      minutesPerDay: 30,
      kanaLevel: "solid",
      romajiMode: "hidden",
      createdAt: 1,
      updatedAt: 20,
    }
  )
  assert.equal(model.normalizeProfile({ minutesPerDay: 2 }, 30).minutesPerDay, 5)
})

test("lesson progress normalization keeps resume fields compatible", () => {
  const normalized = model.normalizeLessonProgressMap(
    {
      "day-1": {
        lessonId: "day-1",
        status: "completed",
        startedAt: 1,
        completedAt: 2,
        score: 120,
        currentStepIndex: 2.9,
        lastStepId: "recognize-a",
        updatedAt: 3,
      },
      stale: { lessonId: 123 },
      mismatch: {
        lessonId: "day-other",
        status: "completed",
        startedAt: 4,
        currentStepIndex: 8,
      },
    },
    99
  )

  assert.deepEqual(normalized, {
    "day-1": {
      lessonId: "day-1",
      status: "completed",
      startedAt: 1,
      completedAt: 2,
      score: 100,
      currentStepIndex: 2,
      lastStepId: "recognize-a",
      updatedAt: 3,
    },
  })
})

test("lesson progress normalization rejects mismatched map keys", () => {
  const normalized = model.normalizeLessonProgressMap(
    {
      "day-1": {
        lessonId: "day-2",
        status: "completed",
        startedAt: 1,
        currentStepIndex: 3,
        lastStepId: "resume-here",
      },
      "day-3": {
        lessonId: "day-3",
        status: "started",
        startedAt: 2,
        currentStepIndex: 1,
        lastStepId: "keep-this",
      },
    },
    99
  )

  assert.equal(normalized["day-1"], undefined)
  assert.equal(normalized["day-3"].lessonId, "day-3")
  assert.equal(normalized["day-3"].currentStepIndex, 1)
  assert.equal(normalized["day-3"].lastStepId, "keep-this")
})

test("item progress normalization clamps mastery and counters", () => {
  const normalized = model.normalizeItemProgressMap(
    {
      a: {
        itemType: "kana",
        recognition: 110,
        listening: -4,
        meaning: 42.4,
        recall: Number.NaN,
        production: 10,
        attempts: -1,
        correct: 2.8,
      },
      bad: { itemType: "unknown" },
    },
    55
  )

  assert.deepEqual(normalized.a, {
    itemId: "a",
    itemType: "kana",
    recognition: 100,
    listening: 0,
    meaning: 42,
    recall: 0,
    production: 10,
    attempts: 0,
    correct: 2,
    updatedAt: 55,
  })
  assert.equal(normalized.bad, undefined)
})

test("practice result normalization filters bad rows and keeps only recent history", () => {
  const raw = Array.from({ length: 305 }, (_, index) => ({
    itemId: `item-${index}`,
    itemType: "vocab",
    lessonStepId: index === 304 ? "step-304" : undefined,
    mode: "meaning",
    correct: index % 2 === 0,
    createdAt: index,
  }))
  raw.push({ itemId: "bad", mode: "meaning" })
  raw.push({ itemId: "bad-mode", itemType: "vocab", mode: "custom", correct: true })
  raw.push({ itemId: "bad-type", itemType: "custom", mode: "meaning", correct: true })

  const normalized = model.normalizePracticeResults(raw, 999)
  assert.equal(normalized.length, 300)
  assert.equal(normalized[0].itemId, "item-5")
  assert.equal(normalized.at(-1).itemId, "item-304")
  assert.equal(normalized.at(-1).lessonStepId, "step-304")
  assert.equal(normalized.at(-1).createdAt, 304)
  assert.equal(normalized.some((item) => item.itemId === "bad-mode"), false)
  assert.equal(normalized.some((item) => item.itemId === "bad-type"), false)
})

test("practice result normalization rejects unknown modes and item types", () => {
  const normalized = model.normalizePracticeResults(
    [
      { itemId: "ok", itemType: "kana", mode: "recognition", correct: true, createdAt: 1 },
      { itemId: "legacy-default-type", mode: "meaning", correct: false, createdAt: 2 },
      { itemId: "bad-mode", itemType: "kana", mode: "shadow", correct: true, createdAt: 3 },
      { itemId: "bad-type", itemType: "shadow", mode: "recognition", correct: true, createdAt: 4 },
    ],
    99
  )

  assert.deepEqual(normalized.map((item) => item.itemId), ["ok", "legacy-default-type"])
  assert.equal(normalized[1].itemType, "lesson")

  const updated = model.updateItemProgressForPractice({}, normalized[0])
  assert.deepEqual(Object.keys(updated.ok).sort(), [
    "attempts",
    "correct",
    "itemId",
    "itemType",
    "listening",
    "meaning",
    "production",
    "recall",
    "recognition",
    "updatedAt",
  ])
})

test("practice recording helpers append history and update item mastery from stored snapshots", () => {
  const rawHistory = Array.from({ length: 300 }, (_, index) => ({
    itemId: `old-${index}`,
    itemType: "kana",
    mode: "recognition",
    correct: true,
    createdAt: index,
  }))

  const nextHistory = model.appendPracticeResult(
    rawHistory,
    {
      itemId: "ka",
      itemType: "kana",
      mode: "recognition",
      correct: false,
      answer: "a",
    },
    999
  )

  assert.equal(nextHistory.length, 300)
  assert.equal(nextHistory[0].itemId, "old-1")
  assert.deepEqual(nextHistory.at(-1), {
    itemId: "ka",
    itemType: "kana",
    mode: "recognition",
    correct: false,
    answer: "a",
    createdAt: 999,
  })

  const nextItems = model.updateItemProgressForPractice(
    {
      ka: {
        itemId: "ka",
        itemType: "kana",
        recognition: 20,
        listening: 5,
        meaning: 0,
        recall: 0,
        production: 0,
        attempts: 2,
        correct: 1,
        updatedAt: 10,
      },
    },
    nextHistory.at(-1)
  )

  assert.deepEqual(nextItems.ka, {
    itemId: "ka",
    itemType: "kana",
    recognition: 10,
    listening: 5,
    meaning: 0,
    recall: 0,
    production: 0,
    attempts: 3,
    correct: 1,
    updatedAt: 999,
  })
})

test("learning progress helpers merge maps, normalize step indexes, and average mastery", () => {
  assert.equal(model.clampScore(99.6), 100)
  assert.equal(model.normalizeStepIndex(-3), 0)
  assert.equal(model.normalizeStepIndex(3.8), 3)
  assert.deepEqual(
    model.mergeLessonProgressMaps(
      { one: { lessonId: "one", status: "started", startedAt: 1 } },
      { two: { lessonId: "two", status: "started", startedAt: 2 } }
    ),
    {
      one: { lessonId: "one", status: "started", startedAt: 1 },
      two: { lessonId: "two", status: "started", startedAt: 2 },
    }
  )
  assert.equal(model.averageMastery(), 0)
  assert.equal(
    model.averageMastery({
      itemId: "a",
      itemType: "kana",
      recognition: 100,
      listening: 50,
      meaning: 0,
      recall: 25,
      production: 25,
      attempts: 1,
      correct: 1,
      updatedAt: 1,
    }),
    40
  )
})

test("learning progress model builds study dates and calculates current streak", () => {
  const day = 24 * 60 * 60 * 1000
  const today = Date.UTC(2026, 5, 12, 12)
  const yesterday = today - day
  const twoDaysAgo = today - 2 * day
  const fourDaysAgo = today - 4 * day

  const dates = model.buildStudyDates(
    {
      lessonToday: {
        lessonId: "lessonToday",
        status: "completed",
        startedAt: today - 1,
        completedAt: today,
      },
      lessonOld: {
        lessonId: "lessonOld",
        status: "completed",
        startedAt: fourDaysAgo - 1,
        completedAt: fourDaysAgo,
      },
      lessonStarted: {
        lessonId: "lessonStarted",
        status: "started",
        startedAt: yesterday,
      },
    },
    [
      {
        itemId: "ka",
        itemType: "kana",
        mode: "recognition",
        correct: true,
        createdAt: yesterday,
      },
      {
        itemId: "mizu",
        itemType: "vocab",
        mode: "meaning",
        correct: true,
        createdAt: twoDaysAgo,
      },
    ]
  )

  assert.deepEqual(Array.from(dates).sort(), ["2026-06-08", "2026-06-10", "2026-06-11", "2026-06-12"])
  assert.equal(model.calculateStudyStreak(dates, new Date(today)), 3)
  assert.equal(model.calculateStudyStreak(new Set(["2026-06-11"]), new Date(today)), 0)
})
