import type { Lesson, LessonStep } from "@/data/lesson-types"
import { contentFingerprint } from "@/lib/content-fingerprint"

export function getLessonStepVersion(step: LessonStep) {
  // Select content fields so UI-only attemptId and object property order cannot affect identity.
  const source = step as unknown as Record<string, unknown>
  return contentFingerprint(["id", "type", "title", "body", "bullets", "japanese", "romaji", "meaning", "note",
    "prompt", "passage", "audioText", "answer", "acceptedAnswers", "options", "chunks", "hint", "explanation",
    "itemId", "itemType", "mode", "reviewItems", "next"].map(key => source[key] ?? null))
}

export function getLessonStepVersions(lesson: Lesson) {
  return Object.fromEntries(lesson.steps.map(step => [step.id, contentFingerprint([
    getLessonStepVersion(step),
    step.id === lesson.steps.find(s => s.type === "example")?.id || step.type === "summary" ? lesson.study ?? null : null,
  ])]))
}

export function getLessonContentVersion(lesson: Lesson) {
  return contentFingerprint([lesson.id, getLessonStepVersions(lesson)])
}
