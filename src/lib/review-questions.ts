import { kanaData } from "@/data/kana-data"
import type { Vocabulary } from "@/data/vocabulary/types"
import { getKanaById, normalizeKanaIdList, normalizeKanaIdRecord } from "@/lib/kana-id"
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

export const TODAY_REVIEW_QUEUE_LIMIT = 30

function normalizeTodayReviewQueueLimit(limit: number) {
  if (!Number.isFinite(limit)) return TODAY_REVIEW_QUEUE_LIMIT
  const normalized = Math.floor(limit)
  return normalized >= 1 ? normalized : TODAY_REVIEW_QUEUE_LIMIT
}

export function buildTodayReviewQueue({
  dueMistakeIds,
  kanaDueIds,
  kanaSrsMap,
  vocabDueIds,
  vocabSrsMap,
  limit = TODAY_REVIEW_QUEUE_LIMIT,
}: {
  dueMistakeIds: string[]
  kanaDueIds: string[]
  kanaSrsMap: SrsMap
  vocabDueIds: string[]
  vocabSrsMap: SrsMap
  limit?: number
}): TodayReviewItem[] {
  const kanaIds = normalizeKanaIdList(kanaDueIds)
  const normalizedKanaSrsMap = normalizeKanaIdRecord(kanaSrsMap) as SrsMap
  const dueItems = [
    ...buildDueReviewItems({ deck: "kana", ids: kanaIds, srsMap: normalizedKanaSrsMap }),
    ...buildDueReviewItems({ deck: "vocab", ids: vocabDueIds, srsMap: vocabSrsMap }),
  ]

  return [
    ...dueMistakeIds.map((id) => ({ deck: "mistakes" as const, id })),
    ...sortDueReviewItems(dueItems),
  ].slice(0, normalizeTodayReviewQueueLimit(limit))
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
  const parsed = getKanaById(id)
  if (!parsed) return null
  const item = parsed.kana
  const glyph = item[parsed.script]

  const options = pickUniqueQuestionOptions({
    target: item,
    pool: kanaData,
    getValue: (kana) => kana.romaji,
    random,
  })
  if (!options) return null

  return {
    type: "review:kana",
    itemId: parsed.id,
    itemType: "kana",
    mode: "recognition",
    questionText: glyph,
    questionAudio: glyph,
    correctAnswer: item.romaji,
    correctDisplay: item.romaji,
    options: options.map((option) => ({ value: option.romaji, display: option.romaji })),
  }
}

export type VocabReviewDirection = "meaning" | "recall" | "listening"

export const VOCAB_REVIEW_DIRECTIONS: readonly VocabReviewDirection[] = ["meaning", "recall", "listening"]

export function pickVocabReviewDirection(random: () => number = Math.random): VocabReviewDirection {
  const raw = Math.floor(random() * VOCAB_REVIEW_DIRECTIONS.length)
  const index = Math.min(Math.max(raw, 0), VOCAB_REVIEW_DIRECTIONS.length - 1)
  return VOCAB_REVIEW_DIRECTIONS[index]
}

function getVocabJapaneseDisplay(item: Pick<Vocabulary, "kanji" | "kana">) {
  return item.kanji ? `${item.kanji}（${item.kana}）` : item.kana
}

export type VocabReviewPromptModel = {
  display: string
  sub?: string
  hint: string
  audio?: string
  autoPlayAudio: boolean
}

export function getVocabReviewPromptModel(item: Vocabulary, direction: VocabReviewDirection): VocabReviewPromptModel {
  if (direction === "recall") {
    return {
      display: item.meaning,
      hint: "回忆并选择对应的日语说法",
      autoPlayAudio: false,
    }
  }

  if (direction === "listening") {
    return {
      display: "听发音作答",
      hint: "听发音，选择正确的中文意思",
      audio: item.kana,
      autoPlayAudio: true,
    }
  }

  return {
    display: item.kanji ?? item.kana,
    sub: item.kanji ? item.kana : undefined,
    hint: "选择正确的中文意思",
    audio: item.kana,
    autoPlayAudio: true,
  }
}

export function makeVocabReviewQuestion(
  itemOrId: string | Vocabulary,
  vocab: readonly Vocabulary[],
  random: () => number = Math.random,
  direction: VocabReviewDirection = "meaning"
): Question | null {
  const item = typeof itemOrId === "string" ? vocab.find((v) => v.id === itemOrId) : itemOrId
  if (!item) return null

  const options = pickUniqueQuestionOptions({
    target: item,
    pool: vocab,
    // Options are judged by id, but learners only see the display value.
    // De-duplicate by that visible value so two equivalent vocabulary rows
    // cannot render identical buttons where only one id is accepted.
    getValue: direction === "recall"
      ? getVocabJapaneseDisplay
      : (entry) => entry.meaning,
    random,
  })
  if (!options) return null

  if (direction === "recall") {
    return {
      type: "review:vocab",
      itemId: item.id,
      itemType: "vocab",
      mode: "recall",
      questionText: item.meaning,
      correctAnswer: item.id,
      correctDisplay: getVocabJapaneseDisplay(item),
      options: options.map((option) => ({ value: option.id, display: getVocabJapaneseDisplay(option) })),
    }
  }

  if (direction === "listening") {
    return {
      type: "review:vocab",
      itemId: item.id,
      itemType: "vocab",
      mode: "listening",
      questionText: "（听发音，选择正确的中文意思）",
      questionAudio: item.kana,
      autoPlayAudio: true,
      correctAnswer: item.id,
      correctDisplay: `${getVocabJapaneseDisplay(item)} · ${item.meaning}`,
      options: options.map((option) => ({ value: option.id, display: option.meaning })),
    }
  }

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
