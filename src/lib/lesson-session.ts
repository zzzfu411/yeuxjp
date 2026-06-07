import type { LessonStep } from "@/data/lessons"
import type { Question } from "@/lib/questions"

export type LessonPracticeStep = Extract<LessonStep, { itemId: string }>

export function lessonStepToQuestion(step: LessonPracticeStep): Question {
  if (step.type === "multipleChoice") {
    return {
      type: `lesson:${step.type}`,
      itemId: step.itemId,
      itemType: step.itemType,
      mode: step.mode,
      questionText: step.prompt,
      questionAudio: step.audioText,
      correctAnswer: step.answer,
      explanation: step.explanation,
      options: step.options.map((option) => ({ value: option, display: option })),
    }
  }

  if (step.type === "typing" || step.type === "dictation") {
    return {
      type: `lesson:${step.type}`,
      itemId: step.itemId,
      itemType: step.itemType,
      mode: step.mode,
      questionText: step.prompt,
      questionAudio: step.audioText,
      correctAnswer: step.answer,
      acceptedAnswers: step.acceptedAnswers,
      options: [{ value: step.answer, display: step.answer }],
    }
  }

  return {
    type: "lesson:sentenceBuild",
    itemId: step.itemId,
    itemType: step.itemType,
    mode: step.mode,
    questionText: step.prompt,
    correctAnswer: step.answer,
    options: [{ value: step.answer, display: step.answer }],
  }
}

export function countPracticeSteps(steps: LessonStep[]) {
  return steps.filter((step): step is LessonPracticeStep => "itemId" in step).length
}

export function calculateLessonCompletionScore(correct: number, practiceSteps: number) {
  return practiceSteps ? Math.round((correct / practiceSteps) * 100) : 100
}
