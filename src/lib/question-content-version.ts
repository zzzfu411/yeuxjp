import { contentFingerprint } from "@/lib/content-fingerprint"
import type { Question } from "@/lib/questions"

/** Option presentation order changes per attempt, without changing the assessment. */
export function getQuestionContentVersion(question: Question) {
  return contentFingerprint([
    question.type, question.itemId, question.itemType, question.mode,
    question.questionText, question.questionAudio, question.correctAnswer,
    [...(question.acceptedAnswers ?? [])].sort(), question.explanation,
    [...question.options].sort((a, b) => a.value.localeCompare(b.value)),
  ])
}
