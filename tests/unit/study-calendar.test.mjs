import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const calendar = await loadTsModule("src/lib/study-calendar-model.ts")
const progress = await loadTsModule("src/lib/learning-progress-model.ts")
const storage = await loadTsModule("src/lib/study-calendar-storage.ts")
const backup = await loadTsModule("src/lib/learning-backup.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")

test("study calendar survives history eviction and keeps a streak active until a whole day is missed", () => {
  let days = {}, history = []
  for (let day = 1; day <= 10; day++) {
    for (let n = 0; n < 40; n++) {
      const result = { itemId: "hiragana:a", itemType: "kana", mode: "recognition", correct: true, createdAt: new Date(2026, 8, day, 12).getTime() }
      days = calendar.addPracticeToCalendar(calendar.mergeLegacyStudyCalendar(days, {}, history), result)
      history = progress.appendPracticeResult(history, result, result.createdAt)
    }
  }
  assert.equal(history.length, 300)
  assert.equal(Object.values(days).reduce((sum, day) => sum + day.practiceCount, 0), 400)
  assert.equal(progress.calculateStudyStreak(calendar.calendarStudyDates(days), new Date(2026, 8, 10)), 10)
  assert.equal(progress.calculateStudyStreak(calendar.calendarStudyDates(days), new Date(2026, 8, 11)), 10)
  assert.equal(progress.calculateStudyStreak(calendar.calendarStudyDates(days), new Date(2026, 8, 12)), 0)
  assert.deepEqual(calendar.mergeLegacyStudyCalendar(days, {}, history), days)
})

test("calendar separates self assessment and assisted answers and recovers lesson dates", () => {
  const now = new Date(2026, 8, 5, 12).getTime()
  const result = { itemId: "sur-g-1", itemType: "vocab", mode: "meaning", correct: true, answer: "good", createdAt: now }
  let days = calendar.addPracticeToCalendar({}, result)
  days = calendar.addPracticeToCalendar(days, { ...result, answer: "hello", assisted: true })
  days = calendar.mergeLegacyStudyCalendar(days, { lesson: { completedAt: now } }, [])
  assert.deepEqual(days["2026-09-05"], { practiceCount: 1, independentCorrect: 0, selfAssessmentCount: 1, lessonCompleted: true })
  const exported = backup.normalizeLearningBackup({ version: 4, exportedAt: now, entries: { [STORAGE_KEYS.STUDY_CALENDAR]: JSON.stringify(days) } })
  assert.deepEqual(JSON.parse(exported.entries[STORAGE_KEYS.STUDY_CALENDAR]), days)
  for (const version of [1, 2, 3]) assert.equal(backup.normalizeLearningBackup({ version, exportedAt: now, entries: {} }).version, 4)
})

test("calendar rejects corrupted dates and values without overwriting raw storage", () => {
  for (const value of [{ "2026-02-30": {} }, { bad: {} }, { "2026-09-05": { practiceCount: -1 } }, []]) {
    assert.equal(calendar.normalizeStudyCalendar(value), null)
  }
  const raw = '{"broken":{}}'
  let writes = 0
  global.window = { localStorage: { getItem: key => key === STORAGE_KEYS.STUDY_CALENDAR ? raw : null, setItem: () => writes++ } }
  assert.equal(storage.readStudyCalendarResult().ok, false)
  assert.equal(storage.prepareStudyCalendarWrite(Date.now()), null)
  assert.equal(writes, 0)
})

test("measured mastery distinguishes an untested skill from an independently failed skill", () => {
  let items = progress.updateItemProgressForPractice({}, { itemId: "sur-g-1", itemType: "vocab", mode: "meaning", correct: true, createdAt: 1 })
  assert.equal(progress.averageMastery(items["sur-g-1"]), 18)
  items = progress.updateItemProgressForPractice(items, { itemId: "sur-g-1", itemType: "vocab", mode: "recall", correct: false, createdAt: 2 })
  assert.deepEqual(items["sur-g-1"].assessedModes, ["meaning", "recall"])
  assert.equal(progress.averageMastery(items["sur-g-1"]), 9)
  assert.deepEqual(progress.normalizeItemProgressMap(items)["sur-g-1"].assessedModes, ["meaning", "recall"])
  const assisted = progress.updateItemProgressForPractice({}, { itemId: "sur-g-2", itemType: "vocab", mode: "recall", correct: true, assisted: true, createdAt: 3 })
  assert.deepEqual(assisted["sur-g-2"].assessedModes, [])
  assert.equal(assisted["sur-g-2"].correct, 0)
})
