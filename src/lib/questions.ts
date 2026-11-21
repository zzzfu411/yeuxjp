import type { PracticeItemType, PracticeMode } from "@/lib/learning-progress"
import type { MistakeItem } from "@/lib/mistake-notebook-model"
import type { PracticeResponseFormat } from "@/lib/learning-progress-types"

export type QuestionOption = {
  value: string
  display: string
}

export type QuestionMeta = MistakeItem["meta"]

export interface Question {
  chunks?: string[]
  responseFormat?: PracticeResponseFormat
  questionVersion?: string
  type: string
  itemId?: string
  itemType?: PracticeItemType
  mode?: PracticeMode
  mistakeId?: string
  questionText?: string
  questionAudio?: string
  autoPlayAudio?: boolean
  correctAnswer: string
  correctDisplay?: string
  acceptedAnswers?: string[]
  explanation?: string
  options: QuestionOption[]
  meta?: QuestionMeta
}

export interface QuestionResult {
  question: Question
  selectedAnswer: string
  correct: boolean
  answeredAt: number
  assisted?: boolean
}

export function normalizeAnswer(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/[\p{P}\p{S}]/gu, "")
    .replace(/\s+/g, "")
    .toLowerCase()
}

export function getQuestionResponseFormat(question: Question): PracticeResponseFormat {
  // Mistake review chooses its UI from the option count, regardless of the original task type.
  if (question.mistakeId) return new Set([question.correctAnswer, ...question.options.map(o => o.value)].map(normalizeAnswer)).size < 2 ? "input" : "choice"
  if (question.responseFormat) return question.responseFormat
  if (question.type === "lesson:typing" || question.type === "lesson:dictation") return "input"
  if (question.type === "lesson:sentenceBuild") return "assembly"
  return "choice"
}

export function getQuestionPracticeMode(question: Question) {
  if (question.mode !== "production") return question.mode
  const format = getQuestionResponseFormat(question)
  return format === "choice" ? "recognition" : format === "assembly" ? "recall" : "production"
}

export function isQuestionAnswerCorrect(question: Pick<Question, "correctAnswer" | "acceptedAnswers">, selectedAnswer: string) {
  const accepted = [question.correctAnswer, ...(question.acceptedAnswers ?? [])]
  const normalized = normalizeAnswer(selectedAnswer)
  return accepted.map(normalizeAnswer).includes(normalized)
}

function finiteNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  return Number.isFinite(fallback) ? fallback : 0
}

export function makeQuestionResult(question: Question, selectedAnswer: string, now: number = Date.now()): QuestionResult {
  return {
    question,
    selectedAnswer,
    correct: isQuestionAnswerCorrect(question, selectedAnswer),
    answeredAt: finiteNumber(now, Date.now()),
  }
}

export function getOptionDisplay(question: Question, value: string) {
  return question.options.find((option) => option.value === value)?.display ?? value
}

export function questionToMistakeInput(result: QuestionResult) {
  if (result.correct) return null
  const { question } = result
  return {
    type: question.type,
    ...(question.questionVersion ? { questionVersion: question.questionVersion } : {}),
    questionText: question.questionText,
    questionAudio: question.questionAudio,
    itemId: question.itemId,
    itemType: question.itemType,
    mode: question.mode,
    correctAnswer: question.correctAnswer,
    acceptedAnswers: question.acceptedAnswers,
    correctDisplay: question.correctDisplay,
    wrongAnswer: result.selectedAnswer,
    explanation: question.explanation,
    meta: question.meta,
    options: normalizeMistakeOptions(question, result.selectedAnswer),
    id: question.mistakeId,
  }
}

function normalizeMistakeOptions(question: Question, selectedAnswer: string): QuestionOption[] {
  const seen = new Set<string>()
  const options: QuestionOption[] = []

  for (const option of question.options) {
    const key = normalizeAnswer(option.value)
    if (seen.has(key)) continue
    seen.add(key)
    options.push(option)
  }

  const correctKey = normalizeAnswer(question.correctAnswer)
  if (!seen.has(correctKey)) {
    seen.add(correctKey)
    options.unshift({
      value: question.correctAnswer,
      display: question.correctDisplay ?? question.correctAnswer,
    })
  }

  const selectedKey = normalizeAnswer(selectedAnswer)
  if (!seen.has(selectedKey)) {
    options.push({
      value: selectedAnswer,
      display: selectedAnswer,
    })
  }

  return options
}
