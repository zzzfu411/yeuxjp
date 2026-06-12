import { kanaData } from "@/data/kana-data"
import type { Vocabulary } from "@/data/vocabulary/types"
import type { MistakeItem } from "@/lib/mistake-notebook-model"
import { pickUniqueQuestionOptions } from "@/lib/question-options"
import { normalizeAnswer, type Question } from "@/lib/questions"
import { sortSrsIdsByDue, type SrsMap } from "@/lib/srs-model"
import { isReviewableKanaId } from "@/lib/review-visibility"

export type ReviewDeck = "kana" | "vocab" | "mistakes"
export type TodayReviewItem = { deck: ReviewDeck; id: string }

export { isReviewableKanaId }
export { shuffleList } from "@/lib/question-options"

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
    const key = normalizeAnswer(option.value)
    if (seen.has(key)) continue
    seen.add(key)
    options.push(option)
  }

  const correctKey = normalizeAnswer(question.correctAnswer)
  if (!seen.has(correctKey)) {
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
    mistakeId: item.id,
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

  const options = pickUniqueQuestionOptions({
    target: item,
    pool: kanaData,
    getValue: (kana) => kana.romaji,
    random,
  })
  if (!options) return null

  return {
    type: "review:kana",
    itemId: item.romaji,
    itemType: "kana",
    mode: "recognition",
    questionText: item.hiragana,
    questionAudio: item.hiragana,
    correctAnswer: item.romaji,
    correctDisplay: item.romaji,
    options: options.map((option) => ({ value: option.romaji, display: option.romaji })),
  }
}

export function makeVocabReviewQuestion(id: string, vocab: Vocabulary[], random: () => number = Math.random): Question | null {
  const item = vocab.find((v) => v.id === id)
  if (!item) return null

  const options = pickUniqueQuestionOptions({
    target: item,
    pool: vocab,
    getValue: (entry) => entry.id,
    random,
  })
  if (!options) return null

  return {
    type: "review:vocab",
    itemId: item.id,
    itemType: "vocab",
    mode: "meaning",
    questionText: item.kanji ?? item.kana,
    questionAudio: item.kana,
    correctAnswer: item.id,
    correctDisplay: item.meaning,
    options: options.map((option) => ({ value: option.id, display: option.meaning })),
  }
}
