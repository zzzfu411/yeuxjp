import { normalizeAnswer, type Question } from "@/lib/questions"

export function uniqueQuestionOptionCount(question: Pick<Question, "options" | "correctAnswer">) {
  const seen = new Set<string>()
  for (const option of question.options) seen.add(normalizeAnswer(option.value))
  seen.add(normalizeAnswer(question.correctAnswer))
  return seen.size
}

export function questionUsesTypedReview(question: Pick<Question, "options" | "correctAnswer">) {
  return uniqueQuestionOptionCount(question) < 2
}

export function shouldShowReviewSpecialFeedback(questionType: string) {
  return questionType === "particle" || questionType === "verb-conjugation"
}
