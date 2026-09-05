import type { LessonStepAnswerMap } from "@/lib/lesson-step-answers"
export type LearningGoal = "balanced" | "travel" | "jlpt" | "media"
export type KanaLevel = "none" | "some" | "solid"
export type RomajiMode = "always" | "practice" | "hidden"

export interface UserProfile {
  goal: LearningGoal
  minutesPerDay: number
  kanaLevel: KanaLevel
  romajiMode: RomajiMode
  createdAt: number
  updatedAt: number
}
export interface LessonProgress {
  lessonId: string
  status: "started" | "completed"
  startedAt: number
  completedAt?: number
  score?: number
  currentStepIndex?: number
  lastStepId?: string
  updatedAt?: number
  stepAnswers?: LessonStepAnswerMap
  attemptId?: string
  attemptCompletedAt?: number
  attemptScore?: number
  hintedStepIds?: string[]
}
export type PracticeItemType = "kana" | "vocab" | "grammar" | "sentence" | "lesson"
export type PracticeMode = "recognition" | "listening" | "meaning" | "recall" | "production"

export interface PracticeResult {
  lessonId?: string
  lessonStepId?: string
  lessonAttemptId?: string
  assisted?: boolean
  itemId: string
  itemType: PracticeItemType
  mode: PracticeMode
  correct: boolean
  answer?: string
  durationMs?: number
  createdAt: number
}
export interface ItemProgress {
  /** Modes with independent evidence; legacy records infer only positive scores. */
  assessedModes?: PracticeMode[]
  itemId: string
  itemType: PracticeItemType
  recognition: number
  listening: number
  meaning: number
  recall: number
  production: number
  attempts: number
  correct: number
  updatedAt: number
}
export type LessonProgressMap = Record<string, LessonProgress>
export type ItemProgressMap = Record<string, ItemProgress>
