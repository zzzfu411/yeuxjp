import type { LessonStep } from "@/data/lesson-types"
import { shuffleList } from "@/lib/question-options"
import { createSeededRandom } from "@/lib/seeded-random"
import { shuffleSentenceChunks } from "@/lib/sentence-assembly"

// Retain source indices as identities (including duplicate chunks), while the
// presentation order is stable for the persisted learning attempt.
export function getLessonPresentation(step: LessonStep, attemptSeed: string) {
  const random = createSeededRandom(`${attemptSeed}:${step.id}`)
  const options = step.type === "multipleChoice" ? shuffleList(step.options, random) : []
  const chunks = step.type === "sentenceBuild"
    ? shuffleSentenceChunks(step.chunks, { correctAnswer: step.answer, acceptedAnswers: step.acceptedAnswers }, random)
    : []
  return { options, chunks }
}

export function isComposingAnswer(event: { isComposing?: boolean; keyCode?: number }) {
  return event.isComposing === true || event.keyCode === 229
}
