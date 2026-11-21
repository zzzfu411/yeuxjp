import { kanaData } from "@/data/kana-data"
import type { Vocabulary } from "@/data/vocabulary/types"
import { getKanaById } from "@/lib/kana-id"
import type { MistakeItem } from "@/lib/mistake-notebook-model"
import { pickUniqueQuestionOptions } from "@/lib/question-options"
import { normalizeAnswer, type Question } from "@/lib/questions"
import { isReviewableKanaId } from "@/lib/review-visibility"
import { shuffleList } from "@/lib/question-options"
import { createSeededRandom } from "@/lib/seeded-random"

export { buildTodayReviewQueue, TODAY_REVIEW_QUEUE_LIMIT, type ReviewDeck, type TodayReviewItem } from "@/lib/review-queue"
export { isReviewableKanaId }
export { shuffleList } from "@/lib/question-options"

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

export { questionUsesTypedReview, shouldShowReviewSpecialFeedback, uniqueQuestionOptionCount } from "@/lib/review-typed-question"

export function mistakeToQuestion(item: MistakeItem, attemptSeed = "review"): Question {
  const options = ensureQuestionOptions(item)
  const lastWrong = item.lastWrongAnswer?.trim()
  if (lastWrong && !options.some((option) => normalizeAnswer(option.value) === normalizeAnswer(lastWrong))) {
    options.push({ value: lastWrong, display: lastWrong })
  }

  return {
    type: item.type,
    questionVersion: item.questionVersion,
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
    options: shuffleList([...options].sort((a, b) => a.value.localeCompare(b.value)), createSeededRandom(`${attemptSeed}:${item.id}`)),
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

export function getVocabReviewPromptModel(
  item: Vocabulary,
  direction: VocabReviewDirection,
  showRomaji = false
): VocabReviewPromptModel {
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

  const subParts = [item.kanji ? item.kana : null, showRomaji ? item.romaji : null].filter(Boolean)
  return {
    display: item.kanji ?? item.kana,
    sub: subParts.length ? subParts.join(" · ") : undefined,
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
    // The Chinese-only prompt cannot distinguish entries with the same gloss.
    pool: direction === "recall"
      ? vocab.filter(entry => entry.id === item.id || normalizeAnswer(entry.meaning) !== normalizeAnswer(item.meaning))
      : vocab,
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
