import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const dailyGoal = await loadTsModule("src/lib/daily-goal.ts")

test("countTodayPracticeResults only counts results created today", () => {
  const today = new Date("2026-07-12T10:00:00Z")
  const todayTs = today.getTime()
  const yesterdayTs = todayTs - 24 * 60 * 60 * 1000

  const count = dailyGoal.countTodayPracticeResults(
    [
      { id: "r1", itemId: "a", itemType: "kana", mode: "recognition", correct: true, createdAt: todayTs },
      { id: "r2", itemId: "i", itemType: "kana", mode: "recognition", correct: false, createdAt: todayTs - 60_000 },
      { id: "r3", itemId: "u", itemType: "kana", mode: "recognition", correct: true, createdAt: yesterdayTs },
      { id: "r4", itemId: "e", itemType: "kana", mode: "recognition", correct: true, createdAt: Number.NaN },
    ],
    today
  )

  assert.equal(count, 2)
})

test("countTodayPracticeResults returns zero for an invalid today date", () => {
  const count = dailyGoal.countTodayPracticeResults(
    [{ id: "r1", itemId: "a", itemType: "kana", mode: "recognition", correct: true, createdAt: Date.now() }],
    new Date(Number.NaN)
  )

  assert.equal(count, 0)
})

test("getDailyPracticeTarget converts minutes into a clamped question target", () => {
  assert.equal(dailyGoal.getDailyPracticeTarget(10), 20)
  assert.equal(dailyGoal.getDailyPracticeTarget(5), 10)
  assert.equal(dailyGoal.getDailyPracticeTarget(1), 10)
  assert.equal(dailyGoal.getDailyPracticeTarget(60), 60)
  assert.equal(dailyGoal.getDailyPracticeTarget(undefined), 20)
  assert.equal(dailyGoal.getDailyPracticeTarget(Number.NaN), 20)
})

test("millisecondsUntilNextLocalDay schedules the learner's next midnight", () => {
  assert.equal(
    dailyGoal.millisecondsUntilNextLocalDay(new Date(2026, 6, 17, 23, 59, 59, 500)),
    500
  )
  assert.equal(dailyGoal.millisecondsUntilNextLocalDay(new Date(Number.NaN)), 60_000)
})
