import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const model = await loadTsModule("src/lib/daily-study-plan.ts")
const storage = await loadTsModule("src/lib/daily-study-storage.ts")
const { normalizeBackupEntry, normalizeLearningBackup, LEARNING_BACKUP_VERSION } = await loadTsModule("src/lib/learning-backup.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const { todayKey } = await loadTsModule("src/lib/learning-progress-model.ts")
const { addPracticeToCalendar, mergeLegacyStudyCalendar, normalizeStudyCalendar, calendarStudyDates } = await loadTsModule("src/lib/study-calendar-model.ts")
const entry = { kind: "lesson", title: "第一课", subtitle: "假名", href: "/learn/day-1-a-row-hello", cta: "开始" }
const now = new Date(2026, 8, 10, 10).getTime()
const build = (minutes = 10, due = 8) => model.buildDailyStudyPlan({ profile: { goal: "travel", minutesPerDay: minutes }, entry, totalDue: due, now })
function install(fail = false) {
  const map = new Map()
  global.window = { localStorage: { getItem: key => map.get(key) ?? null, setItem: (key, value) => { if (fail) throw Error("quota"); map.set(key, value) }, removeItem: key => map.delete(key) }, dispatchEvent: () => true }
  global.CustomEvent = class extends Event { constructor(type, init) { super(type); this.detail = init?.detail } }
  return map
}
test("each supported budget fits actionable reading/review/optional-writing tasks without demanding a full course", () => {
  for (let minutes = 5; minutes <= 30; minutes++) for (const due of [0, 1, 20]) {
    const plan = build(minutes, due)
    assert.equal(plan.tasks.reduce((sum, task) => sum + task.minutes, 0), minutes)
    assert.ok(plan.tasks.some(task => task.kind === "reading" && !task.optional && task.instruction.includes("不要求今天完成整课")))
    assert.equal(plan.tasks.some(task => task.kind === "review"), due > 0)
    assert.equal(plan.tasks.some(task => task.kind === "writing"), minutes >= 10)
    assert.ok(model.normalizeDailyStudyPlans({ preview: plan }))
    const review = plan.tasks.find(task => task.kind === "review")
    if (review) assert.ok(review.target <= due && review.target <= 6)
  }
})
test("task completion separates real review answers, self-confirmed reading, and current-edition work", () => {
  const plan = build()
  const [review, reading, writing] = plan.tasks
  const day = { practiceCount: 100, reviewCount: 0 }
  assert.equal(model.dailyTaskDone(review, plan, day, {}), false)
  day.reviewCount = review.target
  assert.equal(model.dailyTaskDone(review, plan, day, {}), true)
  assert.equal(model.dailyTaskDone(reading, plan, day, {}), false)
  assert.equal(model.dailyTaskDone({ ...reading, confirmedAt: now }, plan, day, {}), true)
  const work = { task: { id: writing.workId }, version: writing.workVersion, completedAt: now }
  assert.equal(model.dailyTaskDone(writing, plan, day, { work }), true)
  assert.equal(model.dailyTaskDone(writing, plan, day, { work: { ...work, version: "old" } }), false)
  assert.equal(model.dailyTaskDone(writing, plan, day, { work: { ...work, completedAt: now - 86400000 } }), false)
})
test("starting freezes a plan, replanning preserves it, reload and v7 backup preserve self-confirmation", () => {
  const map = install()
  assert.equal(storage.saveNewDailyPlan(build(), "first", now), true)
  assert.equal(storage.confirmDailyReading("first", "reading", true, now + 1), true)
  assert.equal(storage.confirmDailyReading("first", "review", true, now + 1), false)
  assert.equal(storage.confirmDailyReading("first", "reading", true, now + 86400000), false)
  assert.equal(storage.saveNewDailyPlan(build(20), "second", now + 2), true)
  const saved = storage.readDailyStudyPlans().value
  assert.equal(saved.first.tasks.find(task => task.kind === "reading").confirmedAt, now + 1)
  assert.equal(model.activeDailyPlan(saved, todayKey(new Date(now))).id, "second")
  assert.deepEqual(JSON.parse(normalizeBackupEntry(STORAGE_KEYS.DAILY_STUDY_PLANS, map.get(STORAGE_KEYS.DAILY_STUDY_PLANS))), saved)
  assert.equal(normalizeLearningBackup({ version: 6, exportedAt: now, entries: {} }).version, LEARNING_BACKUP_VERSION)
  assert.equal(storage.saveNewDailyPlan(build(), "late", now + 86400000), false)
})
test("malformed and failed plan writes preserve original data", () => {
  const map = install()
  map.set(STORAGE_KEYS.DAILY_STUDY_PLANS, '{"bad":true}')
  assert.equal(storage.saveNewDailyPlan(build(), "first", now), false)
  assert.equal(map.get(STORAGE_KEYS.DAILY_STUDY_PLANS), '{"bad":true}')
  assert.equal(model.normalizeDailyStudyPlans({ preview: { ...build(), tasks: [] } }), null)
  assert.equal(model.normalizeDailyStudyPlans({ preview: { ...build(), tasks: build().tasks.map(task => ({ ...task, optional: true })) } }), null)
  install(true)
  assert.equal(storage.saveNewDailyPlan(build(), "first", now), false)
})
test("durable review counts exclude course answers and word-card self ratings, and survive legacy merging", () => {
  const result = { itemId: "hiragana:a", itemType: "kana", mode: "recognition", correct: true, createdAt: now }
  const date = todayKey(new Date(now))
  let calendar = addPracticeToCalendar({}, result)
  assert.equal(calendar[date].reviewCount, undefined)
  calendar = addPracticeToCalendar(calendar, { ...result, activitySource: "review" })
  calendar = addPracticeToCalendar(calendar, { ...result, itemType: "vocab", mode: "meaning", answer: "good", activitySource: "review" })
  assert.equal(calendar[date].reviewCount, 1)
  assert.equal(calendar[date].practiceCount, 2)
  assert.equal(mergeLegacyStudyCalendar(calendar, {}, [result])[date].reviewCount, 1)
  assert.equal(normalizeStudyCalendar(calendar)[date].reviewCount, 1)
  assert.equal(normalizeStudyCalendar({ [date]: { ...calendar[date], reviewCount: 3 } }), null)
})

test("self-confirmed reading is a study date, without becoming an answer or a completed lesson", () => {
  const map = install()
  storage.saveNewDailyPlan(build(), "first", now)
  assert.equal(map.has(STORAGE_KEYS.STUDY_CALENDAR), false)
  assert.equal(storage.confirmDailyReading("first", "reading", true, now + 1), true)
  const calendar = JSON.parse(map.get(STORAGE_KEYS.STUDY_CALENDAR))
  const date = todayKey(new Date(now))
  assert.equal(calendar[date].selfReportedStudy, true)
  assert.equal(calendar[date].practiceCount, 0)
  assert.equal(calendar[date].lessonCompleted, false)
  assert.ok(calendarStudyDates(calendar).has(date))
  assert.equal(mergeLegacyStudyCalendar(calendar, {}, [{ itemId: "a", itemType: "kana", mode: "recognition", correct: true, createdAt: now }])[date].selfReportedStudy, true)
  assert.equal(normalizeStudyCalendar({ [date]: { ...calendar[date], selfReportedStudy: "yes" } }), null)
})

test("calendar failure rolls back reading confirmation and work completion, preserving their prior drafts", async () => {
  const { saveWrittenWork } = await loadTsModule("src/lib/written-work-storage.ts")
  const { workToken } = await loadTsModule("src/lib/written-work-model.ts")
  const map = install()
  storage.saveNewDailyPlan(build(), "first", now)
  const plansBefore = map.get(STORAGE_KEYS.DAILY_STUDY_PLANS)
  const task = { id: "goal:example", title: "表达", prompt: "写一句问候", criteria: ["写出问候"] }
  const input = { draft: "こんにちは。", checked: [0], usedModel: false }
  const draft = saveWrittenWork(task, input, workToken(), false, now)
  const worksBefore = map.get(STORAGE_KEYS.WRITTEN_WORKS)
  const setItem = window.localStorage.setItem
  window.localStorage.setItem = (key, value) => { if (key === STORAGE_KEYS.STUDY_CALENDAR) throw Error("calendar quota"); setItem(key, value) }
  assert.equal(storage.confirmDailyReading("first", "reading", true, now + 1), false)
  assert.equal(map.get(STORAGE_KEYS.DAILY_STUDY_PLANS), plansBefore)
  assert.equal(saveWrittenWork(task, input, workToken(draft), true, now + 1), null)
  assert.equal(map.get(STORAGE_KEYS.WRITTEN_WORKS), worksBefore)
  assert.equal(map.has(STORAGE_KEYS.STUDY_CALENDAR), false)
})
