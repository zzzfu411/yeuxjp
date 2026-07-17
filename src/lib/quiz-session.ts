import type { Question } from "@/lib/questions"

export type QuizStats = {
  score: number
  total: number
}

export function createQuizStats(): QuizStats {
  return { score: 0, total: 0 }
}

export function recordQuizAnswer(stats: QuizStats, correct: boolean): QuizStats {
  return {
    score: stats.score + (correct ? 1 : 0),
    total: stats.total + 1,
  }
}

export function getQuizAccuracy(stats: QuizStats): number | null {
  if (stats.total === 0) return null
  return Math.round((stats.score / stats.total) * 100)
}

export function canStartQuizAnswerSubmission({
  selectedOption,
  answerPending,
  hasQuestion,
}: {
  selectedOption: string | null
  answerPending: boolean
  hasQuestion: boolean
}) {
  return !selectedOption && !answerPending && hasQuestion
}

export function shouldAutoGenerateQuizQuestion({
  selectedOption,
  answerPending,
}: {
  selectedOption: string | null
  answerPending: boolean
}) {
  return selectedOption === null && !answerPending
}

export function resolveQuizAnswerSubmission(selectedAnswer: string, saved: boolean) {
  if (!saved) {
    return {
      answerPending: false,
      saveError: true,
      selectedOption: null,
    }
  }

  return {
    answerPending: true,
    saveError: false,
    selectedOption: selectedAnswer,
  }
}

export function getQuizQuestionKey(question: Pick<Question, "type" | "questionText" | "correctAnswer">) {
  return `${question.type}:${question.questionText ?? ""}:${question.correctAnswer}`
}

export function pickFreshQuizQuestion(
  generate: () => Question | null,
  lastQuestionKey: string | null,
  maxAttempts = 3
): Question | null {
  let question = generate()
  let attempts = 1

  while (
    question &&
    lastQuestionKey !== null &&
    getQuizQuestionKey(question) === lastQuestionKey &&
    attempts < maxAttempts
  ) {
    const retry = generate()
    if (!retry) break
    question = retry
    attempts += 1
  }

  return question
}
