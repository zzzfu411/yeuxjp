export type StudyFocus = [goal: string, explanation: string, task: string, model: string]
export type DialogueLine = [speaker: string, japanese: string, meaning: string]
export type StudyWord = [word: string, reading: string, meaning: string]
export type ReadingCheck = [prompt: string, answer: string, distractorA: string, distractorB: string, explanation: string]

export interface CourseUnit {
  start: number
  title: string
  scene: string
  dialogue: DialogueLine[]
  readingTitle: string
  reading: string
  translation: string
  words: StudyWord[]
  focuses: [StudyFocus, StudyFocus, StudyFocus, StudyFocus, StudyFocus]
  checks: [ReadingCheck, ReadingCheck, ReadingCheck, ReadingCheck, ReadingCheck]
}

export interface LessonStudy {
  unitNumber: number
  unitTitle: string
  goal: string
  explanation: string
  scene: string
  dialogue: DialogueLine[]
  readingTitle: string
  reading: string
  translation: string
  words: StudyWord[]
  task: string
  model: string
  reviewLessonIds: string[]
}
