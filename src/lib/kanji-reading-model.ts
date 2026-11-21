import { STAGE_KANJI_REVISIONS } from "@/data/stage-coverage-index"
import { applySrsResult, createSrsState, normalizeSrsState, type SrsState } from "@/lib/srs-model"
import { contentFingerprint } from "@/lib/content-fingerprint"
import { isKanjiReadingCorrect, kanjiReadingKey, kanjiReadingVersion, type KanjiReadingQuestion } from "@/lib/kanji-reading-question"
export type KanjiReadingRecord = { question: KanjiReadingQuestion; srs: SrsState; lastAnswer: string; lastCorrect: boolean; answeredAt: number }
export type KanjiReadingStore = Record<string, KanjiReadingRecord>
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v)
const time = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && Number.isFinite(new Date(v).getTime())
export function kanjiRecordToken(record: KanjiReadingRecord | undefined) { return record ? contentFingerprint(record) : "missing" }
export function isCurrentKanjiQuestion(question: KanjiReadingQuestion) {
  return kanjiReadingVersion(question) === question.version && STAGE_KANJI_REVISIONS[question.id] === question.version
}
export function normalizeKanjiReadingStore(input: unknown): KanjiReadingStore | null {
  if (!object(input)) return null
  const result: KanjiReadingStore = {}
  for (const [key, row] of Object.entries(input)) {
    if (!object(row) || !object(row.question) || !object(row.srs) || typeof row.lastAnswer !== "string" || typeof row.lastCorrect !== "boolean" || !time(row.answeredAt)) return null
    const q = row.question
    if (![q.id, q.word, q.reading, q.meaning, q.version].every(v => typeof v === "string" && v.length > 0)
      || !Array.isArray(q.acceptedReadings) || !q.acceptedReadings.every(v => typeof v === "string" && v.length > 0)) return null
    const question: KanjiReadingQuestion = { id: q.id as string, word: q.word as string, reading: q.reading as string, acceptedReadings: [...q.acceptedReadings], meaning: q.meaning as string, version: q.version as string }
    if (kanjiReadingKey(question) !== key || kanjiReadingVersion(question) !== question.version || isKanjiReadingCorrect(question, row.lastAnswer) !== row.lastCorrect) return null
    const s = row.srs
    if (![s.createdAt, s.dueAt, s.lastReviewedAt].every(time) || s.lastReviewedAt !== row.answeredAt || (s.createdAt as number) > row.answeredAt
      || ![s.box, s.right, s.wrong].every(v => Number.isSafeInteger(v) && (v as number) >= 0) || (s.box as number) > 6
      || (s.right as number) + (s.wrong as number) < 1) return null
    result[key] = { question, srs: normalizeSrsState(s), lastAnswer: row.lastAnswer, lastCorrect: row.lastCorrect, answeredAt: row.answeredAt }
  }
  return result
}
export function nextKanjiReadingRecord(question: KanjiReadingQuestion, answer: string, previous?: KanjiReadingRecord, now = Date.now()): KanjiReadingRecord | null {
  if (!isCurrentKanjiQuestion(question) || !time(now) || (previous && (kanjiReadingKey(previous.question) !== kanjiReadingKey(question) || now < previous.answeredAt))) return null
  const correct = isKanjiReadingCorrect(question, answer)
  // A first correct answer enters a short interval, not the second-review interval.
  const srs = previous ? applySrsResult(previous.srs, correct ? "good" : "again", now)
    : correct ? { ...createSrsState(now), lastReviewedAt: now, right: 1 } : applySrsResult(createSrsState(now), "again", now)
  return { question: structuredClone(question), srs, lastAnswer: answer, lastCorrect: correct, answeredAt: now }
}
export function getKanjiReadingStatus(questions: readonly KanjiReadingQuestion[], store: KanjiReadingStore, now = Date.now()) {
  const rows = questions.map(question => { const record = isCurrentKanjiQuestion(question) ? store[kanjiReadingKey(question)] : undefined
    return { question, record, status: !record ? "unmeasured" : record.lastCorrect ? "correct" : "practice", due: !!record && record.srs.dueAt <= now } })
  return { rows, unmeasured: rows.filter(row => row.status === "unmeasured"), practice: rows.filter(row => row.status === "practice"), correct: rows.filter(row => row.status === "correct"), due: rows.filter(row => row.due) }
}
