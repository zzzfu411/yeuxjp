import type { PracticeItemType, PracticeMode } from "@/lib/learning-progress"
import type { MistakeItem } from "@/lib/mistake-notebook-model"

export type QuestionOption = {
  value: string
  display: string
}

export type QuestionMeta = MistakeItem["meta"]

export interface Question {
  type: string
  itemId?: string
  itemType?: PracticeItemType
  mode?: PracticeMode
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
}

export function normalizeAnswer(value: string) {
  return value
    .trim()
    .replace(/[。．.]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase()
}

export function isQuestionAnswerCorrect(question: Pick<Question, "correctAnswer" | "acceptedAnswers">, selectedAnswer: string) {
  const accepted = [question.correctAnswer, ...(question.acceptedAnswers ?? [])]
  const normalized = normalizeAnswer(selectedAnswer)
  return accepted.map(normalizeAnswer).includes(normalized)
}

export function makeQuestionResult(question: Question, selectedAnswer: string, now: number = Date.now()): QuestionResult {
  return {
    question,
    selectedAnswer,
    correct: isQuestionAnswerCorrect(question, selectedAnswer),
    answeredAt: now,
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
    questionText: question.questionText,
    questionAudio: question.questionAudio,
    correctAnswer: question.correctAnswer,
    correctDisplay: question.correctDisplay,
    wrongAnswer: result.selectedAnswer,
    explanation: question.explanation,
    meta: question.meta,
    options: normalizeMistakeOptions(question, result.selectedAnswer),
  }
}

function normalizeMistakeOptions(question: Question, selectedAnswer: string): QuestionOption[] {
  const seen = new Set<string>()
  const options: QuestionOption[] = []

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

  if (!seen.has(selectedAnswer)) {
    options.push({
      value: selectedAnswer,
      display: selectedAnswer,
    })
  }

  return options
}
