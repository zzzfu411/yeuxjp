import { kanaData } from "@/data/kana-data"
import type { Vocabulary } from "@/data/vocabulary/types"
import type { MistakeItem } from "@/lib/mistake-notebook-model"
import { pickUniqueQuestionOptions } from "@/lib/question-options"
import { normalizeAnswer, type Question } from "@/lib/questions"
import type { SrsMap } from "@/lib/srs-model"
import { isReviewableKanaId } from "@/lib/review-visibility"

export type ReviewDeck = "kana" | "vocab" | "mistakes"
export type TodayReviewItem = { deck: ReviewDeck; id: string }

type DueReviewItem = TodayReviewItem & {
  deck: "kana" | "vocab"
  dueAt: number
  deckSize: number
  order: number
}

const DUE_REVIEW_DECK_ORDER = {
  kana: 0,
  vocab: 1,
} as const

export { isReviewableKanaId }
export { shuffleList } from "@/lib/question-options"

function getReviewDueAt(map: SrsMap, id: string) {
  return map[id]?.dueAt ?? Number.MAX_SAFE_INTEGER
}

function buildDueReviewItems({
  deck,
  ids,
  srsMap,
}: {
  deck: "kana" | "vocab"
  ids: string[]
  srsMap: SrsMap
}): DueReviewItem[] {
  const deckSize = ids.length
  return ids.map((id, order) => ({
    deck,
    id,
    dueAt: getReviewDueAt(srsMap, id),
    deckSize,
    order,
  }))
}

function sortDueReviewItems(items: DueReviewItem[]): TodayReviewItem[] {
  return [...items]
    .sort((a, b) => {
      const dueOrder = a.dueAt - b.dueAt
      if (dueOrder !== 0) return dueOrder

      const deckSizeOrder = a.deckSize - b.deckSize
      if (deckSizeOrder !== 0) return deckSizeOrder

      const deckOrder = DUE_REVIEW_DECK_ORDER[a.deck] - DUE_REVIEW_DECK_ORDER[b.deck]
      if (deckOrder !== 0) return deckOrder

      return a.order - b.order
    })
    .map(({ deck, id }) => ({ deck, id }))
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
  const kanaIds = kanaDueIds.filter(isReviewableKanaId)
  const dueItems = [
    ...buildDueReviewItems({ deck: "kana", ids: kanaIds, srsMap: kanaSrsMap }),
    ...buildDueReviewItems({ deck: "vocab", ids: vocabDueIds, srsMap: vocabSrsMap }),
  ]

  return [
    ...dueMistakeIds.map((id) => ({ deck: "mistakes" as const, id })),
    ...sortDueReviewItems(dueItems),
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
    itemId: item.itemId,
    itemType: item.itemType,
    mode: item.mode,
    questionText: item.questionText,
    questionAudio: item.questionAudio,
    correctAnswer: item.correctAnswer,
    acceptedAnswers: item.acceptedAnswers,
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

export function makeVocabReviewQuestion(itemOrId: string | Vocabulary, vocab: Vocabulary[], random: () => number = Math.random): Question | null {
  const item = typeof itemOrId === "string" ? vocab.find((v) => v.id === itemOrId) : itemOrId
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
