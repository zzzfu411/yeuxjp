import { contentFingerprint } from "@/lib/content-fingerprint"
import { normalizeAnswer } from "@/lib/questions"
export type KanjiReadingQuestion = { id: string; word: string; reading: string; acceptedReadings: string[]; meaning: string; version: string }
export const EXTRA_WORD_READINGS: Record<string, string[]> = {
  "sur-v-1": ["ゆく"], "sur-adj-7": ["よい"], "sur-p-1": ["わたくし", "あたし"],
  "sur-t-2": ["こんにち"], "sur-t-3": ["あす", "みょうにち"], "sur-t-4": ["さくじつ"],
  "sur-num-7": ["しち"], "sur-num-9": ["く"], "sur-num-10": ["とお"],
  "day-v-43": ["いかる"], "flu-soc-24": ["せろん"],
}
export function kanjiReadingVersion(question: Omit<KanjiReadingQuestion, "version">) {
  return contentFingerprint(["kanji-word-reading-v1", question.id, question.word, question.reading, question.acceptedReadings, question.meaning])
}
export function normalizeKanaReading(value: string) {
  return normalizeAnswer(value).replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60))
}
export function isKanjiReadingCorrect(question: KanjiReadingQuestion, answer: string) {
  return [question.reading, ...question.acceptedReadings].some(reading => normalizeKanaReading(reading) === normalizeKanaReading(answer))
}
export function kanjiReadingKey(question: Pick<KanjiReadingQuestion, "id" | "version">) { return `${question.id}:${question.version}` }
