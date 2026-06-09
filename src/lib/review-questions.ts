import { kanaData } from "@/data/kana-data"
import type { Vocabulary } from "@/data/vocabulary/types"
import type { MistakeItem } from "@/lib/mistake-notebook-model"
import type { Question } from "@/lib/questions"
import { sortSrsIdsByDue, type SrsMap } from "@/lib/srs"

export type ReviewDeck = "kana" | "vocab" | "mistakes"
export type TodayReviewItem = { deck: ReviewDeck; id: string }

const REVIEWABLE_KANA_IDS = new Set(kanaData.map((item) => item.romaji))

export function isReviewableKanaId(id: string) {
  return REVIEWABLE_KANA_IDS.has(id)
}

export function shuffleList<T>(list: T[], random: () => number = Math.random) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]!
    arr[j] = tmp!
  }
  return arr
}

export function buildTodayReviewQueue({
  dueMistakeIds,
  kanaDueIds,
  kanaSrsMap,
  vocabDueIds,
  vocabSrsMap,
}: {
  dueMistakeIds: string[]
  kanaDueIds: string[]
  kanaSrsMap: SrsMap
  vocabDueIds: string[]
  vocabSrsMap: SrsMap
}): TodayReviewItem[] {
  const sortedKanaIds = sortSrsIdsByDue(kanaDueIds.filter(isReviewableKanaId), kanaSrsMap)
  const sortedVocabIds = sortSrsIdsByDue(vocabDueIds, vocabSrsMap)

  return [
    ...dueMistakeIds.map((id) => ({ deck: "mistakes" as const, id })),
    ...sortedKanaIds.map((id) => ({ deck: "kana" as const, id })),
    ...sortedVocabIds.map((id) => ({ deck: "vocab" as const, id })),
  ]
}

export function ensureQuestionOptions(question: Pick<Question, "correctAnswer" | "correctDisplay" | "options">) {
  const seen = new Set<string>()
  const options: Question["options"] = []

  for (const option of question.options) {
    if (seen.has(option.value)) continue
    seen.add(option.value)
    options.push(option)
  }

  if (!seen.has(question.correctAnswer)) {
    options.unshift({
      value: question.correctAnswer,
      display: question.correctDisplay ?? question.correctAnswer,
    })
  }

  return options
}

export function mistakeToQuestion(item: MistakeItem): Question {
  return {
    type: item.type,
    questionText: item.questionText,
    questionAudio: item.questionAudio,
    correctAnswer: item.correctAnswer,
    correctDisplay: item.correctDisplay,
    explanation: item.explanation,
    options: ensureQuestionOptions(item),
    meta: item.meta,
  }
}

export function makeKanaReviewQuestion(id: string, random: () => number = Math.random): Question | null {
  const item = kanaData.find((k) => k.romaji === id)
  if (!item) return null

  const wrong = shuffleList(kanaData.filter((k) => k.romaji !== item.romaji).map((k) => k.romaji), random).slice(0, 3)
  return {
    type: "review:kana",
    itemId: item.romaji,
    itemType: "kana",
    mode: "recognition",
    questionText: item.hiragana,
    questionAudio: item.hiragana,
    correctAnswer: item.romaji,
    correctDisplay: item.romaji,
    options: shuffleList([item.romaji, ...wrong], random).map((value) => ({ value, display: value })),
  }
}

export function makeVocabReviewQuestion(id: string, vocab: Vocabulary[], random: () => number = Math.random): Question | null {
  const item = vocab.find((v) => v.id === id)
  if (!item) return null

  const wrong = shuffleList(vocab.filter((v) => v.id !== item.id).map((v) => v.id), random).slice(0, 3)
  return {
    type: "review:vocab",
    itemId: item.id,
    itemType: "vocab",
    mode: "meaning",
    questionText: item.kanji ?? item.kana,
    questionAudio: item.kana,
    correctAnswer: item.id,
    correctDisplay: item.meaning,
    options: shuffleList([item.id, ...wrong], random).map((optionId) => {
      const option = vocab.find((v) => v.id === optionId)
      return { value: optionId, display: option?.meaning ?? optionId }
    }),
  }
}
