import type { LessonStepAnswerMap } from "@/lib/lesson-step-answers"
export type LearningGoal = "balanced" | "travel" | "jlpt" | "media"
export type KanaLevel = "none" | "some" | "solid"
export type RomajiMode = "always" | "practice" | "hidden"
export type ReferenceLevel = "N5" | "N4" | "N3" | "N2"

export interface UserProfile {
  jlptTarget?: ReferenceLevel
  selfAssessedLevel?: ReferenceLevel | "unknown"
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
  supersededAnswers?: LessonStepAnswerMap
  completedContentVersion?: string
  completedStepVersions?: Record<string, string>
  updateStepIds?: string[]
  attemptId?: string
  attemptCompletedAt?: number
  attemptScore?: number
  hintedStepIds?: string[]
}
export type PracticeItemType = "kana" | "vocab" | "grammar" | "sentence" | "lesson"
export type PracticeMode = "recognition" | "listening" | "meaning" | "recall" | "production"
export type PracticeResponseFormat = "choice" | "assembly" | "input"
export type OutputEvidence = { score: number; attempts: number; correct: number }
export type AssessmentEvidence = OutputEvidence & { versioned?: Record<string, OutputEvidence> }

export interface PracticeResult {
  activitySource?: "review"
  assessmentRevision?: string
  responseFormat?: PracticeResponseFormat
  questionVersion?: string
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
  assessmentEvidence?: Partial<Record<PracticeMode, AssessmentEvidence>>
  /** Versioned independent written-response evidence, separate from legacy production scores. */
  outputEvidence?: OutputEvidence
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
