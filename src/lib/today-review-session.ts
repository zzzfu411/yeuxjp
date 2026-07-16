import { getKanaById } from "@/lib/kana-id"
import type { Vocabulary } from "@/data/vocabulary/types"
import type { MistakeItem } from "@/lib/mistake-notebook-model"
import type { Question, QuestionResult } from "@/lib/questions"
import type { SrsResult } from "@/lib/srs-model"
import { createSeededRandom } from "@/lib/seeded-random"
import {
  getVocabReviewPromptModel,
  makeKanaReviewQuestion,
  makeVocabReviewQuestion,
  mistakeToQuestion,
  pickVocabReviewDirection,
  type ReviewDeck,
  type TodayReviewItem,
} from "@/lib/review-questions"

export type TodayReviewData = {
  deckLabel: string
  prompt: string
  sub?: string
  hint?: string
  audio?: string
  autoPlayAudio?: boolean
  question: Question
}

export type TodayReviewItemResolution = {
  data: TodayReviewData | null
  missingReviewEntry: boolean
  insufficientQuestionOptions: boolean
}

export type TodayReviewSrsDeck = {
  has: (id: string) => boolean
  gradeExisting: (id: string, result: SrsResult) => boolean
}

export type TodayReviewSrsDecks = Record<ReviewDeck, TodayReviewSrsDeck>

function emptyResolution(overrides: Partial<TodayReviewItemResolution> = {}): TodayReviewItemResolution {
  return {
    data: null,
    missingReviewEntry: false,
    insufficientQuestionOptions: false,
    ...overrides,
  }
}

export { createSeededRandom }

export function getTodayReviewBatchCompletionTitle(remainingDueAfterBatch: number) {
  const remaining = Number.isFinite(remainingDueAfterBatch)
    ? Math.max(0, Math.floor(remainingDueAfterBatch))
    : 0
  return remaining > 0
    ? `本轮复习完成，仍有 ${remaining} 项到期`
    : "今日复习完成"
}

export function getTodayReviewItemKey(item: TodayReviewItem | null) {
  return item ? `${item.deck}:${item.id}` : null
}

export function resolveTodayReviewItemData({
  current,
  vocabulary,
  mistakes,
  seed = "",
}: {
  current: TodayReviewItem | null
  vocabulary: readonly Vocabulary[]
  mistakes: ReadonlyMap<string, MistakeItem>
  seed?: string
}): TodayReviewItemResolution {
  if (!current) return emptyResolution()

  if (current.deck === "kana") {
    const parsedKana = getKanaById(current.id)
    if (!parsedKana) return emptyResolution({ missingReviewEntry: true })
    const kanaItem = parsedKana.kana
    const glyph = kanaItem[parsedKana.script]

    const question = makeKanaReviewQuestion(parsedKana.id, createSeededRandom(`${seed}:kana:${current.id}`))
    if (!question) return emptyResolution({ insufficientQuestionOptions: true })

    return {
      data: {
        deckLabel: "\u5047\u540d",
        prompt: glyph,
        sub: parsedKana.script === "hiragana" ? "平假名" : "片假名",
        audio: glyph,
        autoPlayAudio: true,
        question,
      },
      missingReviewEntry: false,
      insufficientQuestionOptions: false,
    }
  }

  if (current.deck === "vocab") {
    const vocabItem = vocabulary.find((item) => item.id === current.id)
    if (!vocabItem) return emptyResolution({ missingReviewEntry: true })

    const random = createSeededRandom(`${seed}:vocab:${current.id}`)
    const vocabDirection = pickVocabReviewDirection(random)
    const question = makeVocabReviewQuestion(vocabItem, vocabulary, random, vocabDirection)
    if (!question) return emptyResolution({ insufficientQuestionOptions: true })

    const prompt = getVocabReviewPromptModel(vocabItem, vocabDirection)
    return {
      data: {
        deckLabel: "\u8bcd\u6c47",
        prompt: prompt.display,
        sub: prompt.sub,
        hint: prompt.hint,
        audio: prompt.audio,
        autoPlayAudio: prompt.autoPlayAudio,
        question,
      },
      missingReviewEntry: false,
      insufficientQuestionOptions: false,
    }
  }

  const mistake = mistakes.get(current.id)
  if (!mistake) return emptyResolution({ missingReviewEntry: true })

  return {
    data: {
      deckLabel: "\u9519\u9898",
      prompt: mistake.questionText ?? mistake.questionAudio ?? "\uff08\u65e0\u9898\u5e72\uff09",
      sub: mistake.type,
      audio: mistake.questionAudio,
      autoPlayAudio: Boolean(mistake.questionAudio),
      question: mistakeToQuestion(mistake),
    },
    missingReviewEntry: false,
    insufficientQuestionOptions: false,
  }
}

export function canRecordTodayReviewItem(current: TodayReviewItem | null, decks: TodayReviewSrsDecks) {
  if (!current) return false
  return decks[current.deck].has(current.id)
}

export function gradeTodayReviewItem(
  current: TodayReviewItem | null,
  result: Pick<QuestionResult, "correct">,
  decks: TodayReviewSrsDecks
) {
  if (!current) return false
  if (current.deck === "mistakes") {
    if (!result.correct) return true
    return decks.mistakes.gradeExisting(current.id, "good")
  }

  return decks[current.deck].gradeExisting(current.id, result.correct ? "good" : "again")
}
