import type { ChoiceStep, DictationStep, LessonStep, SentenceBuildStep, TypingStep } from "@/data/lesson-types"
export function isPracticeStep(step: LessonStep): step is ChoiceStep | TypingStep | DictationStep | SentenceBuildStep {
  return step.type === "multipleChoice" || step.type === "typing" || step.type === "dictation" || step.type === "sentenceBuild"
}
