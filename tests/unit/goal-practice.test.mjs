import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const { getGoalPracticePlan } = await loadTsModule("src/lib/goal-practice.ts")
const { grammarData } = await loadTsModule("src/data/grammar-data.ts")
const { pragmaticsData } = await loadTsModule("src/data/pragmatics-data.ts")
const { normalizeProfile } = await loadTsModule("src/lib/learning-progress-model.ts")
const { normalizeBackupEntry } = await loadTsModule("src/lib/learning-backup.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")

test("each goal exposes distinct immediately available tasks, with real deep links and concrete checks", () => {
  const signatures = new Set()
  for (const goal of ["balanced", "travel", "media", "jlpt"]) {
    const plan = getGoalPracticePlan({ goal })
    assert.equal(plan.goal, goal)
    assert.equal(plan.tasks.length, 3)
    signatures.add(plan.tasks.map(task => task.id).join(","))
    for (const task of plan.tasks) {
      assert.ok(task.instruction.length > 15)
      assert.ok(task.prerequisite)
      assert.ok(task.selfCheck)
      for (const resource of task.resources) {
        const url = new URL(resource.href, "http://localhost")
        if (url.pathname.startsWith("/pragmatics/")) assert.ok(pragmaticsData.some(item => `/pragmatics/${item.id}` === url.pathname))
        else if (url.pathname === "/grammar") {
          const point = grammarData[url.searchParams.get("level")].find(item => item.id === url.searchParams.get("item"))
          assert.ok(point, resource.href)
          assert.ok(point.practiceTemplates.length)
        } else assert.ok(["/path", "/review", "/vocabulary", "/quiz"].includes(url.pathname), resource.href)
        assert.equal(url.pathname.startsWith("/learn/"), false, "a locked future course is not an immediately available specialty task")
      }
    }
  }
  assert.equal(signatures.size, 4)
})

test("JLPT preparation honors target and self-assessed base without treating aspiration as current ability", () => {
  const plan = (target, current) => getGoalPracticePlan({ goal: "jlpt", jlptTarget: target, selfAssessedLevel: current })
  assert.match(plan("N2", "unknown").tasks[0].resources[0].href, /level=N5/)
  assert.match(plan("N2", "N3").tasks[0].resources[0].href, /level=N3/)
  assert.match(plan("N4", "N2").tasks[0].resources[0].href, /level=N4/)
  for (const level of ["N5", "N4", "N3", "N2"]) {
    const task = plan(level, level).tasks[0]
    const url = new URL(task.resources[0].href, "http://localhost")
    assert.ok(grammarData[level].find(point => point.id === url.searchParams.get("item")))
  }
  assert.match(plan("N2", "unknown").description, /尚未定位/)
})

test("profile fields survive normalization and backup while old profiles remain unknown", () => {
  const old = { goal: "jlpt", kanaLevel: "some", romajiMode: "practice", minutesPerDay: 10, createdAt: 1, updatedAt: 2 }
  assert.deepEqual(normalizeProfile(old), old)
  const profile = { ...old, jlptTarget: "N2", selfAssessedLevel: "N4" }
  assert.deepEqual(normalizeProfile(profile), profile)
  assert.deepEqual(JSON.parse(normalizeBackupEntry(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile))), profile)
  const invalid = normalizeProfile({ ...old, jlptTarget: "N1", selfAssessedLevel: "expert" })
  assert.equal(invalid.jlptTarget, undefined)
  assert.equal(invalid.selfAssessedLevel, undefined)
})
