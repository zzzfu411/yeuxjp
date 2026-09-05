import type { LessonStep } from "@/data/lesson-types"
import { shuffleList } from "@/lib/question-options"
import { createSeededRandom } from "@/lib/seeded-random"
import { normalizeAnswer } from "@/lib/questions"

// Retain source indices as identities (including duplicate chunks), while the
// presentation order is stable for the persisted learning attempt.
export function getLessonPresentation(step: LessonStep, attemptSeed: string) {
  const random = createSeededRandom(`${attemptSeed}:${step.id}`)
  const options = step.type === "multipleChoice" ? shuffleList(step.options, random) : []
  let chunks = step.type === "sentenceBuild"
    ? shuffleList(step.chunks.map((chunk, idx) => ({ chunk, idx })), random)
    : []
  if (step.type === "sentenceBuild" && chunks.length > 1 &&
    normalizeAnswer(chunks.map(({ chunk }) => chunk).join("")) === normalizeAnswer(step.answer)) {
    // A random shuffle can still expose the complete answer. Swap two distinct
    // chunks rather than changing the answer or removing repeated words.
    const different = chunks.findIndex(({ chunk }) => chunk !== chunks[0].chunk)
    if (different > 0) {
      chunks = [...chunks]
      ;[chunks[0], chunks[different]] = [chunks[different], chunks[0]]
    }
  }
  return { options, chunks }
}

export function isComposingAnswer(event: { isComposing?: boolean; keyCode?: number }) {
  return event.isComposing === true || event.keyCode === 229
}
