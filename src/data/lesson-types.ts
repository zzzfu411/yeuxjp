export type LessonTrack = "starter-45" | "n4-core" | "n3-core" | "n2-core"
export type LessonItemType = "kana" | "vocab" | "grammar" | "sentence"
export type LessonPracticeMode = "recognition" | "listening" | "meaning" | "recall" | "production"

export interface LessonItemRef {
  type: LessonItemType
  id: string
}

interface LessonStepBase {
  id: string
  title: string
}

export interface ExplainStep extends LessonStepBase {
  type: "explain"
  body: string
  bullets?: string[]
}

export interface ExampleStep extends LessonStepBase {
  type: "example"
  japanese: string
  romaji?: string
  meaning: string
  note?: string
  audioText?: string
}

export interface ChoiceStep extends LessonStepBase {
  type: "multipleChoice"
  prompt: string
  options: string[]
  answer: string
  acceptedAnswers?: string[]
  explanation?: string
  audioText?: string
  itemId: string
  itemType: LessonItemType
  mode: LessonPracticeMode
}

export interface TypingStep extends LessonStepBase {
  type: "typing"
  prompt: string
  answer: string
  acceptedAnswers?: string[]
  hint?: string
  audioText?: string
  itemId: string
  itemType: LessonItemType
  mode: LessonPracticeMode
}

export interface DictationStep extends LessonStepBase {
  type: "dictation"
  prompt: string
  audioText: string
  answer: string
  acceptedAnswers?: string[]
  hint?: string
  itemId: string
  itemType: LessonItemType
  mode: LessonPracticeMode
}

export interface SentenceBuildStep extends LessonStepBase {
  type: "sentenceBuild"
  prompt: string
  chunks: string[]
  answer: string
  meaning: string
  itemId: string
  itemType: LessonItemType
  mode: LessonPracticeMode
}

export interface SummaryStep extends LessonStepBase {
  type: "summary"
  body: string
  reviewItems: string[]
  next?: string
}

export type LessonStep =
  | ExplainStep
  | ExampleStep
  | ChoiceStep
  | TypingStep
  | DictationStep
  | SentenceBuildStep
  | SummaryStep

export interface Lesson {
  id: string
  title: string
  subtitle: string
  track: LessonTrack
  order: number
  estimatedMinutes: number
  prerequisites: string[]
  skillIds: string[]
  newItemIds: LessonItemRef[]
  steps: LessonStep[]
}
