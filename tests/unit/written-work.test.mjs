import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const model = await loadTsModule("src/lib/written-work-model.ts")
const storage = await loadTsModule("src/lib/written-work-storage.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const { normalizeBackupEntry, normalizeLearningBackup, LEARNING_BACKUP_VERSION } = await loadTsModule("src/lib/learning-backup.ts")
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { lessonWritingTask, goalWritingTask } = await loadTsModule("src/lib/writing-tasks.ts")
const { getGoalPracticePlan } = await loadTsModule("src/lib/goal-practice.ts")
const task = { id: "lesson:first", title: "自己紹介", prompt: "介绍名字和学习目标。", criteria: ["名字", "目标"] }
const input = { draft: "私は林です。日本語を勉強しています。", checked: [0, 1], usedModel: false }
function install(fail = false) {
  const map = new Map()
  global.window = { localStorage: { getItem: key => map.get(key) ?? null, setItem: (key, value) => { if (fail) throw Error("quota"); map.set(key, value) }, removeItem: key => map.delete(key) }, dispatchEvent: () => true }
  global.CustomEvent = class extends Event { constructor(type, init) { super(type); this.detail = init?.detail } }
  return map
}
test("completion requires a work and all checks; editing clears completion without creating assessment evidence", () => {
  const map = install()
  assert.equal(storage.saveWrittenWork(task, { ...input, draft: " " }, model.workToken(), true, 10), null)
  assert.equal(storage.saveWrittenWork(task, { ...input, checked: [0] }, model.workToken(), true, 10), null)
  const first = storage.saveWrittenWork(task, input, model.workToken(), true, 10)
  assert.equal(first.completedAt, 10)
  const edited = storage.saveWrittenWork(task, { ...input, draft: "new draft", checked: [] }, model.workToken(first), false, 20)
  assert.equal(edited.completedAt, undefined)
  assert.deepEqual([...map.keys()].sort(), [STORAGE_KEYS.WRITTEN_WORKS, STORAGE_KEYS.STUDY_CALENDAR].sort())
  assert.ok(Object.values(JSON.parse(map.get(STORAGE_KEYS.STUDY_CALENDAR))).some(day => day.selfReportedStudy && day.practiceCount === 0))
})
test("stale editors cannot overwrite another tab or resurrect deleted work; unrelated tasks can save", () => {
  const map = install()
  const first = storage.saveWrittenWork(task, input, model.workToken(), false, 10)
  const second = storage.saveWrittenWork(task, { ...input, draft: "other tab" }, model.workToken(first), false, 20)
  assert.equal(storage.saveWrittenWork(task, input, model.workToken(first), false, 30), null)
  assert.equal(storage.readWrittenWorks().value[model.writingKey(task)].draft, second.draft)
  assert.ok(storage.saveWrittenWork({ ...task, id: "goal:other" }, input, model.workToken(), false, 40))
  map.set(STORAGE_KEYS.WRITTEN_WORKS, "{}")
  assert.equal(storage.saveWrittenWork(task, input, model.workToken(second), false, 50), null)
})
test("revised task retains prior work and rubric; backups preserve both editions and accept v5", () => {
  const map = install()
  const first = storage.saveWrittenWork(task, input, model.workToken(), true, 10)
  const revised = { ...task, prompt: "介绍名字、目标和理由。", criteria: [...task.criteria, "理由"] }
  const second = storage.saveWrittenWork(revised, { ...input, checked: [] }, model.workToken(), false, 20)
  assert.equal(storage.readWrittenWorks().value[model.writingKey(task)].completedAt, 10)
  assert.equal(second.completedAt, undefined)
  const backup = JSON.parse(normalizeBackupEntry(STORAGE_KEYS.WRITTEN_WORKS, map.get(STORAGE_KEYS.WRITTEN_WORKS)))
  assert.equal(Object.keys(backup).length, 2)
  assert.deepEqual(backup[model.writingKey(task)], first)
  assert.equal(normalizeLearningBackup({ version: 5, exportedAt: 20, entries: {} }).version, LEARNING_BACKUP_VERSION)
})
test("corrupt records and failed storage writes preserve original raw data", () => {
  const map = install()
  map.set(STORAGE_KEYS.WRITTEN_WORKS, '{"bad":true}')
  assert.equal(storage.readWrittenWorks().ok, false)
  assert.equal(storage.saveWrittenWork(task, input, model.workToken()), null)
  assert.equal(map.get(STORAGE_KEYS.WRITTEN_WORKS), '{"bad":true}')
  assert.equal(normalizeBackupEntry(STORAGE_KEYS.WRITTEN_WORKS, '{"bad":true}'), null)
  install(true)
  assert.equal(storage.saveWrittenWork(task, input, model.workToken()), null)
})
test("all 175 lessons and all goal tasks have distinct scoped work definitions tied to their actual goals", () => {
  const ids = new Set()
  for (const lesson of STARTER_LESSONS) {
    const definition = lessonWritingTask(lesson.id, lesson.study)
    assert.equal(definition.prompt, lesson.study.task)
    assert.ok(definition.criteria.some(text => text.includes(lesson.study.goal)))
    ids.add(definition.id)
  }
  assert.equal(ids.size, 175)
  for (const goal of ["travel", "media", "jlpt", "balanced"]) for (const activity of getGoalPracticePlan({ goal }).tasks) {
    const definition = goalWritingTask(activity)
    assert.equal(ids.has(definition.id), false)
    assert.equal(definition.prompt, activity.instruction)
    ids.add(definition.id)
  }
})
