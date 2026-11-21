import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const { STAGE_KANJI } = await loadTsModule("src/data/stage-kanji.ts")
const { STAGE_COVERAGE } = await loadTsModule("src/data/stage-coverage-index.ts")
const { STARTER_LESSONS } = await loadTsModule("src/data/lessons.ts")
const { COURSE_PHASES } = await loadTsModule("src/lib/course-phases.ts")
const qmodel = await loadTsModule("src/lib/kanji-reading-question.ts")
const model = await loadTsModule("src/lib/kanji-reading-model.ts")
const storage = await loadTsModule("src/lib/kanji-reading-storage.ts")
const { STORAGE_KEYS } = await loadTsModule("src/lib/storage-keys.ts")
const { normalizeBackupEntry } = await loadTsModule("src/lib/learning-backup.ts")
const { updateItemProgressForPractice } = await loadTsModule("src/lib/learning-progress-model.ts")
const all = Object.values(STAGE_KANJI).flat()
function install() {
  const map = new Map()
  global.window = { localStorage: { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }, dispatchEvent: () => true }
  global.CustomEvent = class extends Event { constructor(type, init) { super(type); this.detail = init?.detail } }
  return map
}
test("kanji sets and counts come from each stage's actual declarations, not vocabulary level or self-rating", () => {
  for (const phase of COURSE_PHASES) {
    const lessons = STARTER_LESSONS.filter(l => l.track === phase.track)
    const ids = new Set(lessons.flatMap(l => l.newItemIds.filter(i => i.type === "vocab").map(i => i.id)))
    const questions = STAGE_KANJI[phase.id]
    assert.equal(questions.length, STAGE_COVERAGE[phase.id].kanjiWords)
    assert.equal(ids.size, STAGE_COVERAGE[phase.id].vocabulary)
    assert.equal(new Set(questions.map(q => q.id)).size, questions.length)
    for (const q of questions) {
      assert.ok(ids.has(q.id)); assert.match(q.word, /\p{Script=Han}/u)
      assert.match(q.reading, /^[\p{Script=Hiragana}\p{Script=Katakana}ー\s]+$/u)
      assert.ok(model.isCurrentKanjiQuestion(q))
      assert.ok(qmodel.isKanjiReadingCorrect(q, q.reading))
    }
    const state = model.getKanjiReadingStatus(questions, {})
    assert.equal(state.unmeasured.length, questions.length)
    assert.equal(state.correct.length, 0)
  }
})
test("valid alternative readings are accepted but a different meaning and wrong kana are not", () => {
  for (const [id, answer] of [["sur-t-3", "みょうにち"], ["sur-t-3", "アス"], ["sur-num-7", "しち"], ["sur-num-9", "く"], ["sur-adj-7", "よい"], ["flu-soc-24", "せろん"]]) {
    assert.ok(qmodel.isKanjiReadingCorrect(all.find(q => q.id === id), answer), `${id}:${answer}`)
  }
  assert.equal(qmodel.isKanjiReadingCorrect(all.find(q => q.id === "flu-biz-10"), "いちば"), false)
  assert.match(all.find(q => q.id === "flu-biz-10").meaning, /经济/)
  assert.equal(qmodel.isKanjiReadingCorrect(all.find(q => q.id === "sur-n-24"), "がこう"), false)
})
test("wrong -> correct -> due review preserves evidence, short initial interval and distinct non-production practice", () => {
  const q = STAGE_KANJI.n5[0]
  const key = qmodel.kanjiReadingKey(q)
  const map = install()
  const results = []
  const record = result => { results.push(result); return true }
  const wrong = storage.saveKanjiReading(q, "wrong", "missing", record, false, 1000)
  assert.equal(wrong.lastCorrect, false)
  assert.equal(wrong.srs.wrong, 1)
  assert.equal(model.getKanjiReadingStatus([q], storage.readKanjiReadings().value, 1001).due.length, 1)
  const correct = storage.saveKanjiReading(q, q.reading, model.kanjiRecordToken(wrong), record, true, 2000)
  assert.equal(correct.srs.right, 1)
  assert.equal(correct.srs.wrong, 1)
  assert.equal(correct.srs.dueAt, 2000 + 600_000)
  assert.equal(model.getKanjiReadingStatus([q], storage.readKanjiReadings().value, 2001).correct.length, 1)
  assert.equal(model.getKanjiReadingStatus([q], storage.readKanjiReadings().value, correct.srs.dueAt).due.length, 1)
  assert.equal(results[1].activitySource, "review")
  assert.equal(results[1].mode, "recognition")
  const updated = updateItemProgressForPractice(undefined, { ...results[1], createdAt: 2000 })
  assert.equal(updated.outputEvidence, undefined)
  assert.deepEqual(JSON.parse(normalizeBackupEntry(STORAGE_KEYS.KANJI_READINGS, map.get(STORAGE_KEYS.KANJI_READINGS)))[key], correct)
  const firstRight = model.nextKanjiReadingRecord(q, q.reading, undefined, 4000)
  assert.equal(firstRight.srs.dueAt, 604000)
})
test("stale tabs, malformed storage and failed practice writes cannot overwrite or half-save kanji evidence", () => {
  const q = STAGE_KANJI.n5[0]
  const map = install()
  const first = storage.saveKanjiReading(q, "wrong", "missing", () => true, false, 1000)
  const before = map.get(STORAGE_KEYS.KANJI_READINGS)
  assert.equal(storage.saveKanjiReading(q, q.reading, "missing", () => true, false, 2000), null)
  assert.equal(storage.saveKanjiReading(q, q.reading, model.kanjiRecordToken(first), () => false, false, 2000), null)
  assert.equal(map.get(STORAGE_KEYS.KANJI_READINGS), before)
  map.set(STORAGE_KEYS.KANJI_READINGS, "[]")
  assert.equal(storage.saveKanjiReading(q, q.reading, "missing", () => true), null)
  assert.equal(map.get(STORAGE_KEYS.KANJI_READINGS), "[]")
})
test("retired reading snapshots survive backup without certifying the new question", () => {
  const q = STAGE_KANJI.n5[0]
  const old = { ...q, meaning: `${q.meaning}（旧版）` }
  old.version = qmodel.kanjiReadingVersion(old)
  const row = model.nextKanjiReadingRecord(q, q.reading, undefined, 1000)
  row.question = old
  const store = { [qmodel.kanjiReadingKey(old)]: row }
  assert.ok(model.normalizeKanjiReadingStore(store))
  assert.equal(model.getKanjiReadingStatus([q], store, 9999999).unmeasured.length, 1)
  assert.equal(model.getKanjiReadingStatus([q], store, 9999999).due.length, 0)
  assert.deepEqual(JSON.parse(normalizeBackupEntry(STORAGE_KEYS.KANJI_READINGS, JSON.stringify(store))), store)
  row.lastCorrect = false
  assert.equal(model.normalizeKanjiReadingStore(store), null)
})
