"use client"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { readJsonStorage, validJsonStorageValue, invalidJsonStorageValue } from "@/lib/storage-read-result"
import { writeLearningJson } from "@/lib/learning-storage"
import { runLearningStorageTransaction } from "@/lib/learning-storage-transaction"
import { normalizeKanjiReadingStore, nextKanjiReadingRecord, kanjiRecordToken, type KanjiReadingStore } from "@/lib/kanji-reading-model"
import { kanjiReadingKey, type KanjiReadingQuestion } from "@/lib/kanji-reading-question"
import type { PracticeResult } from "@/lib/learning-progress-types"
import { CURRENT_ASSESSMENT_REVISION } from "@/lib/assessment-evidence"
export function readKanjiReadings() {
  return readJsonStorage(STORAGE_KEYS.KANJI_READINGS, {} as KanjiReadingStore, input => {
    const value = normalizeKanjiReadingStore(input)
    return value ? validJsonStorageValue(value) : invalidJsonStorageValue<KanjiReadingStore>()
  }, "kanji-readings")
}
export function saveKanjiReading(question: KanjiReadingQuestion, answer: string, expectedToken: string, recordPractice: (result: Omit<PracticeResult, "createdAt">) => boolean, review = false, now = Date.now()) {
  const stored = readKanjiReadings()
  const key = kanjiReadingKey(question)
  if (!stored.ok || kanjiRecordToken(stored.value[key]) !== expectedToken) return null
  const next = nextKanjiReadingRecord(question, answer, stored.value[key], now)
  if (!next) return null
  const result: Omit<PracticeResult, "createdAt"> = { itemId: question.id, itemType: "vocab", mode: "recognition", responseFormat: "input", questionVersion: question.version,
    assessmentRevision: CURRENT_ASSESSMENT_REVISION, correct: next.lastCorrect, answer, ...(review ? { activitySource: "review" } : {}) }
  const saved = runLearningStorageTransaction(() => writeLearningJson(STORAGE_KEYS.KANJI_READINGS, { ...stored.value, [key]: next }, { expectedRaw: stored.raw }) && recordPractice(result))
  return saved ? next : null
}
