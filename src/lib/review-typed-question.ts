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

export function presentedReviewQuestion<T>(
  liveQuestion: T | null | undefined,
  selectedAnswer: string | null,
  latchedQuestion: T | null | undefined
): T | null {
  if (selectedAnswer != null && latchedQuestion != null) return latchedQuestion
  return liveQuestion ?? null
}

export type ReviewQuestionPresentationSource = {
  options: { value: string }[]
  correctAnswer: string
  mistakeId?: string
  itemId?: string
  questionText?: string
}

export function reviewQuestionPresentationKey(
  question: ReviewQuestionPresentationSource | null | undefined,
  presentationIdentity?: string | number | null
) {
  if (!question && (presentationIdentity == null || presentationIdentity === "")) return ""
  const options = question
    ? question.options.map((option) => normalizeAnswer(option.value)).join("\0")
    : ""
  return [
    presentationIdentity ?? "",
    question?.mistakeId ?? "",
    question?.itemId ?? "",
    question?.questionText ?? "",
    question ? normalizeAnswer(question.correctAnswer) : "",
    options,
  ].join("\0")
}

export function shouldShowReviewSpecialFeedback(questionType: string) {
  return questionType === "particle" || questionType === "verb-conjugation"
}
